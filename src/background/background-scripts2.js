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
async function downloadFile(commandParams, msg) {
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
  async function findTabs(commandParams, msg) {
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
  async function replaceTabsTitle(commandParams, msg) {
    try {
      const { pattern, replacement } = commandParams;
  
      if (pattern === undefined || replacement === undefined) {
        throw new Error("必须提供正则表达式模式和替换字符串");
      }
  
      // 获取所有标签页
      const allTabs = await chrome.tabs.query({});
  
      let modifiedCount = 0;
      let skippedCount = 0; // 因不匹配或无ID而跳过
      let failedCount = 0;
      const errors = [];
  
      const scriptFunc = (patternStr, replacementStr) => {
          try {
            // 'u' flag for unicode support might be useful depending on titles
            const regex = new RegExp(patternStr, 'gu'); 
            if (regex.test(document.title)) {
              const oldTitle = document.title;
              const newTitle = oldTitle.replace(regex, replacementStr);
              // 仅在标题实际更改时才更新，避免不必要的 DOM 操作
              if (newTitle !== oldTitle) {
                 document.title = newTitle;
                 return { changed: true, newTitle: document.title };
              } else {
                 return { changed: false, reason: "替换结果与原标题相同" };
              }
            } else {
              return { changed: false, reason: "标题不匹配模式" };
            }
          } catch (e) {
            console.error('标签页标题替换脚本执行失败:', e);
            // 将脚本内部错误传递回 background
            return { error: `脚本执行失败: ${e.message}` }; 
          }
        };
  
      for (const tab of allTabs) {
        if (!tab.id) {
          console.log(`跳过没有 ID 的标签页: ${tab.url || '未知 URL'}`);
          skippedCount++;
          continue;
        }
  
        try {
          // 注入脚本到每个标签页
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scriptFunc,
            args: [pattern, replacement]
          });
  
          // executeScript 返回一个结果数组，通常包含一个主框架的结果
          if (results && results[0] && results[0].result) {
            const result = results[0].result;
            if (result.error) {
               console.warn(`标签页 ${tab.id} (${tab.title}) 脚本执行出错: ${result.error}`);
               failedCount++;
               errors.push({ tabId: tab.id, title: tab.title, url: tab.url, error: result.error });
            } else if (result.changed) {
               console.log(`标签页 ${tab.id} (${tab.title}) 标题已修改为: ${result.newTitle}`);
               modifiedCount++;
            } else {
               // console.log(`标签页 ${tab.id} (${tab.title}) 未修改: ${result.reason}`);
               skippedCount++;
            }
          } else {
              // 处理没有结果或结果格式不符合预期的情况
              console.warn(`标签页 ${tab.id} (${tab.title}) 脚本执行未返回有效结果。`, results);
              // 可能是由于页面限制（如 chrome:// URLs）或权限问题，虽然 executeScript 本身可能不抛错
              failedCount++;
              errors.push({ tabId: tab.id, title: tab.title, url: tab.url, error: "脚本执行未返回有效结果" });
          }
  
        } catch (error) {
          // 处理注入脚本时的错误（例如，无法访问页面）
          console.error(`处理标签页 ${tab.id} (${tab.title}) 时出错: ${error.message}`, error);
          failedCount++;
           errors.push({ tabId: tab.id, title: tab.title, url: tab.url, error: `注入脚本失败: ${error.message}` });
           // 可以根据 error.message 进一步细化错误原因
        }
      }
  
      const message = `标题替换操作完成: ${modifiedCount} 个标签页被修改, ${skippedCount} 个标签页未匹配或跳过, ${failedCount} 个标签页处理失败。`;
      console.log(message);
      if (failedCount > 0) {
          console.warn('失败详情:', errors);
      }
  
      return {
          success: true, // 操作本身是成功的，即使部分标签页失败
          message: message,
          modifiedCount: modifiedCount,
          skippedCount: skippedCount,
          failedCount: failedCount,
          errors: failedCount > 0 ? errors : undefined // 仅在有错误时返回错误详情
       };
  
    } catch (error) {
      // 处理函数级别的错误（例如参数错误，查询标签页失败）
      console.error('执行 replaceTabsTitle 时发生意外错误:', error);
      // 让调用者知道整个操作失败了
      throw new Error(`替换所有标签页标题时发生错误: ${error.message}`);
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
  async function sendHttpRequest(commandParams, msg) {
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