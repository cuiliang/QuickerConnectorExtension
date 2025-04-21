'use strict';

import {sendReplyToQuicker} from '../connection.js';

/**
 * 更新元素信息
 * @param {Object} target - 目标对象
 * @param {Object} command - 命令对象
 * @param {Object} commandParams - 命令参数
 * @param {Object} msg - 消息对象
 */
export async function updateElementInfoHandler(target, command, commandParams, msg) {
    const selector = commandParams.selector;
    const infoType = commandParams.infoType;
    const attrName = commandParams.attrName;
    const value = commandParams.value;

    console.log('updateElementInfo, commandParams:', commandParams);

    await chrome.scripting.executeScript({
        target: target,
        files: ['libs/jquery.min.js']
    });

    try {
        var result = await chrome.scripting.executeScript({
            target: target,
            func: updateFormControl,
            args: [selector, value, infoType, attrName]
        });

        console.log('updateElementInfo result:', result);   

        let hasUpdateSuccess = result.filter(x => x.result).length > 0;

        if (hasUpdateSuccess) {
            return {success: true, result: {}};
        } else {
            return {success: false, error: `没有找到元素(${selector})或遇到了错误，请检查浏览器控制台报错。`};
        }
    } catch (error) {
        return {success: false, error: error.message};
    }
}


/**
 * 更新网页表单控件或元素，目标值以字符串形式传入。
 *
 * @param {string} selector - 用于查找目标元素的 CSS 选择器。
 * @param {string} targetValue - 要设置的目标值的字符串表示。
 * - 对于 'Value', 'Attribute', 'InnerText', 'InnerHTML': 直接使用此字符串。
 * - 对于 'ArrayValue': 期望是数组的 JSON 字符串格式 (例如 '["val1", "val2"]') 或简单的逗号分隔字符串（需要调整解析逻辑）。目前实现为JSON格式。
 * - 对于 'Property': 会尝试根据属性名（如 'checked', 'disabled'）将字符串 ("true", "false") 解析为布尔值，或将数字字符串解析为数字。
 * @param {'Value'|'ArrayValue'|'Attribute'|'Property'|'InnerText'|'InnerHTML'} updateType - 要更新的对象类型。
 * @param {string} [attributeName] - 当 updateType 为 'Attribute' 或 'Property' 时需要指定的属性或特性名称。
 */
function updateFormControl(selector, targetValue, updateType, attributeName) {
    // 确保 JQuery 可用
    if (typeof jQuery === 'undefined') {
        throw new Error("错误：此函数需要 JQuery。请确保已加载 JQuery 库。");
    }

    // 检查 targetValue 是否为字符串 (虽然调用者保证了，但加一层防护)
    if (typeof targetValue !== 'string') {
        throw new Error(`错误：targetValue 必须是一个字符串，但收到了类型 ${typeof targetValue}。`);
    }



    // 使用 JQuery 选择器查找元素
    const $elements = selector.startsWith('xpath:') ? $(_x(selector.substring(7))) : $(selector);

    // 检查是否找到元素
    if ($elements.length === 0) {
        throw new Error(`错误：选择器 "${selector}" 没有找到任何元素。`);
    }

    const element = $elements[0];

    // 定义可能需要特殊处理的属性名 (小写)
    const booleanPropertyNames = ['checked', 'disabled', 'required', 'readonly', 'multiple', 'selected', 'hidden'];
    const numericPropertyNames = ['maxlength', 'minlength', 'tabindex', 'size', 'rows', 'cols', 'step', 'valueasnumber'];

    // 根据 updateType 执行更新操作
    try {
        let processedValue = targetValue;

        switch (updateType.toLowerCase()) {
            case 'value':
                if ($elements.is('select[multiple]')) {
                    throw new Error(`错误：对 <select multiple> 使用 "Value" 类型可能无法按预期工作。请考虑使用 "ArrayValue" 并提供 JSON 数组字符串。尝试将 "${targetValue}" 作为单个值设置。`);
                }
                $elements.val(targetValue);

                //触发输入和改变事件
                var event = new Event('input', { bubbles: true });
                var tracker = element._valueTracker;
                if (tracker) {
                    tracker.setValue(lastValue);
                }
                element.dispatchEvent(event);

                // event = new Event('change', {bubbles: true});
                // element.dispatchEvent(event);

                break;

            case 'arrayvalue':
                let actualArray;
                // 尝试解析输入值，支持JSON数组或换行分隔的文本
                try {
                    actualArray = JSON.parse(targetValue);
                } catch (jsonError) {
                    // 如果JSON解析失败，尝试按行分割并过滤空行
                    actualArray = targetValue
                        .split(/[\r\n]+/)  // 按换行符分割
                        .map(line => line.trim())  // 去除每行首尾空白
                        .filter(line => line !== '');  // 过滤空行
                }
                console.log('actualArray:', actualArray);

                if (!Array.isArray(actualArray)) {
                    throw new Error(`错误：解析后的 targetValue 不是一个数组 (解析自 "${targetValue}")。`);
                }

                processedValue = actualArray;

                if ($elements.is('select')) {
                    $elements.val(processedValue);
                } else if ($elements.is('input')) {
                    $elements.each(function () {
                        const $input = $(this);
                        const inputType = $input.attr('type');
                        const value = $input.val();

                        if (inputType === 'checkbox' || inputType === 'radio') {
                            if (processedValue.some(target => String(target) === String(value))) {
                                $input.prop('checked', true);
                            } else {
                                if (inputType === 'checkbox') {
                                    $input.prop('checked', false);
                                }
                            }
                        } else {
                            throw new Error(`错误：对 type="${inputType}" 的 input 使用 "ArrayValue" 可能不是预期行为。`);
                        }
                    });
                } else {
                    throw new Error('错误：updateType "ArrayValue" 通常用于 <select multiple> 或 input 组 (checkbox/radio)。');
                }

                // let event = new Event('change', {bubbles: true});
                // element.dispatchEvent(event);
                break;

            case 'attribute':
                if (!attributeName) {
                    throw new Error('错误：当 updateType 为 "Attribute" 时，必须提供 attributeName。');
                }
                $elements.attr(attributeName, targetValue);
                break;

            case 'property':
                if (!attributeName) {
                    throw new Error('错误：当 updateType 为 "Property" 时，必须提供 attributeName。');
                }

                const lowerAttrName = attributeName.toLowerCase();

                if (booleanPropertyNames.includes(lowerAttrName)) {
                    processedValue = targetValue.toLowerCase() === 'true';
                } else if (numericPropertyNames.includes(lowerAttrName)) {
                    if (lowerAttrName === 'valueasnumber') {
                        const numVal = parseFloat(targetValue);
                        if (!isNaN(numVal)) {
                            processedValue = numVal;
                        } else {
                            throw new Error(`错误：无法将属性 "${attributeName}" 的值 "${targetValue}" 解析为浮点数。`);
                        }
                    } else {
                        const numVal = parseInt(targetValue, 10);
                        if (!isNaN(numVal)) {
                            processedValue = numVal;
                        } else {
                            throw new Error(`错误：无法将属性 "${attributeName}" 的值 "${targetValue}" 解析为整数。`);
                        }
                    }
                }

                $elements.prop(attributeName, processedValue);

                // event = new Event('change', {bubbles: true});
                // element.dispatchEvent(event);
                break;

            case 'innertext':
                $elements.text(targetValue);

                // event = new Event('change', {bubbles: true});
                // element.dispatchEvent(event);
                break;

            case 'innerhtml':
                $elements.html(targetValue);

                // event = new Event('change', {bubbles: true});
                // element.dispatchEvent(event);
                break;

            default:
                throw new Error(`错误：未知的 updateType "${updateType}"。`);
        }

        $elements.trigger('change');

        return true;
    } catch (error) {
        throw new Error(`更新元素 "${selector}" 时发生错误: ${error.message}`);
    }
}

