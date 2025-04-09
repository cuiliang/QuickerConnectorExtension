"use strict";

import {setupActionsForTab} from './tabs.js';
import {MSG_MENU_CLICK} from './constants.js';
import {reportUrlChange, sendReplyToQuicker} from './connection.js';

// Note: This module uses global window.state extensively.
// Consider refactoring for better state management.

/**
 * 设置状态报告事件监听
 */
export function setupReports() {
  // 标签页激活事件
  chrome.tabs.onActivated.addListener(function (activeInfo) {
    // Note: Relies on global state
    if (self.state?._isQuickerConnected && self.state?._enableReport) {
      chrome.tabs.get(activeInfo.tabId, function (currTab) {
        if (chrome.runtime.lastError) {
          console.warn(`Error getting tab info for tab ${activeInfo.tabId}: ${chrome.runtime.lastError.message}`);
          return;
        }
        // Ensure tab object is valid
        if (currTab) {
          reportUrlChange(activeInfo.tabId, currTab.url, true, 1); // EventType 1: Tab Activated
        }
      });
    }
  });

  // 网址更新事件
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // Note: Relies on global state
    if (self.state?._isQuickerConnected && self.state?._enableReport) {
      // Only report if the URL actually changed
      if (changeInfo.url) {
        reportUrlChange(tabId, changeInfo.url, tab.active, 2); // EventType 2: URL Updated
      }
    }

    // Also check if actions need to be updated when a tab finishes loading
    if (changeInfo.status === 'complete' && tab.url) {
        // Consider delaying slightly if content script might not be ready immediately
        // setTimeout(() => setupActionsForTab(tab), 100);
        setupActionsForTab(tab);
    }
  });

  // 窗口焦点改变事件
  chrome.windows.onFocusChanged.addListener(function (windowId) {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
      // Note: Relies on global state
      if (self.state?._isQuickerConnected && self.state?._enableReport) {
        chrome.tabs.query(
          {
            windowId: windowId,
            active: true
          },
          function (tabs) {
            if (chrome.runtime.lastError) {
              console.warn(`Error querying active tab for window ${windowId}: ${chrome.runtime.lastError.message}`);
              return;
            }
            if (tabs && tabs.length > 0) {
              reportUrlChange(tabs[0].id, tabs[0].url, tabs[0].active, 3); // EventType 3: Window Focused
            }
          }
        );
      }
    }
  });
}

/**
 * 右键菜单被点击了
 * @param {object} info 点击信息
 * @param {object} tab 标签页信息
 */
export function menuItemClicked(info, tab) {
  console.log('menu clicked:', info, tab);

  if (!self.state._isQuickerConnected) {
    console.warn('尚未连接到Quicker！');
    return;
  }

  const data = {info, tab};
  sendReplyToQuicker(true, "menu clicked", data, 0, MSG_MENU_CLICK);
}

/**
 * 注册右键菜单点击事件监听
 */
export function setupContextMenuListener() {
  // Use the imported handler
  chrome.contextMenus.onClicked.addListener(menuItemClicked);
}

