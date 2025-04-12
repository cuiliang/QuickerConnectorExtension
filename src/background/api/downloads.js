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
 * 开始一个新的下载。
 * @param {DownloadOptions} commandParams - 下载选项对象，包含 url、可选的 filename、conflictAction 等。
 * @returns {Promise<number>} 返回新创建下载项的 downloadId。如果下载未能成功开始，Promise 会被拒绝 (reject)。
 */
async function download(commandParams) {
  // chrome.downloads.download 需要一个 options 对象
  // commandParams 直接作为该对象传递
  return await chrome.downloads.download(commandParams);
}

/**
 * 搜索浏览器下载历史中的 DownloadItem。
 * @param {DownloadQuery} commandParams - 查询参数对象。如果省略或为空对象，则返回所有下载项。
 * @returns {Promise<DownloadItem[]>} 返回匹配的下载项数组。
 */
async function search(commandParams) {
  // chrome.downloads.search 需要一个 query 对象
  // commandParams 直接作为该对象传递
  // 如果 commandParams 为 undefined 或 null，则传递 {} 查询所有
  return await chrome.downloads.search(commandParams || {});
}

/**
 * 暂停指定的下载。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 要暂停的下载项 ID。
 * @returns {Promise<void>} 操作完成时解析。如果下载无法暂停（例如已完成或不存在），Promise 会被拒绝。
 */
async function pause(commandParams) {
  // chrome.downloads.pause 需要 downloadId 参数
  const { downloadId } = commandParams;
  return await chrome.downloads.pause(downloadId);
}

/**
 * 恢复已暂停的下载。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 要恢复的下载项 ID。
 * @returns {Promise<void>} 操作完成时解析。如果下载无法恢复（例如未暂停或不存在），Promise 会被拒绝。
 */
async function resume(commandParams) {
  // chrome.downloads.resume 需要 downloadId 参数
  const { downloadId } = commandParams;
  return await chrome.downloads.resume(downloadId);
}

/**
 * 取消下载。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 要取消的下载项 ID。
 * @returns {Promise<void>} 操作完成时解析。如果下载无法取消（例如已完成或不存在），Promise 会被拒绝。
 */
async function cancel(commandParams) {
  // chrome.downloads.cancel 需要 downloadId 参数
  const { downloadId } = commandParams;
  return await chrome.downloads.cancel(downloadId);
}

/**
 * 获取与指定下载项关联的文件图标。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 下载项 ID。
 * @param {Object} [commandParams.options] - 可选。图标选项对象。
 * @param {number} [commandParams.options.size] - 请求的图标大小，例如 16 或 32。
 * @returns {Promise<string>} 返回文件图标的 data URI 字符串。
 */
async function getFileIcon(commandParams) {
  // chrome.downloads.getFileIcon 需要 downloadId 和可选的 options 参数
  const { downloadId, options } = commandParams;
  return await chrome.downloads.getFileIcon(downloadId, options);
}

/**
 * 使用系统关联的应用程序打开下载的文件。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 要打开文件的下载项 ID。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function open(commandParams) {
  // chrome.downloads.open 需要 downloadId 参数
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
 * 在文件管理器中显示默认的下载文件夹。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function showDefaultFolder(commandParams) {
  // chrome.downloads.showDefaultFolder 不需要参数
  await chrome.downloads.showDefaultFolder();
  // API本身不返回，为了统一返回void Promise
  return Promise.resolve();
}

/**
 * 从下载历史记录中移除与查询匹配的 DownloadItem。不会删除下载的文件。
 * @param {DownloadQuery} commandParams - 查询参数对象。如果省略或为空对象，则清除所有下载历史。
 * @returns {Promise<number[]>} 返回被移除的下载项 ID 数组。
 */
async function erase(commandParams) {
  // chrome.downloads.erase 需要一个 query 对象
  // commandParams 直接作为该对象传递
  return await chrome.downloads.erase(commandParams || {});
}

/**
 * 删除与指定 downloadId 关联的已下载文件。此操作会移动文件到回收站/废纸篓。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 要删除其文件的下载项 ID。
 * @returns {Promise<void>} 操作完成时解析。如果文件无法删除，Promise 会被拒绝。
 */
async function removeFile(commandParams) {
  // chrome.downloads.removeFile 需要 downloadId 参数
  const { downloadId } = commandParams;
  return await chrome.downloads.removeFile(downloadId);
}

/**
 * 允许用户下载被标记为危险的文件。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 要接受的危险下载项 ID。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function acceptDanger(commandParams) {
  // chrome.downloads.acceptDanger 需要 downloadId 参数
  const { downloadId } = commandParams;
  return await chrome.downloads.acceptDanger(downloadId);
}

/**
 * 开始拖动指定的下载文件。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.downloadId - 要拖动的下载项 ID。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function drag(commandParams) {
  // chrome.downloads.drag 需要 downloadId 参数
  const { downloadId } = commandParams;
  return await chrome.downloads.drag(downloadId);
}

/**
 * 设置浏览器窗口底部的下载搁架 (shelf) 是否可见。
 * @param {Object} commandParams - 命令参数。
 * @param {boolean} commandParams.enabled - true 表示显示搁架，false 表示隐藏。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function setShelfEnabled(commandParams) {
  // chrome.downloads.setShelfEnabled 需要 enabled 参数
  const { enabled } = commandParams;
  // 注意：此API是同步的，没有回调或Promise，但为保持封装风格，返回一个resolved Promise
  chrome.downloads.setShelfEnabled(enabled);
  return Promise.resolve();
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