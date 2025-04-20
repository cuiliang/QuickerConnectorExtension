/**
 * @typedef {Object} ChromeCommandMessage
 * @template T
 * @property {number} serial - 命令序号
 * @property {number} [replyTo] - 响应哪条消息
 * @property {number} messageType - 消息类型
 * @property {string} cmd - 指令类型
 * @property {number} [tabId] - 要操作的tabId
 * @property {number} timeoutMs - 超时毫秒数
 * @property {string} [target] - 要操作的目标控件id、element
 * @property {boolean} waitComplete - 等待完成
 * @property {T} data - 指令参数
 */

// 使用特殊注释导出类型定义
/** @typedef {ChromeCommandMessage} ChromeCommandMessage */

// 导出空对象，使模块可以被导入
export {}; 