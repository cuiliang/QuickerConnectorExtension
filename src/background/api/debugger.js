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
 * 将调试器附加到指定的目标 (tab, extension, etc.)。
 * @param {Object} commandParams - 命令参数。
 * @param {Debuggee} commandParams.target - 调试目标，包含 tabId, extensionId 或 targetId。
 * @param {string} commandParams.requiredVersion - 要求的调试协议版本 (例如, "1.3")。
 * @returns {Promise<void>} 附加成功时解析。如果目标已被附加或不存在，Promise 会被拒绝。
 */
async function attach(commandParams) {
  const { target, requiredVersion } = commandParams;
  return await chrome.debugger.attach(target, requiredVersion);
}

/**
 * 从指定的目标分离调试器。
 * @param {Object} commandParams - 命令参数。
 * @param {Debuggee} target - 调试目标。
 * @returns {Promise<void>} 分离成功时解析。如果目标未附加或不存在，Promise 会被拒绝。
 */
async function detach(commandParams) {
  const  target  = commandParams;
  return await chrome.debugger.detach(target);
}

/**
 * 向指定的调试目标发送调试协议命令。
 * @param {Object} commandParams - 命令参数。
 * @param {Debuggee} commandParams.target - 调试目标。
 * @param {string} commandParams.method - 要调用的调试协议方法名。
 * @param {Object} [commandParams.commandParams] - 可选。传递给调试方法的参数对象。
 * @returns {Promise<Object | undefined>} 返回命令执行的结果对象。如果发生错误或命令没有返回值，可能返回 undefined。
 */
async function sendCommand(commandParams) {
  const { target, method, commandParams: debuggerCommandParams } = commandParams;
  return await chrome.debugger.sendCommand(target, method, debuggerCommandParams);
}

/**
 * 获取当前可用的调试目标列表。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<TargetInfo[]>} 返回 TargetInfo 对象数组。
 */
async function getTargets(commandParams) {
  return await chrome.debugger.getTargets();
}

export {
  attach,
  detach,
  sendCommand,
  getTargets
}; 