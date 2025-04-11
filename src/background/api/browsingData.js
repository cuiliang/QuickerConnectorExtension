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
 * 移除应用程序缓存
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeAppcache(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeAppcache(options);
}

/**
 * 移除缓存
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeCache(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeCache(options);
}

/**
 * 移除缓存存储
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeCacheStorage(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeCacheStorage(options);
}

/**
 * 移除Cookie
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeCookies(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeCookies(options);
}

/**
 * 移除下载记录
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeDownloads(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeDownloads(options);
}

/**
 * 移除文件系统
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeFileSystems(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeFileSystems(options);
}

/**
 * 移除表单数据
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeFormData(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeFormData(options);
}

/**
 * 移除浏览历史
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeHistory(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeHistory(options);
}

/**
 * 移除IndexedDB数据
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeIndexedDB(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeIndexedDB(options);
}

/**
 * 移除本地存储
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeLocalStorage(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeLocalStorage(options);
}

/**
 * 移除插件数据
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removePluginData(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removePluginData(options);
}

/**
 * 移除密码
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removePasswords(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removePasswords(options);
}

/**
 * 移除Service Workers
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeServiceWorkers(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeServiceWorkers(options);
}

/**
 * 移除WebSQL数据
 * @param {Object} commandParams - 命令参数
 * @param {RemovalOptions} commandParams.options - 删除选项
 * @returns {Promise<void>} 无返回值
 */
async function removeWebSQL(commandParams) {
  const { options } = commandParams;
  return await chrome.browsingData.removeWebSQL(options);
}

/**
 * 获取浏览器的数据删除设置
 * @returns {Promise<SettingsSet>} 返回设置对象
 */
async function settings() {
  return await chrome.browsingData.settings();
}

module.exports = {
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