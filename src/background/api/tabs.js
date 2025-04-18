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
 * 内部辅助函数：如果需要，获取当前窗口的活动标签页 ID。
 * @param {number | null | undefined} tabId - 传入的标签页 ID。
 * @returns {Promise<number>} - 返回有效的标签页 ID。
 * @throws {Error} 如果找不到活动标签页。
 */
async function _getActiveTabIdIfNeeded(tabId) {
  if (tabId === null || tabId === undefined || tabId === 0) {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs.length > 0) {
      return tabs[0].id;
    } else {
      throw new Error("Could not find active tab in the current window.");
    }
  }
  return tabId;
}

/**
 * 内部辅助函数：如果需要，获取当前窗口的活动标签页 ID的数组。
 * @param {number[] | null | undefined} tabIds - 传入的标签页 ID 数组。
 * @returns {Promise<number[]>} - 返回有效的标签页 ID 数组。
 * @throws {Error} 如果找不到活动标签页。
 */
async function _getActiveTabIdsIfNeeded(tabIds) {
  if (!tabIds || tabIds.length === 0 || (tabIds.length === 1 && tabIds[0] === 0)) {
    return [await _getActiveTabIdIfNeeded(0)];
  }
  return tabIds;
}

/**
 * 内部辅助函数：如果需要， 获取最后聚焦的窗口 ID。
 * @param {number | null | undefined} windowId - 传入的窗口 ID。
 * @returns {Promise<number>} - 返回有效的窗口 ID。
 * @throws {Error} 如果找不到活动窗口。
 */
async function _getLastFocusedWindowIdIfNeeded(windowId) {
  if (windowId === null || windowId === undefined || windowId === 0) {
    return await chrome.windows.getLastFocused().id;
  }
  return windowId;
}


/**
 * 创建标签页
 * @param {CreateProperties} commandParams - 创建新标签页的属性对象。
 * @returns {Promise<Tab>} 返回创建的标签页信息。
 */
async function create(commandParams) {
  // chrome.tabs.create 需要一个 CreateProperties 对象
  // 因此 commandParams 直接作为该对象传递
  return await chrome.tabs.create(commandParams);
}

/**
 * 获取指定 ID 的标签页信息。
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 要获取的标签页的 ID。
 * @returns {Promise<Tab>} 返回标签页信息。
 */
async function get(commandParams) {
  // chrome.tabs.get 需要一个简单的 tabId 参数
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.get(tabId);
}

/**
 * 查询符合特定条件的标签页。
 * @param {QueryFilter} commandParams - 查询条件对象。如果省略或为空对象，则查询所有标签页。
 * @returns {Promise<Tab[]>} 返回匹配的标签页数组。
 */
async function query(commandParams) {
  // chrome.tabs.query 需要一个 QueryFilter 对象
  // 因此 commandParams 直接作为该对象传递
  // 如果 commandParams 是 undefined 或 null，则传递 {} 查询所有标签页
  return await chrome.tabs.query(commandParams || {});
}

/**
 * 更新标签页的属性。
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 可选。要更新的标签页 ID。如果省略，则更新当前窗口的活动标签页。
 * @param {UpdateProperties} commandParams.updateProperties - 要更新的属性对象。
 * @returns {Promise<Tab | undefined>} 返回更新后的标签页信息，如果标签页不存在或发生错误则可能返回 undefined。
 */
async function update(commandParams) {
  // chrome.tabs.update 可以接受 (tabId, updateProperties) 或 (updateProperties)
  const { tabId, updateProperties } = commandParams;
  if (tabId !== undefined) {
      return await chrome.tabs.update(tabId, updateProperties);
  } else {
      // 如果 tabId 未在 commandParams 中提供, 则只传递 updateProperties 更新当前活动标签页
      return await chrome.tabs.update(updateProperties);
  }
}

/**
 * 将一个或多个标签页移动到新位置（可在同一窗口或不同窗口）。
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 要移动的标签页 ID 或 ID 数组。
 * @param {MoveProperties} commandParams.moveProperties - 指定新位置的属性对象 (包含 index, 可选的 windowId)。
 * @returns {Promise<Tab|Tab[]>} 返回移动后的标签页信息（单个或数组）。
 */
async function move(commandParams) {
  // chrome.tabs.move 需要 tabIds 和 moveProperties 两个参数
  const { tabIds: tabIdsRaw, moveProperties } = commandParams;
  const tabIds = await _getActiveTabIdsIfNeeded(tabIdsRaw);
  return await chrome.tabs.move(tabIds, moveProperties);
}

