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

    if (details.reason === 'install' || details.reason === 'update') {
        // 获取 whats_new.html 在扩展内的 URL
        const url = chrome.runtime.getURL('whats_new.html');
        // 打开新标签页
        chrome.tabs.create({ url });
        console.log(`Opened whats_new page because: ${details.reason}`);
    }
});








