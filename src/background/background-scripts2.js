/*
 * 封装常用的脚本。
 */

'use strict';


/**
 * 下载指定网址的文件。
 * @param {object} commandParams 命令参数
 * @param {string} commandParams.url 要下载的文件的URL
 * @param {string} [commandParams.filename] 保存的文件名（可选）
 * @param {object} msg 消息对象
 */
async function qk_download_file(commandParams, msg) {
    try {
      const { url, filename } = commandParams;
  
      if (!url) {
        throw new Error("文件URL不能为空");
      }
  
      const downloadOptions = { url };
      if (filename) {
        downloadOptions.filename = filename;
      }
  
      // MV3 中 background script 不能直接访问 DOM 或 window 对象，
      // 但 chrome.downloads API 是可用的。
      const downloadId = await chrome.downloads.download(downloadOptions);
  
      console.log(`开始下载文件: ${url}, 下载ID: ${downloadId}`);
      // 注意：下载是异步的，这里只是启动了下载。
      // 可以添加 chrome.downloads.onChanged 监听器来跟踪下载状态，但对于简单命令可能不需要。
      return { success: true, message: "文件下载已开始", downloadId: downloadId };
    } catch (error) {
      console.error('下载文件失败:' + error.message, error);
      // 将错误消息传递给 Quicker
      throw new Error(`下载文件失败: ${error.message}`);
    }
  }
  
  /**
   * 查找符合条件的标签页。
   * @param {object} commandParams 命令参数
   * @param {string} [commandParams.urlPattern] 匹配标签页URL的模式 (例如 "*://*.google.com/*")
   * @param {string} [commandParams.titlePattern] 匹配标签页标题的模式 (支持通配符 *)
   * @param {object} msg 消息对象
   */
  async function qk_find_tabs(commandParams, msg) {
    try {
      const { urlPattern, titlePattern } = commandParams;
  
      if (!urlPattern && !titlePattern) {
        throw new Error("至少需要提供 URL 模式或标题模式之一");
      }
  
      const queryInfo = {};
      if (urlPattern) {
        // chrome.tabs.query 的 url 字段支持 Match Patterns
        // https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns
        queryInfo.url = urlPattern;
      }
      if (titlePattern) {
        // chrome.tabs.query 的 title 字段支持简单的通配符 *
        queryInfo.title = titlePattern;
      }
  
      const tabs = await chrome.tabs.query(queryInfo);
  
      if (!tabs || tabs.length === 0) {
        return { success: true, message: "未找到匹配的标签页", tabs: [] };
      }
  
      // 返回匹配的标签页信息 (id, title, url, windowId)
      const resultTabs = tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        windowId: tab.windowId,
        active: tab.active,
        status: tab.status
      }));
  
      return { success: true, message: `找到 ${tabs.length} 个匹配的标签页`, tabs: resultTabs };
    } catch (error) {
      console.error('查找标签页失败:' + error.message, error);
       // 对于 Match Pattern 错误等，提供更具体的错误信息
       if (error.message.includes("Invalid match pattern")) {
          throw new Error(`查找标签页失败: 无效的 URL 匹配模式 "${commandParams.urlPattern}"`);
       }
      throw new Error(`查找标签页失败: ${error.message}`);
    }
  }
  
  /**
   * 替换当前活动标签页的标题。
   * @param {object} commandParams 命令参数
   * @param {string} commandParams.pattern 正则表达式模式
   * @param {string} commandParams.replacement 替换字符串
   * @param {object} msg 消息对象
   */
  async function qk_replace_title(commandParams, msg) {
    try {
      const { pattern, replacement } = commandParams;
  
      if (pattern === undefined || replacement === undefined) {
        throw new Error("必须提供正则表达式模式和替换字符串");
      }
  
      // 获取当前活动标签页
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
      if (!activeTab) {
        throw new Error("找不到活动标签页");
      }
      if (!activeTab.id) {
          throw new Error("活动标签页没有ID");
      }
  
      // 注入脚本来修改标题
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (patternStr, replacementStr) => {
          try {
            const regex = new RegExp(patternStr, 'g'); // 'g' for global replacement
            document.title = document.title.replace(regex, replacementStr);
            return { success: true, newTitle: document.title }; // 返回修改后的标题
          } catch (e) {
            // 处理正则表达式错误或其他错误
            console.error('替换标题时出错:', e);
            // 需要一种方式将错误传回，但 executeScript 的结果处理比较复杂
            // 这里简单地在 content script 中 log 错误
            throw new Error(`替换标题脚本执行失败: ${e.message}`); 
          }
        },
        args: [pattern, replacement]
      });
  
      // executeScript 不直接返回 func 的返回值到 background script，
      // 如果需要获取新标题，需要更复杂的通信机制（如消息传递）或检查注入结果。
      // 这里我们假设执行成功即可。
      console.log(`尝试替换标签页 ${activeTab.id} 的标题`);
      return { success: true, message: "标题替换脚本已执行" };
  
    } catch (error) {
      console.error('替换标题失败:' + error.message, error);
      // 特别处理脚本注入错误
      if (error.message.includes("Cannot access contents of url")) {
           throw new Error(`替换标题失败: 无法访问当前页面的内容 (${error.message})。可能是权限问题或页面限制。`);
      }
       if (error.message.includes("No tab with id")) {
           throw new Error(`替换标题失败: 找不到ID为 ${commandParams.tabId} 的标签页。`);
      }
      throw new Error(`替换标题失败: ${error.message}`);
    }
  }
  
  /**
   * 发送 HTTP 请求。
   * 注意：MV3 background script 的生命周期限制可能会影响长时间运行或复杂的请求。
   * @param {object} commandParams 命令参数
   * @param {string} commandParams.url 请求URL
   * @param {string} [commandParams.method='GET'] 请求方法 (GET, POST, PUT, DELETE, etc.)
   * @param {object} [commandParams.headers] 请求头 (例如 { 'Content-Type': 'application/json' })
   * @param {string|object} [commandParams.body] 请求体 (对于POST/PUT等)
   * @param {string} [commandParams.responseType='text'] 期望的响应类型 ('text', 'json', 'arraybuffer', 'blob')
   * @param {object} msg 消息对象
   */
  async function qk_send_http_request(commandParams, msg) {
    try {
      const {
        url,
        method = 'GET',
        headers = {},
        body,
        responseType = 'text' // 默认为 'text'
      } = commandParams;
  
      if (!url) {
        throw new Error("请求URL不能为空");
      }
  
      const fetchOptions = {
        method: method.toUpperCase(),
        headers: headers,
      };
  
      // 根据方法添加 body
      if (body && (fetchOptions.method === 'POST' || fetchOptions.method === 'PUT' || fetchOptions.method === 'PATCH')) {
        // 如果 body 是对象且 Content-Type 是 json，则序列化
        if (typeof body === 'object' && headers['Content-Type'] && headers['Content-Type'].toLowerCase().includes('application/json')) {
          fetchOptions.body = JSON.stringify(body);
        } else {
          fetchOptions.body = body; // 否则直接使用 (如 string, FormData)
        }
      }
  
      console.log(`发送 HTTP 请求: ${fetchOptions.method} ${url}`);
      const response = await fetch(url, fetchOptions);
  
      console.log(`收到响应: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        // 尝试读取错误响应体
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) {
          console.warn('读取错误响应体失败:', e);
        }
        throw new Error(`HTTP 错误: ${response.status} ${response.statusText}. 响应体: ${errorBody}`);
      }
  
      let responseData;
      switch (responseType.toLowerCase()) {
        case 'json':
          responseData = await response.json();
          break;
        case 'arraybuffer':
          responseData = await response.arrayBuffer();
          // ArrayBuffer 不能直接序列化为 JSON 返回给 Quicker，需要考虑如何处理
          // 也许返回 Base64 编码的字符串？或提示用户数据已获取但无法直接返回。
          // 为了简单起见，这里可能抛出错误或返回提示信息。
           console.warn('ArrayBuffer 响应类型不易直接返回，将尝试返回文本表示');
           // 尝试转为文本，如果失败则提示
           try {
               responseData = await response.text(); 
           } catch {
              throw new Error("获取到 ArrayBuffer 响应，但无法转换为文本返回");
           }
          break;
        case 'blob':
          responseData = await response.blob();
          // Blob 同样不能直接序列化，处理方式类似 ArrayBuffer
          console.warn('Blob 响应类型不易直接返回，将尝试返回文本表示');
          try {
               responseData = await response.text(); 
           } catch {
              throw new Error("获取到 Blob 响应，但无法转换为文本返回");
           }
          break;
        case 'text':
        default:
          responseData = await response.text();
          break;
      }
  
      // 提取重要的响应头信息 (可选)
      const responseHeaders = {};
      response.headers.forEach((value, name) => {
        responseHeaders[name] = value;
      });
  
      return {
        success: true,
        message: `请求成功: ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData
      };
  
    } catch (error) {
      console.error('发送HTTP请求失败:' + error.message, error);
      // 网络错误等可能没有 response 对象
      throw new Error(`发送HTTP请求失败: ${error.message}`);
    }
  }