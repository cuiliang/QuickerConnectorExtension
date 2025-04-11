'use strict';

/**
 * 封装chrome.debugger API
 */

/**
 * 调试器目标
 * @typedef {Object} Debuggee
 * @property {number} [tabId] - 调试目标的标签页ID
 * @property {number} [extensionId] - 调试目标的扩展ID
 * @property {string} [targetId] - 调试目标的ID
 */

/**
 * 调试器目标信息
 * @typedef {Object} TargetInfo
 * @property {string} type - 目标类型
 * @property {string} id - 目标ID
 * @property {string} [title] - 目标标题
 * @property {string} [url] - 目标URL
 * @property {boolean} [attached] - 是否已附加调试器
 * @property {string} [faviconUrl] - 目标图标URL
 */

/**
 * 附加调试器到目标
 * @param {Object} commandParams - 命令参数
 * @param {Debuggee} commandParams.target - 调试目标
 * @param {string} commandParams.requiredVersion - 需要的协议版本
 * @returns {Promise<void>} 无返回值
 */
async function attach(commandParams) {
  const { target, requiredVersion } = commandParams;
  return await chrome.debugger.attach(target, requiredVersion);
}

/**
 * 从目标分离调试器
 * @param {Object} commandParams - 命令参数
 * @param {Debuggee} commandParams.target - 调试目标
 * @returns {Promise<void>} 无返回值
 */
async function detach(commandParams) {
  const { target } = commandParams;
  return await chrome.debugger.detach(target);
}

/**
 * 向目标发送调试命令
 * @param {Object} commandParams - 命令参数
 * @param {Debuggee} commandParams.target - 调试目标
 * @param {string} commandParams.method - 调试方法
 * @param {Object} [commandParams.commandParams] - 命令参数
 * @returns {Promise<Object>} 返回调试命令执行结果
 */
async function sendCommand(commandParams) {
  const { target, method, commandParams: debuggerCommandParams } = commandParams;
  return await chrome.debugger.sendCommand(target, method, debuggerCommandParams);
}

/**
 * 获取可用的调试目标列表
 * @returns {Promise<TargetInfo[]>} 返回可用的调试目标列表
 */
async function getTargets() {
  return await chrome.debugger.getTargets();
}

module.exports = {
  attach,
  detach,
  sendCommand,
  getTargets
}; 