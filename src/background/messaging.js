"use strict";

import { MSG_COMMAND_RESP, MSG_REPORT_ACTIVE_TAB_STATE } from './constants.js';
import { sendMessageToQuicker } from './connection.js';
import { getBrowserName } from './utils.js';

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

  const manifest = chrome.runtime.getManifest();
  const _version = manifest.version;
  const _browser = getBrowserName();

  const msg = {
    "messageType": msgType,
    "isSuccess": isSuccess,
    "replyTo": replyTo,
    "message": message,
    "data": data,
    "version": _version,
    "browser": _browser
  };
  
  console.log('sending message to quicker:', msg);

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
  sendReplyToQuicker(true, "", { tabId, url, isActive, eventType }, 0, MSG_REPORT_ACTIVE_TAB_STATE);
} 