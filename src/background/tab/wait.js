'use strict';


/**
 * 等待指定事件发生或超时
 * @param {Object} target - 目标对象
 * @param {Object} command - 命令对象
 * @param {Object} commandParams - 命令参数
 * @param {Object} msg - 消息对象
 * @returns {success, result, error} - 返回结果
 */
export async function waitHandler(target, command, commandParams, msg) {
    // 事件类型
    const eventType = commandParams.eventType;
    // 选择器   
    const selector = commandParams.selector;
    // 超时时间（ms）
    const timeout = commandParams.timeout;
    // 内容（仅当等待内容出现或消失时有效）
    const content = commandParams.content;
    
    var processor = WAIT_PROCESSORS[eventType];
    if (!processor) {
        return {success: false, error: `不支持的事件类型: ${eventType}`};
    }

    const result = await chrome.scripting.executeScript({
        target: target,
        func: processor,
        args: [{selector, eventType, timeout, content, pullInterval:200}]
    });

    if (result.filter(x => x.result).length > 0) {
        return {success: true, result: result};
    } else {
        return {success: false, error: `等待事件失败: ${eventType} ${selector} ${timeout}ms ${content}`};
    }
}

/**
 * 事件类型和对应的处理器
 * 处理器接受参数：selector、timeout、content、pullInterval（仅当等待内容出现或消失时有效）
 * 返回Promise<boolean>
 */
const WAIT_PROCESSORS = {
    'elementExists': waitElementExistsHandler,
    'elementNotExists': waitElementNotExistsHandler,

    'elementVisible': waitElementVisibleHandler,
    'elementNotVisible': waitElementNotVisibleHandler,
    
    'elementClickable': waitElementClickableHandler,
    'elementNotClickable': waitElementNotClickableHandler,
    

    'textContains': waitTextContainsHandler,  //content传入文本, selector为空时判断整个页面
    'textNotContains': waitTextNotContainsHandler,  //content传入文本, selector为空时判断整个页面
    'textMatches': waitTextMatchesHandler,  //content传入表达式, selector为空时判断整个页面
    'textNotMatches': waitTextNotMatchesHandler,  //content传入表达式, selector为空时判断整个页面
    
    'urlMatches': waitUrlMatchesHandler,  //content传入表达式
    'urlNotMatches': waitUrlNotMatchesHandler,  //content传入表达式

    'titleMatches': waitTitleMatchesHandler,  //content传入表达式
    'titleNotMatches': waitTitleNotMatchesHandler,  //content传入表达式

    'attributeMatches': waitAttributeMatchesHandler,  //content传入属性名：表达式
    'attributeNotMatches': waitAttributeNotMatchesHandler,  //content传入属性名：表达式

    'elementHasClass': waitElementHasClassHandler,  //content传入类名
    'elementNotHasClass': waitElementNotHasClassHandler,  //content传入类名

    'elementHasAttribute': waitElementHasAttributeHandler,  //content传入属性名
    'elementNotHasAttribute': waitElementNotHasAttributeHandler,  //content传入属性名   

    'elementCountGt': waitElementCountGtHandler,    //content传入数量
    'elementCountLt': waitElementCountLtHandler,    //content传入数量
    'elementCountEq': waitElementCountEqHandler,    //content传入数量
    
    'elementEvent': waitElementEventHandler,    //content传入事件名 
}

/**
 * 通用等待函数
 * @param {Object} params - 参数对象
 * @param {Function} conditionFn - 条件检查函数
 * @returns {Promise<boolean>}
 */
function waitForCondition(params, conditionFn) {
    const timeout = params.timeout || 5000;
    const pullInterval = params.pullInterval || 200;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        function check() {
            const result = conditionFn();
            if (result) {
                resolve(true);
                return;
            }
            
            if (Date.now() - startTime >= timeout) {
                resolve(false);
                return;
            }
            
            setTimeout(check, pullInterval);
        }
        
        check();
    });
}

