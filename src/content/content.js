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

function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}


/**
 * 通知按钮点击
 * @param {string} actionId 
 */
function notifyActionClick(actionId){
	chrome.runtime.sendMessage(
		{
			cmd: 'action_clicked',
			data: {
				actionId: actionId
			}
		});
}

/**
 * 拖动处理
 * @param {*} dragElement 被拖动的对象
 * @param {*} targetElement 移动的目标（父元素）
 */
function dragElement(dragElement, targetElement) {
	let offsetX = 0,
		offsetY = 0,
		startX = 0,
		startY = 0;


	// 悬浮按钮的其实位置
	let dragEleStartRect = null;
	// 鼠标开始拖动的起始位置
	//let originX = 0, originY = 0; 
	
	dragElement.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		targetElement.classList.add('dragging');
		targetElement.classList.remove('right');

		dragEleStartRect = dragElement.getBoundingClientRect();

		console.log('拖动：mousedown', targetElement.offsetWidth, dragElement.offsetWidth);
		

		e = e || window.event;
		e.preventDefault();
		startX = e.clientX;
		startY = e.clientY;

		// originX = e.clientX;
		// originY = e.clientY;

		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;

		
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		offsetX = startX - e.clientX;
		offsetY = startY - e.clientY;

		console.log('drag:', offsetX, offsetY);

		// startX = e.clientX;
		// startY = e.clientY;

		var rect = dragElement.getBoundingClientRect();

		targetElement.style.bottom = null;
		targetElement.style.right = null;
		targetElement.style.top = dragEleStartRect.top - offsetY + "px";
		targetElement.style.left = dragEleStartRect.left - offsetX + "px";
		
		
	}

	function closeDragElement() {
		
		document.onmouseup = null;
		document.onmousemove = null;

		// 保存
		var viewPortWidth = window.client;
		var viewPortHeight = window.innerHeight;

		// 根据位置调整类，并更新到其它标签页
		processButtonLocationChange(dragElement, targetElement, viewPortWidth, viewPortHeight);

		targetElement.classList.remove('dragging');
	}
}


/**
 * 拖动改变位置后的处理
 * @param {integer} left 拖动位置的左上角坐标
 * @param {*} top 拖动位置的左上角坐标
 * @param {*} viewWidth 窗口宽度
 * @param {*} viewHeight 窗口高度
 */
function processButtonLocationChange(dragElement, targetElement,  viewWidth, viewHeight){

	var viewWidth =  document.body.clientWidth;

	let currRect = dragElement.getBoundingClientRect();

	console.log('drag bounding:', dragElement.getBoundingClientRect(), ' target:', targetElement.getBoundingClientRect(), ' view width:', viewWidth);
	

	let top = currRect.top;
	let left = currRect.left;

	if( left > viewWidth * 0.8){
		console.log('adding class: right');
		targetElement.classList.add('right');
		targetElement.style.left = 'auto';
		let right = (viewWidth - currRect.right) + 'px';
		targetElement.style.right = right;
		console.log('set right:' + right);
		
	}else{
		console.log('removing class: right');
		targetElement.classList.remove('right');
	}
	
	if ((viewHeight - top) < 300){
		console.log('adding class: bottom');
		targetElement.classList.add('bottom');

		targetElement.style.top = 'auto';
		let bottom = (viewHeight - currRect.bottom - 4) + 'px';
		targetElement.style.bottom = bottom;
	}else{
		console.log('removing class: bottom');
		targetElement.classList.remove('bottom');
	}
}

function updateClassAfterButtonLocationChange(left, top, viewWidth, viewHeight){

}


/**
 * Quicker断开后，清除悬浮按钮
 */
function clearActions(){
	var menu = document.getElementById('_qk_menu');
	if(menu){
		menu.remove();
	}
}

/**
 * 显示动作按钮
 * @param {object[]} actions 
 */
function setupActions(actions, menuIcon, menuButtonBgColor){
	console.log('setup actions:', actions);
	
	var menu = document.getElementById('_qk_menu');
	if (!menu){
		menu = document.createElement("div");
		menu.id = '_qk_menu';
		document.body.append(menu);

		// menu.classList.add('bottom');
		// menu.classList.add('right');
		
	}else{
		// clear list
		while(menu.firstChild){
			menu.removeChild(menu.firstChild);
		}
	}
	

	// quicker button
	var quicker_button = document.createElement('div');
	quicker_button.className = 'quicker_button';

	if (menuButtonBgColor){
		quicker_button.style.backgroundColor = menuButtonBgColor;	
	}

	dragElement(quicker_button, menu);
	
	// quicker_button.onmousedown = function(event){
	// 	// stop button taken focus
	// 	event.preventDefault();
	// };


	menu.appendChild(quicker_button);

	if (menuIcon){
		var img = document.createElement('img');
		img.src = menuIcon;
		quicker_button.appendChild(img);
	}else{
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute('style', 'enable-background:new 0 0 32 32;');
		svg.setAttribute('viewBox', '0 0 32 32');
		svg.setAttribute('x', '0px');
		svg.setAttribute('y', '0px');
		// svg.setAttribute('width', '32px');
		// svg.setAttribute('height', '32px');
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	   
		var path1 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		path1.setAttribute('d', 'M5.8,29.5l8.4-13c0.2-0.2,0.1-0.6-0.1-0.7l-8.2-5.6c-0.3-0.2-0.3-0.6,0-0.8l10.8-8.8v0l6,6.5 c0.2,0.3,0.2,0.7-0.1,0.8l-3.3,1.5c-0.4,0.2-0.4,0.7-0.1,0.9l7.8,5.3c0.3,0.2,0.3,0.7,0,0.9L6.5,30.2C6,30.5,5.5,30,5.8,29.5z  M4.5,31.5');
		path1.setAttribute('fill', '#FFFFFF');
	
		svg.appendChild(path1);	
	   
		quicker_button.appendChild(svg);
	}
	


	// drop down content
	var dropdown_content = document.createElement('div');
	dropdown_content.className = 'dropdown-content';
	menu.appendChild(dropdown_content);


	// 为动作添加按钮
	actions.forEach(function(action){
		var button = document.createElement("button");
		button.className = 'qk_action_button';
		button.title = action.description;
		button.addEventListener('click', function(){
			// alert('action clicked:' + action.id);
			notifyActionClick(action.id);
		
		});

		// 防止影响焦点
		button.onmousedown = function(event){
			event.preventDefault();
		};

		var content_wrapper = document.createElement('div');
		content_wrapper.className = 'btn_content_wrapper';
		button.appendChild(content_wrapper);

		// icon
		if(action.icon && action.icon.startsWith('http'))
		{
			var icon = document.createElement('div');
			icon.className = 'qk_action_icon';
			content_wrapper.append(icon);
	
			var img = document.createElement('img');
			img.src = action.icon;
			img.className = 'icon_img';
			icon.append(img);
			
		}
		
		// label
		var label = document.createElement('div');
		label.className = 'qk_action_label';
		label.innerText = action.title;
		content_wrapper.append(label);
		dropdown_content.append(button);
	});
}


if (!inIframe()){

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		console.log('收到后台消息：', message);

		switch(message.cmd){
			case 'setup_actions':
				setupActions(message.actions, message.menuIcon, message.menuButtonBgColor);
				sendResponse();
				break;
			case 'clear_actions':
				clearActions();
				sendResponse();
				break;
		}
		return true;
	});

	/**
	 * 通知后台页面，Content脚本加载完成
	 */
	chrome.runtime.sendMessage(
		{
			cmd: 'content_loaded',
			data: null
		}, response => {});
}
