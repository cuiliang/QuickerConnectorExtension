"use strict";

/**
 * 工具函数文件
 */

/**
 * 网址是否匹配某个模式
 * @param {string} url 网址
 * @param {string} pattern 网址模式
 * @return 是否匹配
 */
export function isUrlMatch(url, pattern) {
  let isMatch = new RegExp(pattern, 'i').test(url);
  return isMatch;
}

/**
 * 是否在chrome自身的窗口上（这时候不能执行脚本）
 * @param {string} url 网址
 * @returns {boolean} 是否是chrome内部页面
 */
export function isChromeTabUrl(url) {
  if (url
    && (url.indexOf("chrome") === 0
      || url.indexOf("https://chrome.google.com/") === 0
      || url.indexOf("chrome-extension://") === 0
      || url.indexOf("https://chromewebstore.google.com/") === 0
    )
  ) {
    return true;
  }
  return false;
}

/**
 * 获得浏览器名称
 * @returns {string} 浏览器名称
 */
export function getBrowserName() {
  // navigator.userAgentData is a more modern approach but might not be fully supported everywhere.
  // Sticking to userAgent for broader compatibility within extensions for now.

  if (self.browser != undefined) {
    return 'firefox';
  }

  const userAgent = navigator.userAgent;

  if (navigator.userAgent.indexOf("Firefox") > -1) {
    return 'firefox';
  }

  if (userAgent.indexOf("Edg/") !== -1) {
    return "msedge"; // Microsoft Edge (Chromium)
  }
  if (userAgent.indexOf("Chrome/") !== -1 && userAgent.indexOf("Edg/") === -1) {
    return "chrome"; // Google Chrome
  }

  // Consider adding checks for other Chromium-based browsers if needed
  // For example, Opera (OPR/) or Vivaldi (Vivaldi/)

  // Fallback for other or unidentified browsers, though unlikely in a Chrome extension context
  return "unknown";
}

/**
 * 按属性排序
 * @param {Array} array 要排序的数组
 * @param {string} prop 排序属性
 * @returns {Array} 排序后的新数组
 */
export function sortArrayByProperty(array, prop) {
  // Create a shallow copy before sorting to avoid modifying the original array
  return array.slice(0).sort(function (a, b) {
    // Basic comparison, assumes properties are comparable
    if (a[prop] > b[prop]) return 1;
    if (a[prop] < b[prop]) return -1;
    return 0;
  });
}

// Removed modification of Array.prototype.sortBy

// 添加Array原型方法
if (!Array.prototype.sortBy) {
  Array.prototype.sortBy = function (p) {
    return this.slice(0).sort(function (a, b) {
      return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
    });
  };
} 


/**
 * 根据提供的路径从对象中安全地获取嵌套属性的值。
 * @param {object} obj - 源对象。
 * @param {string} path - 属性路径 (例如 'a.b.c' 或 'url')。
 * @returns {*} 属性的值，如果路径无效或未找到则返回 undefined。
 */
function getProperty(obj, path) {
  if (typeof path !== 'string' || !obj) {
    return undefined;
  }
  const pathSegments = path.split('.');
  let current = obj;
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    if (current === null || typeof current !== 'object' || !(segment in current)) {
      return undefined; // 路径无效或属性不存在
    }
    current = current[segment];
  }
  return current;
}

/**
 * 根据 filter 参数处理 API 的原始返回结果。
 * @param {*} apiResult - Chrome API 的原始返回结果 (可以是对象或数组)。
 * @param {string|null|undefined} filterString - 描述所需属性的过滤字符串，
 * 每行一个属性路径，支持 \n, \r\n, \r ,，;；作为换行符。
 * @returns {*} 处理后的结果。
 */
export function filterValue(apiResult, filterString) {
  // 如果没有提供 filter 或 filter 为空字符串，则返回原始结果
  if (!filterString || typeof filterString !== 'string' || filterString.trim() === '') {
    return apiResult;
  }

  // 解析 filter 字符串，获取属性路径列表
  // 使用正则表达式分割，匹配一个或多个 \r 或 \n
  const propertiesToExtract = filterString
    .split(/[\r\n；;,，]+/) // <-- 修改点在这里
    .map(line => line.trim()) // 对分割后的每一部分进行 trim
    .filter(line => line.length > 0); // 过滤掉空行

  // 如果没有有效的属性路径，也返回原始结果
  if (propertiesToExtract.length === 0) {
    return apiResult;
  }

  // --- 内部辅助函数：从单个项目（对象）中提取属性 ---
  const extractFromItem = (item) => {
    if (typeof item !== 'object' || item === null) {
      return item; // 如果项目不是对象，无法提取，返回原样
    }

    // 情况 1: 只提取一个属性
    if (propertiesToExtract.length === 1) {
      return getProperty(item, propertiesToExtract[0]);
    }

    // 情况 2: 提取多个属性
    const extractedObject = {};
    propertiesToExtract.forEach(path => {
      const value = getProperty(item, path);
      // 使用路径的最后一部分作为新对象的键名
      const key = path.split('.').pop();
      if (key) {
         extractedObject[key] = value;
      }
    });
    return extractedObject;
  };
  // --- 辅助函数结束 ---

  // 判断 apiResult 是数组还是对象
  if (Array.isArray(apiResult)) {
    // 如果 API 结果是数组，对每个元素应用提取逻辑
    return apiResult.map(item => extractFromItem(item));
  } else if (typeof apiResult === 'object' && apiResult !== null) {
    // 如果 API 结果是对象，直接应用提取逻辑
    return extractFromItem(apiResult);
  } else {
    // 其他情况返回原始结果
    return apiResult;
  }
}

/**
 * 获取目标标签页
 * @param {string} tabId 标签ID，如果未提供，则使用当前焦点tab
 * @returns {Promise<chrome.tabs.Tab>} 标签信息
 */
export async function getTargetTab(tabId) {
  if (tabId) {
    return await chrome.tabs.get(tabId);
  } else {
    // 未提供tab的时候，使用当前焦点tab
    const tabs = await chrome.tabs.query({lastFocusedWindow: true, active: true});
    if (tabs.length < 1) {
      throw new Error("Can not find active tab.");
    }
    return tabs[0];
  }
}