/**
 * 使用MutationObserver等待DOM变化
 * @param {Object} params - 参数对象
 * @param {Function} conditionFn - 条件检查函数
 * @returns {Promise<boolean>}
 */
function waitForDomChange(params, conditionFn) {
    const timeout = params.timeout || 5000;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        // 先检查当前状态
        if (conditionFn()) {
            resolve(true);
            return;
        }
        
        // 设置超时
        const timeoutId = setTimeout(() => {
            if (observer) {
                observer.disconnect();
            }
            resolve(false);
        }, timeout);
        
        // 创建MutationObserver实例
        const observer = new MutationObserver(() => {
            if (conditionFn()) {
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(true);
            } else if (Date.now() - startTime >= timeout) {
                observer.disconnect();
                resolve(false);
            }
        });
        
        // 开始观察DOM变化
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    });
}

/**
 * 等待元素存在
 */
function waitElementExistsHandler(params) {
    const selector = params.selector;
    return waitForDomChange(params, () => {
        return document.querySelector(selector) !== null;
    });
}

/**
 * 等待元素不存在
 */
function waitElementNotExistsHandler(params) {
    const selector = params.selector;
    return waitForDomChange(params, () => {
        return document.querySelector(selector) === null;
    });
}

/**
 * 等待元素可见
 */
function waitElementVisibleHandler(params) {
    const selector = params.selector;
    
    return new Promise(async (resolve) => {
        // 先等待元素存在
        const elementExists = await waitElementExistsHandler(params);
        if (!elementExists) {
            resolve(false);
            return;
        }
        
        // 然后判断可见性
        const result = await waitForCondition(params, () => {
            const element = document.querySelector(selector);
            if (!element) return false;
            
            const style = window.getComputedStyle(element);
            return element.offsetParent !== null && 
                   style.display !== 'none' && 
                   style.visibility !== 'hidden' &&
                   style.opacity !== '0';
        });
        
        resolve(result);
    });
}

/**
 * 等待元素不可见
 */
function waitElementNotVisibleHandler(params) {
    const selector = params.selector;
    
    return waitForCondition(params, () => {
        const element = document.querySelector(selector);
        if (!element) return true;
        
        const style = window.getComputedStyle(element);
        return element.offsetParent === null || 
               style.display === 'none' || 
               style.visibility === 'hidden' ||
               style.opacity === '0';
    });
}

/**
 * 等待元素可点击
 */
function waitElementClickableHandler(params) {
    const selector = params.selector;
    
    return new Promise(async (resolve) => {
        // 先等待元素存在
        const elementExists = await waitElementExistsHandler(params);
        if (!elementExists) {
            resolve(false);
            return;
        }
        
        // 然后判断可点击性
        const result = await waitForCondition(params, () => {
            const element = document.querySelector(selector);
            if (!element) return false;
            
            const style = window.getComputedStyle(element);
            const isVisible = element.offsetParent !== null && 
                             style.display !== 'none' && 
                             style.visibility !== 'hidden' &&
                             style.opacity !== '0';
            
            const rect = element.getBoundingClientRect();
            const isInViewport = rect.top >= 0 &&
                                rect.left >= 0 &&
                                rect.bottom <= window.innerHeight &&
                                rect.right <= window.innerWidth;
            
            const isNotDisabled = !element.disabled;
            
            return isVisible && isInViewport && isNotDisabled;
        });
        
        resolve(result);
    });
}

/**
 * 等待元素不可点击
 */
function waitElementNotClickableHandler(params) {
    const selector = params.selector;
    return waitForCondition(params, () => {
        const element = document.querySelector(selector);
        if (!element) return true;
        
        const style = window.getComputedStyle(element);
        const isVisible = element.offsetParent !== null && 
                         style.display !== 'none' && 
                         style.visibility !== 'hidden' &&
                         style.opacity !== '0';
        
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= 0 &&
                            rect.left >= 0 &&
                            rect.bottom <= window.innerHeight &&
                            rect.right <= window.innerWidth;
        
        const isNotDisabled = !element.disabled;
        
        return !(isVisible && isInViewport && isNotDisabled);
    });
}

