"use strict";

import {MSG_PUSH_ACTIONS, MSG_REGISTER_CONTEXT_MENU, MSG_UPDATE_QUICKER_STATE} from './constants.js';
import {executeOnTab, runScriptOnAllTabs, runScriptOnTab, setupActionsForAllTabs} from './tabs.js';
import {updateConnectionState} from './ui.js';
import {isChromeTabUrl} from './utils.js';
import {reportUrlChange, sendReplyToQuicker} from "./connection.js";

/**
 * 处理Quicker命令
 * @param {object} msg 命令消息
 */
export function processQuickerCmd(msg) {
  // 更新Quicker连接状态
  if (msg.messageType === MSG_UPDATE_QUICKER_STATE) {
    onMsgQuickerStateChange(msg);
    return;
  } 
  // 注册右键菜单
  else if (msg.messageType === MSG_REGISTER_CONTEXT_MENU) {
    onMessageRegisterContextMenu(msg);
    return;
  } 
  // 推送动作列表
  else if (msg.messageType == MSG_PUSH_ACTIONS) {
    onMessagePushActions(msg);
    return;
  }

  try {
    switch (msg.cmd) {
      case "OpenUrl":
        openUrl(msg);
        break;
      case "GetTabInfo":
        getTabInfo(msg);
        break;
      case "CloseTab":
        closeTab(msg);
        break;
      case "RunScript":
        runScript(msg);
        break;
      case "BackgroundScript":
        runBackgroundScript(msg);
        break;

      // cookies
      case "GetCookiesByUrl":
        getCookies(msg);
        break;
      case "RemoveCookiesByUrl":
        removeCookiesByUrl(msg);
        break;
      // bookmarks
      case "CreateBookmark":
        createBookmark(msg);
        break;
      case "GetBookmarks":
        getBookmarks(msg);
        break;
      case "SearchBookmarks":
        searchBookmarks(msg);
        break;
      // browsingData
      case "RemoveBrowsingData":
        removeBrowsingData(msg);
        break;
      // topSites
      case "GetTopSites":
        getTopSites(msg);
        break;
      // downloads
      case "DownloadFile":
        downloadFile(msg);
        break;
      // history
      case "DeleteAllHistory":
        deleteAllHistory(msg);
        break;
      // 
      case "SaveAsMHTML":
        saveAsMHTML(msg);
        break;
      // sessions
      case "GetRecentlyClosed":
        getRecentlyClosed(msg);
        break;
      case "RestoreRecentClosedSession":
        restoreRecentClosedSession(msg);
        break;
      // management
      case "ManagementGetAll":
        managementGetAll(msg);
        break;
      // send
      case "SendDebuggerCommand":
        sendDebuggerCommand(msg);
        break;
      case "CaptureFullPage":
        captureFullPage(msg);
        break;
      case "Speek":
        speekText(msg);
        break;
      default:
        console.error("Unknown command:" + msg.cmd);
        sendReplyToQuicker(false, "Unknown command:" + msg.cmd, {}, msg.serial);
        break;
    }
  } catch (err) {
    console.error(err);
    sendReplyToQuicker(false, err.message, err, msg.serial);
  }
}

/**
 * Quicker 连接状态变化了
 * @param {object} msg 消息对象
 */
function onMsgQuickerStateChange(msg) {
  if (msg.data.isConnected) {
    self.state._quickerVersion = msg.data.quickerVersion;
    self.state._hostVersion = msg.data.hostVersion;

    // 报告最新状态
    if (self.state._enableReport) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (chrome.runtime.lastError) {
          console.warn("Error querying active tab for reporting state:", chrome.runtime.lastError.message);
          return;
        }
        if (tabs.length > 0) {
          reportUrlChange(tabs[0].id, tabs[0].url, tabs[0].active, 1);
        }
      });
    }
  } else {
    // quicker断开了，清除悬浮按钮
    runScriptOnAllTabs(function (tab) {
      chrome.tabs.sendMessage(tab.id,
        { cmd: 'clear_actions' },
        function (response) {
          if (chrome.runtime.lastError) {
             if (!chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
                console.warn(`Error sending 'clear_actions' to tab ${tab.id} during disconnect: ${chrome.runtime.lastError.message}`);
             }
          }
       });
    });
  }

  updateConnectionState(true, msg.data.isConnected);
}

/**
 * 注册右键菜单
 * @param {object} msg 消息对象
 */
function onMessageRegisterContextMenu(msg) {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.warn("Error removing existing context menus:", chrome.runtime.lastError.message);
    }

    if (msg.data && msg.data.items && msg.data.items.length > 0) {
      msg.data.items.forEach(function (item) {
        chrome.contextMenus.create(item, () => {
          if (chrome.runtime.lastError) {
            console.warn("Error creating context menu item:", item.id, chrome.runtime.lastError.message);
          }
        });
      });
    } else {
      console.log("No context menu items provided to register.");
    }
  });
}

/**
 * 处理推送动作消息
 * @param {object} msg 推送动作的消息 
 */
function onMessagePushActions(msg) {
  console.log('onMessagePushActions:', msg.data);
  self.state._actions = msg.data.actions || [];
  self.state._actionGroups = msg.data.groups || [];
  self.state._menuIcon = msg.data.menuIcon;
  self.state._menuButtonBgColor = msg.data.menuButtonBgColor;

  // 安装到所有标签页
  setupActionsForAllTabs();
}

/**
 *  打开网址
 * @param {object} msg 消息对象
 */
