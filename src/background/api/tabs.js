'use strict';

/**
 * 封装chrome.tabs API
 */

/**
 * 标签页信息
 * @typedef {Object} Tab
 * @property {boolean} active - 标签页是否激活
 * @property {boolean} audible - 标签页是否发出声音
 * @property {boolean} autoDiscardable - 标签页是否可以自动丢弃
 * @property {number} [discarded] - 标签页是否已被丢弃
 * @property {string} [favIconUrl] - 标签页图标URL
 * @property {number} [groupId] - 标签页所在组ID
 * @property {number} [height] - 标签页高度
 * @property {boolean} highlighted - 标签页是否高亮
 * @property {number} id - 标签页ID
 * @property {boolean} incognito - 标签页是否在隐身模式
 * @property {number} index - 标签页在窗口中的索引
 * @property {boolean} [muted] - 标签页是否静音
 * @property {Object} mutedInfo - 标签页静音信息
 * @property {number} [openerTabId] - 打开此标签页的标签页ID
 * @property {string} [pendingUrl] - 待加载的URL
 * @property {boolean} pinned - 标签页是否固定
 * @property {string} [sessionId] - 标签页的会话ID
 * @property {string} status - 标签页加载状态
 * @property {string} title - 标签页标题
 * @property {string} url - 标签页URL
 * @property {number} [width] - 标签页宽度
 * @property {number} windowId - 标签页所在窗口ID
 */

/**
 * 静音信息
 * @typedef {Object} MutedInfo
 * @property {boolean} muted - 是否静音
 * @property {string} [reason] - 静音原因
 * @property {string} [extensionId] - 静音的扩展ID
 */

/**
 * 标签页缩放类型
 * @typedef {string} ZoomSettingsMode
 * "automatic" | "manual" | "disabled"
 */

/**
 * 标签页缩放范围
 * @typedef {string} ZoomSettingsScope
 * "per-origin" | "per-tab"
 */

/**
 * 缩放设置
 * @typedef {Object} ZoomSettings
 * @property {number} [defaultZoomFactor] - 默认缩放比例
 * @property {ZoomSettingsMode} [mode] - 缩放模式
 * @property {ZoomSettingsScope} [scope] - 缩放范围
 */

/**
 * 创建标签页属性
 * @typedef {Object} CreateProperties
 * @property {boolean} [active] - 是否激活
 * @property {number} [index] - 标签页索引
 * @property {number} [openerTabId] - 打开此标签页的标签页ID
 * @property {boolean} [pinned] - 是否固定
 * @property {boolean} [selected] - 是否选中
 * @property {string} [url] - 标签页URL
 * @property {number} [windowId] - 窗口ID
 */

/**
 * 更新标签页属性
 * @typedef {Object} UpdateProperties
 * @property {boolean} [active] - 是否激活
 * @property {boolean} [autoDiscardable] - 是否可自动丢弃
 * @property {boolean} [highlighted] - 是否高亮
 * @property {boolean} [muted] - 是否静音
 * @property {number} [openerTabId] - 打开此标签页的标签页ID
 * @property {boolean} [pinned] - 是否固定
 * @property {string} [url] - 标签页URL
 */

/**
 * 移动标签页属性
 * @typedef {Object} MoveProperties
 * @property {number} index - 新索引
 * @property {number} [windowId] - 目标窗口ID
 */

/**
 * 查询标签页过滤器
 * @typedef {Object} QueryFilter
 * @property {boolean} [active] - 是否激活
 * @property {boolean} [audible] - 是否发出声音
 * @property {number} [currentWindow] - 是否当前窗口
 * @property {boolean} [discarded] - 是否已丢弃
 * @property {number} [groupId] - 标签组ID
 * @property {boolean} [highlighted] - 是否高亮
 * @property {number} [index] - 索引
 * @property {boolean} [lastFocusedWindow] - 是否最后聚焦窗口
 * @property {boolean} [muted] - 是否静音
 * @property {boolean} [pinned] - 是否固定
 * @property {string} [status] - 加载状态
 * @property {string} [title] - 标题
 * @property {string} [url] - URL
 * @property {number} [windowId] - 窗口ID
 * @property {string} [windowType] - 窗口类型
 */

