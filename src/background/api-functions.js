"use strict";

import { executeOnTab } from './tabs.js';
import {sendReplyToQuicker} from "./connection.js";

/**
 * 获取某个URL的cookie
 * @param {object} msg 消息对象
 */
export function getCookies(msg) {
  chrome.cookies.getAll(msg.data, function (cookies) {
    sendReplyToQuicker(true, "", cookies, msg.serial);
  });
}

/**
 * 清除某个URL的所有cookie
 * @param {object} msg 消息对象
 */
export function removeCookiesByUrl(msg) {
  chrome.cookies.getAll(msg.data, function (cookies) {
    cookies.forEach(cookie => {
      chrome.cookies.remove({ url: msg.data.url, name: cookie.name });
    });
    sendReplyToQuicker(true, "", cookies, msg.serial);
  });
}

/**
 * 创建书签
 * @param {object} msg 消息对象
 */
export function createBookmark(msg) {
  chrome.bookmarks.create(msg.data, function (result) {
    sendReplyToQuicker(true, "", result, msg.serial);
  });
}

/**
 * 获取整个书签树
 * @param {object} msg 消息对象
 */
export function getBookmarks(msg) {
  chrome.bookmarks.getTree(function (result) {
    sendReplyToQuicker(true, "", result, msg.serial);
  });
}

/**
 * 搜索书签
 * @param {object} msg 消息对象
 */
export function searchBookmarks(msg) {
  chrome.bookmarks.search(msg.data.query, function (result) {
    sendReplyToQuicker(true, "", result, msg.serial);
  });
}

/**
 * 清除浏览数据
 * @param {object} msg 消息对象
 */
export function removeBrowsingData(msg) {
  chrome.browsingData.remove(msg.data.options, msg.data.dataToRemove, function () {
    sendReplyToQuicker(true, "", "", msg.serial);
  });
}

/**
 * 获取热门站点
 * @param {object} msg 消息对象
 */
export function getTopSites(msg) {
  chrome.topSites.get(function (data) {
    sendReplyToQuicker(true, "", data, msg.serial);
  });
}

/**
 * 下载文件
 * @param {object} msg 消息对象
 */
export function downloadFile(msg) {
  chrome.downloads.download(msg.data, function (downloadId) {
    sendReplyToQuicker(true, "", downloadId, msg.serial);
  });
}

/**
 * 删除所有历史记录
 * @param {object} msg 消息对象
 */
export function deleteAllHistory(msg) {
  chrome.history.deleteAll(function () {
    sendReplyToQuicker(true, "", true, msg.serial);
  });
}

/**
 * 将网页保存为MHTML文件
 * @param {object} msg 消息对象
 */
export function saveAsMHTML(msg) {
  executeOnTab(msg, function (tabId, theMsg) {
    chrome.pageCapture.saveAsMHTML({ tabId: tabId }, function (mhtmlData) {
      var url = URL.createObjectURL(mhtmlData);
      chrome.downloads.download({
        url: url,
        filename: msg.data.fileName
      });
      sendReplyToQuicker(true, "", true, msg.serial);
    });
  });
}

/**
 * 恢复最近关闭的会话
 * @param {object} msg 消息对象
 */
export function restoreRecentClosedSession(msg) {
  chrome.sessions.restore(null, function (session) {
    sendReplyToQuicker(true, "", session, msg.serial);
  });
}

/**
 * 获取最近关闭的会话
 * @param {object} msg 消息对象
 */
export function getRecentlyClosed(msg) {
  chrome.sessions.getRecentlyClosed({ maxResults: msg.data.maxResults }, function (sessions) {
    sendReplyToQuicker(true, "", sessions, msg.serial);
  });
}

/**
 * 获取所有扩展信息
 * @param {object} msg 消息对象
 */
export function managementGetAll(msg) {
  chrome.management.getAll(function (result) {
    sendReplyToQuicker(true, "", result, msg.serial);
  });
}

/**
 * 发送调试命令
 * @param {object} msg 消息对象
 */
export function sendDebuggerCommand(msg) {
  chrome.debugger.attach(msg.data.target, "0.1", function () {
    chrome.debugger.sendCommand(msg.data.target, msg.data.method, msg.data.commandParams, function (result) {
      console.log('debugger result:', result);
      if (msg.data.callbackScript) {
        eval(msg.data.callbackScript);
      }
      chrome.debugger.detach(msg.data.target);
    });
  });
  sendReplyToQuicker(true, "", "", msg.serial);
}

/**
 * 使用tts播放文本
 * @param {object} msg 消息对象
 */
export function speekText(msg) {
  var text = msg.data.text;
  var options = msg.data.options;

  chrome.tts.speak(text, options, function() {
    sendReplyToQuicker(true, "", "", msg.serial);
  });
}

/**
 * 截取整个页面
 * @param {object} msg 消息对象
 */
