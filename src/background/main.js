"use strict";
/**
 * 本插件用于连接Quicker软件。
 * 网址：https://getquicker.net
 * 反馈网址：https://github.com/cuiliang/Quicker
 */

// 导入模块
import { getBrowserName } from './utils.js';
import { connect} from './connection.js';
import { loadSettings } from './settings.js';
import { setupReports, setupContextMenuListener } from './event-handlers.js';
import { updateConnectionState } from './ui.js';
import { installToExistingTabs } from './tabs.js';
import { DEFAULT_BUTTON_POSITION } from './constants.js';
import { setupUserScriptMessageHandlers } from './userscript-message-handler.js';
import { setupExtensionMessageHandler } from "./extension-message-handler.js";

// 初始化浏览器信息
self.browserInfo = {
	name: getBrowserName(),
	version: chrome.runtime.getManifest().version
};

// 定义全局状态
self.state = {
	_isQuickerConnected: false,
	_isHostConnected: false,
	_quickerVersion: null,
	_hostVersion: null,
	_enableReport: true,
	_buttonPosition: DEFAULT_BUTTON_POSITION,
	_actions: [],
	_actionGroups: [],
	_menuIcon: null,
	_menuButtonBgColor: null,
};

console.log("Quicker Chrome Connector starting...");

// 兼容Firefox
chrome = chrome || browser;

// 初始化状态
updateConnectionState(false, false);

// 启动连接
connect();

// 加载设置
loadSettings();

// 设置事件监听
setupReports();
setupContextMenuListener();
setupExtensionMessageHandler();
setupUserScriptMessageHandlers();

// 启动时重新连接
chrome.runtime.onStartup.addListener(function () {
	console.log('runtime on startup. connect()...');
	connect();
});

// 安装或更新处理
chrome.runtime.onInstalled.addListener(function (details) {
	console.log('plugin installed or updated:' + details.reason);
	
	// 安装脚本到已存在的标签页
	installToExistingTabs();
});









//
// /**
//  * 发送最新的网址以方便切换场景
//  * @param {int} tabId 更新的标签页ID
//  * @param {string} url 更新的网址
//  * @param {boolean} isActive 标签页是否为活动标签页
//  * @param {number} eventType 事件类型：1. 标签页激活。 2. 网址变更。 3. 窗口激活。
//  */
// function reportUrlChange(tabId, url, isActive, eventType) {
// 	sendReplyToQuicker(true, "", { tabId, url, isActive, eventType }, 0, MSG_REPORT_ACTIVE_TAB_STATE);
// }
//
// /**
//  * 端口收到消息的处理（来自Quicker的消息）
//  * @param {*} msg
//  * 消息格式：
//  * 	 	serial: 消息序号，响应时在replyTo中返回，以便于pc端进行消息对应
//  * 		cmd: 命令
//  */
// function OnPortMessage(msg) {
// 	console.log("Received msg from Quicker:", msg.serial, msg);
//
// 	if (_port == null) {
// 		console.warn("OnPortMessage: port is null!");
// 		console.log(msg);
// 		return;
// 	}
// 	if (msg === null || msg === undefined) {
// 		console.warn("OnPortMessage: message is null!");
// 		return;
// 	}
//
// 	processQuickerCmd(msg);
// }

