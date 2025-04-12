'use strict';

/**
 * 封装chrome.browsingData API
 */

/**
 * 数据删除选项
 * @typedef {Object} RemovalOptions
 * @property {string} [cookiesStoreId] - 要删除cookie的cookie存储ID
 * @property {boolean} [hostnames] - 筛选要删除数据的主机名
 * @property {number|string} [since] - 要删除数据的开始时间戳（毫秒），省略表示"全部时间"
 * @property {string[]} [origins] - 要筛选删除数据的源
 */

/**
 * 数据类型
 * @typedef {Object} DataTypeSet
 * @property {boolean} [appcache] - 应用缓存
 * @property {boolean} [cache] - 普通缓存
 * @property {boolean} [cacheStorage] - 缓存存储
 * @property {boolean} [cookies] - Cookie
 * @property {boolean} [downloads] - 下载记录
 * @property {boolean} [fileSystems] - 文件系统
 * @property {boolean} [formData] - 表单数据
 * @property {boolean} [history] - 浏览历史
 * @property {boolean} [indexedDB] - IndexedDB数据
 * @property {boolean} [localStorage] - 本地存储
 * @property {boolean} [passwords] - 保存的密码
 * @property {boolean} [pluginData] - 插件数据
 * @property {boolean} [serviceWorkers] - Service Workers
 * @property {boolean} [webSQL] - WebSQL数据
 */

/**
 * 设置选项
 * @typedef {Object} SettingsSet
 * @property {DataTypeSet} dataRemovalPermitted - 允许删除的数据类型
 * @property {DataTypeSet} dataToRemove - 要删除的数据类型
 * @property {RemovalOptions} options - 删除选项
 */

/**
 * 移除浏览数据
 * @param {Object} commandParams - 命令参数
 * @param {DataTypeSet} commandParams.dataToRemove - 要删除的数据类型
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function remove(commandParams) {
  const { dataToRemove, options } = commandParams;
  return await chrome.browsingData.remove(options, dataToRemove);
}

/**
 * 清除应用程序缓存。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeAppcache(commandParams) {
  return await chrome.browsingData.removeAppcache(commandParams);
}

/**
 * 清除浏览器缓存。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeCache(commandParams) {
  return await chrome.browsingData.removeCache(commandParams);
}

/**
 * 清除缓存存储 (CacheStorage)。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeCacheStorage(commandParams) {
  return await chrome.browsingData.removeCacheStorage(commandParams);
}

/**
 * 清除 Cookie。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeCookies(commandParams) {
  return await chrome.browsingData.removeCookies(commandParams);
}

/**
 * 清除下载记录。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeDownloads(commandParams) {
  return await chrome.browsingData.removeDownloads(commandParams);
}

/**
 * 清除文件系统数据。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeFileSystems(commandParams) {
  return await chrome.browsingData.removeFileSystems(commandParams);
}

/**
 * 清除自动填充的表单数据。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeFormData(commandParams) {
  return await chrome.browsingData.removeFormData(commandParams);
}

/**
 * 清除浏览历史记录。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeHistory(commandParams) {
  return await chrome.browsingData.removeHistory(commandParams);
}

/**
 * 清除 IndexedDB 数据。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeIndexedDB(commandParams) {
  return await chrome.browsingData.removeIndexedDB(commandParams);
}

/**
 * 清除本地存储 (LocalStorage) 数据。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeLocalStorage(commandParams) {
  return await chrome.browsingData.removeLocalStorage(commandParams);
}

/**
 * 清除插件数据。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removePluginData(commandParams) {
  return await chrome.browsingData.removePluginData(commandParams);
}

/**
 * 清除保存的密码。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removePasswords(commandParams) {
  return await chrome.browsingData.removePasswords(commandParams);
}

/**
 * 清除 Service Worker 数据。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeServiceWorkers(commandParams) {
  return await chrome.browsingData.removeServiceWorkers(commandParams);
}

/**
 * 清除 WebSQL 数据。
 * @param {RemovalOptions} commandParams - 清除选项对象，指定时间范围和来源限制。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function removeWebSQL(commandParams) {
  return await chrome.browsingData.removeWebSQL(commandParams);
}

/**
 * 获取当前浏览器的数据清除设置。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<SettingsSet>} 返回包含当前设置的对象。
 */
async function settings(commandParams) {
  return await chrome.browsingData.settings();
}

export {
  remove,
  removeAppcache,
  removeCache,
  removeCacheStorage,
  removeCookies,
  removeDownloads,
  removeFileSystems,
  removeFormData,
  removeHistory,
  removeIndexedDB,
  removeLocalStorage,
  removePluginData,
  removePasswords,
  removeServiceWorkers,
  removeWebSQL,
  settings
}; 