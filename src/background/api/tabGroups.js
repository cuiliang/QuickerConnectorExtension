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
 * 获取当前最后聚焦窗口的活动标签页所在的标签组 ID。
 * 如果活动标签页不在任何组中，则抛出错误。
 * @returns {Promise<number>} 返回活动标签页的标签组 ID。
 * @private
 */
async function _getDefaultGroupId() {
  const window = await chrome.windows.getLastFocused({ populate: true, windowTypes: ['normal'] });
  if (!window || !window.tabs) {
    throw new Error("无法获取最后聚焦的窗口信息。");
  }
  const activeTab = window.tabs.find(tab => tab.active);
  if (!activeTab) {
    throw new Error("在最后聚焦的窗口中找不到活动标签页。");
  }
  // chrome.tabs.TAB_ID_NONE is -1
  if (activeTab.groupId === undefined || activeTab.groupId < 0) {
     throw new Error("当前活动标签页不属于任何标签组。");
  }
  return activeTab.groupId;
}

/**
 * 获取指定 ID 的标签组信息。如果未指定 groupId，则获取当前活动标签页所在组的信息。
 * @param {Object} commandParams - 命令参数。
 * @param {number} [commandParams.groupId] - 要获取的标签组 ID。如果省略，则使用当前活动标签页的组 ID。
 * @returns {Promise<TabGroup>} 返回标签组信息。
 */
async function get(commandParams) {
  let { groupId } = commandParams || {};
  if (groupId === undefined || groupId === null || groupId < 0) {
    groupId = await _getDefaultGroupId();
  }
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
 * 更新指定标签组的属性。如果未指定 groupId，则更新当前活动标签页所在组的属性。
 * @param {Object} commandParams - 命令参数。
 * @param {number} [commandParams.groupId] - 要更新的标签组 ID。如果省略，则使用当前活动标签页的组 ID。
 * @param {TabGroupUpdateProperties} commandParams.updateProperties - 包含要更新的属性的对象。
 * @returns {Promise<TabGroup>} 返回更新后的标签组信息。
 */
async function update(commandParams) {
  let { groupId, updateProperties } = commandParams || {};
  if (!updateProperties) {
      throw new Error("缺少 'updateProperties' 参数。");
  }
  if (groupId === undefined || groupId === null || groupId < 0) {
    groupId = await _getDefaultGroupId();
  }
  return await chrome.tabGroups.update(groupId, updateProperties);
}

/**
 * 将指定的标签组移动到同一窗口或不同窗口的新位置。如果未指定 groupId，则移动当前活动标签页所在的组。
 * @param {Object} commandParams - 命令参数。
 * @param {number} [commandParams.groupId] - 要移动的标签组 ID。如果省略，则使用当前活动标签页的组 ID。
 * @param {TabGroupMoveProperties} commandParams.moveProperties - 指定新位置的属性对象 (包含可选的 windowId 和可选的 index)。
 * @returns {Promise<TabGroup>} 返回移动后的标签组信息。
 */
async function move(commandParams) {
  let { groupId, moveProperties } = commandParams || {};
   if (!moveProperties) {
      throw new Error("缺少 'moveProperties' 参数。");
  }
  if (groupId === undefined || groupId === null || groupId < 0) {
    groupId = await _getDefaultGroupId();
  }
  return await chrome.tabGroups.move(groupId, moveProperties);
}

export {
  get,
  query,
  update,
  move
}; 