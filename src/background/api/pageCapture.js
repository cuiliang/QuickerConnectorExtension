'use strict';

/**
 * 封装chrome.pageCapture API
 */

/**
 * 将指定标签页的内容保存为 MHTML 文件。
 * @param {Object} commandParams - 包含要保存的标签页信息的对象。
 * @param {number} commandParams.tabId - 要保存为 MHTML 的标签页 ID。
 * @returns {Promise<Blob>} 返回包含 MHTML 内容的 Blob 对象。
 */
async function saveAsMHTML(commandParams) {
  // chrome.pageCapture.saveAsMHTML 需要一个包含 tabId 的 details 对象
  // commandParams 直接作为该对象传递
  return await chrome.pageCapture.saveAsMHTML(commandParams);
}

export {
  saveAsMHTML
}; 