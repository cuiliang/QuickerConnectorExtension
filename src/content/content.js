// 页面上下文脚本


// Listen for messages
// chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
//     // If the received message has the expected format...
//     if (msg.text === 'report_back') {
//         // Call the specified callback, passing
//         // the web-page's DOM content as argument
//         sendResponse(document.all[0].outerHTML);
//     }
// });

/**
 * 增加xpath解析支持
 * @param {*} STR_XPATH XPath
 */
function _x(STR_XPATH) {
    var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
    var xnodes = [];
    var xres;
    while (xres = xresult.iterateNext()) {
        xnodes.push(xres);
    }

    return xnodes;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('msg recved:', message);
    return true;
});


/**
 * 向Quicker发送通用消息，由后台脚本中转
 * @param {*}} msg 
 */
function sendToQuicker(msg) {
    chrome.runtime.sendMessage(
        {
            cmd: 'send_to_quicker',
            data: msg
        }, (respones) => {

        });
}

/**
 * 向Quicker发送响应消息
 * @param {bool} isSuccess 
 * @param {string} message 
 * @param {*} data 
 * @param {number} replyTo 
 */
function sendReplyToQuicker(isSuccess, message, data, replyTo) {

	//;console.log('sending message,isSuccess:', isSuccess, 'replyTo:', replyTo, 'message:', message, 'data:', data)

	// 如果返回的结果是简单类型，将其封装在对象中
	if (data) {
		if (typeof data !== "object") {
			console.log('warpping data in object.', data);
			data = {
				data: data
			};
		}
	}

	var msg = {
		"messageType": 3,
		"isSuccess": isSuccess,
		"replyTo": replyTo,
		"message": message,
		"data": data
	};
	console.log('sending message to quicker:', msg);

	// 发送结果
	sendToQuicker(msg);
}