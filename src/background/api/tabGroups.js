'use strict';

/**
 * 封装chrome.tabGroups API
 */

/**
 * 标签组颜色
 * @typedef {string} TabGroupColor
 * "grey" | "blue" | "red" | "yellow" | "green" | "pink" | "purple" | "cyan" | "orange"
 */

/**
 * 标签组
 * @typedef {Object} TabGroup
 * @property {number} id - 标签组ID
 * @property {boolean} collapsed - 标签组是否折叠
 * @property {TabGroupColor} color - 标签组颜色
 * @property {string} title - 标签组标题
 * @property {number} windowId - 所在窗口ID
 */

/**
 * 标签组查询选项
 * @typedef {Object} TabGroupQueryInfo
 * @property {boolean} [collapsed] - 是否折叠
 * @property {TabGroupColor} [color] - 标签组颜色
 * @property {string} [title] - 标签组标题
 * @property {number} [windowId] - 所在窗口ID
 */

/**
 * 标签组更新选项
 * @typedef {Object} TabGroupUpdateProperties
 * @property {boolean} [collapsed] - 是否折叠
 * @property {TabGroupColor} [color] - 标签组颜色
 * @property {string} [title] - 标签组标题
 */

/**
 * 移动标签组选项
 * @typedef {Object} TabGroupMoveProperties
 * @property {number} windowId - 目标窗口ID
 * @property {number} [index] - 目标位置索引
 */

/**
 * 获取指定标签组
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.groupId - 标签组ID
 * @returns {Promise<TabGroup>} 返回标签组信息
 */
async function get(commandParams) {
  const { groupId } = commandParams;
  return await chrome.tabGroups.get(groupId);
}

/**
 * 查询标签组
 * @param {Object} commandParams - 命令参数
 * @param {TabGroupQueryInfo} [commandParams.queryInfo] - 查询条件
 * @returns {Promise<TabGroup[]>} 返回匹配的标签组数组
 */
async function query(commandParams) {
  const { queryInfo } = commandParams || {};
  return await chrome.tabGroups.query(queryInfo);
}

/**
 * 更新标签组
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.groupId - 标签组ID
 * @param {TabGroupUpdateProperties} commandParams.updateProperties - 更新属性
 * @returns {Promise<TabGroup>} 返回更新后的标签组
 */
async function update(commandParams) {
  const { groupId, updateProperties } = commandParams;
  return await chrome.tabGroups.update(groupId, updateProperties);
}

/**
 * 移动标签组
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.groupId - 标签组ID
 * @param {TabGroupMoveProperties} commandParams.moveProperties - 移动属性
 * @returns {Promise<TabGroup>} 返回移动后的标签组
 */
async function move(commandParams) {
  const { groupId, moveProperties } = commandParams;
  return await chrome.tabGroups.move(groupId, moveProperties);
}

export {
  get,
  query,
  update,
  move
}; 