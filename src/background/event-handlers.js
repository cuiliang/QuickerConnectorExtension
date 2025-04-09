"use strict";

import {setupActionsForTab} from './tabs.js';
import {onButtonPositionChanged, resetButtonPosition, updateUi} from './ui.js';
import {loadSettings} from './settings.js';
import {MSG_MENU_CLICK, MSG_START_PICKER} from './constants.js';
import {reportUrlChange, sendMessageToQuicker, sendReplyToQuicker} from './connection.js';
import {getBrowserName} from './utils.js';

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

/**
 * 设置扩展消息监听
 */
export function setupMessageListener() {
  chrome.runtime.onMessage.addListener(function (messageFromContentOrPopup, sender, sendResponse) {
    console.log('Message received:', messageFromContentOrPopup, ' Sender:', sender);

    let isAsync = false; // Flag to indicate if sendResponse will be called asynchronously

    switch (messageFromContentOrPopup.cmd) {
      case 'update_ui':
        {
          // 点击popup时，更新popup显示
          updateUi(); // Use imported function
          sendResponse({ status: 'UI update triggered' });
        }
        break;
      case 'local_setting_changed':
        {
          isAsync = true; // loadSettings is async
          loadSettings().then(() => {
            console.log("Settings reloaded due to local change.");
            sendResponse({ status: 'Settings reloaded' });
          }).catch(error => {
            console.error("Error reloading settings:", error);
            sendResponse({ status: 'Error reloading settings', error: error.message });
          });
        }
        break;
      case 'send_to_quicker':
        {
          isAsync = true; // sendMessageToQuicker involves async native messaging

          // // 转发消息给Quicker
          // const manifest = chrome.runtime.getManifest();
          // const _version = manifest.version;
          // const _browser = getBrowserName(); // Use imported function
          //
          // const msg = Object.assign({}, {
          //   "messageType": 0,
          //   "isSuccess": true,
          //   "replyTo": 0,
          //   "message": ''
          // }, messageFromContentOrPopup.data);
          //
          // sendMessageToQuicker(msg); // Use imported function

          sendMessageToQuicker(messageFromContentOrPopup.data);

          // Native messaging doesn't have a direct callback for success/failure here.
          // We respond immediately, assuming the message was posted to the host.
          sendResponse({ status: 'Message forwarded to Quicker' });
          isAsync = false; // Responded synchronously
        }
        break;
      case 'action_clicked':
        {
           isAsync = true; // sendMessageToQuicker involves async native messaging
          // 转发消息给Quicker
          const manifest = chrome.runtime.getManifest();
          const _version = manifest.version;
          const _browser = getBrowserName(); // Use imported function

          const msg = {
            "messageType": 22, // MSG_ACTION_CLICKED (use constant?)
            "isSuccess": true,
            "replyTo": 0,
            "message": '',
            "data": messageFromContentOrPopup.data
          };

          console.log('action_clicked, forwarding to quicker:', msg);
          sendMessageToQuicker(msg); // Use imported function
          sendResponse({ status: 'Action click forwarded to Quicker' });
          isAsync = false; // Responded synchronously
        }
        break;
      case 'content_loaded':
        {
           isAsync = true; // setupActionsForTab might involve async messaging now
          // 网页加载完成，设置动作
          if (sender.tab) {
             console.log(`Setting up actions for newly loaded tab: ${sender.tab.id}`);
             setupActionsForTab(sender.tab);
             // Assuming setupActionsForTab might now be async or have async parts
             // It's safer to respond async, though a simple sync response might work
             // depending on setupActionsForTab implementation details.
             setTimeout(() => sendResponse({ status: 'Actions setup initiated' }), 0); // Respond async shortly after
          } else {
             console.warn("Received 'content_loaded' without sender tab info.");
             sendResponse({ status: 'Error: No sender tab info' });
             isAsync = false;
          }
        }
        break;
      case 'button_pos_changed':
        {
          // 通知其它标签页更新按钮位置
          if (sender.tab) {
             onButtonPositionChanged(sender.tab, messageFromContentOrPopup);
             sendResponse({ status: 'Button position change processed' });
          } else {
             sendResponse({ status: 'Error: No sender tab info' });
          }
        }
        break;
      case 'reset_floater_position':
        {
          // 重置浮动按钮位置
          resetButtonPosition();
          sendResponse({ status: 'Floater position reset' });
        }
        break;
      case 'start_picker':
        {
          isAsync = true; // chrome.tabs.query is async
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (chrome.runtime.lastError) {
               console.error("Error querying active tab for picker:", chrome.runtime.lastError.message);
               sendResponse({ status: 'Error querying tab', error: chrome.runtime.lastError.message });
               return;
            }
            if (tabs && tabs.length > 0) {
               const currentTabId = tabs[0].id;
               // Note: Relies on global state for connection check
               if (self.state?._isQuickerConnected) {
                  sendReplyToQuicker(true, "", { tabId: currentTabId }, 0, MSG_START_PICKER);
                  console.log('Sent start picker command to Quicker for tab:', currentTabId);
                  sendResponse({ status: 'Picker start command sent' });
               } else {
                  console.warn("Quicker not connected, cannot start picker.");
                  sendResponse({ status: 'Error: Quicker not connected' });
               }
            } else {
               console.warn("No active tab found to start picker.");
               sendResponse({ status: 'Error: No active tab found' });
            }
          });
        }
        break;
      default:
        console.warn('Unknown message received:', messageFromContentOrPopup);
        // Respond for unknown commands as well
        sendResponse({ status: 'Unknown command received' });
        break;
    }

    // Return true if we are handling the response asynchronously
    return isAsync;
  });
} 