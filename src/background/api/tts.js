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
 * 朗读文本
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.utterance - 要朗读的文本
 * @param {TtsOptions} [commandParams.options] - 朗读选项
 * @returns {Promise<void>} 无返回值
 */
async function speak(commandParams) {
  const { utterance, options } = commandParams;
  return new Promise((resolve, reject) => {
    chrome.tts.speak(utterance, {
      ...options,
      onEvent: function(event) {
        if (event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled' || event.type === 'error') {
          if (event.type === 'error') {
            reject(new Error(event.errorMessage || '语音合成错误'));
          } else {
            resolve();
          }
        }
      }
    });
  });
}

/**
 * 停止朗读
 * @returns {Promise<void>} 无返回值
 */
async function stop() {
  return await chrome.tts.stop();
}

/**
 * 暂停朗读
 * @returns {Promise<void>} 无返回值
 */
async function pause() {
  return await chrome.tts.pause();
}

/**
 * 恢复朗读
 * @returns {Promise<void>} 无返回值
 */
async function resume() {
  return await chrome.tts.resume();
}

/**
 * 是否正在朗读
 * @returns {Promise<boolean>} 返回是否正在朗读
 */
async function isSpeaking() {
  return await chrome.tts.isSpeaking();
}

/**
 * 获取所有可用的语音
 * @returns {Promise<TtsVoice[]>} 返回可用语音数组
 */
async function getVoices() {
  return await chrome.tts.getVoices();
}

module.exports = {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  getVoices
}; 