//   // --- 示例用法 (targetValue 现在总是字符串) ---

//   // 假设页面上有与之前相同的 HTML 结构...

//   $(document).ready(function() {
//     // 示例 1: 更新文本输入框的值 (字符串)
//     updateFormControl('#username', 'JaneDoe', 'Value');

//     // 示例 2: 更新下拉选择框的值 (字符串)
//     updateFormControl('#country', 'MX', 'Value');

//     // 示例 3: 更新文本区域的值 (字符串)
//     updateFormControl('#comments', 'New comment text.', 'Value');

//     // 示例 4: 更新多选下拉框的值 (使用 ArrayValue, targetValue 是 JSON 字符串)
//     updateFormControl('#hobbies', '["reading", "sports"]', 'ArrayValue');
//     // 错误示例 (非 JSON 字符串，会导致解析错误):
//     // updateFormControl('#hobbies', 'reading,sports', 'ArrayValue'); // 这会报错，除非修改解析逻辑

//     // 示例 5: 更新图片元素的 src 特性 (字符串)
//     updateFormControl('#profile-pic', 'another_avatar.jpg', 'Attribute', 'src');

//     // 示例 6: 更新图片元素的 data-userid 特性 (字符串，即使内容是数字)
//     updateFormControl('#profile-pic', '98765', 'Attribute', 'data-userid');

//     // 示例 7: 更新复选框的选中状态 (使用 Property, targetValue 是 "true" 或 "false" 字符串)
//     updateFormControl('#newsletter-check', 'true', 'Property', 'checked'); // 选中
//     // updateFormControl('#newsletter-check', 'false', 'Property', 'checked'); // 取消选中

//     // 示例 8: 更新段落的内部文本 (字符串)
//     updateFormControl('#description', 'Description updated via string.', 'InnerText');

//     // 示例 9: 更新 div 的内部 HTML (字符串)
//     updateFormControl('#content-area', '<h3>Updated Title</h3><p>Some updated HTML content.</p>', 'InnerHTML');

//     // 示例 10: 更新一组复选框 (使用 ArrayValue, targetValue 是 JSON 字符串)
//     updateFormControl('input[name="options"]', '["opt2"]', 'ArrayValue');

//     // 示例 11: 设置 input 的 disabled 属性 (Property, boolean string)
//     // updateFormControl('#username', 'true', 'Property', 'disabled');

//     // 示例 12: 设置 textarea 的 maxlength 属性 (Property, numeric string)
//      updateFormControl('#comments', '200', 'Property', 'maxLength');


//     // --- 事件监听器 (与之前相同，用于观察效果) ---
//     $('#country').on('change', function() {
//       console.log('国家(change):', $(this).val());
//     });
//     $('#hobbies').on('change', function() {
//       console.log('爱好(change):', $(this).val()); // .val() for multiple select returns an array
//     });
//      $('#newsletter-check').on('change', function() {
//       console.log('订阅(change):', $(this).prop('checked'));
//     });
//     $('input[name="options"]').on('change', function() {
//       console.log(`选项 "${$(this).val()}" (change): ${$(this).prop('checked')}`);
//     });
//      $('#username').on('change', function() {
//          console.log('用户名(change):', $(this).val(), 'Disabled:', $(this).prop('disabled'));
//      });
//       $('#comments').on('change', function() {
//           console.log('评论(change):', $(this).val(), 'MaxLength:', $(this).prop('maxLength'));
//       });
//   });