export function captureFullPage(msg) {
  executeOnTab(msg, function (tabId, theMsg) {
    // 附加到调试器
    attachToDebugger(tabId);
    sendReplyToQuicker(true, "", "", msg.serial);
  });
}

/**
 * 附加到调试器
 * @param {number} tabId 标签页ID
 */
function attachToDebugger(tabId) {
  try {
    chrome.debugger.attach({ tabId: tabId }, "1.0", function () {
      if (chrome.runtime.lastError) {
        console.log(`{back}: debugger attach failed: error=${chrome.runtime.lastError.message}`);
      } else {
        console.log(`{back}: debugger attach success: tabId=${tabId}`);
        enableDTPage(tabId);
      }
    });
  } catch (e) {
    console.error('Failed to attach debugger:', e);
  }
}

/**
 * 启用调试页面
 * @param {number} tabId 标签页ID
 */
function enableDTPage(tabId) {
  console.log(`{back}: enableDTPage: status=aboutTo, tabId=${tabId}`);

  chrome.debugger.sendCommand({ tabId: tabId }, "Page.enable", {}, function () {
    console.log(`{back}: enableDTPage: status=enabled, tabId=${tabId}`);
    setColorlessBackground(tabId);
  });

  console.log(`{back}: enableDTPage: status=commandSent, tabId=${tabId}`);
}

/**
 * 设置透明背景
 * @param {number} tabId 标签页ID
 */
function setColorlessBackground(tabId) {
  console.log(`{back}: setColorlessBackground: status=aboutTo, tabId=${tabId}`);

  chrome.debugger.sendCommand(
    { tabId: tabId },
    "Emulation.setDefaultBackgroundColorOverride",
    { color: { r: 0, g: 0, b: 0, a: 0 } },
    function () {
      console.log(`{back}: setColorlessBackground: status=enabled, tabId=${tabId}`);
      getLayoutMetrics(tabId);
    }
  );

  console.log(`{back}: setColorlessBackground: status=commandSent, tabId=${tabId}`);
}

/**
 * 获取布局尺寸
 * @param {number} tabId 标签页ID
 */
function getLayoutMetrics(tabId) {
  chrome.debugger.sendCommand(
    { tabId: tabId },
    "Page.getLayoutMetrics",
    {},
    function (object) {
      console.log("---- get layout w: " + object.contentSize.width);
      console.log("---- get layout h: " + object.contentSize.height);
      const { height, width } = object.contentSize;
      setDeviceMetricsOverride(tabId, height, width);
    }
  );
}

/**
 * 设置设备尺寸
 * @param {number} tabId 标签页ID
 * @param {number} height 高度
 * @param {number} width 宽度
 */
function setDeviceMetricsOverride(tabId, height, width) {
  chrome.debugger.sendCommand(
    { tabId: tabId },
    "Emulation.setDeviceMetricsOverride",
    { height: height, width: width, deviceScaleFactor: 1, mobile: false },
    function () {
      setTimeout(function () {
        captureScreenshot(tabId);
      }, 500);
    }
  );
}

/**
 * 捕获截图
 * @param {number} tabId 标签页ID
 */
function captureScreenshot(tabId) {
  console.log(`{page}: captureScreenshot: status=aboutTo, tabId=${tabId}`);

  chrome.debugger.sendCommand(
    { tabId: tabId },
    "Page.captureScreenshot",
    {
      format: "jpeg",
      quality: 60,
      fromSurface: false,
    },
    function (response) {
      if (chrome.runtime.lastError) {
        console.log(`{back}: captureScreenshot: status=failed, tabId=${tabId}`);
      } else {
        var dataType = typeof response.data;
        console.log(`{back}: captureScreenshot: status=success, tabId=${tabId}, dataType=${dataType}`);
        let base_64_data = "data:image/jpg;base64," + response.data;
        setTimeout(function () {
          clearDeviceMetricsOverride(tabId, base_64_data);
        }, 500);
      }
    }
  );

  console.log(`{page}: captureScreenshot: status=commandSent, tabId=${tabId}`);
}

/**
 * 清除设备尺寸设置
 * @param {number} tabId 标签页ID
 * @param {string} base_64_data 图片数据
 */
function clearDeviceMetricsOverride(tabId, base_64_data) {
  chrome.debugger.sendCommand(
    { tabId: tabId },
    "Emulation.clearDeviceMetricsOverride",
    {},
    function () {
      postData(base_64_data, tabId);
    }
  );
}

/**
 * 发送数据
 * @param {string} base_64_data 图片数据
 * @param {number} tabId 标签页ID
 */
function postData(base_64_data, tabId) {
  // 这里可以处理图片数据，例如下载或发送到Quicker
  console.log('截图完成，数据长度:', base_64_data.length);
  chrome.debugger.detach({ tabId: tabId });
} 