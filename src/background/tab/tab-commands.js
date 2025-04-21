'use strict';

import { getTargetTab } from '../utils.js';
import { sendReplyToQuicker } from '../connection.js';
import { pickElementSelectorHandler } from "./pick-element-selector-handler.js";
import { triggerEventHandler } from "./trigger-event-handler.js";
import { updateElementInfoHandler } from "./update-element-info.js";
import { getElementInfoHandler } from "./get-element-info.js";

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
    sendReplyToQuicker(false, 'Unknown tab command：' + command, null, msg.serial);
    return;
  }

  //
  // execute
  try {
    // handler应该返回PC端最终需要的结果
    var result = await handler(target, command, params, msg);

    console.log('runTabCommand result:', result);
    
    sendReplyToQuicker(true, 'ok', result, msg.serial);

  }
  catch (e) {
    console.error('Error executing tab command:', msg, e);
    sendReplyToQuicker(false, e.message, e, msg.serial);
  }
}


/**
 * 后台命令和处理函数的映射 
 */
const TAB_COMMAND_HANDLERS = {
  'pick_element_selector': pickElementSelectorHandler,
  'get_element_info': getElementInfoHandler,
  'trigger_event': triggerEventHandler,
  'update_element_info': updateElementInfoHandler,
}




//#endregion


//#region 触发事件


//#endregion