/**
 * 等待文本包含指定内容
 */
function waitTextContainsHandler(params) {
    const selector = params.selector;
    const content = params.content;
    
    if (!selector || selector === '') {
        return waitForCondition(params, () => {
            return document.body.textContent.includes(content);
        });
    } else {
        return new Promise(async (resolve) => {
            // 先等待元素存在
            const elementExists = await waitElementExistsHandler({...params, timeout: params.timeout / 2});
            if (!elementExists) {
                resolve(false);
                return;
            }
            
            // 然后判断文本
            const result = await waitForCondition(params, () => {
                const element = document.querySelector(selector);
                return element && element.textContent.includes(content);
            });
            
            resolve(result);
        });
    }
}

/**
 * 等待文本不包含指定内容
 */
function waitTextNotContainsHandler(params) {
    const selector = params.selector;
    const content = params.content;
    
    if (!selector || selector === '') {
        return waitForCondition(params, () => {
            return !document.body.textContent.includes(content);
        });
    } else {
        return waitForCondition(params, () => {
            const element = document.querySelector(selector);
            return !element || !element.textContent.includes(content);
        });
    }
}

/**
 * 等待文本匹配正则表达式
 */
function waitTextMatchesHandler(params) {
    const selector = params.selector;
    const pattern = new RegExp(params.content);
    
    if (!selector || selector === '') {
        return waitForCondition(params, () => {
            return pattern.test(document.body.textContent);
        });
    } else {
        return new Promise(async (resolve) => {
            // 先等待元素存在
            const elementExists = await waitElementExistsHandler({...params, timeout: params.timeout / 2});
            if (!elementExists) {
                resolve(false);
                return;
            }
            
            // 然后判断文本
            const result = await waitForCondition(params, () => {
                const element = document.querySelector(selector);
                return element && pattern.test(element.textContent);
            });
            
            resolve(result);
        });
    }
}

/**
 * 等待文本不匹配正则表达式
 */
function waitTextNotMatchesHandler(params) {
    const selector = params.selector;
    const pattern = new RegExp(params.content);
    
    if (!selector || selector === '') {
        return waitForCondition(params, () => {
            return !pattern.test(document.body.textContent);
        });
    } else {
        return waitForCondition(params, () => {
            const element = document.querySelector(selector);
            return !element || !pattern.test(element.textContent);
        });
    }
}

/**
 * 等待URL匹配正则表达式
 */
function waitUrlMatchesHandler(params) {
    const pattern = new RegExp(params.content);
    return waitForCondition(params, () => {
        return pattern.test(window.location.href);
    });
}

/**
 * 等待URL不匹配正则表达式
 */
function waitUrlNotMatchesHandler(params) {
    const pattern = new RegExp(params.content);
    return waitForCondition(params, () => {
        return !pattern.test(window.location.href);
    });
}

/**
 * 等待标题匹配正则表达式
 */
function waitTitleMatchesHandler(params) {
    const pattern = new RegExp(params.content);
    return waitForCondition(params, () => {
        return pattern.test(document.title);
    });
}

/**
 * 等待标题不匹配正则表达式
 */
function waitTitleNotMatchesHandler(params) {
    const pattern = new RegExp(params.content);
    return waitForCondition(params, () => {
        return !pattern.test(document.title);
    });
}

/**
 * 等待属性匹配正则表达式
 */
function waitAttributeMatchesHandler(params) {
    const selector = params.selector;
    const [attrName, attrPattern] = params.content.split(':');
    const pattern = new RegExp(attrPattern.trim());
    
    return new Promise(async (resolve) => {
        // 先等待元素存在
        const elementExists = await waitElementExistsHandler({...params, timeout: params.timeout / 2});
        if (!elementExists) {
            resolve(false);
            return;
        }
        
        // 然后判断属性
        const result = await waitForCondition(params, () => {
            const element = document.querySelector(selector);
            if (!element) return false;
            
            const attrValue = element.getAttribute(attrName.trim());
            return attrValue !== null && pattern.test(attrValue);
        });
        
        resolve(result);
    });
}

