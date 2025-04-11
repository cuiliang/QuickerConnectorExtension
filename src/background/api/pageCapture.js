'use strict';

/**
 * 封装chrome.pageCapture API
 */

/**
 * 保存页面为MHTML
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 要保存的标签页ID
 * @returns {Promise<Blob>} 返回MHTML文档的Blob对象
 */
async function saveAsMHTML(commandParams) {
  const { tabId } = commandParams;
  return await chrome.pageCapture.saveAsMHTML({ tabId });
}

module.exports = {
  saveAsMHTML
}; 