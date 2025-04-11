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
 * 添加条目到阅读列表
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.url - 要添加的URL
 * @param {string} [commandParams.title] - 条目标题
 * @param {boolean} [commandParams.hasBeenRead] - 是否已读
 * @returns {Promise<ReadingListEntry>} 返回添加的阅读列表条目
 */
async function addEntry(commandParams) {
  return await chrome.readingList.addEntry(commandParams);
}

/**
 * 从阅读列表中移除条目
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 条目ID
 * @returns {Promise<void>} 无返回值
 */
async function removeEntry(commandParams) {
  const { id } = commandParams;
  return await chrome.readingList.removeEntry(id);
}

/**
 * 获取所有阅读列表条目
 * @returns {Promise<ReadingListEntry[]>} 返回阅读列表条目数组
 */
async function getEntries() {
  return await chrome.readingList.getEntries();
}

/**
 * 根据URL查找阅读列表条目
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.url - 要查找的URL
 * @returns {Promise<ReadingListEntry>} 返回找到的阅读列表条目
 */
async function getEntryByUrl(commandParams) {
  const { url } = commandParams;
  return await chrome.readingList.getEntryByUrl(url);
}

/**
 * 更新阅读列表条目
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 条目ID
 * @param {boolean} [commandParams.hasBeenRead] - 是否已读
 * @returns {Promise<ReadingListEntry>} 返回更新后的阅读列表条目
 */
async function updateEntry(commandParams) {
  const { id, hasBeenRead } = commandParams;
  return await chrome.readingList.updateEntry(id, { hasBeenRead });
}

export {
  addEntry,
  removeEntry,
  getEntries,
  getEntryByUrl,
  updateEntry
}; 