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
 * 在浏览器历史记录中搜索与指定查询匹配的 HistoryItem。
 * @param {Object} commandParams - 查询参数对象。
 * @param {string} commandParams.text - 用于限制结果的文本。空字符串""表示获取所有历史记录。
 * @param {number} [commandParams.startTime] - 可选。限制结果为在此时间之后访问的条目（毫秒时间戳）。
 * @param {number} [commandParams.endTime] - 可选。限制结果为在此时间之前访问的条目（毫秒时间戳）。
 * @param {number} [commandParams.maxResults=100] - 可选。要获取的最大结果数，默认为 100。
 * @returns {Promise<HistoryItem[]>} 返回匹配的历史记录条目数组。
 */
async function search(commandParams) {
  return await chrome.history.search(commandParams);
}

/**
 * 获取指定 URL 的所有访问记录 (VisitItem)。
 * @param {Object} commandParams - 包含 URL 的对象。
 * @param {string} commandParams.url - 要获取访问记录的 URL。
 * @returns {Promise<VisitItem[]>} 返回该 URL 的访问记录数组。
 */
async function getVisits(commandParams) {
  return await chrome.history.getVisits(commandParams);
}

/**
 * 将一个 URL 添加到历史记录中。
 * @param {Object} commandParams - 包含要添加的 URL 详细信息的对象。
 * @param {string} commandParams.url - 要添加的 URL。
 * @param {string} [commandParams.title] - 可选。页面的标题。
 * @param {number} [commandParams.visitTime] - 可选。访问时间（毫秒时间戳）。
 * @param {chrome.history.TransitionType} [commandParams.transition] - 可选。导航到此页面的方式。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function addUrl(commandParams) {
  return await chrome.history.addUrl(commandParams);
}

/**
 * 从历史记录中删除与指定 URL 相关的所有记录。
 * @param {Object} commandParams - 包含 URL 的对象。
 * @param {string} commandParams.url - 要删除其历史记录的 URL。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function deleteUrl(commandParams) {
  return await chrome.history.deleteUrl(commandParams);
}

/**
 * 删除在指定时间范围内的所有历史记录条目。
 * @param {Object} commandParams - 时间范围对象。
 * @param {number} commandParams.startTime - 范围开始时间（毫秒时间戳）。
 * @param {number} commandParams.endTime - 范围结束时间（毫秒时间戳）。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function deleteRange(commandParams) {
  return await chrome.history.deleteRange(commandParams);
}

/**
 * 删除所有浏览器历史记录。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function deleteAll(commandParams) {
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