/**
 * 高亮标签页选项
 * @typedef {Object} HighlightInfo
 * @property {number[]} tabs - 标签页索引数组
 * @property {number} [windowId] - 窗口ID
 */

/**
 * 创建标签页
 * @param {Object} commandParams - 命令参数
 * @param {CreateProperties} commandParams.createProperties - 创建属性
 * @returns {Promise<Tab>} 返回创建的标签页
 */
async function create(commandParams) {
  const { createProperties } = commandParams;
  return await chrome.tabs.create(createProperties);
}

/**
 * 获取标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 标签页ID
 * @returns {Promise<Tab>} 返回标签页信息
 */
async function get(commandParams) {
  const { tabId } = commandParams;
  return await chrome.tabs.get(tabId);
}

/**
 * 查询标签页
 * @param {Object} commandParams - 命令参数
 * @param {QueryFilter} [commandParams.queryInfo] - 查询条件
 * @returns {Promise<Tab[]>} 返回匹配的标签页数组
 */
async function query(commandParams) {
  const { queryInfo } = commandParams || {};
  return await chrome.tabs.query(queryInfo);
}

/**
 * 更新标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 标签页ID
 * @param {UpdateProperties} commandParams.updateProperties - 更新属性
 * @returns {Promise<Tab>} 返回更新后的标签页
 */
async function update(commandParams) {
  const { tabId, updateProperties } = commandParams;
  return await chrome.tabs.update(tabId, updateProperties);
}

/**
 * 移动标签页
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 标签页ID或ID数组
 * @param {MoveProperties} commandParams.moveProperties - 移动属性
 * @returns {Promise<Tab|Tab[]>} 返回移动后的标签页
 */
async function move(commandParams) {
  const { tabIds, moveProperties } = commandParams;
  return await chrome.tabs.move(tabIds, moveProperties);
}

/**
 * 重新加载标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 标签页ID，省略表示当前标签页
 * @param {Object} [commandParams.reloadProperties] - 重新加载属性
 * @returns {Promise<void>} 无返回值
 */
async function reload(commandParams) {
  const { tabId, reloadProperties } = commandParams || {};
  return await chrome.tabs.reload(tabId, reloadProperties);
}

/**
 * 重复标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 标签页ID
 * @returns {Promise<Tab>} 返回新创建的标签页
 */
async function duplicate(commandParams) {
  const { tabId } = commandParams;
  return await chrome.tabs.duplicate(tabId);
}

/**
 * 发送消息给标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 标签页ID
 * @param {any} commandParams.message - 消息内容
 * @param {Object} [commandParams.options] - 发送选项
 * @returns {Promise<any>} 返回接收方的响应
 */
async function sendMessage(commandParams) {
  const { tabId, message, options } = commandParams;
  return await chrome.tabs.sendMessage(tabId, message, options);
}

/**
 * 关闭标签页
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 标签页ID或ID数组
 * @returns {Promise<void>} 无返回值
 */
async function remove(commandParams) {
  const { tabIds } = commandParams;
  return await chrome.tabs.remove(tabIds);
}

/**
 * 分组标签页
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 标签页ID或ID数组
 * @param {number} [commandParams.groupId] - 标签组ID，省略则创建新组
 * @returns {Promise<number>} 返回标签组ID
 */
async function group(commandParams) {
  const { tabIds, groupId } = commandParams;
  return await chrome.tabs.group({ tabIds, groupId });
}

/**
 * 取消标签页分组
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 标签页ID或ID数组
 * @returns {Promise<number>} 返回标签组ID
 */
async function ungroup(commandParams) {
  const { tabIds } = commandParams;
  return await chrome.tabs.ungroup(tabIds);
}

/**
 * 丢弃标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 标签页ID
 * @returns {Promise<Tab>} 返回丢弃的标签页
 */
async function discard(commandParams) {
  const { tabId } = commandParams;
  return await chrome.tabs.discard(tabId);
}

/**
 * 执行脚本
 * @param {Object} commandParams - 命令参数
 * @param {Object} commandParams.details - 脚本详情
 * @returns {Promise<any[]>} 返回脚本执行结果
 */
