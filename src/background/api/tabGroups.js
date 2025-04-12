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
 * 获取指定 ID 的标签组信息。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.groupId - 要获取的标签组 ID。
 * @returns {Promise<TabGroup>} 返回标签组信息。
 */
async function get(commandParams) {
  const { groupId } = commandParams;
  return await chrome.tabGroups.get(groupId);
}

/**
 * 查询符合特定条件的标签组。
 * @param {TabGroupQueryInfo} commandParams - 查询条件对象。如果省略或为空对象，则查询所有标签组。
 * @returns {Promise<TabGroup[]>} 返回匹配的标签组信息数组。
 */
async function query(commandParams) {
  return await chrome.tabGroups.query(commandParams || {});
}

/**
 * 更新指定标签组的属性。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.groupId - 要更新的标签组 ID。
 * @param {TabGroupUpdateProperties} commandParams.updateProperties - 包含要更新的属性的对象。
 * @returns {Promise<TabGroup>} 返回更新后的标签组信息。
 */
async function update(commandParams) {
  const { groupId, updateProperties } = commandParams;
  return await chrome.tabGroups.update(groupId, updateProperties);
}

/**
 * 将指定的标签组移动到同一窗口或不同窗口的新位置。
 * @param {Object} commandParams - 命令参数。
 * @param {number} commandParams.groupId - 要移动的标签组 ID。
 * @param {TabGroupMoveProperties} commandParams.moveProperties - 指定新位置的属性对象 (包含可选的 windowId 和可选的 index)。
 * @returns {Promise<TabGroup>} 返回移动后的标签组信息。
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