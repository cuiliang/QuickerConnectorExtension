'use strict';

import { getTargetTab } from './utils.js';
import { sendReplyToQuicker } from './connection.js';

/**
 * 对标签页执行命令.
 * 这些脚本运行在ContentPage上下文中
 */


/**
 * 对标签页执行命令
 * @param {object} msg 消息对象
 */
export async function runTabCommand(msg) {
  const command = msg.data.command;
  const params = msg.data.commandParams;


  console.log('runTabCommand', command, params);

  //
  // build target
  const tabId = msg.tabId;
  const tab = await getTargetTab(tabId);

  const allFrames = msg.data.allFrames === undefined ? false : msg.data.allFrames;
  const frameId = msg.data.frameId;
  const target = {
    tabId: tab.id,
    allFrames: allFrames,
    frameIds: frameId ? [frameId] : undefined
  };

  //
  // find handler
  const handler = TAB_COMMAND_HANDLERS[command];
  if (!handler) {
    console.error('Unknown command:', command);
    sendReplyToQuicker(false, 'Unknown background command：' + command, null, msg.serial);
    return;
  }

  //
  // execute
  try {
    await handler(target, command, params, msg);
  }
  catch (e) {
    console.error('Error executing background command:', msg, e);
    sendReplyToQuicker(false, e.message, e, msg.serial);
  }
}


/**
 * 后台命令和处理函数的映射 
 */
const TAB_COMMAND_HANDLERS = {
  'pick_element_selector': pickElementSelectorHandler,
  'trigger_event': triggerEventHandler,
}




//#region 选择元素Css选择器
function funcPickElementMain(msgSerial) {
  // 开始选择元素
  //
  if (typeof window._qk_picker !== 'undefined') {
    try {
      window._qk_picker.close();
      delete window._qk_picker;
    } catch (e) { }
  }


  var _qk_picker = new ElementPicker({
    container: document.body,
    selectors: "*",
    background: "rgba(153, 235, 255, 0.5)",
    borderWidth: 5,
    transition: "all 150ms ease",
    ignoreElements: [document.body],
    action: {
      trigger: 'click',
      callback: (function (target) {
        console.log('element selected:', target);
        const selector = finder(target);
        console.log('get selector:', selector);


        _qk_picker.close();
        delete window._qk_picker;

        // send to quicker
        //sendToQuicker({messageType:9, data:{data:selector}});
        sendReplyToQuicker(true, '', { 'selector': selector }, msgSerial)
      })
    }
  });
}

/**
 * 选择元素，并向Quicker返回选择器
 * @param {chrome.scripting.InjectionTarget} target 目标标签页
 * @param {string} command 命令
 * @param {object} commandParams 命令参数
 * @param {object} msg 消息对象
 */
async function pickElementSelectorHandler(target, command, commandParams, msg) {


  await chrome.scripting.executeScript({
    target: target,
    files: ['libs/pick.js']
  });

  await chrome.scripting.executeScript({
    target: target,
    func: funcPickElementMain,
    args: [msg.serial]
  });

  console.log('done pick element selector');
}

//#endregion


//#region 触发事件

async function triggerEventHandler(target, command, commandParams, msg) {
  const selector = commandParams.selector;
  const eventType = commandParams.eventType;
  const eventProperties = commandParams.eventProperties || {};

  console.log('trigger event, commandParams:', commandParams);

  var reuslt = await chrome.scripting.executeScript({
    target: target,
    func: triggerEventOnElement,
    args: [selector, eventType, eventProperties]
  });

  console.log('trigger event result:', reuslt);

  sendReplyToQuicker(true, 'ok', {}, msg.serial);
}

/**
 * 在指定元素上触发事件。
 * 此函数设计用于浏览器扩展的内容脚本 (content script)。
 *
 * @param {string} selector - 元素的 CSS 选择器，或者以 "xpath:" 开头的 XPath 表达式。
 * @param {string} eventType - 要触发的事件类型:
 * 'click': 模拟鼠标点击 (使用 element.click())。
 * 'change': 触发 change 事件 (通常用于 input, select, textarea)。
 * 'native.eventName': 触发指定的原生 JS 事件 (如 'native.focus', 'native.mouseover')。
 * 'otherEventName': 触发其他可以通过 dispatchEvent 触发的标准或自定义事件 (如 'input', 'blur', 'custom-event')。
 * @param {object} [eventProperties={}] - (可选) 附加到事件对象的额外属性。
 * 当使用 dispatchEvent 时生效，可以包含如 bubbles, cancelable, detail 等。
 * @returns {boolean} - 如果成功找到元素并尝试触发事件，则返回 true；如果未找到元素或选择器无效，则返回 false。
 * 注意：返回 true 并不保证页面上的事件监听器一定会按预期执行，仅表示事件已触发。
 */
