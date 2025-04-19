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

    // --- 判断是否打开 "What's New" 页面的逻辑 ---
    let shouldOpenWhatsNew = false;

    if (details.reason === 'install') {
        // 首次安装时，通常也希望用户看到介绍或新功能页面
        shouldOpenWhatsNew = true;

    } else if (details.reason === 'update') {
        const currentVersion = chrome.runtime.getManifest().version;
        const previousVersion = details.previousVersion;

        if (previousVersion) {
            // 解析版本号 (例如 "1.2.3" -> ["1", "2", "3"])
            const currentParts = currentVersion.split('.');
            const previousParts = previousVersion.split('.');

            // 比较主版本号 (a) 或次版本号 (b) 是否发生变化
            // a.b.c => parts[0].parts[1].parts[2]
            if (currentParts.length >= 2 && previousParts.length >= 2 &&
                (currentParts[0] !== previousParts[0] || currentParts[1] !== previousParts[1]))
            {
                shouldOpenWhatsNew = true;
                console.log(`Reason: Major or minor version update detected (${previousVersion} -> ${currentVersion}).`);
            } else {
                console.log(`Reason: Patch version update or no change in major/minor parts (${previousVersion} -> ${currentVersion}). Not opening whats_new.`);
            }
        } else {
             // 如果没有 previousVersion，可能是一个特殊情况，保险起见可以打开
             console.warn("Update reason but no previousVersion found. Opening whats_new as a fallback.");
             shouldOpenWhatsNew = true;
        }
    }
    // 'chrome_update' 或 'shared_module_update' 等其他原因不触发打开页面

    // 如果判断需要打开页面
    if (shouldOpenWhatsNew) {
        try {
            const url = chrome.runtime.getURL('whats_new.html');
            chrome.tabs.create({ url });
            console.log(`Opened whats_new page.`);
        } catch (error) {
            console.error("Error opening whats_new page:", error);
        }
    }
});








