'use strict';

/**
 * 封装chrome.readingList API
 */

/**
 * 阅读列表项
 * @typedef {Object} ReadingListEntry
 * @property {string} id - 条目唯一标识符
 * @property {string} title - 条目标题
 * @property {string} url - 条目URL
 * @property {string} [excerpt] - 条目摘要
 * @property {string} [creationTime] - 创建时间
 * @property {string} [updateTime] - 更新时间
 * @property {boolean} [hasBeenRead] - 是否已读
 * @property {string} [lastReadTime] - 最后阅读时间
 */

/**
 * 向阅读列表添加一个条目。
 * @param {Object} commandParams - 要添加的条目信息。
 * @param {string} commandParams.url - 条目的 URL (必需)。
 * @param {string} commandParams.title - 条目的标题 (必需)。
 * @param {boolean} [commandParams.hasBeenRead=false] - 可选。条目是否标记为已读，默认为 false。
 * @returns {Promise<void>} 操作完成时解析。注意：API 文档说明不返回条目对象，仅在成功时解析。
 */
async function addEntry(commandParams) {
  // chrome.readingList.addEntry 需要一个包含 url 和 title 的对象
  return await chrome.readingList.addEntry(commandParams);
}

/**
 * 从阅读列表中移除一个条目。
 * @param {Object} commandParams - 要移除的条目信息。
 * @param {string} commandParams.url - 要移除条目的 URL (必需)。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeEntry(commandParams) {
  // chrome.readingList.removeEntry 需要一个包含 url 的对象
  return await chrome.readingList.removeEntry(commandParams);
}

/**
 * 查询阅读列表中的条目。
 * @param {Object} [commandParams] - 可选。查询过滤器对象 (目前 API 仅支持空对象，即查询所有条目)。
 * @returns {Promise<ReadingListEntry[]>} 返回匹配的阅读列表条目数组。
 */
async function query(commandParams) {
  // chrome.readingList.query 需要一个查询对象 (目前只能是空对象)
  // 忽略 commandParams，始终传递空对象查询所有
  return await chrome.readingList.query(commandParams);
}

/**
 * 根据 URL 获取阅读列表中的特定条目 (通过查询实现)。
 * @param {Object} commandParams - 命令参数。
 * @param {string} commandParams.url - 要查找的 URL。
 * @returns {Promise<ReadingListEntry | undefined>} 返回找到的阅读列表条目，如果未找到则返回 undefined。
 */
async function getEntryByUrl(commandParams) {
  // 使用 query 获取所有条目，然后在结果中查找匹配的 URL
  const { url } = commandParams;
  const entries = await chrome.readingList.query({});
  return entries.find(entry => entry.url === url);
}

/**
 * 更新阅读列表中的一个条目。
 * @param {Object} commandParams - 要更新的条目信息。
 * @param {string} commandParams.url - 要更新条目的 URL (必需)。
 * @param {string} [commandParams.title] - 可选。新的标题。
 * @param {boolean} [commandParams.hasBeenRead] - 可选。新的已读状态。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function updateEntry(commandParams) {
  // chrome.readingList.updateEntry 需要一个包含 url 及要更新字段的对象
  return await chrome.readingList.updateEntry(commandParams);
}

export {
  addEntry,
  removeEntry,
  query, // 重命名 getEntries 为 query 以匹配 API
  getEntryByUrl,
  updateEntry
}; 