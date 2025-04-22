// src/userScripts/userScriptApi.js
// API for User Scripts to interact with the Quicker Connector extension.



// Basic logging (consider a more robust solution if needed)
function _log(...args) {
    console.log('[UserScriptAPI]', ...args); // Enable for debugging
}

_log('UserScriptAPI loaded');

/**
 * 向Quicker发送通用消息，由service worker中转
 * @param {*} msg 
 */
function sendToQuicker(msg) {
	chrome.runtime.sendMessage(
		{
			cmd: 'send_to_quicker',
			data: msg
		}, (respones) => {
            _log('sendToQuicker response:', respones);
		});
}


/**
 * 向Quicker发送响应消息 (User Script Version)
 * Sends a reply message to Quicker via the background service worker.
 *
 * @param {boolean} isSuccess Indicates if the operation was successful.
 * @param {string} message A descriptive message.
 * @param {*} data Additional data to send (will be wrapped if not an object).
 * @param {number} replyTo The ID of the message this reply is for.
 */
function sendReplyToQuicker(isSuccess, message, data, replyTo) {
    _log('Sending reply from user script -> isSuccess:', isSuccess, 'replyTo:', replyTo, 'message:', message, 'data:', data);

    // Ensure data is an object if it's a simple type
    let processedData = data;
    if (data && typeof data !== "object") {
        _log('Wrapping simple data in object for user script reply.', data);
        processedData = { data: data };
    }

    const messageToSend = {
            isSuccess: isSuccess,
            replyTo: replyTo,
            message: message,
            data: processedData
        };

    _log('sendReplyToQuicker from user script:', messageToSend);
    sendToQuicker(messageToSend);
}



// How this function becomes available to the user script depends on how
// chrome.userScripts.register is called. The user script registration
// logic needs to include this function's definition or make it accessible
// (e.g., by attaching it to the window object if running in the page context,
// though user scripts run in isolated worlds usually).
// Example of making it globally accessible (use with caution):
// window.QuickerConnector_sendReplyToQuicker = sendReplyToQuicker; 