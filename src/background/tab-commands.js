'use strict';

import { getTargetTab } from './utils.js';

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
    'pick_element_selector': pickElementSelector,
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
async function pickElementSelector(target, command, commandParams, msg) {
   

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


