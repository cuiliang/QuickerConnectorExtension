'use strict';

import { sendReplyToQuicker } from "../connection.js";

export async function triggerEventHandler(target, command, commandParams, msg) {
    const selector = commandParams.selector;
    const eventType = commandParams.eventType;
    const eventProperties = commandParams.eventProperties || {};

    console.log('trigger event, commandParams:', commandParams);

    await chrome.scripting.executeScript({
        target: target,
        files: ['libs/jquery.min.js']
    });

    try{
        var reuslt = await chrome.scripting.executeScript({
            target: target,
            func: triggerEventOnElement,
            args: [selector, eventType, eventProperties]
        });
    
        console.log('trigger event result:', reuslt);
    
        sendReplyToQuicker(true, 'ok', {}, msg.serial);
    }catch(error){
        console.error('trigger event error:', error);
        sendReplyToQuicker(false, error.message, {}, msg.serial);
    }
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
/**
 * 在指定元素上触发事件。
 * 此函数设计用于浏览器扩展的内容脚本 (content script)。
 * 使用原生 DOM API，不依赖 jQuery。
 *
 * @param {string} selector - 元素的 CSS 选择器，或者以 "xpath:" 开头的 XPath 表达式。
 * @param {string} eventType - 要触发的事件类型:
 *   'click': 模拟鼠标点击 (尝试 element.click()，备用 MouseEvent)。
 *   'focus': 调用 element.focus()。
 *   'change': 分发 'change' 事件 (通常用于 input, select, textarea)。
 *   'native.eventName': 分发指定的原生 JS 事件 (如 'native.mouseover')。
 *   'otherEventName': 分发其他可以通过 dispatchEvent 触发的标准或自定义事件 (如 'input', 'blur', 'custom-event')。
 * @param {object} [eventProperties={}] - (可选) 附加到事件对象的额外属性。
 *   当使用 dispatchEvent 时生效，可以包含如 bubbles, cancelable, detail, view, button, clientX/Y 等。
 *   对于 'focus' 事件，这些属性会作为 options 传递给 element.focus(options)。
 * @returns {boolean} - 如果成功找到元素并尝试触发事件，则返回 true；如果未找到元素或选择器无效，或触发时发生错误，则返回 false。
 *   注意：返回 true 并不保证页面上的事件监听器一定会按预期执行，仅表示事件已成功分发或方法已调用。
 * @throws {Error} 如果选择器无效或未找到元素。
 */
function triggerEventOnElement(selector, eventType, eventProperties = {}) {

    console.log(`[扩展] 尝试在选择器 "${selector}" 上触发事件 "${eventType}"`); // 调试信息

    // 确保 JQuery 可用
    if (typeof jQuery === 'undefined') {
        throw new Error("错误：此函数需要 JQuery。请确保已加载 JQuery 库。");
    }

    // 使用 JQuery 选择器查找元素
    const $elements = selector.startsWith('xpath:') ? $(_x(selector.substring(7))) : $(selector);

    // 检查是否找到元素
    if ($elements.length === 0) {
        throw new Error(`错误：选择器 "${selector}" 没有找到任何元素。`);
    }

    const element = $elements[0];
    console.log(`[扩展] 找到元素:`, element); // 调试信息

    try {
        // 根据 eventType 触发事件
        switch (eventType) {
            case 'focus':
                if (typeof element.focus === 'function') {
                    const options = eventProperties || {}; // 使用 eventProperties 作为 focus 选项
                    element.focus(options);
                    console.log(`[扩展] 已调用元素的 focus() 方法。`);
                    // 可选：检查 document.activeElement 是否为目标元素
                    // setTimeout(() => { console.log('Active element:', document.activeElement); }, 0);
                } else {
                    console.warn(`[扩展] 元素 ${element.tagName} 没有 focus() 方法。尝试分发 focus 事件。`);
                    // 备选：分发 focus 事件 (可能不如 element.focus() 有效)
                    const focusEvent = new FocusEvent('focus', { bubbles: false, cancelable: false, ...eventProperties });
                    element.dispatchEvent(focusEvent);
                }
                break;

            case 'click':
                // 尝试先 focus (某些元素需要先 focus 才能响应 click)
                if (typeof element.focus === 'function') {
                    try { element.focus(); } catch (e) { /* 忽略 focus 错误 */ }
                }
                // 优先使用 element.click()
                if (typeof element.click === 'function') {
                    element.click();
                    console.log(`[扩展] 已调用元素的 click() 方法。`);
                } else {
                    // 备选：分发 MouseEvent (适用于 SVG 或其他没有 .click 方法的元素)
                    console.warn(`[扩展] 元素 ${element.tagName} 没有 click() 方法，尝试分发 MouseEvent。`);
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        ...eventProperties // 允许传递 MouseEvent 特定属性
                    });
                    element.dispatchEvent(clickEvent);
                    console.log(`[扩展] 已在元素上分发 'click' MouseEvent。`);
                }
                break;

            case 'change':
                // 注意：通常需要先修改元素的 value 或 checked 状态，再触发 change
                const changeEvent = new Event('change', {
                    bubbles: true,       // change 事件通常需要冒泡
                    cancelable: false,   // change 事件通常不可取消
                    ...eventProperties   // 合并用户指定的属性
                });
                element.dispatchEvent(changeEvent);
                console.log(`[扩展] 已在元素上分发 'change' 事件。`);
                break;

            default:
                let actualEventType = eventType;
                let isNativePrefix = false;

                // 处理 'native.eventName'
                if (eventType.startsWith('native.')) {
                    actualEventType = eventType.substring(7);
                    isNativePrefix = true;
                    if (!actualEventType) {
                        throw new Error(`[扩展] 无效的原生事件类型: "${eventType}"`);
                    }

                    // 确定事件接口 (尝试更具体的事件类型)
                    let eventObject;
                    const commonEventProps = {
                        bubbles: true,       // 默认允许冒泡
                        cancelable: true,    // 默认允许取消
                        ...eventProperties   // 合并用户指定的属性
                    };

                    // 根据事件类型选择合适的构造函数 (不完全列表，可按需扩展)
                    if (['mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'].includes(actualEventType)) {
                        eventObject = new MouseEvent(actualEventType, commonEventProps);
                    } else if (['keydown', 'keyup', 'keypress'].includes(actualEventType)) {
                        eventObject = new KeyboardEvent(actualEventType, commonEventProps);
                    } else if (['focus', 'blur'].includes(actualEventType) && !isNativePrefix) { // 避免重复处理 focus
                        // 如果是 'focus' 且没有 'native.' 前缀，已在上面处理过
                        if (actualEventType === 'focus') {
                            console.warn("[扩展] 'focus' 事件建议直接使用 eventType 'focus' 以调用 element.focus()");
                            // 仍然尝试分发事件作为备选
                            eventObject = new FocusEvent(actualEventType, { bubbles: false, cancelable: false, ...eventProperties });
                        } else { // blur
                            eventObject = new FocusEvent(actualEventType, { bubbles: false, cancelable: false, ...eventProperties });
                        }
                    } else if (['input'].includes(actualEventType)) {
                        // InputEvent 有特殊属性，但用 Event 通常也有效
                        eventObject = new Event(actualEventType, commonEventProps);
                    }
                    // ... 可以添加更多特定事件类型如 WheelEvent, TouchEvent 等
                    else {
                        // 默认使用通用 Event
                        eventObject = new Event(actualEventType, commonEventProps);
                    }

                    element.dispatchEvent(eventObject);
                    console.log(`[扩展] 已在元素上分发事件 '${actualEventType}' (原始类型: ${eventType})。`);
                } else {
                    $elements.trigger(eventType, eventProperties);
                }

                break;
        }
        return true; // 表示尝试触发事件成功

    } catch (error) {
        console.error(`[扩展] 在元素上触发事件 '${eventType}' 时出错:`, element, error);
        // 不再返回 false，而是重新抛出错误，让调用者知道具体问题
        throw new Error(`在元素上触发事件 '${eventType}' 时出错: ${error.message}`);
    }
}