/**
 * 重新加载标签页，类似于用户点击浏览器刷新按钮。
 * @param {Object} [commandParams] - 可选。命令参数
 * @param {number} [commandParams.tabId] - 可选。要重新加载的标签页 ID。如果省略或为无效值 (0, null, undefined)，则重新加载当前窗口的活动标签页。
 * @param {Object} [commandParams.reloadProperties] - 可选。重新加载选项对象。
 * @param {boolean} [commandParams.reloadProperties.bypassCache] - 是否绕过缓存，默认为 false。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function reload(commandParams) {
  const { tabId: rawTabId, reloadProperties } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.reload(tabId, reloadProperties);
}

/**
 * 复制指定的标签页。
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 要复制的标签页 ID。如果为无效值 (0, null, undefined)，则复制当前窗口的活动标签页。
 * @returns {Promise<Tab | undefined>} 返回新创建的标签页信息，如果发生错误则可能返回 undefined。
 */
async function duplicate(commandParams) {
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.duplicate(tabId);
}

/**
 * 向指定标签页的内容脚本发送单次消息。
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 目标标签页的 ID。如果为无效值 (0, null, undefined)，则发送给当前窗口的活动标签页。
 * @param {any} commandParams.message - 要发送的消息 (必须是 JSON 可序列化的)。
 * @param {Object} [commandParams.options] - 可选。发送选项对象。
 * @param {number} [commandParams.options.frameId] - 发送到特定框架 ID。0 表示主框架。
 * @param {boolean} [commandParams.options.documentId] - 发送到特定文档 ID。
 * @returns {Promise<any>} 返回内容脚本发送的响应。如果目标标签页不存在或没有接收者，则 Promise 会被拒绝 (reject)。
 */
async function sendMessage(commandParams) {
  const { tabId: rawTabId, message, options } = commandParams;
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.sendMessage(tabId, message, options);
}

/**
 * 关闭一个或多个标签页。
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 要关闭的标签页 ID 或 ID 数组。
 * @returns {Promise<void>} 操作完成时解析。如果任何指定的标签页不存在，操作仍然会尝试关闭其他存在的标签页，并且不会报错。
 */
async function remove(commandParams) {
  // chrome.tabs.remove 需要一个 tabIds 参数 (number 或 number[])
  const { tabIds: tabIdsRaw } = commandParams || {};

  const tabIds = await _getActiveTabIdsIfNeeded(tabIdsRaw);

  return await chrome.tabs.remove(tabIds);
}

/**
 * 将指定的标签页添加到一个标签组中。如果提供了组 ID，则添加到现有组；否则，创建一个新组。
 * @param {Object} commandParams - 分组选项对象。
 * @param {number | [number, ...number[]]} commandParams.tabIds - 要分组的标签页 ID 数组。
 * @param {number} [commandParams.groupId] - 可选。要将标签页添加到的现有标签组的 ID。
 * @param {Object} [commandParams.createProperties] - 可选。如果未提供 groupId，则使用此对象在新窗口中创建新组。
 * @param {number} [commandParams.createProperties.windowId] - 创建组的窗口 ID。默认为当前窗口。
 * @returns {Promise<number>} 返回标签页被添加到的组的 ID。
 */
async function group(commandParams) {
  // chrome.tabs.group 需要一个 options 对象
  // commandParams 直接作为该对象传递
  return await chrome.tabs.group(commandParams);
}

/**
 * 将一个或多个标签页从它们的标签组中移除。
 * @param {Object} commandParams - 命令参数
 * @param {number|number[]} commandParams.tabIds - 要取消分组的标签页 ID 或 ID 数组。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function ungroup(commandParams) {
  // chrome.tabs.ungroup 需要一个 tabIds 参数 (number 或 number[])
  const { tabIds: tabIdsRaw } = commandParams || {};

  const tabIds = await _getActiveTabIdsIfNeeded(tabIdsRaw);

  return await chrome.tabs.ungroup(tabIds);
}

/**
 * 丢弃（卸载）指定的标签页以释放内存。被丢弃的标签页仍然在标签栏可见，并在激活时重新加载。
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 要丢弃的标签页 ID。如果为无效值 (0, null, undefined)，则丢弃当前窗口的活动标签页。
 * @returns {Promise<Tab | undefined>} 返回被丢弃的标签页信息，如果标签页无法被丢弃 (例如，活动标签页或不允许丢弃的标签页) 或不存在，则返回 undefined。
 */
