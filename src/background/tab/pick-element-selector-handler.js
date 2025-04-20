//#region 选择元素Css选择器
import {sendReplyToQuicker} from "../connection.js";

function funcPickElementMain(msgSerial) {
    // 开始选择元素
    //
    if (typeof window._qk_picker !== 'undefined') {
        try {
            window._qk_picker.close();
            delete window._qk_picker;
        } catch (e) {
        }
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
                sendReplyToQuicker(true, '', {'selector': selector}, msgSerial)
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
export async function pickElementSelectorHandler(target, command, commandParams, msg) {


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