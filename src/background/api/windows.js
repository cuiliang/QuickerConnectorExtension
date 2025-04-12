'use strict';

/**
 * 封装chrome.windows API
 */

/**
 * 指定创建的浏览器窗口类型
 * @typedef {string} CreateType
 * "normal" - 指定窗口为标准窗口
 * "popup" - 指定窗口为弹出窗口
 * "panel" - 指定窗口为面板（已弃用，仅适用于Chrome OS上现有的允许列表中的扩展）
 */

/**
 * 窗口查询选项
 * @typedef {Object} QueryOptions
 * @property {boolean} [populate] - 如果为true，windows.Window对象会有一个tabs属性，包含Tab对象列表
 * @property {WindowType[]} [windowTypes] - 如果设置，返回的windows.Window基于类型过滤，默认为['normal', 'popup']
 */

/**
 * 窗口对象
 * @typedef {Object} Window
 * @property {boolean} alwaysOnTop - 窗口是否设置为始终置顶
 * @property {boolean} focused - 窗口当前是否为焦点窗口
 * @property {number} [height] - 窗口的高度（包括边框），以像素为单位
 * @property {number} [id] - 窗口的ID，在浏览器会话中唯一
 * @property {boolean} incognito - 窗口是否为隐身模式
 * @property {number} [left] - 窗口距离屏幕左边缘的偏移量（像素）
 * @property {string} [sessionId] - 用于唯一标识窗口的会话ID，从sessions API获取
 * @property {WindowState} [state] - 浏览器窗口的状态
 * @property {Object[]} [tabs] - 表示窗口中当前标签页的Tab对象数组
 * @property {number} [top] - 窗口距离屏幕顶部边缘的偏移量（像素）
 * @property {WindowType} [type] - 浏览器窗口的类型
 * @property {number} [width] - 窗口的宽度（包括边框），以像素为单位
 */

/**
 * 窗口状态
 * @typedef {string} WindowState
 * "normal" - 窗口处于正常状态
 * "minimized" - 窗口已最小化
 * "maximized" - 窗口已最大化
 * "fullscreen" - 窗口处于全屏模式
 * "locked-fullscreen" - 窗口处于锁定全屏模式（Chrome OS）
 */

/**
 * 窗口类型
 * @typedef {string} WindowType
 * "normal" - 常规浏览器窗口
 * "popup" - 弹出窗口
 * "panel" - 面板
 * "app" - 应用窗口
 * "devtools" - 开发者工具窗口
 */

/**
 * 创建窗口参数
 * @typedef {Object} CreateParams
 * @property {boolean} [allowScriptsToClose] - 是否允许脚本关闭窗口
 * @property {boolean} [alwaysOnTop] - 窗口是否始终置顶
 * @property {boolean} [focused] - 窗口是否获得焦点
 * @property {number} [height] - 窗口高度（像素）
 * @property {boolean} [incognito] - 是否创建隐身窗口
 * @property {number} [left] - 窗口距离屏幕左边的偏移量（像素）
 * @property {WindowState} [state] - 窗口状态
 * @property {number} [top] - 窗口距离屏幕顶部的偏移量（像素）
 * @property {CreateType} [type] - 要创建的窗口类型
 * @property {string} [url] - 要在新窗口打开的URL
 * @property {number} [width] - 窗口宽度（像素）
 */

/**
 * 更新窗口参数
 * @typedef {Object} UpdateInfo
 * @property {boolean} [drawAttention] - 如果为true，使窗口显示以吸引用户注意
 * @property {boolean} [focused] - 如果为true，将窗口带到前面
 * @property {number} [height] - 调整窗口高度（像素）
 * @property {number} [left] - 从屏幕左边缘移动窗口的偏移量（像素）
 * @property {WindowState} [state] - 窗口的新状态
 * @property {number} [top] - 从屏幕顶部边缘移动窗口的偏移量（像素）
 * @property {number} [width] - 调整窗口宽度（像素）
 */

/**
 * 创建新的浏览器窗口。
 * @param {CreateParams} commandParams - 创建窗口的参数对象。
 * @returns {Promise<Window>} 返回创建的窗口信息。
 */
async function create(commandParams) {
  return await chrome.windows.create(commandParams);
}

/**
 * 获取指定 ID 的窗口信息。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.windowId - 要获取的窗口 ID。
 * @param {QueryOptions} [commandParams.queryOptions] - 可选。查询选项，例如是否包含标签页信息。
 * @returns {Promise<Window>} 返回窗口信息。
 */
async function get(commandParams) {
  const { windowId, queryOptions } = commandParams;
  return await chrome.windows.get(windowId, queryOptions);
}

/**
 * 获取所有浏览器窗口的信息。
 * @param {Object} [commandParams] - 可选。命令参数。
 * @param {QueryOptions} [commandParams] - 可选。查询选项，例如是否包含标签页信息或过滤窗口类型。
 * @returns {Promise<Window[]>} 返回所有窗口信息的数组。
 */
async function getAll(commandParams) {
  const queryOptions  = commandParams || {};
  return await chrome.windows.getAll(queryOptions);
}

/**
 * 获取当前（通常是最后获得焦点的）浏览器窗口的信息。
 * @param {Object} [commandParams] - 可选。命令参数。
 * @param {QueryOptions} [commandParams] - 可选。查询选项，例如是否包含标签页信息。
 * @returns {Promise<Window>} 返回当前窗口信息。
 */
async function getCurrent(commandParams) {
  const queryOptions = commandParams || {};
  return await chrome.windows.getCurrent(queryOptions);
}

/**
 * 获取最后获得焦点的浏览器窗口（通常是用户当前正在交互的窗口）。
 * @param {Object} [commandParams] - 可选。命令参数。
 * @param {QueryOptions} [commandParams] - 可选。查询选项，例如是否包含标签页信息或过滤窗口类型。
 * @returns {Promise<Window>} 返回最后获得焦点的窗口信息。
 */
async function getLastFocused(commandParams) {
  const  queryOptions = commandParams || {};
  return await chrome.windows.getLastFocused(queryOptions);
}

/**
 * 移除（关闭）指定的窗口及其中的所有标签页。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.windowId - 要关闭的窗口 ID。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function remove(commandParams) {
  const { windowId } = commandParams;
  return await chrome.windows.remove(windowId);
}

/**
 * 更新指定窗口的属性。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.windowId - 要更新的窗口 ID。
 * @param {UpdateInfo} commandParams.updateInfo - 包含要更新的属性的对象。
 * @returns {Promise<Window>} 返回更新后的窗口信息。
 */
async function update(commandParams) {
  const { windowId, updateInfo } = commandParams;
  return await chrome.windows.update(windowId, updateInfo);
}

export {
  create,
  get,
  getAll,
  getCurrent,
  getLastFocused,
  remove,
  update
};



