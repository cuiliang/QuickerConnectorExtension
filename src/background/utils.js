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
      || url.indexOf("https://chrome.google.com/") === 0)
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
  const userAgent = navigator.userAgent;

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