'use strict';

/**
 * 等待指定事件发生或超时
 * @param {chrome.scripting.InjectionTarget} target - 目标对象 (e.g., {tabId: number, frameIds?: number[]})
 * @param {Object} commandParams - 命令参数
 * @param {string} commandParams.eventType - 要等待的事件类型 (来自 WAIT_PROCESSORS 的键)
 * @param {string} [commandParams.selector] - CSS 选择器 (根据 eventType 可能需要)
 * @param {number} commandParams.timeout - 超时时间 (ms)
 * @param {string|number} [commandParams.content] - 附加内容 (文本, 正则表达式, 属性名:表达式, 类名, 属性名, 数量, 事件名 - 取决于 eventType)
 * @param {number} [commandParams.pullInterval=200] - 轮询间隔时间 (ms) - 主要用于 waitForCondition
 * @returns {Promise<{success: boolean, result?: any, error?: string}>} - 返回结果, success表示是否成功, result可能包含第一个成功frame的结果, error包含错误信息
 */
export async function waitHandler(target, command, commandParams, msg) {
    // 事件类型
    const eventType = commandParams.eventType;
    // 选择器
    const selector = commandParams.selector;
    // 超时时间（ms）
    const timeout = commandParams.timeout;
    // 内容（仅当等待内容出现或消失时有效）
    const content = commandParams.eventParams;
    // 轮询间隔
    const pullInterval = commandParams.pullInterval || 200;

    if (selector.startsWith('xpath:')) {
        return {success: false, error: '等待命令不支持xpath'};
    }
    

    let executionResults;
    try {
        executionResults = await chrome.scripting.executeScript({
            target: target,
            func: doWait,
            // 将所有需要的参数传递给 content script
            args: [{ selector, eventType, timeout, content, pullInterval }]
        });

        console.log('waitHandler executionResults:', executionResults);


        if (executionResults.filter(x => x.result).length > 0) {
            var result = executionResults[0].result;
            if (result.success) {
                return { success: true, result: executionResults[0].result };
            } else {
                return { success: false, error: result.error };
            }
        } else {
            return { success: false, error: `等待条件不满足` };
        }
    } catch (injectionError) {
        // 捕获注入脚本本身的错误 (例如，目标 tab 不存在)
        console.error("Error injecting script for waitHandler:", injectionError);
        return { success: false, error: `脚本注入失败: ${injectionError.message}` };
    }
}

// ---------------------------------------------------------------------------
// Content Script Functions (to be injected)
// ---------------------------------------------------------------------------

