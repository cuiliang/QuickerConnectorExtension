"use strict";

import { isChromeTabUrl, isUrlMatch } from './utils.js';
import { sendReplyToQuicker } from './messaging.js';

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
    console.log(`Sending setup_actions to tab ${tab.id} with ${actionsForTab.length} actions.`);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (scriptToRun) => {
        // This function runs in the content script context
        // IMPORTANT: It cannot directly access variables from the background script scope (like 'code')
        // We pass the script content via 'args'
        try {
          // Attempt to execute the script. 'eval' is often discouraged due to security risks.
          // Consider alternative methods if possible, like message passing.
          return eval(scriptToRun);
        } catch (e) {
          // Return error information if execution fails
          return { error: e.toString(), stack: e.stack };
        }
      },
      args: [JSON.stringify({
        cmd: 'setup_actions',
        actions: actionsForTab,
        menuIcon: _menuIcon,
        menuButtonBgColor: _menuButtonBgColor,
        position: _buttonPosition || position
      })]
    }, (injectionResults) => {
      // Check for errors, but specifically ignore non-structured-clonable errors
      // as the executed script might intentionally return complex objects (like functions or DOM elements)
      // which cannot be cloned across the extension boundary.
      let finalResult = null;
      let scriptError = null;

      if (chrome.runtime.lastError) {
        scriptError = chrome.runtime.lastError.message;
        console.warn('executeScript injection error:', scriptError);
      } else if (injectionResults && injectionResults.length > 0) {
        // Find the result from the main frame (frameId 0) or the first successful result
        const mainFrameResult = injectionResults.find(r => r.frameId === 0);
        if (mainFrameResult) {
          if (mainFrameResult.error) {
            scriptError = typeof mainFrameResult.error === 'object' ? mainFrameResult.error.message : mainFrameResult.error;
            console.warn('Script execution error in main frame:', mainFrameResult.error);
          } else {
            finalResult = mainFrameResult.result;
          }
        } else {
          // Fallback: take the first result if no main frame result
          const firstResult = injectionResults[0];
          if (firstResult.error) {
            scriptError = typeof firstResult.error === 'object' ? firstResult.error.message : firstResult.error;
            console.warn('Script execution error in frame:', firstResult.frameId, firstResult.error);
          } else {
            finalResult = firstResult.result;
          }
        }
      }

      // Handle non-structured-clonable results gracefully (often functions or DOM elements)
      if (scriptError && scriptError.includes("non-structured-clonable")) {
        console.log('Script returned non-structured-clonable data (ignored).');
        scriptError = null; // Don't treat this as a fatal error for reply purposes
        // finalResult might still be null or undefined here, which is okay.
      }

      console.log('run script result:', finalResult, 'Error:', scriptError);

      // If not waiting for a manual reply, send the result back immediately.
      if (!waitManualReturn) {
        if (scriptError) {
          sendReplyToQuicker(false, scriptError, null, msg.serial);
        } else {
          sendReplyToQuicker(true, "", finalResult, msg.serial);
        }
      }
    });
  } else {
    // If no actions apply, send clear_actions to remove any existing UI
    console.log(`Sending clear_actions to tab ${tab.id}`);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        chrome.tabs.sendMessage(tab.id, { cmd: 'clear_actions' }, (response) => {
          // Check for errors when sending message to content script
          if (chrome.runtime.lastError) {
            // Avoid logging errors if the tab was closed or navigated away before receiving the message
            if (!chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
              console.warn(`Error sending 'clear_actions' to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
            }
          }
        });
      }
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
  const allFrames = msg.data.allFrames === undefined ? true : msg.data.allFrames;
  const frameId = msg.data.frameId;
  const waitManualReturn = msg.data.waitManualReturn;

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

  // Note: chrome.tabs.executeScript is deprecated in MV3. Use chrome.scripting.executeScript instead.
  chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: details.allFrames, frameIds: details.frameId ? [details.frameId] : undefined },
    func: (scriptToRun) => {
      // This function runs in the content script context
      // IMPORTANT: It cannot directly access variables from the background script scope (like 'code')
      // We pass the script content via 'args'
      try {
        // Attempt to execute the script. 'eval' is often discouraged due to security risks.
        // Consider alternative methods if possible, like message passing.
        return eval(scriptToRun);
      } catch (e) {
        // Return error information if execution fails
        return { error: e.toString(), stack: e.stack };
      }
    },
    args: [code] // Pass the actual script code here
  }, (injectionResults) => {
    // Check for errors, but specifically ignore non-structured-clonable errors
    // as the executed script might intentionally return complex objects (like functions or DOM elements)
    // which cannot be cloned across the extension boundary.
    let finalResult = null;
    let scriptError = null;

    if (chrome.runtime.lastError) {
      scriptError = chrome.runtime.lastError.message;
      console.warn('executeScript injection error:', scriptError);
    } else if (injectionResults && injectionResults.length > 0) {
      // Find the result from the main frame (frameId 0) or the first successful result
      const mainFrameResult = injectionResults.find(r => r.frameId === 0);
      if (mainFrameResult) {
        if (mainFrameResult.error) {
          scriptError = typeof mainFrameResult.error === 'object' ? mainFrameResult.error.message : mainFrameResult.error;
          console.warn('Script execution error in main frame:', mainFrameResult.error);
        } else {
          finalResult = mainFrameResult.result;
        }
      } else {
        // Fallback: take the first result if no main frame result
        const firstResult = injectionResults[0];
        if (firstResult.error) {
          scriptError = typeof firstResult.error === 'object' ? firstResult.error.message : firstResult.error;
          console.warn('Script execution error in frame:', firstResult.frameId, firstResult.error);
        } else {
          finalResult = firstResult.result;
        }
      }
    }

    // Handle non-structured-clonable results gracefully (often functions or DOM elements)
    if (scriptError && scriptError.includes("non-structured-clonable")) {
      console.log('Script returned non-structured-clonable data (ignored).');
      scriptError = null; // Don't treat this as a fatal error for reply purposes
      // finalResult might still be null or undefined here, which is okay.
    }

    console.log('run script result:', finalResult, 'Error:', scriptError);

    // If not waiting for a manual reply, send the result back immediately.
    if (!waitManualReturn) {
      if (scriptError) {
        sendReplyToQuicker(false, scriptError, null, msg.serial);
      } else {
        sendReplyToQuicker(true, "", finalResult, msg.serial);
      }
    }
  });
} 