function triggerEventOnElement(selector, eventType, eventProperties = {}) {
  let element = null;
  console.log(`[扩展] 尝试在选择器 "${selector}" 上触发事件 "${eventType}"`); // 调试信息

  try {
    // 检查是 CSS 选择器还是 XPath
    if (selector.startsWith('xpath:')) {
      const xpath = selector.substring(6);
      if (!xpath) {
        console.error(`[扩展] 无效的 XPath 表达式: "${selector}"`);
        return false;
      }
      // 使用 document.evaluate 查找 XPath
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      element = result.singleNodeValue;
    } else {
      // 使用 document.querySelector 查找 CSS 选择器
      element = document.querySelector(selector);
    }
  } catch (error) {
    console.error(`[扩展] 查找元素时出错 (选择器: "${selector}"):`, error);
    return false;
  }

  // 检查是否找到元素
  if (!element) {
    console.warn(`[扩展] 未找到匹配选择器 "${selector}" 的元素。`);
    return false;
  }

  console.log(`[扩展] 找到元素:`, element); // 调试信息

  try {
    // 根据 eventType 触发事件
    if (eventType === 'focus') { // <-- 特殊处理 focus
      if (typeof element.focus === 'function') {
        const options = eventProperties || {}; // 使用 eventProperties 作为 focus 选项
        element.focus(options); // 调用 focus() 方法
        console.log(`[扩展] 已调用元素的 focus() 方法。`);
        // 可选：检查 activeElement
        setTimeout(() => { /* ... 检查代码 ... */ }, 0);
        return true;
      } else {
        console.warn(`[扩展] 元素没有 focus() 方法。`);
        return false;
      }
    } else if (eventType === 'click') {
      // 采纳代码 2 的优点：先 focus 再 click
      if (typeof element.focus === 'function') {
        element.focus(); // 尝试 focus，忽略错误（某些元素可能无法 focus）
      }
      if (typeof element.click === 'function') {
        element.click();
      } else {
        // 对于某些SVG元素等可能没有 .click() 方法，可以尝试分发MouseEvent
        console.warn(`[扩展] 元素没有 .click() 方法，尝试分发 MouseEvent。`);
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          ...eventProperties // 允许传递MouseEvent特定属性
        });
        element.dispatchEvent(clickEvent);
      }
      console.log(`[扩展] 已在元素上触发 'click' 操作。`);
    } else if (eventType === 'change') {
      // 对于 change 事件，需要手动创建并分发
      // 注意：通常需要先修改元素的 value 或 checked 状态，再触发 change
      const event = new Event('change', {
        bubbles: true,       // change 事件通常需要冒泡
        cancelable: false,   // change 事件通常不可取消
        ...eventProperties   // 合并用户指定的属性
      });
      element.dispatchEvent(event);
      console.log(`[扩展] 已在元素上分发 'change' 事件。`);
    } else if (eventType.startsWith('native.')) {
      // 处理原生事件 'native.eventName'
      const nativeEventName = eventType.substring(7);
      if (!nativeEventName) {
        console.error(`[扩展] 无效的原生事件类型: "${eventType}"`);
        return false;
      }
      // 创建并分发指定的原生事件
      const event = new Event(nativeEventName, {
        bubbles: true,       // 默认允许冒泡
        cancelable: true,    // 默认允许取消
        ...eventProperties   // 合并用户指定的属性
      });
      element.dispatchEvent(event);
      console.log(`[扩展] 已在元素上分发原生事件 '${nativeEventName}'。`);
    } else {
      // 处理其他自定义或标准事件 (如 'input', 'blur', 'focus', 'mouseover', 'keydown', 自定义事件等)
      // 使用 dispatchEvent 分发
      const event = new Event(eventType, {
        bubbles: true,       // 默认允许冒泡
        cancelable: true,    // 默认允许取消
        ...eventProperties   // 合并用户指定的属性
      });
      element.dispatchEvent(event);
      console.log(`[扩展] 已在元素上分发事件 '${eventType}'。`);
    }
    return true; // 表示尝试触发事件成功
  } catch (error) {
    console.error(`[扩展] 在元素上触发事件 '${eventType}' 时出错:`, element, error);
    return false; // 表示触发事件时发生错误
  }
}

// --- 使用示例 (在内容脚本中调用) ---



//#endregion