function openUrl(msg) {
  const waitLoad = msg.waitComplete;
  const timeoutMs = msg.timeoutMs;
  const url = msg.data.url;

  // 新建窗口
  if (msg.data.windowId === "New") {
    // create new window
    const windowInfo = Object.assign({}, msg.data.windowInfo, { url: url });
    chrome.windows.create(
      windowInfo,
      function (win) {
        if (chrome.runtime.lastError) {
          console.error("Error creating new window:", chrome.runtime.lastError.message);
          sendReplyToQuicker(false, `Error creating new window: ${chrome.runtime.lastError.message}`, null, msg.serial);
        } else {
          console.log("New window created:", win);
          sendReplyToQuicker(true, "new window created.", { windowId: win.id, tabId: win.tabs[0].id }, msg.serial);
        }
      });
    return;
  }

  // 创建标签. 使用"窗口信息"为tabs.create指定额外参数（如是否活动）
  const createProperties = Object.assign({}, msg.data.windowInfo, { url: url });

  // 父窗口id
  if (msg.data.windowId) {
    if (msg.data.windowId !== "Current" && msg.data.windowId !== "") {
      createProperties.windowId = parseInt(msg.data.windowId); // 窗口ID
    }
  }

  // 创建标签页
  chrome.tabs.create(
    createProperties,
    function (tab) {
      if (chrome.runtime.lastError) {
        console.error("Error creating new tab:", chrome.runtime.lastError.message);
        sendReplyToQuicker(false, `Error creating new tab: ${chrome.runtime.lastError.message}`, null, msg.serial);
      } else {
        sendReplyToQuicker(true, "new tab created.", { windowId: tab.windowId, tabId: tab.id }, msg.serial);
      }
    });
}

/**
 * 获得标签信息
 * @param {object} msg 消息对象
 */
function getTabInfo(msg) {
  const tabId = msg.tabId;
  if (!tabId) {
    // 未提供tab的时候，使用当前焦点tab
    chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
      if (tabs.length < 1) {
        sendReplyToQuicker(false, "Can not find active tab.", {}, msg.serial);
        return;
      }
      const tab = tabs[0];
      console.log('GetTabInfo', tabId, tab);
      sendReplyToQuicker(true, "", tab, msg.serial);
    });
    return;
  }

  // 获得tab信息
  chrome.tabs.get(tabId, function (tab) {
    console.log('GetTabInfo', tabId, tab);
    sendReplyToQuicker(true, "", tab, msg.serial);
    return;
  });
}

/**
 * 关闭标签
 * @param {object} msg 消息对象
 */
function closeTab(msg) {
  executeOnTab(msg, function (tabId, msg) {
    console.log("Closing tab", tabId);
    chrome.tabs.remove(tabId, function () {
      if (chrome.runtime.lastError) {
        console.warn("Error closing tab:", tabId, chrome.runtime.lastError.message);
        sendReplyToQuicker(false, `Error closing tab: ${chrome.runtime.lastError.message}`, null, msg.serial);
      } else {
        sendReplyToQuicker(true, "Tab closed.", { tabId: tabId }, msg.serial);
      }
    });
  });
}

/**
 * 使用Eval.Call执行后台脚本
 * @param {object} msg 消息对象
 */
function runBackgroundScript(msg) {
  // 脚本内容
  const script = msg.data.script;

  // 将消息序号写入全局变量
  self.qk_msg_serial = msg.serial;

  // 重置结果变量
  self.qk_bgmsg_result = undefined;

  try {
    eval.call(self, script);

    // 后台脚本中如果不含有返回结果的代码，则直接返回。否则由后台脚本返回结果。
    if (!script.includes("sendReplyToQuicker(")) {
      // 读取后台脚本为qk_bgmsg_result的复制
      const result = self.qk_bgmsg_result || {};
      sendReplyToQuicker(true, "ok", result, msg.serial);
    }
  } catch (e) {
    console.error('后台脚本错误：', e);
    sendReplyToQuicker(false, e.message, e, msg.serial);
  }
}

/**
 * 执行脚本
 * @param {object} msg 消息对象
 */
function runScript(msg) {
  const tabId = msg.tabId;
  const script = msg.data.script;

  console.log('running script on tab:', msg.data);

  if (!tabId) {
    chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
			if (tabs.length < 1) {
				sendReplyToQuicker(false, "Can not find active tab.", {}, msg.serial);
				return;
			}

			if (isChromeTabUrl(tabs[0].url)) {
				sendReplyToQuicker(false, "Can not run on this page.", {}, msg.serial)
			} else {
				runScriptOnTab(tabs[0].id, script, msg);
			}

		});
  } else {
    runScriptOnTab(tabId, script, msg);
  }
}

// 其他API功能函数的实现...
// 为了保持代码简洁，这里只列出了一部分核心功能

/**
 * 获取某个URL的cookie
 * @param {object} msg 消息对象 data: {url: string}
 */
function getCookies(msg) {
  chrome.cookies.getAll(msg.data, function (cookies) {
    sendReplyToQuicker(true, "", cookies, msg.serial);
  });
}

/**
 * 清除某个URL的所有cookie
 * @param {object} msg 消息对象 data:{url: string}
 */
function removeCookiesByUrl(msg) {
  chrome.cookies.getAll(msg.data, function (cookies) {
    cookies.forEach(cookie => {
      chrome.cookies.remove({ url: msg.data.url, name: cookie.name });
    });
    sendReplyToQuicker(true, "", cookies, msg.serial);
  });
}

// 其他API功能函数...

/**
 * 截屏整个页面
 * @param {object} msg 消息对象
 */
function captureFullPage(msg) {
  // 为保持简洁，仅保留函数接口，具体实现略
  executeOnTab(msg.tabId || msg, function(tabId, theMsg) {
    // 调用debugger API进行截图的核心逻辑...
    sendReplyToQuicker(true, "", "", msg.serial);
  });
} 