import { sendReplyToQuicker } from "./connection.js";

// 引入所有API
import * as browsingData from "./api/browsingData.js";
import * as cookies from "./api/cookies.js";
import * as debugger_api from "./api/debugger.js";
import * as downloads from "./api/downloads.js";
import * as history from "./api/history.js";
import * as pageCapture from "./api/pageCapture.js";
import * as readingList from "./api/readingList.js";
import * as tabGroups from "./api/tabGroups.js";
import * as tabs from "./api/tabs.js";
import * as tts from "./api/tts.js";
import * as windows from "./api/windows.js";
import * as scripts from "./background-scripts.js";

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
  'qk_open_url'                    : qk_open_url,
  'qk_get_tabs'                    : qk_get_tabs,
  'qk_show_tab'                    : qk_show_tab,
  'qk_get_bookmarks'               : qk_get_bookmarks,
  'qk_query_history'               : qk_query_history,
  'qk_delete_bookmark'             : qk_delete_bookmark,
  
  // browsingData API
  'api_browsingData_remove'        : browsingData.remove,
  'api_browsingData_removeAppcache': browsingData.removeAppcache,
  'api_browsingData_removeCache'   : browsingData.removeCache,
  'api_browsingData_removeCookies' : browsingData.removeCookies,
  'api_browsingData_removeDownloads': browsingData.removeDownloads,
  'api_browsingData_removeFileSystems': browsingData.removeFileSystems,
  'api_browsingData_removeFormData': browsingData.removeFormData,
  'api_browsingData_removeHistory' : browsingData.removeHistory,
  'api_browsingData_removeIndexedDB': browsingData.removeIndexedDB,
  'api_browsingData_removeLocalStorage': browsingData.removeLocalStorage,
  'api_browsingData_removePasswords': browsingData.removePasswords,
  'api_browsingData_removePluginData': browsingData.removePluginData,
  'api_browsingData_removeServiceWorkers': browsingData.removeServiceWorkers,
  'api_browsingData_removeWebSQL'  : browsingData.removeWebSQL,
  'api_browsingData_settings'      : browsingData.settings,
  
  // cookies API
  'api_cookies_get'                : cookies.get,
  'api_cookies_getAll'             : cookies.getAll,
  'api_cookies_set'                : cookies.set,
  'api_cookies_remove'             : cookies.remove,
  'api_cookies_getAllCookieStores' : cookies.getAllCookieStores,
  
  // debugger API
  'api_debugger_attach'            : debugger_api.attach,
  'api_debugger_detach'            : debugger_api.detach,
  'api_debugger_sendCommand'       : debugger_api.sendCommand,
  'api_debugger_getTargets'        : debugger_api.getTargets,
  
  // downloads API
  'api_downloads_download'         : downloads.download,
  'api_downloads_search'           : downloads.search,
  'api_downloads_pause'            : downloads.pause,
  'api_downloads_resume'           : downloads.resume,
  'api_downloads_cancel'           : downloads.cancel,
  'api_downloads_erase'            : downloads.erase,
  'api_downloads_removeFile'       : downloads.removeFile,
  'api_downloads_open'             : downloads.open,
  'api_downloads_show'             : downloads.show,
  'api_downloads_showDefaultFolder': downloads.showDefaultFolder,
  'api_downloads_getFileIcon'      : downloads.getFileIcon,
  'api_downloads_setShelfEnabled'  : downloads.setShelfEnabled,
  
  // history API
  'api_history_search'             : history.search,
  'api_history_getVisits'          : history.getVisits,
  'api_history_addUrl'             : history.addUrl,
  'api_history_deleteUrl'          : history.deleteUrl,
  'api_history_deleteRange'        : history.deleteRange,
  'api_history_deleteAll'          : history.deleteAll,
  
  // pageCapture API
  'api_pageCapture_saveAsMHTML'    : pageCapture.saveAsMHTML,
  
  // readingList API
  'api_readingList_add'            : readingList.addEntry,
  'api_readingList_getEntries'     : readingList.query,
  'api_readingList_remove'         : readingList.removeEntry,
  'api_readingList_update'         : readingList.updateEntry,
  
  // tabGroups API
  'api_tabGroups_get'              : tabGroups.get,
  'api_tabGroups_update'           : tabGroups.update,
  'api_tabGroups_move'             : tabGroups.move,
  'api_tabGroups_query'            : tabGroups.query,
  
  // tabs API
  //'api_tabs_getSelected': tabs.getSelected,
  'api_tabs_captureVisibleTab' : tabs.captureVisibleTab,
  'api_tabs_create'            : tabs.create,
  'api_tabs_detectLanguage'    : tabs.detectLanguage,
  'api_tabs_discard'           : tabs.discard,
  'api_tabs_duplicate'         : tabs.duplicate,
  'api_tabs_get'               : tabs.get,
  'api_tabs_getCurrent'        : tabs.getCurrent,
  'api_tabs_getZoom'           : tabs.getZoom,
  'api_tabs_getZoomSettings'   : tabs.getZoomSettings,
  'api_tabs_goBack'            : tabs.goBack,
  'api_tabs_goForward'         : tabs.goForward,
  'api_tabs_group'             : tabs.group,
  'api_tabs_highlight'         : tabs.highlight,
  'api_tabs_move'              : tabs.move,
  'api_tabs_query'             : tabs.query,
  'api_tabs_reload'            : tabs.reload,
  'api_tabs_remove'            : tabs.remove,
  'api_tabs_sendMessage'       : tabs.sendMessage,
  'api_tabs_setZoom'           : tabs.setZoom,
  'api_tabs_setZoomSettings'   : tabs.setZoomSettings,
  'api_tabs_toggleMuteState'   : tabs.toggleMuteState,
  'api_tabs_ungroup'           : tabs.ungroup,
  'api_tabs_update'            : tabs.update,

  
  
  // tts API
  'api_tts_speak'           : tts.speak,
  'api_tts_stop'           : tts.stop,
  'api_tts_pause'          : tts.pause,
  'api_tts_resume'         : tts.resume,
  'api_tts_isSpeaking'     : tts.isSpeaking,
  'api_tts_getVoices'      : tts.getVoices,
  
  // windows API
  'api_windows_create'      : windows.create,
  'api_windows_get'         : windows.get,
  'api_windows_getAll'      : windows.getAll,
  'api_windows_getCurrent'  : windows.getCurrent,
  'api_windows_getLastFocused': windows.getLastFocused,
  'api_windows_remove'      : windows.remove,
  'api_windows_update'      : windows.update,

  // scripts API
  'scripts_closeOtherTabs'    : scripts.closeOtherTabs,
  'scripts_closeLeftTabs'     : scripts.closeLeftTabs,
  'scripts_closeRightTabs'    : scripts.closeRightTabs,
  'scripts_closeDuplicateTabs': scripts.closeDuplicateTabs,
  'scripts_switchToLeftTab'     : scripts.switchToLeftTab,
  'scripts_switchToRightTab'    : scripts.switchToRightTab,
  'scripts_switchToFirstTab'    : scripts.switchToFirstTab,
  'scripts_switchToLastTab'     : scripts.switchToLastTab,
  'scripts_moveTabToStart'      : scripts.moveTabToStart,
  'scripts_moveTabToEnd'        : scripts.moveTabToEnd,
  'scripts_moveTabRight'        : scripts.moveTabRight,
  'scripts_moveTabLeft'         : scripts.moveTabLeft,
  'scripts_toggleTabMute'       : scripts.toggleTabMute,
  'scripts_toggleTabPin'        : scripts.toggleTabPin,
  'scripts_pinCurrentTab'       : scripts.pinCurrentTab,
  'scripts_addBookmarkForCurrentTab'    : scripts.addBookmarkForCurrentTab,
  'scripts_removeBookmarkForCurrentTab' : scripts.removeBookmarkForCurrentTab,
  'scripts_openBookmarksManager'        : scripts.openBookmarksManager,
  'scripts_goToParentDirectory'         : scripts.goToParentDirectory,
  'scripts_scrollUp'            : scripts.scrollUp,
  'scripts_scrollDown'          : scripts.scrollDown,
  'scripts_scrollToTop'         : scripts.scrollToTop,
  'scripts_scrollToBottom'      : scripts.scrollToBottom,
  'scripts_scrollLeft'          : scripts.scrollLeft,
  'scripts_scrollRight'         : scripts.scrollRight,
  'scripts_reloadTab'           : scripts.reloadTab,
  'scripts_forceReloadTab'      : scripts.forceReloadTab,
  'scripts_reloadAllTabs'       : scripts.reloadAllTabs,
  'scripts_reopenClosedTab'     : scripts.reopenClosedTab,
  'scripts_createNewTab'        : scripts.createNewTab,
  'scripts_duplicateCurrentTab' : scripts.duplicateCurrentTab,
  'scripts_detachCurrentTab'    : scripts.detachCurrentTab,
  'scripts_createNewWindow'     : scripts.createNewWindow,
  'scripts_createNewIncognitoWindow' : scripts.createNewIncognitoWindow,
  'scripts_createNewWindowWithUrls'  : scripts.createNewWindowWithUrls,
  'scripts_closeOtherWindows'   : scripts.closeOtherWindows,
  'scripts_mergeAllWindows'     : scripts.mergeAllWindows,
  'scripts_closeLastFocusedWindow'   : scripts.closeLastFocusedWindow,
  'scripts_closeAllWindows'     : scripts.closeAllWindows,
  'scripts_toggleFullscreen'    : scripts.toggleFullscreen,
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