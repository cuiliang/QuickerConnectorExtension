import { sendReplyToQuicker } from "./connection.js";

/**
 * 因为MV3中无法执行eval.call，因此需要使用新的方式执行预定义的后台脚本。
 * 每个命令包含：
 * - Command: 命令名称
 * - CommandParams: 命令参数
 * 
 * 每个命令Handler的参数为：
 * - commandParams: 命令参数
 * - msg: 消息对象
 */


/**
 * 执行后台命令
 * @param {object} msg 消息对象
 */
export async function runBackgroundCommand(msg) {
  const command = msg.data.command;
  const params = msg.data.commandParams;

  
  console.log('runBackgroundCommand', command, params);

  const handler = BG_COMMAND_HANDLERS[command];
  if (!handler) {
    console.error('Unknown command:', command);
    sendReplyToQuicker(false, 'Unknown background command：' + command, null, msg.serial);
    return;
  }

  try{
     let result = await handler(params, msg);
     sendReplyToQuicker(true, 'ok', result, msg.serial);
  }
  catch(e){
    console.error('Error executing background command:', msg, e);
    sendReplyToQuicker(false, e.message, e, msg.serial);
  }
}


/**
 * 后台命令和处理函数的映射 
 */
const BG_COMMAND_HANDLERS = {
  'qk_open_url': qk_open_url,
  'qk_get_tabs': qk_get_tabs,
  'qk_show_tab': qk_show_tab,
  'qk_get_bookmarks': qk_get_bookmarks,
  'qk_query_history': qk_query_history,
  'qk_delete_bookmark': qk_delete_bookmark,
}

//////////////////////////////////////////////////command handlers/////////////////////////////////////////////////////////////////////

/**
 * 打开URL，并激活标签页或所在的窗口。用于搜索框打开网址。
 * @param {object} commandParams 命令参数
 * @param {object} msg 消息对象
 */
async function qk_open_url(commandParams, msg) {
  const url = commandParams.url;

  try {
    const tab = await chrome.tabs.create({
      url: url,
      active: true
    });
    
    if (!tab) {
      // 可能没有活动窗口
      await chrome.windows.create({url: url, focused: true});
    } else {
      await chrome.windows.update(tab.windowId, {focused: true});
    }
  } catch (error) {
    console.error('打开URL时出错:', error);
    throw error;
  }
}


/**
 * 获取当前活动的标签页。用于标签页搜索功能。
 * @param {object} commandParams 命令参数
 * @param {object} msg 消息对象
 */
async function qk_get_tabs(commandParams, msg) {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs.map(tab => ({
      'tabId': tab.id,
      'url': tab.url,
      'title': tab.title,
      'favIconUrl': tab.favIconUrl,
      'status': tab.status,
      'incognito': tab.incognito,
      'index': tab.index,
      'windowId': tab.windowId
    }));
  } catch (error) {
    console.error('获取标签页时出错:', error);
    throw error;
  }
}


/**
 * 激活标签页及所在的窗口。
 * @param {object} commandParams 命令参数
 * @param {number} [commandParams.tabId] 目标标签页 ID (可选)
 * @param {number} [commandParams.windowId] 目标窗口 ID (可选)
 * @param {object} msg 消息对象  
 */
async function qk_show_tab(commandParams, msg) {
  const tabId = commandParams.tabId;
  const windowId = commandParams.windowId;

  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tabId, { active: true });
    console.log("标签页和窗口已成功激活");
  } catch (error) {
    console.error("激活失败:", error);
  }
}


/**
 * 获取书签。 用于书签搜索功能。
 * @param {object} commandParams 命令参数
 * @param {object} msg 消息对象
 */
async function qk_get_bookmarks(commandParams, msg) { 
  
  try {

    const rootNodes = await chrome.bookmarks.getTree();
    const result = [];

    // 使用递归方法遍历书签树，并筛选出包含 url 属性的节点
    function traverse(nodes) {
      nodes.forEach(node => {
        // 只处理包含 URL 的节点，代表具体的网址书签
        if (node.url) {          
          result.push({
            id: node.id,
            title: node.title,
            url: node.url,
            dateLastUsed: node.dateLastUsed || 0
          });
        }
        // 如果节点有子节点，则继续递归
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    }
  
    traverse(rootNodes);
    return result;
  } catch (error) {
    console.error('获取书签失败', error);
    throw error;
  }
}


/**
 * 查询历史记录。用于历史记录搜索功能。
 * @param {object} commandParams 命令参数，对应于 chrome.history.search 的query参数。
 * @param {object} msg 消息对象
 */
async function qk_query_history(commandParams, msg) {
  try {
    const result = await chrome.history.search(commandParams);
    return result;
  } catch (error) {
    console.error('查询历史记录失败', error);
    throw error;
  }
}

/**
 * 删除书签。
 * @param {object} commandParams 命令参数
 * @param {string} commandParams.id 书签ID
 * @param {string} commandParams.url 书签URL
 * @param {object} msg 消息对象
 */
async function qk_delete_bookmark(commandParams, msg) {
  try {
    const { id, url } = commandParams;
    
    if (!id) {
      throw new Error("书签ID不能为空");
    }
    
    // 获取书签信息
    const bookmarkNode = await chrome.bookmarks.get(id);
    
    if (!bookmarkNode || bookmarkNode.length === 0) {
      throw new Error(`找不到ID为 ${id} 的书签`);
    }
    
    // 检查URL是否匹配
    if (url && bookmarkNode[0].url !== url) {
      throw new Error("网址不匹配");
    }
    
    
    // 删除书签
    await chrome.bookmarks.remove(id);
    
    return { success: true, message: "书签已删除" };
  } catch (error) {
    console.error('删除书签失败:' + error.message, error);
    throw error;
  }
}