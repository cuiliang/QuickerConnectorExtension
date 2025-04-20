'use strict';


/**
 * 根据选择器获取元素
 * @param {string} selector - 选择器。或以 'xpath:' 开头的 XPath 表达式。
 * @returns {Element|undefined} 元素或undefined
 */ 
export function getElementBySelector(selector) {
    let element = undefined;
    try {
        // 检查是 CSS 选择器还是 XPath
        if (selector.startsWith('xpath:')) {
            const xpath = selector.substring(6);
            if (!xpath) {
                console.error(`[扩展] 无效的 XPath 表达式: "${selector}"`);
                return undefined;
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
        return undefined;
    }

    return element;
}



