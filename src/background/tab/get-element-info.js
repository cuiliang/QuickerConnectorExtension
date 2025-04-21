'use strict';

import {sendReplyToQuicker} from '../connection.js';

/**
 * 获取元素信息
 * @param {Object} target - 目标对象
 * @param {Object} command - 命令对象
 * @param {Object} commandParams - 命令参数
 * @param {Object} msg - 消息对象
 * @returns {Object} 获取到的元素值的数组
 */
export async function getElementInfoHandler(target, command, commandParams, msg) {
    const selector = commandParams.selector;
    const infoType = commandParams.infoType;
    const attrName = commandParams.attrName;

    console.log('getElementInfo, commandParams:', commandParams);

    await chrome.scripting.executeScript({
        target: target,
        files: ['libs/jquery.min.js']
    });

    var result = await chrome.scripting.executeScript({
        target: target,
        func: getFormControlInfo,
        args: [selector, infoType, attrName]
    });
    console.log('getElementInfo result:', result);

    // 从 result 数组中查找第一个具有有效 result 属性的项，并返回该 result 值
    const valueArray = result.filter(x => x.result).map(x => x.result);

    console.log('getElementInfo valueArray:', valueArray);

    if (valueArray.length === 0) {
        return {success: false, error: `没有找到元素(${selector})`};
    }else{
        return {success: true, result: valueArray};
    }
}


/**
 * 获取网页表单控件或元素的信息
 *
 * @param {string} selector - 用于查找目标元素的 CSS 选择器。
 * @param {'Value'|'ArrayValue'|'Attribute'|'Property'|'InnerText'|'InnerHTML'} infoType - 要获取的信息类型。
 * @param {string} [attributeName] - 当 infoType 为 'Attribute' 或 'Property' 时需要指定的属性或特性名称。
 * @returns {*} 获取到的元素信息
 */
function getFormControlInfo(selector, infoType, attributeName) {
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

    // 根据 infoType 获取信息
    try {
        switch (infoType.toLowerCase()) {
            case 'value':
                //return $elements.val();
                return $elements.map(function(i,v){ return $(this).val(); }).toArray();
            case 'arrayvalue':
                if ($elements.is('select[multiple]')) {
                    //return $elements.val();
                    return $elements.map(function(i,v){ return $(this).val(); }).toArray();
                } else if ($elements.is('input[type="checkbox"], input[type="radio"]')) {
                    // 获取所有选中的复选框或单选按钮的值
                    let selectedValues = [];
                    $elements.filter(':checked').each(function() {
                        selectedValues.push($(this).val());
                    });
                    return selectedValues;
                } else {
                    throw new Error('错误：infoType "ArrayValue" 通常用于 <select multiple> 或 input 组 (checkbox/radio)。');
                }

            case 'attribute':
                if (!attributeName) {
                    throw new Error('错误：当 infoType 为 "Attribute" 时，必须提供 attributeName。');
                }
                return $elements.map(function(i,v){ return $(this).attr(attributeName); }).toArray();

            case 'property':
                if (!attributeName) {
                    throw new Error('错误：当 infoType 为 "Property" 时，必须提供 attributeName。');
                }
                return $elements.map(function(i,v){ return $(this).prop(attributeName); }).toArray();

            case 'innertext':
                //return $elements.text();
                return $elements.map(function(i,v){ return $(this).text(); }).toArray();

            case 'innerhtml':
                //return $elements.html();
                return $elements.map(function(i,v){ return $(this).html(); }).toArray();

            case 'outerhtml':
                //return $elements.outerHTML;
                console.log('$elements:', $elements);
                return $elements.map(function(i,v){ 
                    console.log('$(this).outerHTML:', this.outerHTML); // 这里不能使用$(this).outerHTML，因为$(this)是JQuery对象，而不是DOM对象
                    return this.outerHTML; }).toArray();

            default:
                console.error('未知的 infoType:', infoType);
                throw new Error(`错误：未知的 infoType "${infoType}"。`);
        }
    } catch (error) {
        throw new Error(`获取元素 "${selector}" 的信息时发生错误: ${error.message}`);
    }
} 