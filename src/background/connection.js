"use strict";

import { HOST_NAME } from './constants.js';
import { updateConnectionState } from './ui.js';
import { installToExistingTabs, runScriptOnAllTabs } from './tabs.js';
import { processQuickerCmd } from './message-handler.js';
import { getBrowserName } from './utils.js';

// 与浏览器的连接端口
let _port = null;
let reconnectTimer = null; // Timer for scheduling reconnects

/**
 * Schedules a reconnection attempt after a delay.
 * @param {number} delay Delay in milliseconds before attempting to reconnect.
 */
function scheduleReconnect(delay) {
  console.log(`Scheduling reconnect in ${delay / 1000} seconds...`);
  // Clear any existing timer to prevent multiple reconnect attempts running concurrently
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  reconnectTimer = setTimeout(() => {
    console.log("Attempting to reconnect...");
    connect();
  }, delay);
}

/**
 * 连接到Native Message Host(QuickerAgent.exe)
 */
export function connect() {
  // Clear any pending reconnect timer if connection is manually initiated or successful
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // clean up old connection
  if (_port !== null && _port !== undefined) {
    removePortListener();
  }

  // 检查端口是否已存在
  if (_port === null || _port === undefined) {
    try {
      console.log("Connecting to " + HOST_NAME);
      // 连接到QuickerAgent
      _port = chrome.runtime.connectNative(HOST_NAME);
      console.log('connected to host');

      updateConnectionState(true, false);
    } catch (e) {
      console.error("Connection failed:", e);
      _port = null;
      updateConnectionState(false, false);
      // Schedule a reconnect attempt after initial connection failure
      scheduleReconnect(10000); // Retry after 10 seconds
      return; // Exit connect function after scheduling reconnect
    }
  }

  // 收到Quicker消息
  _port.onMessage.addListener(onPortMessage);
  // 关闭插件等情况下，需要将port设置为null，否则QuickerAgent.exe不会退出
  _port.onDisconnect.addListener(onPortDisconnect);

  if (chrome.runtime.lastError) {
    console.warn("Error setup port: " + chrome.runtime.lastError.message);
    _port = null;
    return;
  } else {
    console.log("Connected to native port");
  }

  // 安装脚本到现有标签页
  installToExistingTabs();

  // 发送Hello消息，报告浏览器类型和版本
  sendHelloMessage();
}

/**
 * 发送Hello消息
 */
function sendHelloMessage() {
  try {
    // 从存储中获取浏览器类型和版本
    const manifest = chrome.runtime.getManifest();
    const _version = manifest.version;
    const _browser = getBrowserName();

    // Check if _port is still valid before sending
    if (!_port) {
      console.warn("sendHelloMessage: Port is not connected.");
      return;
    }

    _port.postMessage({
      replyTo: -1,
      message: "Hello!",
      browser: _browser,
      version: _version,
      isSuccess: true
    });
  } catch (e) {
    console.error(e);
    _port = null;
  }
}

/**
 * 去除监听事件
 */
function removePortListener() {
  try {
    if (_port) {
      _port.onMessage.removeListener(onPortMessage);
      _port.onDisconnect.removeListener(onPortDisconnect);
    }
  }
  catch (e) {
    console.warn(e);
  }
}

/**
 * 端口断开
 * @param {*} message 
 */
function onPortDisconnect(message) {
  console.log("Port Disconnected");
  const lastError = chrome.runtime.lastError; // Store lastError before async operations

  removePortListener();
  _port = null;

  updateConnectionState(false, false);

  if (lastError) {
    const errMsg = lastError.message;
    console.warn("Disconnected reason: " + errMsg);
    let retryTime = 3000; // Default retry time
    if (errMsg && errMsg.includes('host not found')) {
      retryTime = 10000; // Longer delay if host is not found
    }

    // Schedule reconnect using the helper function
    scheduleReconnect(retryTime);
    return; // Exit after scheduling reconnect
  } else {
    console.log("Disconnected gracefully from native port");
  }

  // 通知清除动作
  notifyClearActions();
}

/**
 * 通知标签页，端口已经断开，去除显示的悬浮按钮
 */
function notifyClearActions() {
  runScriptOnAllTabs(function (tab) {
    chrome.tabs.sendMessage(tab.id,
      {
        cmd: 'clear_actions'
      },
      function (response) {
        // Check for errors when sending message to tabs
        if (chrome.runtime.lastError) {
          console.warn(`Error sending 'clear_actions' to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
        } else {
          // Optional: Log success or response if needed
          // console.log(`'clear_actions' sent to tab ${tab.id}, response:`, response);
        }
      });
  });
}

/**
 * 端口收到消息的处理（来自Quicker的消息）
 * @param {*} msg 
 * 消息格式：
 *    serial: 消息序号，响应时在replyTo中返回，以便于pc端进行消息对应
 *    cmd: 命令
 */
function onPortMessage(msg) {
  console.log("Received msg from Quicker:", msg.serial, msg);

  if (_port == null) {
    console.warn("OnPortMessage: port is null!");
    console.log(msg);
    return;
  }
  if (msg === null || msg === undefined) {
    console.warn("OnPortMessage: message is null!");
    return;
  }

  processQuickerCmd(msg);
}

/**
 * 向Quicker发送消息
 * @param {object} msg 要发送的消息对象
 */
export function sendMessageToQuicker(msg) {
  if (_port) {
    _port.postMessage(msg);
  } else {
    console.warn("Cannot send message, port is not connected");
  }
}

/**
 * 获取当前端口
 * @returns {object} 当前连接端口
 */
export function getPort() {
  return _port;
} 