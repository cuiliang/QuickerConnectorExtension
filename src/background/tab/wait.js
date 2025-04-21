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