// /**
//  * 处理推送动作消息
//  * @param {object} msg 推送动作的消息
//  */
// function onMessagePushActions(msg) {
// 	console.log('onMessagePushActions:', msg);
// 	self.state._actions = msg.data.actions;
// 	self.state._actionGroups = msg.data.groups;
// 	self.state._menuIcon = msg.data.menuIcon;
// 	self.state._menuButtonBgColor = msg.data.menuButtonBgColor;
//
// 	//安装到所有标签页
// 	setupActionsForAllTabs();
// }
//
// /**
//  * 右键菜单被点击了
//  * @param {*} info
//  * @param {*} tab
//  * @returns
//  */
// function menuItemClicked(info, tab) {
// 	console.log('menu clicked:', info, tab);
//
// 	if (!self.state._isQuickerConnected) {
// 		console.warn('尚未连接到Quicker！');
// 		return;
// 	}
//
// 	// 发送消息给Quicker
// 	sendReplyToQuicker(true, "", {
// 		menuItemId: info.menuItemId,
// 		pageUrl: tab.url,
// 		selectionText: info.selectionText,
// 		linkUrl: info.linkUrl,
// 		linkText: info.linkText,
// 		srcUrl: info.srcUrl,
// 		mediaType: info.mediaType,
// 		frameUrl: info.frameUrl,
// 		editable: info.editable,
// 		wasChecked: info.wasChecked,
// 		checked: info.checked,
// 		parentMenuItemId: info.parentMenuItemId,
// 		tabId: tab.id
// 	}, 0, MSG_MENU_CLICK);
// }
//
// /**
//  * 监听popup窗口的消息
//  */
// chrome.runtime.onMessage.addListener(function (messageFromContentOrPopup, sender, sendResponse) {
// 	console.log('msg from popup/content:', messageFromContentOrPopup, ' sender:', sender);
//
// 	switch (messageFromContentOrPopup.cmd) {
// 		case 'update_ui':
// 			{
// 				updateUi();
// 				sendResponse();
// 			}
// 			break;
// 		case 'local_setting_changed':
// 			{
// 				loadSettings();
// 				sendResponse();
// 			}
// 			break;
// 		case 'send_to_quicker':
// 			{
// 				// 转发消息给Quicker
// 				var msg = Object.assign({}, {
// 					"messageType": 0,
// 					"isSuccess": true,
// 					"replyTo": 0,
// 					"message": '',
// 					"version": _version,
// 					"browser": _browser
// 				}, messageFromContentOrPopup.data);
// 				_port.postMessage(msg);
//
// 				// 返回
// 				sendResponse();
// 			}
// 			break;
// 		case 'action_clicked':
// 			{
// 				// 转发消息给Quicker
// 				var msg = {
// 					"messageType": 22, //ActionButtonClick
// 					"isSuccess": true,
// 					"replyTo": 0,
// 					"message": '',
// 					"version": _version,
// 					"browser": _browser,
// 					"data": messageFromContentOrPopup.data
// 				};
// 				_port.postMessage(msg);
//
// 				// 返回
// 				sendResponse();
// 			}
// 			break;
// 	}
// });
//
// /**
//  * Quicker 连接状态变化了
//  * @param {*} msg
//  */
// function onMsgQuickerStateChange(msg) {
// 	if (msg.data.isConnected) {
// 		self.browserInfo.name = msg.data.browser;
// 		self.state._quickerVersion = msg.data.quickerVersion;
// 		self.state._hostVersion = msg.data.hostVersion;
//
// 		if (self.state._enableReport) {
// 			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
// 				if (tabs.length > 0) {
// 					reportUrlChange(tabs[0].tabId, tabs[0].url, tabs[0].active, 1);
// 				}
// 			})
// 		}
// 	} else {
// 		notifyClearActions();
// 	}
//
// 	updateConnectionState(true, msg.data.isConnected);
// }
//
// const QUICKER_ROOT_MENU_ID = "quicker_root_menu";
// /**
//  * 注册右键菜单
//  * @param {*} msg
//  */
// function onMessageRegisterContextMenu(msg) {
// 	chrome.contextMenus.removeAll();
//
// 	if (msg.data.items.length > 0) {
// 		msg.data.items.forEach(function (item) {
// 			chrome.contextMenus.create(item);
// 		});
// 	}
// }
//
// /**
//  * 按属性排序
//  * @param {string} p
//  * @returns
//  */
// Array.prototype.sortBy = function (p) {
// 	return this.slice(0).sort(function (a, b) {
// 		return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
// 	});
// }