async function discard(commandParams) {
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.discard(tabId);
}

/**
 * 放大或缩小指定的标签页。
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 可选。要设置缩放级别的标签页 ID。如果省略或为无效值 (0, null, undefined)，则设置当前窗口活动标签页的缩放级别。
 * @param {number} commandParams.zoomFactor - 缩放因子。必须大于 0。 1 表示 100%, 2 表示 200%, 0.5 表示 50%。设置为 0 会重置为默认缩放级别。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function setZoom(commandParams) {
  const { tabId: rawTabId, zoomFactor } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.setZoom(tabId, zoomFactor ?? 1);
}

/**
 * 获取指定标签页的缩放因子。
 * @param {Object} [commandParams] - 可选。命令参数
 * @param {number} [commandParams.tabId] - 可选。要获取缩放级别的标签页 ID。如果省略或为无效值 (0, null, undefined)，则获取当前窗口活动标签页的缩放级别。
 * @returns {Promise<number>} 返回当前缩放因子。
 */
async function getZoom(commandParams) {
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.getZoom(tabId);
}

/**
 * 设置指定标签页的缩放设置（模式和范围）。这些设置是持久的。
 * @param {Object} commandParams - 命令参数
 * @param {number} [commandParams.tabId] - 可选。要设置缩放设置的标签页 ID。如果省略或为无效值 (0, null, undefined)，则设置当前窗口活动标签页的缩放设置。
 * @param {ZoomSettings} commandParams.zoomSettings - 要应用的缩放设置对象。
 * @returns {Promise<void>} 操作完成时解析。
 */
async function setZoomSettings(commandParams) {
  const { tabId: rawTabId, zoomSettings } = commandParams;
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.setZoomSettings(tabId, zoomSettings);
}

/**
 * 获取指定标签页的缩放设置（模式和范围）。
 * @param {Object} [commandParams] - 可选。命令参数
 * @param {number} [commandParams.tabId] - 可选。要获取缩放设置的标签页 ID。如果省略或为无效值 (0, null, undefined)，则获取当前窗口活动标签页的缩放设置。
 * @returns {Promise<ZoomSettings>} 返回当前缩放设置对象。
 */
async function getZoomSettings(commandParams) {
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.getZoomSettings(tabId);
}

/**
 * 高亮显示（通常是选中）指定的标签页。
 * @param {HighlightInfo} commandParams - 高亮信息对象，包含窗口 ID（可选，默认当前窗口）和要高亮的标签页索引/ID 数组。
 * @param {number[]} commandParams.tabs - 要高亮的标签页【索引】（序号）的数组。
 * @param {number} [commandParams.windowId] - 可选。包含这些标签页的窗口 ID。默认为当前窗口。
 * @returns {Promise<chrome.windows.Window>} 返回包含高亮标签页的窗口信息。
 */
async function highlight(commandParams) {
  

  return await chrome.tabs.highlight(commandParams);
}

/**
 * 捕获指定窗口当前活动标签页的可见区域。
 * @param {Object} [commandParams] - 可选。命令参数
 * @param {number} [commandParams.windowId] - 可选。目标窗口的 ID。如果省略，则默认为当前窗口。
 * @param {Object} [commandParams.options] - 可选。截图选项对象。
 * @param {'jpeg'|'png'} [commandParams.options.format='jpeg'] - 图片格式。默认为 'jpeg'。
 * @param {number} [commandParams.options.quality] - 图片质量 (0-100)，仅适用于 jpeg 格式。
 * @returns {Promise<string>} 返回截图的 data URI 字符串。
 */
async function captureVisibleTab(commandParams) {
  // chrome.tabs.captureVisibleTab 需要可选的 windowId 和可选的 options 参数
  const { windowId: windowIdRaw, options } = commandParams || {};
  const windowId = await _getLastFocusedWindowIdIfNeeded(windowIdRaw);

  return await chrome.tabs.captureVisibleTab(windowId, options);
}

/**
 * 检测指定标签页内容的语言。
 * @param {Object} [commandParams] - 可选。命令参数
 * @param {number} [commandParams.tabId] - 可选。要检测语言的标签页 ID。如果省略或为无效值 (0, null, undefined)，则检测当前窗口活动标签页的语言。
 * @returns {Promise<string>} 返回检测到的主要语言代码 (BCP 47格式, 例如, "en", "zh-CN")。如果语言无法检测到，则返回 "und" (undetermined)。
 */