/**
 * 等待属性不匹配正则表达式
 */
function waitAttributeNotMatchesHandler(params) {
    const selector = params.selector;
    const [attrName, attrPattern] = params.content.split(':');
    const pattern = new RegExp(attrPattern.trim());
    
    return waitForCondition(params, () => {
        const element = document.querySelector(selector);
        if (!element) return true;
        
        const attrValue = element.getAttribute(attrName.trim());
        return attrValue === null || !pattern.test(attrValue);
    });
}

/**
 * 等待元素具有指定类名
 */
function waitElementHasClassHandler(params) {
    const selector = params.selector;
    const className = params.content;
    
    return new Promise(async (resolve) => {
        // 先等待元素存在
        const elementExists = await waitElementExistsHandler({...params, timeout: params.timeout / 2});
        if (!elementExists) {
            resolve(false);
            return;
        }
        
        // 然后判断类名
        const result = await waitForCondition(params, () => {
            const element = document.querySelector(selector);
            return element && element.classList.contains(className);
        });
        
        resolve(result);
    });
}

/**
 * 等待元素不具有指定类名
 */
function waitElementNotHasClassHandler(params) {
    const selector = params.selector;
    const className = params.content;
    
    return waitForCondition(params, () => {
        const element = document.querySelector(selector);
        return !element || !element.classList.contains(className);
    });
}

/**
 * 等待元素具有指定属性
 */
function waitElementHasAttributeHandler(params) {
    const selector = params.selector;
    const attributeName = params.content;
    
    return new Promise(async (resolve) => {
        // 先等待元素存在
        const elementExists = await waitElementExistsHandler({...params, timeout: params.timeout / 2});
        if (!elementExists) {
            resolve(false);
            return;
        }
        
        // 然后判断属性
        const result = await waitForCondition(params, () => {
            const element = document.querySelector(selector);
            return element && element.hasAttribute(attributeName);
        });
        
        resolve(result);
    });
}

/**
 * 等待元素不具有指定属性
 */
function waitElementNotHasAttributeHandler(params) {
    const selector = params.selector;
    const attributeName = params.content;
    
    return waitForCondition(params, () => {
        const element = document.querySelector(selector);
        return !element || !element.hasAttribute(attributeName);
    });
}

/**
 * 等待元素数量大于指定值
 */
function waitElementCountGtHandler(params) {
    const selector = params.selector;
    const count = parseInt(params.content, 10);
    
    return waitForDomChange(params, () => {
        const elements = document.querySelectorAll(selector);
        return elements.length > count;
    });
}

/**
 * 等待元素数量小于指定值
 */
function waitElementCountLtHandler(params) {
    const selector = params.selector;
    const count = parseInt(params.content, 10);
    
    return waitForDomChange(params, () => {
        const elements = document.querySelectorAll(selector);
        return elements.length < count;
    });
}

/**
 * 等待元素数量等于指定值
 */
function waitElementCountEqHandler(params) {
    const selector = params.selector;
    const count = parseInt(params.content, 10);
    
    return waitForDomChange(params, () => {
        const elements = document.querySelectorAll(selector);
        return elements.length === count;
    });
}

/**
 * 等待元素触发特定事件
 */
function waitElementEventHandler(params) {
    const selector = params.selector;
    const eventName = params.content;
    
    return new Promise(async (resolve) => {
        // 先等待元素存在
        const elementExists = await waitElementExistsHandler({...params, timeout: params.timeout / 2});
        if (!elementExists) {
            resolve(false);
            return;
        }
        
        const element = document.querySelector(selector);
        const timeoutId = setTimeout(() => {
            element.removeEventListener(eventName, eventHandler);
            resolve(false);
        }, params.timeout / 2);
        
        function eventHandler() {
            clearTimeout(timeoutId);
            element.removeEventListener(eventName, eventHandler);
            resolve(true);
        }
        
        element.addEventListener(eventName, eventHandler);
    });
}


