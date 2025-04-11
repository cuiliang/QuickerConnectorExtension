'use strict';

/**
 * 封装chrome.downloads API
 */

/**
 * 下载项
 * @typedef {Object} DownloadItem
 * @property {number} id - 下载项的唯一标识符
 * @property {string} url - 下载项的URL
 * @property {string} [referrer] - 下载引用页URL
 * @property {string} filename - 目标文件名
 * @property {boolean} [incognito] - 是否在隐身模式下下载
 * @property {boolean} [danger] - 下载项是否可能有危险
 * @property {string} mime - 下载项的MIME类型
 * @property {string} [startTime] - 下载开始时间
 * @property {number} [bytesReceived] - 已接收的字节数
 * @property {number} [totalBytes] - 下载项的总字节数
 * @property {string} [state] - 下载项的状态
 * @property {boolean} [paused] - 下载是否暂停
 * @property {boolean} [canResume] - 暂停的下载是否可以恢复
 * @property {string} [error] - 下载中断的原因
 * @property {number} [endTime] - 下载结束时间
 * @property {boolean} [exists] - 下载文件是否存在
 * @property {string} [byExtensionId] - 启动下载的扩展ID
 * @property {string} [byExtensionName] - 启动下载的扩展名称
 */

/**
 * 下载查询选项
 * @typedef {Object} DownloadQuery
 * @property {string} [query] - 匹配下载项的字符串
 * @property {number} [startedBefore] - 在此时间之前开始的下载
 * @property {number} [startedAfter] - 在此时间之后开始的下载
 * @property {number} [endedBefore] - 在此时间之前结束的下载
 * @property {number} [endedAfter] - 在此时间之后结束的下载
 * @property {number} [totalBytesGreater] - 总字节数大于此值的下载
 * @property {number} [totalBytesLess] - 总字节数小于此值的下载
 * @property {string} [filenameRegex] - 匹配文件名的正则表达式
 * @property {string} [urlRegex] - 匹配URL的正则表达式
 * @property {number} [limit] - 结果的最大数量
 * @property {number[]} [id] - 指定下载ID数组
 * @property {string} [url] - 匹配URL的模式
 * @property {string} [filename] - 匹配文件名的模式
 * @property {string} [danger] - 匹配危险类型
 * @property {string} [mime] - 匹配MIME类型
 * @property {string} [state] - 匹配状态
 * @property {boolean} [paused] - 匹配暂停状态
 * @property {boolean} [error] - 匹配错误
 * @property {boolean} [exists] - 匹配文件是否存在
 */

/**
 * 下载选项
 * @typedef {Object} DownloadOptions
 * @property {string} url - 要下载的URL
 * @property {string} [filename] - 可选的文件名
 * @property {boolean} [conflictAction] - 文件冲突时的处理方式
 * @property {boolean} [saveAs] - 是否显示保存对话框
 * @property {string} [method] - 下载使用的HTTP方法
 * @property {Object} [headers] - 下载请求的自定义头
 * @property {string} [body] - POST请求的正文
 */

/**
 * 下载项变化信息
 * @typedef {Object} DownloadDelta
 * @property {number} id - 变化的下载项ID
 * @property {Object} [url] - URL的变化
 * @property {Object} [filename] - 文件名的变化
 * @property {Object} [danger] - 危险状态的变化
 * @property {Object} [mime] - MIME类型的变化
 * @property {Object} [startTime] - 开始时间的变化
 * @property {Object} [endTime] - 结束时间的变化
 * @property {Object} [state] - 状态的变化
 * @property {Object} [canResume] - 可恢复状态的变化
 * @property {Object} [paused] - 暂停状态的变化
 * @property {Object} [error] - 错误状态的变化
 * @property {Object} [totalBytes] - 总字节数的变化
 * @property {Object} [bytesReceived] - 已接收字节数的变化
 * @property {Object} [fileSize] - 文件大小的变化
 * @property {Object} [exists] - 文件存在状态的变化
 */

/**
 * 下载
 * @param {Object} commandParams - 命令参数
 * @param {DownloadOptions} commandParams.options - 下载选项
 * @returns {Promise<number>} 返回下载项ID
 */
async function download(commandParams) {
  const { options } = commandParams;
  return await chrome.downloads.download(options);
}

/**
 * 搜索下载项
 * @param {Object} commandParams - 命令参数
 * @param {DownloadQuery} [commandParams.query] - 搜索条件
 * @returns {Promise<DownloadItem[]>} 返回下载项列表
 */
async function search(commandParams) {
  const { query } = commandParams || {};
  return await chrome.downloads.search(query);
}

/**
 * 暂停下载
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<void>} 无返回值
 */
async function pause(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.pause(downloadId);
}

/**
 * 恢复下载
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<void>} 无返回值
 */
async function resume(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.resume(downloadId);
}

/**
 * 取消下载
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<void>} 无返回值
 */
async function cancel(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.cancel(downloadId);
}

/**
 * 获取下载文件的保存路径
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<string>} 返回下载文件的路径
 */
async function getFileIcon(commandParams) {
  const { downloadId, options } = commandParams;
  return await chrome.downloads.getFileIcon(downloadId, options);
}

/**
 * 打开下载项
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<void>} 无返回值
 */
async function open(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.open(downloadId);
}

/**
 * 显示下载项
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<boolean>} 返回是否成功
 */
async function show(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.show(downloadId);
}

/**
 * 显示默认下载文件夹
 * @returns {Promise<boolean>} 返回是否成功
 */
async function showDefaultFolder() {
  return await chrome.downloads.showDefaultFolder();
}

/**
 * 擦除下载历史
 * @param {Object} commandParams - 命令参数
 * @param {DownloadQuery} [commandParams.query] - 查询条件
 * @returns {Promise<number[]>} 返回被擦除的下载ID数组
 */
async function erase(commandParams) {
  const { query } = commandParams || {};
  return await chrome.downloads.erase(query);
}

/**
 * 删除下载文件
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<void>} 无返回值
 */
async function removeFile(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.removeFile(downloadId);
}

/**
 * 接受危险下载
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<void>} 无返回值
 */
async function acceptDanger(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.acceptDanger(downloadId);
}

/**
 * 拖动下载项
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.downloadId - 下载项ID
 * @returns {Promise<void>} 无返回值
 */
async function drag(commandParams) {
  const { downloadId } = commandParams;
  return await chrome.downloads.drag(downloadId);
}

/**
 * 设置下载UI是否显示
 * @param {Object} commandParams - 命令参数
 * @param {boolean} commandParams.enabled - 是否显示
 * @returns {Promise<void>} 无返回值
 */
async function setShelfEnabled(commandParams) {
  const { enabled } = commandParams;
  return await chrome.downloads.setShelfEnabled(enabled);
}

export {
  download,
  search,
  pause,
  resume,
  cancel,
  getFileIcon,
  open,
  show,
  showDefaultFolder,
  erase,
  removeFile,
  acceptDanger,
  drag,
  setShelfEnabled
}; 