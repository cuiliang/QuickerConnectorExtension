'use strict';

/**
 * 封装chrome.management API
 */

/**
 * 扩展图标信息
 * @typedef {Object} IconInfo
 * @property {number} size - 图标大小
 * @property {string} url - 图标URL
 */

/**
 * 扩展信息
 * @typedef {Object} ExtensionInfo
 * @property {string} id - 扩展ID
 * @property {string} name - 扩展名称
 * @property {string} shortName - 扩展简称
 * @property {string} description - 扩展描述
 * @property {string} version - 扩展版本
 * @property {boolean} mayDisable - 是否可以被禁用
 * @property {boolean} enabled - 是否启用
 * @property {string[]} [disabledReason] - 禁用原因
 * @property {boolean} isApp - 是否为应用
 * @property {string} type - 扩展类型
 * @property {string} appLaunchUrl - 应用启动URL
 * @property {string} homepageUrl - 主页URL
 * @property {string} updateUrl - 更新URL
 * @property {boolean} offlineEnabled - 是否支持离线
 * @property {string} optionsUrl - 选项页URL
 * @property {IconInfo[]} icons - 图标信息数组
 * @property {string[]} permissions - 权限数组
 * @property {string[]} hostPermissions - 主机权限数组
 * @property {string} installType - 安装类型
 */

/**
 * 获取所有扩展信息
 * @returns {Promise<ExtensionInfo[]>} 返回扩展信息数组
 */
async function getAll() {
  return await chrome.management.getAll();
}

/**
 * 获取指定扩展信息
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 扩展ID
 * @returns {Promise<ExtensionInfo>} 返回扩展信息
 */
async function get(commandParams) {
  const { id } = commandParams;
  return await chrome.management.get(id);
}

/**
 * 获取自身扩展信息
 * @returns {Promise<ExtensionInfo>} 返回自身扩展信息
 */
async function getSelf() {
  return await chrome.management.getSelf();
}

/**
 * 获取扩展权限警告
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 扩展ID
 * @returns {Promise<string[]>} 返回权限警告数组
 */
async function getPermissionWarningsById(commandParams) {
  const { id } = commandParams;
  return await chrome.management.getPermissionWarningsById(id);
}

/**
 * 通过manifest获取扩展权限警告
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.manifestStr - 清单字符串
 * @returns {Promise<string[]>} 返回权限警告数组
 */
async function getPermissionWarningsByManifest(commandParams) {
  const { manifestStr } = commandParams;
  return await chrome.management.getPermissionWarningsByManifest(manifestStr);
}

/**
 * 设置扩展启用状态
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 扩展ID
 * @param {boolean} commandParams.enabled - 是否启用
 * @returns {Promise<void>} 无返回值
 */
async function setEnabled(commandParams) {
  const { id, enabled } = commandParams;
  return await chrome.management.setEnabled(id, enabled);
}

/**
 * 卸载扩展
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 扩展ID
 * @param {Object} [commandParams.options] - 卸载选项
 * @returns {Promise<void>} 无返回值
 */
async function uninstall(commandParams) {
  const { id, options } = commandParams;
  return await chrome.management.uninstall(id, options);
}

/**
 * 启动应用
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 应用ID
 * @returns {Promise<void>} 无返回值
 */
async function launchApp(commandParams) {
  const { id } = commandParams;
  return await chrome.management.launchApp(id);
}

/**
 * 创建应用快捷方式
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 应用ID
 * @returns {Promise<void>} 无返回值
 */
async function createAppShortcut(commandParams) {
  const { id } = commandParams;
  return await chrome.management.createAppShortcut(id);
}

/**
 * 设置启动类型
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 应用ID
 * @param {string} commandParams.launchType - 启动类型
 * @returns {Promise<void>} 无返回值
 */
async function setLaunchType(commandParams) {
  const { id, launchType } = commandParams;
  return await chrome.management.setLaunchType(id, launchType);
}

/**
 * 生成应用图标
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.id - 应用ID
 * @param {Object} commandParams.options - 图标选项
 * @returns {Promise<Object>} 返回图标信息
 */
async function generateAppForLink(commandParams) {
  const { id, options } = commandParams;
  return await chrome.management.generateAppForLink(id, options);
}

export {
  getAll,
  get,
  getSelf,
  getPermissionWarningsById,
  getPermissionWarningsByManifest,
  setEnabled,
  uninstall,
  launchApp,
  createAppShortcut,
  setLaunchType,
  generateAppForLink
}; 