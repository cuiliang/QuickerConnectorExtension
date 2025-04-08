import { sendMessageToQuicker } from './connection.js';
import { getBrowserName } from './utils.js';

// LOGGING based on if in dev mode
const IS_DEV_MODE = !('update_url' in chrome.runtime.getManifest());
function _log(...args) {
    if (IS_DEV_MODE) {
        console.log('[UserScript Handler]', ...args);
    }
}

function handleUserScriptMessage(message, sender, sendResponse) {
    _log('Received userScriptReply:', message);

    switch(message.cmd){
        case 'send_to_quicker':
            //sendToQuicker(message.data);
            {
                // 转发消息给Quicker
                const manifest = chrome.runtime.getManifest();
                const _version = manifest.version;
                const _browser = getBrowserName(); // Use imported function

                const msg = Object.assign({}, {
                    "messageType": 0,
                    "isSuccess": true,
                    "replyTo": 0,
                    "message": '',
                    "version": _version,
                    "browser": _browser
                }, message.data);

                sendMessageToQuicker(msg); // Use imported function
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

    // // Listener for general messages (including sendReplyToQuicker)
    // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //     // Check if the message is from a user script context (optional, but good practice)
    //     // User scripts usually don't have sender.tab or sender.id associated with the extension
    //     // Check if it's the specific type we defined
    //     if (message.type === 'userScriptReply') {
    //          // Ensure it's not coming from our own extension pages/content scripts
    //         if (!sender.id || sender.id !== chrome.runtime.id) {
    //              return handleUserScriptReply(message, sender, sendResponse);
    //         } else {
    //             _log('Ignoring userScriptReply message from own extension context:', sender);
    //         }
    //     }
    //     // Return true if you intend to send a response asynchronously, otherwise false or undefined.
    //     // Important for the message channel to stay open for sendResponse.
    //     // Return true here ONLY IF handleUserScriptReply needs to be async.
    //     // Since handleUserScriptReply is currently synchronous but calls sendResponse,
    //     // we return true from there.
    //     return false; // Let other listeners handle other message types
    // });

    // Listener specifically for chrome.userScripts.postMessage
    // Note: This API might be less common now with MV3's userScripts API changes.
    // Consider if chrome.runtime.sendMessage is sufficient.
    if (chrome.runtime.onUserScriptMessage) {
        _log('registering userScriptMessage listener.');
        chrome.runtime.onUserScriptMessage.addListener(handleUserScriptMessage);
    } else {
        _log('chrome.userScripts.onUserScriptMessage not available.');
    }


    // Listener for long-lived connections from user scripts (if needed)
    // chrome.runtime.onConnect.addListener((port) => {
    //     _log(`Connection established from: ${port.name}`, port);
    //     // You might check port.sender properties to identify user script connections
    //     if (port.name === 'quickerUserScriptConnection') { // Example name
    //         port.onMessage.addListener((msg) => {
    //             _log('Message received on user script port:', msg);
    //             // Handle messages received over the port
    //             // Example: Forward to Quicker or process
    //             // port.postMessage({ response: 'Received your message' });
    //         });

    //         port.onDisconnect.addListener(() => {
    //             _log(`Port ${port.name} disconnected.`);
    //             if (chrome.runtime.lastError) {
    //                 console.error('Port disconnect error:', chrome.runtime.lastError.message);
    //             }
    //         });
    //     } else {
    //          _log('Ignoring connection from port:', port.name);
    //     }
    // });

    _log('User Script message listeners set up.');
} 