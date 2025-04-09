import { sendMessageToQuicker } from './connection.js';
import { getBrowserName } from './utils.js';

/**
 * 处理用户脚本消息
 */


// LOGGING based on if in dev mode
const IS_DEV_MODE = !('update_url' in chrome.runtime.getManifest());
function _log(...args) {
    if (IS_DEV_MODE) {
        console.log('[UserScript Handler]', ...args);
    }
}

/**
 * 处理用户脚本消息
 * @param {*} message 
 * @param {*} sender 
 * @param {*} sendResponse 
 */
function handleUserScriptMessage(message, sender, sendResponse) {
    _log('Received userScriptReply:', message);

    switch(message.cmd){
        case 'send_to_quicker':
            //sendToQuicker(message.data);
            {
                // // 转发消息给Quicker
                // const manifest = chrome.runtime.getManifest();
                // const _version = manifest.version;
                // const _browser = getBrowserName(); // Use imported function
                //
                // const msg = Object.assign({}, {
                //     "messageType": 0,
                //     "isSuccess": true,
                //     "replyTo": 0,
                //     "message": '',
                //     "version": _version,
                //     "browser": _browser
                // }, message.data);
                //
                // sendMessageToQuicker(msg); // Use imported function

                sendMessageToQuicker(message.data);

                // Native messaging doesn't have a direct callback for success/failure here.
                // We respond immediately, assuming the message was posted to the host.
                sendResponse({ status: 'Message forwarded to Quicker' });
                
            }
            break;
        default:
            _log('Unknown command:', message.cmd);
            break;
    }
}

/**
 * Sets up listeners for messages and connections related to User Scripts.
 */
export function setupUserScriptHandlers() {
    _log('Setting up User Script message listeners...');

    chrome.userScripts.configureWorld({
        messaging: true
    });

   
    if (chrome.runtime.onUserScriptMessage) {
        _log('registering userScriptMessage listener.');
        chrome.runtime.onUserScriptMessage.addListener(handleUserScriptMessage);
    } else {
        _log('chrome.userScripts.onUserScriptMessage not available.');
    }


    _log('User Script message listeners set up.');
} 