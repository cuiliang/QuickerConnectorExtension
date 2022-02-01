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
 * 向Quicker发送消息，由后台脚本中转
 * @param {*}} msg 
 */
function sendToQuicker(msg){
    chrome.runtime.sendMessage({cmd: 'send_to_quicker', data: msg}, (respones)=>{

    });
}