async function detectLanguage(commandParams) {
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.detectLanguage(tabId);
}

/**
 * 切换指定标签页的静音状态。这是一个辅助函数，非直接 API 封装。
 * @param {Object} commandParams - 命令参数
 * @param {number} commandParams.tabId - 要切换静音状态的标签页 ID。如果为无效值 (0, null, undefined)，则切换当前窗口活动标签页的静音状态。
 * @returns {Promise<Tab>} 返回更新后的标签页信息。
 * @throws {Error} 如果找不到标签页或标签页没有 mutedInfo。
 */
async function toggleMuteState(commandParams) {
  const { tabId: rawTabId } = commandParams;
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  const tab = await chrome.tabs.get(tabId);
  if (tab && tab.mutedInfo) {
    const muted = !tab.mutedInfo.muted;
    return await chrome.tabs.update(tabId, { muted });
  } else {
    throw new Error(`Tab with id ${tabId} not found or missing mutedInfo.`);
  }
}

/**
 * 获取指定窗口中的活动标签页 (selected/active tab)。
 * @deprecated 请使用 query({active: true, currentWindow: true/windowId}) 替代。此方法在 MV3 中已被废弃。
 * @param {Object} [commandParams] - 可选。命令参数
 * @param {number} [commandParams.windowId] - 可选。目标窗口的 ID。如果省略，则默认为当前窗口 (`currentWindow: true`)。
 * @returns {Promise<Tab | undefined>} 返回活动标签页信息，如果没有活动标签页则返回 undefined。
 */
async function getSelected(commandParams) {
  // 使用 query API 实现 getSelected 的功能
  console.warn('chrome.tabs.getSelected is deprecated in MV3. Using chrome.tabs.query instead.');
  const { windowId } = commandParams || {};
  const queryInfo = { active: true };
  if (windowId !== undefined) {
    queryInfo.windowId = windowId;
  } else {
    // 如果未指定 windowId，则查询当前窗口
    queryInfo.currentWindow = true;
  }
  const tabs = await chrome.tabs.query(queryInfo);
  // query 返回数组，getSelected 应该返回单个 Tab 或 undefined
  return tabs.length > 0 ? tabs[0] : undefined;
}

/**
 * 获取运行此脚本的标签页的 Tab 对象。
 * 注意: 此方法通常在扩展页面（如弹出窗口或选项页）或内容脚本的上下文中调用才有意义。
 * 在 Background Service Worker 中调用通常返回 undefined，因为它没有直接关联的标签页上下文。
 * @returns {Promise<Tab | undefined>} 返回当前上下文的标签页信息，如果在非标签页上下文中调用则返回 undefined。
 */
async function getCurrent() {
  // chrome.tabs.getCurrent() 不需要参数，因此也不需要 commandParams
  return await chrome.tabs.getCurrent();
}

/**
 * 导航到指定标签页的上一个历史记录条目。
 * @param {Object} [commandParams] - 可选。命令参数。
 * @param {number} [commandParams.tabId] - 可选。目标标签页的 ID。如果省略或为无效值 (0, null, undefined)，则导航当前窗口的活动标签页。
 * @returns {Promise<void>} 操作完成时解析。如果无法后退（例如，没有历史记录），则 Promise 会被拒绝。
 */
async function goBack(commandParams) {
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.goBack(tabId);
}

/**
 * 导航到指定标签页的下一个历史记录条目。
 * @param {Object} [commandParams] - 可选。命令参数。
 * @param {number} [commandParams.tabId] - 可选。目标标签页的 ID。如果省略或为无效值 (0, null, undefined)，则导航当前窗口的活动标签页。
 * @returns {Promise<void>} 操作完成时解析。如果无法前进（例如，没有前进的历史记录），则 Promise 会被拒绝。
 */
async function goForward(commandParams) {
  const { tabId: rawTabId } = commandParams || {};
  const tabId = await _getActiveTabIdIfNeeded(rawTabId);
  return await chrome.tabs.goForward(tabId);
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
  setZoom,
  getZoom,
  setZoomSettings,
  getZoomSettings,
  highlight,
  captureVisibleTab,
  detectLanguage,
  toggleMuteState,
  getCurrent,
  goBack,
  goForward
}; 