function doWait(params) {
    


    /**
     * 事件类型和对应的处理器 (这些函数将在目标页面的上下文中执行)
     * 处理器接受参数对象：{selector, eventType, timeout, content, pullInterval}
     * 返回Promise<boolean> (表示条件是否在超时前满足)
     */
    const WAIT_PROCESSORS = {
        'elementExists': waitElementExistsHandler,
        'elementNotExists': waitElementNotExistsHandler,

        'elementVisible': waitElementVisibleHandler,
        'elementNotVisible': waitElementNotVisibleHandler,

        'elementClickable': waitElementClickableHandler,
        'elementNotClickable': waitElementNotClickableHandler,

        'textContains': waitTextContainsHandler,      // content传入文本, selector为空时判断整个页面
        'textNotContains': waitTextNotContainsHandler, // content传入文本, selector为空时判断整个页面
        'textMatches': waitTextMatchesHandler,        // content传入表达式字符串, selector为空时判断整个页面
        'textNotMatches': waitTextNotMatchesHandler,   // content传入表达式字符串, selector为空时判断整个页面

        'urlMatches': waitUrlMatchesHandler,          // content传入表达式字符串
        'urlNotMatches': waitUrlNotMatchesHandler,       // content传入表达式字符串

        'titleMatches': waitTitleMatchesHandler,        // content传入表达式字符串
        'titleNotMatches': waitTitleNotMatchesHandler,     // content传入表达式字符串

        'attributeMatches': waitAttributeMatchesHandler,    // content传入 "属性名:表达式字符串"
        'attributeNotMatches': waitAttributeNotMatchesHandler,// content传入 "属性名:表达式字符串"

        'elementHasClass': waitElementHasClassHandler,       // content传入类名
        'elementNotHasClass': waitElementNotHasClassHandler, // content传入类名

        'elementHasAttribute': waitElementHasAttributeHandler, // content传入属性名
        'elementNotHasAttribute': waitElementNotHasAttributeHandler,// content传入属性名

        'elementCountGt': waitElementCountGtHandler,       // content传入数量 (string or number)
        'elementCountLt': waitElementCountLtHandler,       // content传入数量 (string or number)
        'elementCountEq': waitElementCountEqHandler,       // content传入数量 (string or number)

        'elementEvent': waitElementEventHandler,           // content传入事件名 (e.g., 'click', 'load')
    }

    /**
     * 通用轮询等待函数 (用于无法使用 MutationObserver 的情况)
     * @param {Object} params - 参数对象 {timeout, pullInterval}
     * @param {Function} conditionFn - 条件检查函数 (应处理自身异常并返回 boolean)
     * @returns {Promise<boolean>} - 条件是否满足
     */
    function waitForCondition(params, conditionFn) {
        const timeout = params.timeout || 5000; // 默认超时
        const pullInterval = params.pullInterval || 200; // 默认轮询间隔
        const startTime = Date.now();

        return new Promise((resolve) => {
            function check() {
                let result = false;
                try {
                    result = conditionFn(); // 执行条件检查
                } catch (e) {
                    console.error("waitForCondition: Error in condition function:", e);
                    result = false; // 出错视为条件不满足
                }

                if (result === true) {
                    resolve(true); // 条件满足
                    return;
                }

                if (Date.now() - startTime >= timeout) {
                    resolve(false); // 超时
                    return;
                }

                // 继续轮询
                setTimeout(check, pullInterval);
            }
            check(); // 立即开始第一次检查
        });
    }

    /**
     * 使用MutationObserver等待DOM变化 (更高效)
     * @param {Object} params - 参数对象 {timeout}
     * @param {Function} conditionFn - 条件检查函数 (应处理自身异常并返回 boolean)
     * @returns {Promise<boolean>} - 条件是否满足
     */
    function waitForDomChange(params, conditionFn) {
        const timeout = params.timeout || 5000; // 默认超时
        const startTime = Date.now();

        return new Promise((resolve) => {
            let initialResult = false;
            try {
                initialResult = conditionFn(); // 先立即检查一次
            } catch (e) {
                console.error("waitForDomChange: Error in initial condition check:", e);
                initialResult = false;
            }

            if (initialResult === true) {
                resolve(true);
                return;
            }

            let observer = null; // 声明 observer 变量

            // 设置总超时定时器
            const timeoutId = setTimeout(() => {
                if (observer) {
                    observer.disconnect(); // 超时后停止观察
                }
                resolve(false); // 超时，条件未满足
            }, timeout);

            // 创建 MutationObserver 实例
            observer = new MutationObserver(() => {
                // DOM 变化时再次检查条件
                let checkResult = false;
                try {
                    checkResult = conditionFn();
                } catch (e) {
                    console.error("waitForDomChange: Error in observer condition check:", e);
                    checkResult = false;
                }

                if (checkResult === true) {
                    clearTimeout(timeoutId); // 条件满足，清除超时定时器
                    observer.disconnect(); // 停止观察
                    resolve(true); // 条件满足
                }
                // 注意：移除了这里的冗余超时检查，外部 setTimeout 会处理
            });

            // 开始观察整个 body 的变化 (子节点、属性、文本内容)
            // 注意：这不包括 Shadow DOM 内部的变化
            observer.observe(document.body || document.documentElement, { // Fallback to documentElement if body is not yet available? Usually body is fine.
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true // 观察文本节点内容变化
            });
        });
    }


    // --- 具体事件处理器 ---

    /** 等待元素存在 */
    function waitElementExistsHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(false); // 需要选择器
        return waitForDomChange(params, () => {
            try {
                return document.querySelector(selector) !== null;
            } catch (e) {
                console.error(`Error finding element [${selector}] in waitElementExistsHandler:`, e);
                return false; // 无效选择器或其他错误
            }
        });
    }

    /** 等待元素不存在 */
    function waitElementNotExistsHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(true); // 没有选择器，可以认为"不存在"
        return waitForDomChange(params, () => {
            try {
                return document.querySelector(selector) === null;
            } catch (e) {
                // 如果选择器无效，查询会抛错，此时元素也"不存在"
                console.warn(`Error finding element [${selector}] in waitElementNotExistsHandler (treating as non-existent):`, e);
                return true;
            }
        });
    }

    /** 检查元素是否在网页中可见的辅助函数（不考虑是否在视口中）*/
    function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect(); // 需要检查尺寸是否大于0
        const visible = style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            parseFloat(style.opacity) > 0 && // 检查 opacity > 0
            element.offsetParent !== null && // 在布局流中
            rect.width > 0 && rect.height > 0; // 必须有实际尺寸
        return visible;
    }

    /** 等待元素可见 */
    function waitElementVisibleHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(false); // 需要选择器

        return new Promise(async (resolve) => {
            const startTime = Date.now();
            const totalTimeout = params.timeout;

            // 1. 等待元素存在
            const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
            if (!elementExists) {
                resolve(false); // 如果元素在分配时间内都未出现，则失败
                return;
            }

            // 计算剩余可用时间
            const elapsedTime = Date.now() - startTime;
            const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

            // 2. 元素已存在，现在等待它变得可见 (使用剩余时间)
            const result = await waitForCondition({ ...params, timeout: remainingTimeout }, () => {
                try {
                    const element = document.querySelector(selector);
                    return isElementVisible(element);
                } catch (e) {
                    console.error(`Error checking visibility for [${selector}]:`, e);
                    return false;
                }
            });
            resolve(result);
        });
    }

    /** 等待元素不可见 */
    function waitElementNotVisibleHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(true); // 没有选择器，可以认为"不可见"

        return waitForCondition(params, () => {
            try {
                const element = document.querySelector(selector);
                // 如果元素不存在，或者元素存在但不可见，则条件满足
                return !element || !isElementVisible(element);
            } catch (e) {
                // 如果选择器无效导致查询失败，也视为"不可见"
                console.warn(`Error checking non-visibility for [${selector}] (treating as not visible):`, e);
                return true;
            }
        });
    }


    /** 检查元素是否可点击的辅助函数 */
    function isElementClickable(element) {
        if (!element || !isElementVisible(element)) { // 首先必须可见
            return false;
        }
        // 检查是否被禁用
        if (element.disabled) {
            return false;
        }
        // 检查是否在视口内 (这是一个基本检查，不考虑遮挡)
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        // 可以添加更复杂的检查，例如 elementFromPoint 来检测遮挡，但会更复杂且可能有性能影响
        // const centerX = rect.left + rect.width / 2;
        // const centerY = rect.top + rect.height / 2;
        // const elementAtCenter = document.elementFromPoint(centerX, centerY);
        // const isNotObscured = element === elementAtCenter || element.contains(elementAtCenter);

        return isInViewport && !element.disabled; // 结合可见性、视口和禁用状态
    }

    /** 等待元素可点击 */
    function waitElementClickableHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(false); // 需要选择器

        return new Promise(async (resolve) => {
            const startTime = Date.now();
            const totalTimeout = params.timeout;

            // 1. 等待元素存在
            const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
            if (!elementExists) {
                resolve(false);
                return;
            }

            // 计算剩余可用时间
            const elapsedTime = Date.now() - startTime;
            const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

            // 2. 元素已存在，等待它变得可点击 (使用剩余时间)
            const result = await waitForCondition({ ...params, timeout: remainingTimeout }, () => {
                try {
                    const element = document.querySelector(selector);
                    return isElementClickable(element);
                } catch (e) {
                    console.error(`Error checking clickability for [${selector}]:`, e);
                    return false;
                }
            });
            resolve(result);
        });
    }

    /** 等待元素不可点击 */
    function waitElementNotClickableHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(true); // 没有选择器，认为"不可点击"

        return waitForCondition(params, () => {
            try {
                const element = document.querySelector(selector);
                // 如果元素不存在，或者存在但不可点击，则条件满足
                return !element || !isElementClickable(element);
            } catch (e) {
                // 选择器无效，视为"不可点击"
                console.warn(`Error checking non-clickability for [${selector}] (treating as not clickable):`, e);
                return true;
            }
        });
    }

    /** 等待文本包含指定内容 */
    function waitTextContainsHandler(params) {
        const selector = params.selector;
        const content = params.content;
        if (content === undefined || content === null) return Promise.resolve(false); // 需要内容

        const checkFn = (textSource) => {
            // 处理 textSource 可能为 null 或 undefined 的情况
            const text = textSource ? textSource.textContent : '';
            return text.includes(content);
        };

        if (!selector || selector === '') {
            // 检查整个页面 body
            return waitForCondition(params, () => checkFn(document.body));
        } else {
            // 检查特定元素
            return new Promise(async (resolve) => {
                const startTime = Date.now();
                const totalTimeout = params.timeout;

                // 1. 等待元素存在
                const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
                if (!elementExists) {
                    resolve(false);
                    return;
                }

                // 计算剩余可用时间
                const elapsedTime = Date.now() - startTime;
                const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

                // 2. 元素已存在，现在检查文本
                const result = await waitForCondition({ ...params, timeout: remainingTimeout }, () => {
                    try {
                        const element = document.querySelector(selector);
                        return checkFn(element);
                    } catch (e) {
                        console.error(`Error checking textContains for [${selector}]:`, e);
                        return false;
                    }
                });
                resolve(result);
            });
        }
    }

    /** 等待文本不包含指定内容 */
    function waitTextNotContainsHandler(params) {
        const selector = params.selector;
        const content = params.content;
        if (content === undefined || content === null) return Promise.resolve(true); // 没有内容可包含，所以"不包含"为真

        const checkFn = (textSource) => {
            const text = textSource ? textSource.textContent : '';
            return !text.includes(content);
        };

        if (!selector || selector === '') {
            return waitForCondition(params, () => checkFn(document.body));
        } else {
            return waitForCondition(params, () => {
                try {
                    const element = document.querySelector(selector);
                    // 如果元素不存在，也视为"不包含"
                    return !element || checkFn(element);
                } catch (e) {
                    console.warn(`Error checking textNotContains for [${selector}] (treating as not containing):`, e);
                    return true; // 选择器错误，视为不包含
                }
            });
        }
    }

    /** 等待文本匹配正则表达式 */
    function waitTextMatchesHandler(params) {
        const selector = params.selector;
        const content = params.content;
        if (typeof content !== 'string' || content === '') return Promise.resolve(false); // 需要有效的正则字符串

        let pattern;
        try {
            pattern = new RegExp(content); // 创建正则表达式
        } catch (e) {
            console.error(`Invalid RegExp pattern in waitTextMatchesHandler: ${content}`, e);
            return Promise.resolve(false); // 无效正则，直接失败
        }

        const checkFn = (textSource) => {
            const text = textSource ? textSource.textContent : '';
            return pattern.test(text);
        };

        if (!selector || selector === '') {
            return waitForCondition(params, () => checkFn(document.body));
        } else {
            return new Promise(async (resolve) => {
                const startTime = Date.now();
                const totalTimeout = params.timeout;

                // 1. 等待元素存在
                const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
                if (!elementExists) {
                    resolve(false);
                    return;
                }

                // 计算剩余可用时间
                const elapsedTime = Date.now() - startTime;
                const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

                // 2. 元素已存在，现在检查文本匹配
                const result = await waitForCondition({ ...params, timeout: remainingTimeout }, () => {
                    try {
                        const element = document.querySelector(selector);
                        return checkFn(element);
                    } catch (e) {
                        console.error(`Error checking textMatches for [${selector}]:`, e);
                        return false;
                    }
                });
                resolve(result);
            });
        }
    }

    /** 等待文本不匹配正则表达式 */
    function waitTextNotMatchesHandler(params) {
        const selector = params.selector;
        const content = params.content;
        if (typeof content !== 'string' || content === '') return Promise.resolve(true); // 无有效正则可匹配，所以"不匹配"为真

        let pattern;
        try {
            pattern = new RegExp(content);
        } catch (e) {
            console.error(`Invalid RegExp pattern in waitTextNotMatchesHandler: ${content}`, e);
            return Promise.resolve(false); // 无效正则视为失败，因为无法判断不匹配
        }

        const checkFn = (textSource) => {
            const text = textSource ? textSource.textContent : '';
            return !pattern.test(text);
        };

        if (!selector || selector === '') {
            return waitForCondition(params, () => checkFn(document.body));
        } else {
            return waitForCondition(params, () => {
                try {
                    const element = document.querySelector(selector);
                    // 元素不存在，视为"不匹配"
                    return !element || checkFn(element);
                } catch (e) {
                    console.warn(`Error checking textNotMatches for [${selector}] (treating as not matching):`, e);
                    return true; // 选择器错误，视为不匹配
                }
            });
        }
    }


    /** 等待URL匹配正则表达式 */
    function waitUrlMatchesHandler(params) {
        const content = params.content;
        if (typeof content !== 'string' || content === '') return Promise.resolve(false);
        let pattern;
        try {
            pattern = new RegExp(content);
        } catch (e) {
            console.error(`Invalid RegExp pattern for URL: ${content}`, e);
            return Promise.resolve(false);
        }
        return waitForCondition(params, () => pattern.test(window.location.href));
    }

    /** 等待URL不匹配正则表达式 */
    function waitUrlNotMatchesHandler(params) {
        const content = params.content;
        if (typeof content !== 'string' || content === '') return Promise.resolve(true);
        let pattern;
        try {
            pattern = new RegExp(content);
        } catch (e) {
            console.error(`Invalid RegExp pattern for URL: ${content}`, e);
            return Promise.resolve(false); // 无法判断不匹配
        }
        return waitForCondition(params, () => !pattern.test(window.location.href));
    }

    /** 等待标题匹配正则表达式 */
    function waitTitleMatchesHandler(params) {
        const content = params.content;
        if (typeof content !== 'string' || content === '') return Promise.resolve(false);
        let pattern;
        try {
            pattern = new RegExp(content);
        } catch (e) {
            console.error(`Invalid RegExp pattern for Title: ${content}`, e);
            return Promise.resolve(false);
        }
        return waitForCondition(params, () => pattern.test(document.title));
    }

    /** 等待标题不匹配正则表达式 */
    function waitTitleNotMatchesHandler(params) {
        const content = params.content;
        if (typeof content !== 'string' || content === '') return Promise.resolve(true);
        let pattern;
        try {
            pattern = new RegExp(content);
        } catch (e) {
            console.error(`Invalid RegExp pattern for Title: ${content}`, e);
            return Promise.resolve(false); // 无法判断不匹配
        }
        return waitForCondition(params, () => !pattern.test(document.title));
    }

    /** 解析 "name:pattern" 格式 */
    function parseAttributeMatcher(content) {
        if (typeof content !== 'string' || content === '') return null;
        const match = content.match(/^([^:]+):(.*)$/s); // 匹配第一个冒号前后的内容
        if (!match || match.length < 3) {
            console.error(`Invalid format for attribute matcher content: ${content}. Expected "attributeName:pattern"`);
            return null;
        }
        const attrName = match[1].trim();
        const attrPatternStr = match[2].trim(); // 可能为空字符串
        if (!attrName) {
            console.error(`Attribute name cannot be empty in: ${content}`);
            return null;
        }
        try {
            const pattern = new RegExp(attrPatternStr);
            return { attrName, pattern };
        } catch (e) {
            console.error(`Invalid RegExp pattern in attribute matcher "${attrPatternStr}" from content "${content}":`, e);
            return null;
        }
    }


    /** 等待属性匹配正则表达式 */
    function waitAttributeMatchesHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(false); // 需要选择器

        const matcher = parseAttributeMatcher(params.content);
        if (!matcher) return Promise.resolve(false); // 格式或正则错误
        const { attrName, pattern } = matcher;

        return new Promise(async (resolve) => {
            const startTime = Date.now();
            const totalTimeout = params.timeout;

            // 1. 等待元素存在
            const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
            if (!elementExists) {
                resolve(false);
                return;
            }

            // 计算剩余可用时间
            const elapsedTime = Date.now() - startTime;
            const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

            // 2. 元素已存在，现在检查属性匹配
            const result = await waitForCondition({ ...params, timeout: remainingTimeout }, () => {
                try {
                    const element = document.querySelector(selector);
                    if (!element) return false; // 元素再次消失
                    const attrValue = element.getAttribute(attrName);
                    // 属性必须存在 (getAttribute 返回 null 如果不存在) 且值匹配正则
                    return attrValue !== null && pattern.test(attrValue);
                } catch (e) {
                    console.error(`Error checking attributeMatches for [${selector}]:`, e);
                    return false;
                }
            });
            resolve(result);
        });
    }

    /** 等待属性不匹配正则表达式 */
    function waitAttributeNotMatchesHandler(params) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(true); // 没有元素，自然不匹配

        const matcher = parseAttributeMatcher(params.content);
        if (!matcher) return Promise.resolve(false); // 格式或正则错误视为失败
        const { attrName, pattern } = matcher;

        return waitForCondition(params, () => {
            try {
                const element = document.querySelector(selector);
                if (!element) return true; // 元素不存在，视为不匹配
                const attrValue = element.getAttribute(attrName);
                // 属性不存在 (null) 或 属性存在但不匹配正则
                return attrValue === null || !pattern.test(attrValue);
            } catch (e) {
                console.warn(`Error checking attributeNotMatches for [${selector}] (treating as not matching):`, e);
                return true; // 选择器错误，视为不匹配
            }
        });
    }

    /** 等待元素具有指定类名 */
    function waitElementHasClassHandler(params) {
        const selector = params.selector;
        const className = params.content;
        if (!selector || typeof className !== 'string' || className === '') {
            return Promise.resolve(false);
        }

        return new Promise(async (resolve) => {
            const startTime = Date.now();
            const totalTimeout = params.timeout;

            // 1. 等待元素存在
            const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
            if (!elementExists) {
                resolve(false);
                return;
            }

            // 计算剩余可用时间
            const elapsedTime = Date.now() - startTime;
            const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

            // 2. 元素已存在，现在检查类名
            const result = await waitForCondition({ ...params, timeout: remainingTimeout }, () => {
                try {
                    const element = document.querySelector(selector);
                    return element && element.classList.contains(className);
                } catch (e) {
                    console.error(`Error checking elementHasClass for [${selector}]:`, e);
                    return false;
                }
            });
            resolve(result);
        });
    }

    /** 等待元素不具有指定类名 */
    function waitElementNotHasClassHandler(params) {
        const selector = params.selector;
        const className = params.content;
        if (!selector || typeof className !== 'string' || className === '') {
            return Promise.resolve(true); // 条件不足，视为不包含
        }

        return waitForCondition(params, () => {
            try {
                const element = document.querySelector(selector);
                // 元素不存在，或存在但不包含该类
                return !element || !element.classList.contains(className);
            } catch (e) {
                console.warn(`Error checking elementNotHasClass for [${selector}] (treating as not having class):`, e);
                return true; // 选择器错误视为不包含
            }
        });
    }

    /** 等待元素具有指定属性 */
    function waitElementHasAttributeHandler(params) {
        const selector = params.selector;
        const attributeName = params.content;
        if (!selector || typeof attributeName !== 'string' || attributeName === '') {
            return Promise.resolve(false);
        }

        return new Promise(async (resolve) => {
            const startTime = Date.now();
            const totalTimeout = params.timeout;

            // 1. 等待元素存在
            const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
            if (!elementExists) {
                resolve(false);
                return;
            }

            // 计算剩余可用时间
            const elapsedTime = Date.now() - startTime;
            const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

            // 2. 元素已存在，现在检查属性
            const result = await waitForCondition({ ...params, timeout: remainingTimeout }, () => {
                try {
                    const element = document.querySelector(selector);
                    return element && element.hasAttribute(attributeName);
                } catch (e) {
                    console.error(`Error checking elementHasAttribute for [${selector}]:`, e);
                    return false;
                }
            });
            resolve(result);
        });
    }

    /** 等待元素不具有指定属性 */
    function waitElementNotHasAttributeHandler(params) {
        const selector = params.selector;
        const attributeName = params.content;
        if (!selector || typeof attributeName !== 'string' || attributeName === '') {
            return Promise.resolve(true); // 条件不足，视为不包含
        }

        return waitForCondition(params, () => {
            try {
                const element = document.querySelector(selector);
                // 元素不存在，或存在但不包含该属性
                return !element || !element.hasAttribute(attributeName);
            } catch (e) {
                console.warn(`Error checking elementNotHasAttribute for [${selector}] (treating as not having attribute):`, e);
                return true; // 选择器错误视为不包含
            }
        });
    }


    /** 等待元素数量比较 */
    function waitElementCountHandler(params, comparisonFn) {
        const selector = params.selector;
        if (!selector) return Promise.resolve(false); // 需要选择器

        const count = parseInt(params.content, 10);
        if (isNaN(count)) {
            console.error(`Invalid count number provided: ${params.content}`);
            return Promise.resolve(false);
        }

        return waitForDomChange(params, () => {
            try {
                const elements = document.querySelectorAll(selector);
                return comparisonFn(elements.length, count); // 执行传入的比较函数
            } catch (e) {
                console.error(`Error finding elements [${selector}] for count check:`, e);
                return false; // 查询出错，视为条件不满足
            }
        });
    }

    /** 等待元素数量大于指定值 */
    function waitElementCountGtHandler(params) {
        return waitElementCountHandler(params, (length, targetCount) => length > targetCount);
    }

    /** 等待元素数量小于指定值 */
    function waitElementCountLtHandler(params) {
        return waitElementCountHandler(params, (length, targetCount) => length < targetCount);
    }

    /** 等待元素数量等于指定值 */
    function waitElementCountEqHandler(params) {
        return waitElementCountHandler(params, (length, targetCount) => length === targetCount);
    }


    /** 等待元素触发特定事件 */
    function waitElementEventHandler(params) {
        const selector = params.selector;
        const eventName = params.content;
        if (!selector || typeof eventName !== 'string' || eventName === '') {
            return Promise.resolve(false);
        }

        return new Promise(async (resolve) => {
            const startTime = Date.now();
            const totalTimeout = params.timeout;

            // 1. 等待元素存在
            const elementExists = await waitElementExistsHandler({ ...params, timeout: totalTimeout });
            if (!elementExists) {
                resolve(false); // 元素未在指定时间内出现
                return;
            }

            // 计算剩余可用时间
            const elapsedTime = Date.now() - startTime;
            const remainingTimeout = Math.max(1, totalTimeout - elapsedTime);

            let element;
            let timeoutId = null;
            let eventListener = null;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                if (element && eventListener) {
                    element.removeEventListener(eventName, eventListener);
                }
            };

            // 2. 元素存在，尝试获取并添加监听器
            try {
                element = document.querySelector(selector);
                // **健壮性检查**：元素可能在存在检查后又消失了
                if (!element) {
                    console.warn(`Element [${selector}] disappeared before event listener could be attached.`);
                    resolve(false);
                    return;
                }

                // 设置事件等待的超时
                timeoutId = setTimeout(() => {
                    cleanup();
                    resolve(false); // 事件在超时时间内未触发
                }, remainingTimeout);

                // 定义事件处理器
                eventListener = () => {
                    cleanup();
                    resolve(true); // 事件已触发
                };

                // 添加事件监听器
                element.addEventListener(eventName, eventListener, { once: true }); // 使用 once 选项自动移除监听器

            } catch (e) {
                console.error(`Error setting up event listener for ${eventName} on [${selector}]:`, e);
                cleanup();
                resolve(false); // 设置监听器时出错
            }
        });
    }



    /// 主要代码处理
    console.log('doWait params:', params);
    const { selector, eventType, timeout, content, pullInterval } = params;
    const processor = WAIT_PROCESSORS[eventType];
    if (!processor) {
        return { success: false, error: `不支持的事件类型: ${eventType}` };
    }

    try {
        const resultPromiseOrValue = processor(params);

        // 检查 processor 是否返回了 Promise
        if (resultPromiseOrValue && typeof resultPromiseOrValue.then === 'function') {
            // 如果是 Promise，则等待其解决，并封装结果
            return resultPromiseOrValue.then(successValue => {
                console.log('doWait async result:', successValue);
                // 确保 processor 返回的是布尔值
                if (typeof successValue !== 'boolean') {
                    console.warn(`Async processor for ${eventType} resolved to non-boolean value:`, successValue);
                    return { success: false, error: `处理器异步返回了非布尔值: ${typeof successValue}` };
                }
                return { success: successValue, result: successValue };
            }).catch(error => {
                // 捕获 Promise 的 rejection
                console.error(`Error in async processor for ${eventType}:`, error);
                return { success: false, error: `处理器异步执行出错: ${error?.message || String(error)}` };
            });
        } else {
            // 如果直接返回布尔值或其他同步值
            const successValue = resultPromiseOrValue;
            console.log('doWait sync result:', successValue);
            // 确保 processor 返回的是布尔值
            if (typeof successValue !== 'boolean') {
                console.warn(`Sync processor for ${eventType} returned non-boolean value:`, successValue);
                return { success: false, error: `处理器同步返回了非布尔值: ${typeof successValue}` };
            }
            // 直接封装同步结果
            return { success: successValue, result: successValue };
        }
    } catch (error) {
        // 捕获 processor 函数本身可能抛出的同步错误
        console.error(`Error executing sync processor for ${eventType}:`, error);
        return { success: false, error: `执行处理器时同步出错: ${error.message}` };
    }
}