async function executeScript(commandParams) {
  const { details } = commandParams;
  return await chrome.tabs.executeScript(details);
}

/**
 * 插入CSS
 * @param {Object} commandParams - 命令参数
 * @param {Object} commandParams.details - CSS详情
 * @returns {Promise<void>} 无返回值
 */
async function insertCSS(commandParams) {
  const { details } = commandParams;
  return await chrome.tabs.insertCSS(details);
}

/**
 * 移除CSS
 * @param {Object} commandParams - 命令参数
 * @param {Object} commandParams.details - CSS详情
 * @returns {Promise<void>} 无返回值
 */
async function removeCSS(commandParams) {
  const { details } = commandParams;
  return await chrome.tabs.removeCSS(details);
}

/**
 * 设置缩放
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 标签页ID
 * @param {number} commandParams.zoomFactor - 缩放比例
 * @returns {Promise<void>} 无返回值
 */
async function setZoom(commandParams) {
  const { tabId, zoomFactor } = commandParams;
  return await chrome.tabs.setZoom(tabId, zoomFactor);
}

/**
 * 获取缩放
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 标签页ID
 * @returns {Promise<number>} 返回缩放比例
 */
async function getZoom(commandParams) {
  const { tabId } = commandParams || {};
  return await chrome.tabs.getZoom(tabId);
}

/**
 * 设置缩放设置
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 标签页ID
 * @param {ZoomSettings} commandParams.zoomSettings - 缩放设置
 * @returns {Promise<void>} 无返回值
 */
async function setZoomSettings(commandParams) {
  const { tabId, zoomSettings } = commandParams;
  return await chrome.tabs.setZoomSettings(tabId, zoomSettings);
}

/**
 * 获取缩放设置
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 标签页ID
 * @returns {Promise<ZoomSettings>} 返回缩放设置
 */
async function getZoomSettings(commandParams) {
  const { tabId } = commandParams || {};
  return await chrome.tabs.getZoomSettings(tabId);
}

/**
 * 高亮标签页
 * @param {Object} commandParams - 命令参数
 * @param {HighlightInfo} commandParams.highlightInfo - 高亮信息
 * @returns {Promise<Object>} 返回包含窗口ID的对象
 */
async function highlight(commandParams) {
  const { highlightInfo } = commandParams;
  return await chrome.tabs.highlight(highlightInfo);
}

/**
 * 捕获标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 标签页ID
 * @param {Object} [commandParams.options] - 捕获选项
 * @returns {Promise<string>} 返回捕获的图像数据URL
 */
async function captureVisibleTab(commandParams) {
  const { tabId, options } = commandParams || {};
  return await chrome.tabs.captureVisibleTab(tabId, options);
}

/**
 * 检测语言
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 标签页ID
 * @returns {Promise<string>} 返回检测到的语言
 */
async function detectLanguage(commandParams) {
  const { tabId } = commandParams;
  return await chrome.tabs.detectLanguage(tabId);
}

/**
 * 切换静音
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 标签页ID或ID数组
 * @param {boolean} commandParams.muted - 是否静音
 * @returns {Promise<Tab[]>} 返回更新的标签页数组
 */
async function toggleMuteState(commandParams) {
  const { tabIds, muted } = commandParams;
  return await chrome.tabs.toggleMuteState(tabIds, muted);
}

/**
 * 获取所选标签页
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.windowId] - 窗口ID
 * @returns {Promise<Tab[]>} 返回选中的标签页数组
 */
async function getSelected(commandParams) {
  const { windowId } = commandParams || {};
  return await chrome.tabs.getSelected(windowId);
}

/**
 * 获取当前标签页
 * @returns {Promise<Tab>} 返回当前标签页
 */
async function getCurrent() {
  return await chrome.tabs.getCurrent();
}

export {
  create,
  get,
  query,
  update,
  move,
  reload,
  duplicate,
  sendMessage,
  remove,
  group,
  ungroup,
  discard,
  executeScript,
  insertCSS,
  removeCSS,
  setZoom,
  getZoom,
  setZoomSettings,
  getZoomSettings,
  highlight,
  captureVisibleTab,
  detectLanguage,
  toggleMuteState,
  getSelected,
  getCurrent
}; 