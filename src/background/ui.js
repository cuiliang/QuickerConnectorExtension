"use strict";

import { DEFAULT_BUTTON_POSITION } from './constants.js';
import { getBrowserName } from './utils.js';
import { runScriptOnAllTabs } from './tabs.js';

// 删除本地state定义，改为使用main.js中定义的self.state
// 注意：state对象在main.js中已作为self.state全局定义

// 删除导出state的语句
// export { state };

/**
 * 更新连接状态
 * @param {boolean} hostConnected 是否连接到主机
 * @param {boolean} quickerConnected 是否连接到Quicker
 */
export function updateConnectionState(hostConnected, quickerConnected) {
  const quickerWasConnected = self.state._isQuickerConnected;

  self.state._isHostConnected = hostConnected;
  self.state._isQuickerConnected = quickerConnected;

  // If Quicker just disconnected, clear context menus
  if (quickerWasConnected && !quickerConnected) {
    chrome.contextMenus.removeAll(() => {
      if (chrome.runtime.lastError) {
        console.warn("Error removing context menus on disconnect:", chrome.runtime.lastError.message);
      } else {
        console.log("Context menus cleared due to Quicker disconnect.");
      }
    });
  }

  updateUi();
}

/**
 * 更新 UI 状态（主要是popup窗口）
 * @param {boolean} isHostConnected
 * @param {boolean} isQuickerConnected
 */
export function updateUi() {
	// No longer attempts to directly modify popup DOM.
	// Instead, send a message to the runtime. Popup listeners will handle UI updates.
	chrome.runtime.sendMessage({
		cmd: 'update_popup_ui',
		data: {
			isHostConnected: self.state._isHostConnected,
			hostVersion: self.state._hostVersion,
			isQuickerConnected: self.state._isQuickerConnected,
			quickerVersion: self.state._quickerVersion,
			browserName: getBrowserName(), // Re-use existing utility
			extensionVersion: chrome.runtime.getManifest().version
		}
	}).catch(error => {
		// Catch potential errors if no popup is open or listening. This is expected.
		if (error.message.includes("Could not establish connection") || error.message.includes("Receiving end does not exist")) {
			// Ignore errors indicating the popup wasn't open
		} else {
			console.warn("Error sending update_popup_ui message:", error);
		}
	});
}

/**
 * 重置浮动按钮位置
 */
export function resetButtonPosition() {
  console.log("Resetting button position to default.");
  // Use the default position from constants
  const defaultPos = { ...DEFAULT_BUTTON_POSITION };
  // Call onButtonPositionChanged to save and notify
  onButtonPositionChanged(null, { data: defaultPos });
}

/**
 * 按钮位置改变后的处理：保存、通知其它标签页
 * @param {object | null} originTab 发送消息的标签页 (null if reset)
 * @param {object} message 标签页发送来的消息 { data: positionData }
 */
export function onButtonPositionChanged(originTab, message) {
  const newPosition = message.data;
  // Basic validation might be good here
  if (!newPosition || typeof newPosition !== 'object') {
    console.warn("Invalid position data received in onButtonPositionChanged:", newPosition);
    return;
  }

  // 保存到 state
  self.state._buttonPosition = newPosition;

  // 保存按钮位置到 local storage
  chrome.storage.local.set({ 'button_position': newPosition }, () => {
    if (chrome.runtime.lastError) {
      console.error(`Error saving button_position: ${chrome.runtime.lastError.message}`);
    } else {
      console.log('Button position saved to storage:', newPosition);
    }
  });

  // 通知其它标签页 (using imported function)
  runScriptOnAllTabs(function (tab) {
    // Don't send back to the originating tab if it exists
    if (originTab === null || tab.id !== originTab.id) {
      chrome.tabs.sendMessage(tab.id,
        {
          cmd: 'update_btn_position',
          data: newPosition
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Avoid logging errors for tabs that might have closed
            if (!chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
              console.warn(`Error sending 'update_btn_position' to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
            }
          } else {
            // console.log(`Sent 'update_btn_position' to tab ${tab.id}`, response);
          }
        });
    }
  });
} 