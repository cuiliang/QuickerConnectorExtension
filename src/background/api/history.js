'use strict';

/**
 * 封装chrome.history API
 */

/**
 * 历史记录项
 * @typedef {Object} HistoryItem
 * @property {string} id - 历史记录项的唯一标识符
 * @property {string} url - 历史记录的URL
 * @property {string} [title] - 页面的标题
 * @property {number} [lastVisitTime] - 上次访问时间（毫秒）
 * @property {number} [visitCount] - 访问次数
 * @property {number} [typedCount] - 作为URL直接输入的次数
 */

/**
 * 访问记录
 * @typedef {Object} VisitItem
 * @property {string} id - 访问的唯一标识符
 * @property {number} visitId - 访问的唯一标识符
 * @property {number} visitTime - 访问时间（毫秒）
 * @property {string} referringVisitId - 引用的访问ID
 * @property {string} transition - 导航到此页面的方式
 */

/**
 * 搜索历史记录
 * @param {Object} commandParams - 命令参数
 * @param {string} [commandParams.text] - 搜索文本
 * @param {number} [commandParams.startTime] - 开始时间
 * @param {number} [commandParams.endTime] - 结束时间
 * @param {number} [commandParams.maxResults] - 最大结果数
 * @returns {Promise<HistoryItem[]>} 返回历史记录项数组
 */
async function search(commandParams) {
  return await chrome.history.search(commandParams);
}

/**
 * 获取访问详情
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.url - 要获取访问记录的URL
 * @returns {Promise<VisitItem[]>} 返回访问记录数组
 */
async function getVisits(commandParams) {
  const { url } = commandParams;
  return await chrome.history.getVisits({ url });
}

/**
 * 添加URL到历史记录
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.url - 要添加的URL
 * @param {string} [commandParams.title] - 页面标题
 * @param {number} [commandParams.visitTime] - 访问时间
 * @param {string} [commandParams.referringVisitId] - 引用的访问ID
 * @param {string} [commandParams.transition] - 导航到此页面的方式
 * @returns {Promise<void>} 无返回值
 */
async function addUrl(commandParams) {
  return await chrome.history.addUrl(commandParams);
}

/**
 * 删除指定URL的记录
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.url - 要删除的URL
 * @returns {Promise<void>} 无返回值
 */
async function deleteUrl(commandParams) {
  const { url } = commandParams;
  return await chrome.history.deleteUrl({ url });
}

/**
 * 删除指定范围的历史记录
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.startTime] - 开始时间
 * @param {number} [commandParams.endTime] - 结束时间
 * @returns {Promise<void>} 无返回值
 */
async function deleteRange(commandParams) {
  return await chrome.history.deleteRange(commandParams);
}

/**
 * 删除所有历史记录
 * @returns {Promise<void>} 无返回值
 */
async function deleteAll() {
  return await chrome.history.deleteAll();
}

export {
  search,
  getVisits,
  addUrl,
  deleteUrl,
  deleteRange,
  deleteAll
}; 