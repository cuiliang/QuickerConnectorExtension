"use strict";

import {HOST_NAME, MSG_COMMAND_RESP, MSG_REPORT_ACTIVE_TAB_STATE} from './constants.js';
import {updateConnectionState} from './ui.js';
import {installToExistingTabs, notifyClearActions} from './tabs.js';
import {processQuickerCmd} from './quicker-message-handler.js';
import {getBrowserName} from './utils.js';

/**
 *  连接到ChromeAgent
 */


let _port = null; // 与NativeMessageHost的连接端口
let reconnectTimer = null; // Timer for scheduling reconnects
const manifest = chrome.runtime.getManifest();
const _version = manifest.version;
const _browser = getBrowserName();

//#region 连接管理


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
 * 获取当前端口
 * @returns {object} 当前连接端口
 */
export function getPort() {
  return _port;
}

//#endregion




//#region 消息接收

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

//#endregion



//#region 发送消息

/**
 * 向Quicker发送消息, 自动补全参数。
 * @param {object} msg 要发送的消息对象
 */
export function sendMessageToQuicker(msg) {
  // 补全参数
  addDefaultProperties(msg, messageDefaults);

  sendMessageToQuickerRaw(msg);
}

/**
 * 向Quicker发送消息（原始任意消息）
 * @param msg
 */
function sendMessageToQuickerRaw(msg) {
  console.log('sending message to quicker:', msg);
  if (_port) {
    _port.postMessage(msg);
  } else {
    console.warn("Cannot send message, port is not connected");
  }
}

/**
 * 发送Hello消息
 */
function sendHelloMessage() {
  try {
    // Check if _port is still valid before sending
    if (!_port) {
      console.warn("sendHelloMessage: Port is not connected.");
      return;
    }

    sendMessageToQuickerRaw({
      replyTo: -1,
      message: "Hello!",
      browser: _browser,
      version: _version,
      isSuccess: true,
      manifestVersion: manifest.manifest_version
    });
  } catch (e) {
    console.error(e);
    _port = null;
  }
}


/**
 * 向Quicker发送响应消息
 * @param {boolean} isSuccess 操作是否成功
 * @param {string} message 失败时，消息内容
 * @param {*} data 成功时，返回的数据内容
 * @param {integer} replyTo 所回复的来源消息的编号
 * @param {integer} msgType 可选的消息类型。用于非命令响应的情况
 */
export function sendReplyToQuicker(isSuccess, message, data, replyTo, msgType = MSG_COMMAND_RESP) {
  // 如果返回的结果是简单类型，将其封装在对象中
  if (data) {
    if (typeof data !== "object") {
      console.log('warpping data in object.', data);
      data = {
        data: data
      };
    }
  }



  const msg = {
    "messageType": msgType,
    "isSuccess": isSuccess,
    "replyTo": replyTo,
    "message": message,
    "data": data
  };

  //console.log('sending message to quicker:', msg);

  // 发送结果
  sendMessageToQuicker(msg);
}

/**
 * 发送最新的网址以方便切换场景
 * @param {number} tabId 更新的标签页ID
 * @param {string} url 更新的网址
 * @param {boolean} isActive 标签页是否为活动标签页
 * @param {number} eventType 事件类型：1. 标签页激活。 2. 网址变更。 3. 窗口激活。
 */
export function reportUrlChange(tabId, url, isActive, eventType) {
  sendReplyToQuicker(true, "", {tabId, url, isActive, eventType}, 0, MSG_REPORT_ACTIVE_TAB_STATE);
}


function addDefaultProperties(obj, defaults) {
  for (const key in defaults) {
    // 只有当对象没有该属性或属性值为undefined时才添加
    if (obj[key] === undefined) {
      obj[key] = defaults[key];
    }
  }
  return obj;
}

const messageDefaults = {
  "version": _version,
  "browser": _browser,
  "manifestVersion": manifest.manifest_version,
  "messageType": 0,
  "isSuccess": true,
  "replyTo": 0,
  "message": ''
};

//#endregion
