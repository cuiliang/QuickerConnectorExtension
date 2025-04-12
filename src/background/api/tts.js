'use strict';

/**
 * 封装chrome.tts API
 */

/**
 * 语音选项
 * @typedef {Object} TtsOptions
 * @property {string} [voiceName] - 语音名称
 * @property {string} [lang] - 语言
 * @property {string} [gender] - 性别
 * @property {number} [rate] - 语速，0.1到10.0之间
 * @property {number} [pitch] - 音调，0.0到2.0之间
 * @property {number} [volume] - 音量，0.0到1.0之间
 * @property {boolean} [enqueue] - 是否加入队列
 * @property {boolean} [requiredEventTypes] - 必需的事件类型数组
 * @property {boolean} [desiredEventTypes] - 期望的事件类型数组
 */

/**
 * 语音详情
 * @typedef {Object} TtsVoice
 * @property {string} voiceName - 语音名称
 * @property {string} [lang] - 语言
 * @property {string} [gender] - 性别
 * @property {boolean} [remote] - 是否为远程语音
 * @property {string} [extensionId] - 提供此语音的扩展ID
 * @property {string[]} [eventTypes] - 支持的事件类型数组
 */

/**
 * 使用指定的语音参数朗读文本。
 * @param {Object} commandParams - 命令参数。
 * @param {string} commandParams.utterance - 要朗读的文本字符串。
 * @param {TtsOptions} [commandParams.options] - 可选。朗读选项对象，用于指定语音、语速、音调等。
 * @returns {Promise<void>} 当朗读完成、被中断或取消时解析，如果发生错误则拒绝 (reject)。
 */
async function speak(commandParams) {
  const { utterance, options } = commandParams;
  return await chrome.tts.speak(utterance, options);
}

/**
 * 立即停止当前所有正在进行的朗读。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<void>} 操作完成时解析。
 */
function stop(commandParams) {
  chrome.tts.stop();
}

/**
 * 暂停当前的朗读（如果正在进行）。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<void>} 操作完成时解析。
 */
function pause() {
  return chrome.tts.pause();
}

/**
 * 如果朗读已暂停，则恢复朗读。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<void>} 操作完成时解析。
 */
function resume(commandParams) {
  chrome.tts.resume();
}

/**
 * 检查当前是否有正在进行的朗读（包括暂停状态）。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<boolean>} 返回一个布尔值，true 表示正在朗读或暂停，false 表示空闲。
 */
async function isSpeaking() {
  return await chrome.tts.isSpeaking();
}

/**
 * 获取浏览器支持的所有文本转语音引擎提供的可用语音列表。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<TtsVoice[]>} 返回一个包含 TtsVoice 对象的数组。
 */
async function getVoices(commandParams) {
  return await chrome.tts.getVoices();
}

export {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  getVoices
}; 