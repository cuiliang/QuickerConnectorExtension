"use strict";

import {isChromeTabUrl, isUrlMatch} from './utils.js';

import {sendReplyToQuicker} from "./connection.js";

/**
 * 与浏览器标签页的交互
 */


/**
 * 将脚本安装到当前已经打开的标签页中
 */
export function installToExistingTabs() {
  console.log('installing script into tabs.');

  const manifest = chrome.runtime.getManifest();
  // Ensure content_scripts and js array exist
  if (!manifest.content_scripts || !manifest.content_scripts[0] || !manifest.content_scripts[0].js) {
    console.warn("Cannot find content scripts to inject in manifest.");
    return;
  }
  const scripts = manifest.content_scripts[0].js;

  runScriptOnAllTabs(function (tab) {
    scripts.forEach(script => {
      // Note: chrome.tabs.executeScript is deprecated in MV3. Use chrome.scripting.executeScript instead.
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [script]
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn(`Error injecting script ${script} into tab ${tab.id}: ${chrome.runtime.lastError.message}`);
        }
      });
    });
  });
}

/**
 * 在所有打开的标签页上执行函数
 * @param {Function} func 要执行的函数，参数为标签页对象
 */
export function runScriptOnAllTabs(func) {
  chrome.windows.getAll({
    populate: true
  }, function (windows) {
    windows.forEach(win => {
      win.tabs.forEach(tab => {
        if (!isChromeTabUrl(tab.url)) {
          func(tab);
        }
      });
    });
  });
}

/**
 * 对每个标签页，更新动作按钮
 */
export function setupActionsForAllTabs() {
  runScriptOnAllTabs(function (tab) {
    setupActionsForTab(tab);
  });
}

/**
 * 当某个tab加载完成，content脚本加载完成后，
 * 根据需要，添加动作按钮到网页
 * @param {object} tab 标签页对象
 * @param {object} position 当前位置数据，可选
 */
export function setupActionsForTab(tab, position) {
  const url = tab.url;

  if (isChromeTabUrl(url)) {
    console.log('setupActionsForTab: skip chrome tab:', url);
    return;
  }

  // Note: Relies on global state. Consider passing state explicitly or using a state management module.
  const { _actions, _actionGroups, _menuIcon, _menuButtonBgColor, _buttonPosition } = self.state || {}; // Use self.state

  // Ensure state properties are initialized before use
  const currentActions = _actions || [];
  const currentActionGroups = _actionGroups || [];

  console.log('Setting up actions for tab:', tab.id, 'URL:', url);

  let actionsForTab = [];

  if (currentActions.length) {
    currentActions.forEach(action => {
      if (isUrlMatch(url, action.urlPattern)) {
        actionsForTab.push(action);
      }
    });
  }

  if (currentActionGroups.length) {
    currentActionGroups.forEach(group => {
      if (group.actions && isUrlMatch(url, group.urlPattern)) {
        group.actions.forEach(action => {
          actionsForTab.push(action);
        });
      }
    });
  }

  if (actionsForTab.length > 0) {

		chrome.tabs.sendMessage(tab.id,
			{
				cmd: 'setup_actions',
				actions: actionsForTab,
				menuIcon: _menuIcon,
				menuButtonBgColor: _menuButtonBgColor,
				position: _buttonPosition
			},
			function (response) {
			});
	} else {
		// 如果之前显示了动作，则通知其清除
		chrome.tabs.sendMessage(tab.id,
			{
				cmd: 'clear_actions'
			},
			function (response) {
			});
	}
}

/**
 * 在指定标签页上执行代码
 * @param {object} msg 消息对象 
 * @param {Function} func 要执行的函数，参数为tabId和msg
 */
export function executeOnTab(msg, func) {
  const tabId = msg.tabId;

  if (!tabId) {
    chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
      if (tabs.length < 1) {
        sendReplyToQuicker(false, "Can not find active tab.", {}, msg.serial);
        return;
      }

      if (isChromeTabUrl(tabs[0].url)) {
        sendReplyToQuicker(false, "Can not run on this page.", {}, msg.serial);
      } else {
        func(tabs[0].id, msg);
      }
    });
  } else {
    func(tabId, msg);
  }
}

/**
 * 对指定tab执行脚本
 * @param {number} tabId 标签页ID
 * @param {string} script 要执行的脚本
 * @param {object} msg 消息对象
 */
export function runScriptOnTab(tabId, script, msg) {

  if (!isUserScriptsAvailable()) {
    sendReplyToQuicker(false, "执行动态脚本需要开启浏览器的开发者模式.", {}, msg.serial);
    return;
  }

  const allFrames = msg.data.allFrames === undefined ? true : msg.data.allFrames;
  const frameId = msg.data.frameId;
  const waitManualReturn = msg.data.waitManualReturn;

  const world = msg.data.world || 'USER_SCRIPT';

  const code = waitManualReturn
    ? script.replace('qk_msg_serial', msg.serial)  // Inject serial for manual reply
    : script;

  const details = {
    code: code,
    allFrames: allFrames
  };

  if (frameId !== undefined && frameId !== null) { // Ensure frameId is valid if provided
    details.frameId = frameId;
    // When targeting a specific frame, allFrames should typically be false, but follow input if specified.
    // details.allFrames = false; // Consider forcing this if frameId is present
  }

  const target = { 
    tabId: tabId, 
    allFrames: details.allFrames, 
    frameIds: details.frameId ? [details.frameId] : undefined 
  };

  
  const scriptSource = [];
  // 检查脚本是否包含'quicker'关键字
  if (code.includes('quicker')) {
    scriptSource.push({
      file: './userScripts/userScriptApi.js'
    });
  }

  // 检查脚本是否包含jQuery代码
  if (code.includes('$') || code.includes('jQuery')) {
    scriptSource.push({
      file: './libs/jquery-3.6.0.min.js'
    });
  }
  
  // 检查脚本是否使用了_x函数
  if (code.includes('_x(')) {
    scriptSource.push({
      code: `
/**
 * 增加xpath解析支持
 * @param {*} STR_XPATH XPath
 */
function _x(STR_XPATH) {
	var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
	var xnodes = [];
	var xres;
	while (xres = xresult.iterateNext()) {
		xnodes.push(xres);
	}

	return xnodes;
}`
    });
  }
  
  // 添加用户脚本代码
  scriptSource.push({
    code: code
  });
  


  //
  chrome.userScripts.execute({
    js: scriptSource,
    target: target,
    world: world // MAIN, USER_SCRIPT.
  }, 
    
    function(result){
      //result: InjectionResult[]
      if (chrome.runtime.lastError
				&& chrome.runtime.lastError.message.includes("result is non-structured-clonable data") === false) {
				console.warn('execute tab script error:', chrome.runtime.lastError)
				sendReplyToQuicker(false, chrome.runtime.lastError.message, result, msg.serial);
			} else {
				console.log('run script result:', result);

				// 如果需要等待手动响应，则不直接返回脚本结果，而是等待脚本返回
				if (!waitManualReturn) {
					sendReplyToQuicker(true, "", result, msg.serial);
				}
			}
  })

}

/**
 * 通知标签页，端口已经断开，去除显示的悬浮按钮
 */
export function notifyClearActions() {
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



//# region 辅助代码

// 判断是否支持userScripts
function isUserScriptsAvailable() {
  try {
    // Property access which throws if developer mode is not enabled.
    chrome.userScripts;
    return true;
  } catch {
    // Not available.
    return false;
  }
}


//# endregion
