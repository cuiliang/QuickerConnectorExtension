import {resetButtonPosition, updateUi} from "./ui.js";
import {loadSettings} from "./settings.js";
import {sendMessageToQuicker, sendReplyToQuicker} from "./connection.js";
import {runScriptOnAllTabs, setupActionsForTab} from "./tabs.js";
import {MSG_START_PICKER} from "./constants.js";

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
    chrome.storage.local.set({'button_position': newPosition}, () => {
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

/**
 * 处理扩展content script/popup 等位置发来的消息。
 */
export function setupExtensionMessageHandler() {
    chrome.runtime.onMessage.addListener(function (messageFromContentOrPopup, sender, sendResponse) {
        console.log('Message received:', messageFromContentOrPopup, ' Sender:', sender);

        let isAsync = false; // Flag to indicate if sendResponse will be called asynchronously

        switch (messageFromContentOrPopup.cmd) {
            case 'update_ui': {
                // 点击popup时，更新popup显示
                updateUi(); // Use imported function
                sendResponse({status: 'UI update triggered'});
            }
                break;
            case 'local_setting_changed': {
                isAsync = true; // loadSettings is async
                loadSettings().then(() => {
                    console.log("Settings reloaded due to local change.");
                    sendResponse({status: 'Settings reloaded'});
                }).catch(error => {
                    console.error("Error reloading settings:", error);
                    sendResponse({status: 'Error reloading settings', error: error.message});
                });
            }
                break;
            case 'send_to_quicker': {
                isAsync = true; // sendMessageToQuicker involves async native messaging

                // 转发消息给Quicker
                sendMessageToQuicker(messageFromContentOrPopup.data);

                sendResponse({status: 'Message forwarded to Quicker'});
                isAsync = false; // Responded synchronously
            }
                break;
            case 'action_clicked': {
                isAsync = true; // sendMessageToQuicker involves async native messaging

                const msg = {
                    "messageType": 22, // MSG_ACTION_CLICKED (use constant?)
                    "isSuccess": true,
                    "replyTo": 0,
                    "message": '',
                    "data": messageFromContentOrPopup.data
                };

                console.log('action_clicked, forwarding to quicker:', msg);
                sendMessageToQuicker(msg); // Use imported function
                sendResponse({status: 'Action click forwarded to Quicker'});
                isAsync = false; // Responded synchronously
            }
                break;
            case 'content_loaded': {
                isAsync = true; // setupActionsForTab might involve async messaging now
                // 网页加载完成，设置动作
                if (sender.tab) {
                    console.log(`Setting up actions for newly loaded tab: ${sender.tab.id}`);
                    setupActionsForTab(sender.tab);
                    // Assuming setupActionsForTab might now be async or have async parts
                    // It's safer to respond async, though a simple sync response might work
                    // depending on setupActionsForTab implementation details.
                    setTimeout(() => sendResponse({status: 'Actions setup initiated'}), 0); // Respond async shortly after
                } else {
                    console.warn("Received 'content_loaded' without sender tab info.");
                    sendResponse({status: 'Error: No sender tab info'});
                    isAsync = false;
                }
            }
                break;
            case 'button_pos_changed': {
                // 通知其它标签页更新按钮位置
                if (sender.tab) {
                    onButtonPositionChanged(sender.tab, messageFromContentOrPopup);
                    sendResponse({status: 'Button position change processed'});
                } else {
                    sendResponse({status: 'Error: No sender tab info'});
                }
            }
                break;
            case 'reset_floater_position': {
                // 重置浮动按钮位置
                resetButtonPosition();
                sendResponse({status: 'Floater position reset'});
            }
                break;
            case 'start_picker': {
                isAsync = true; // chrome.tabs.query is async
                chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                    if (chrome.runtime.lastError) {
                        console.error("Error querying active tab for picker:", chrome.runtime.lastError.message);
                        sendResponse({status: 'Error querying tab', error: chrome.runtime.lastError.message});
                        return;
                    }
                    if (tabs && tabs.length > 0) {
                        const currentTabId = tabs[0].id;
                        // Note: Relies on global state for connection check
                        if (self.state?._isQuickerConnected) {
                            sendReplyToQuicker(true, "", {tabId: currentTabId}, 0, MSG_START_PICKER);
                            console.log('Sent start picker command to Quicker for tab:', currentTabId);
                            sendResponse({status: 'Picker start command sent'});
                        } else {
                            console.warn("Quicker not connected, cannot start picker.");
                            sendResponse({status: 'Error: Quicker not connected'});
                        }
                    } else {
                        console.warn("No active tab found to start picker.");
                        sendResponse({status: 'Error: No active tab found'});
                    }
                });
            }
                break;
            default:
                console.warn('Unknown message received:', messageFromContentOrPopup);
                // Respond for unknown commands as well
                sendResponse({status: 'Unknown command received'});
                break;
        }

        // Return true if we are handling the response asynchronously
        return isAsync;
    });
}