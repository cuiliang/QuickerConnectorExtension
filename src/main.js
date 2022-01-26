/**
 * 本插件用于连接Quicker软件。
 * 网址：https://getquicker.net
 * 反馈网址：https://github.com/cuiliang/Quicker
 */

const host = "com.getquicker.chromeagent";
console.log("Quicker Chrome Connector starting...");

// to support firefox
chrome = chrome || _browser;

var manifest = chrome.runtime.getManifest();

// 与浏览器的连接端口
var _port = null;
var _version = manifest.version;	// 扩展版本
var _browser = getBrowserName();	// 浏览器名称



var _isHostConnected = false;		// 是否连接到MessageHost
var _isQuickerConnected = false;		// 是否连接到Quicker
var _quickerVersion = "";			// Quicker版本号
var _hostVersion = "";				// MessageHost版本号


// 消息类型
const MSG_UPDATE_QUICKER_STATE = 11;  	// 更新Quicker的连接状态

// 更新显示为未连接状态
updateConnectionState(false, false);

// 开始连接
connect();


chrome.runtime.onStartup.addListener(function () {
	if (_port == null) {
		console.log('runtime on startup. connect()...');
		connect();
	}
});

/**
 * 插件安装或更新事件：
 * 在每个tab上安装客户端脚本？
 */
chrome.runtime.onInstalled.addListener(function (details) {
	console.log('plugin installed or updated:' + details.reason);

	// 根据是安装还是更新做操作
	// if (details.reason == "install") {
	// } else if(details.reason == "update") {
	// }

	// 将客户端脚本更新到所有已打开的标签页上
	installToExistingTabs();
});


/**
 * 连接到Native Message Host(QuickerAgent.exe)
 */
function connect() {

	// clean up old connection
	if (_port !== null && _port !== undefined) {
		removePortListener();
	}

	// ? 是否有可能端口
	if (_port === null || _port === undefined) {
		try {
			console.log("Connecting to " + host);
			// 连接到QuickerAgent
			_port = chrome.runtime.connectNative(host);
			console.log('connected to host');

			updateConnectionState(true, false);
		} catch (e) {
			console.error(e);
			_port = null;
			updateConnectionState(false, false);
			return;
		}
	}


	// 收到Quicker消息
	_port.onMessage.addListener(OnPortMessage);
	// 关闭插件等情况下，需要将port设置为null，否则QuickerAgent.exe不会退出
	_port.onDisconnect.addListener(OnPortDisconnect);

	if (chrome.runtime.lastError) {
		console.warn("Error setup port: " + chrome.runtime.lastError.message);
		_port = null;
		return;
	} else {
		console.log("Connected to native port");
	}

	// setup
	installToExistingTabs();


	// 发送Hello消息，报告浏览器类型和版本
	try {
		_port.postMessage({
			replyTo: -1,
			message: "Hello!",
			browser: _browser,
			version: _version,
			isSuccess: true
		});

	} catch (e) {
		console.error(e);
		_port = null;
	}
}

/**
 * 去除监听事件
 */
function removePortListener() {
	try {
		if (_port) {
			_port.onMessage.removeListener(OnPortMessage);
			_port.onDisconnect.removeListener(OnPortDisconnect);
		}
	}
	catch (e) {
		console.warn(e);
	}
}

/**
 * 端口断开
 * @param {*} message 
 */
function OnPortDisconnect(message) {
	console.log("Port Disconnected");

	removePortListener();
	_port = null;

	updateConnectionState(false, false);

	if (chrome.runtime.lastError) {
		var errMsg = chrome.runtime.lastError.message;
		console.warn("Disconnected reason: " + errMsg);
		var retryTime = 3000;
		if (errMsg.includes('host not found')) {
			retryTime = 10000;
		}

		_port = null;
		setTimeout(function () {
			connect();
		}, retryTime);
		return;
	} else {
		console.log("Disconnected from native port");
	}


}

/**
 * 端口收到消息的处理
 * @param {*} msg 
 * 消息格式：
 * 	 	serial: 消息序号，响应时在replyTo中返回，以便于pc端进行消息对应
 * 		cmd: 命令
 */
function OnPortMessage(msg) {
	console.log("Received msg:", msg.serial, msg);

	if (_port == null) {
		console.warn("OnPortMessage: port is null!");
		console.log(msg);
		return;
	}
	if (msg === null || msg === undefined) {
		console.warn("OnPortMessage: message is null!");
		return;
	}

	//sendReplyToQuicker(true, "success", { tabId: 1 });

	processQuickerCmd(msg);
}


/**
 * 向Quicker发送响应消息
 * @param {*} isSuccess 操作是否成功
 * @param {*} message 	失败时，消息内容
 * @param {*} data 		成功时，返回的数据内容
 * @param {integer} replyTo   所回复的来源消息的编号
 */
function sendReplyToQuicker(isSuccess, message, data, replyTo) {

	console.log('sending message,isSuccess:', isSuccess, 'replyTo:', replyTo, 'message:', message, 'data:', data)

	// 如果返回的结果是简单类型，将其封装在对象中
	if (data) {
		if (typeof data !== "object") {
			console.log('warpping data in object.', data);
			data = {
				data: data
			};
		}
	}

	// 发送结果
	_port.postMessage({
		"isSuccess": isSuccess,
		"replyTo": replyTo,
		"message": message,
		"data": data,
		"version": _version,
		"browser": _browser
	});
}



/**
 * 处理Quicker命令
 * @param {*} msg 命令消息
 */
function processQuickerCmd(msg) {
	
	// 更新Quicker连接状态。消息类型《UpdateQuickerConnectionStateData》
	if (msg.messageType === MSG_UPDATE_QUICKER_STATE){
		
		if (msg.data.isConnected){
			_browser = msg.data.browser;
			_quickerVersion = msg.data.quickerVersion;
			_hostVersion = msg.data.hostVersion;
		}

		updateConnectionState(true, msg.data.isConnected);
		
		return;
	}

	try {
		switch (msg.cmd) {
			case "OpenUrl":
				openUrl(msg);
				break;
			case "GetTabInfo":
				getTabInfo(msg);
				break;
			case "CloseTab":
				closeTab(msg);
				break;
			case "RunScript":
				runScript(msg);
				break;
			case "BackgroundScript":
				runBackgroundScript(msg);
				break;

			// since 0.5.0
			// cookies
			case "GetCookiesByUrl":
				getCookies(msg);
				break;
			case "RemoveCookiesByUrl":
				removeCookiesByUrl(msg);
				break;
			// bookmarks
			case "CreateBookmark":
				createBookmark(msg);
				break;
			case "GetBookmarks":
				getBookmarks(msg);
				break;
			case "SearchBookmarks":
				searchBookmarks(msg);
				break;
			// browsingData
			case "RemoveBrowsingData":
				removeBrowsingData(msg);
				break;
			// topSites
			case "GetTopSites":
				getTopSites(msg);
				break;
			// downloads
			case "DownloadFile":
				downloadFile(msg);
				break;
			// history
			case "DeleteAllHistory":
				deleteAllHistory(msg);
				break;
			// 
			case "SaveAsMHTML":
				saveAsMHTML(msg);
				break;

			// sessions
			case "GetRecentlyClosed":
				getRecentlyClosed(msg);
				break;
			case "RestoreRecentClosedSession":
				restoreRecentClosedSession(msg);
				break;
			// management
			case "ManagementGetAll":
				managementGetAll(msg);
				break;
			// send
			case "SendDebuggerCommand":
				sendDebuggerCommand(msg);
				break;
			case "CaptureFullPage":
				captureFullPage(msg);
				break;
			default:
				console.error("Unknown command:" + msg.cmd);
				sendReplyToQuicker(false, "Unknown command:" + msg.cmd, {}, msg.serial);
				break;

		}
	} catch (err) {
		console.error(err);
		sendReplyToQuicker(false, err.message, err, msg.serial);
	}



}

/**
 *  打开网址
 * @param {data:{url,waitLoad}} msg 
 * 
			//命令消息
			var msg = new ChromeCommandMessage()
			{
				Cmd = "OpenUrl",
				WaitComplete = waitLoad,
				TimeoutMs = (int)timeoutMs,
				Data = new
				{
					Url = url,
					WindowId = window,
					WindowInfo = jWindowInfo
				}
			};
 */
function openUrl(msg) {

	var waitLoad = msg.waitComplete;
	var timeoutMs = msg.timeoutMs;
	var url = msg.data.url;

	// 新建窗口
	if (msg.data.windowId === "New") {
		// create new window
		var windowInfo = Object.assign({}, msg.data.windowInfo, { url: url });
		chrome.windows.create(
			windowInfo,
			function (win) {
				console.log(win);
				sendReplyToQuicker(true, "new window created.", { windowId: win.id, tabId: win.tabs[0].id }, msg.serial);
			});

		return;
	}


	//
	// 创建标签. 使用“窗口信息” 为tabs.create指定额外参数（如是否活动）
	var createProperties = Object.assign({}, msg.data.windowInfo, { url: url });

	//  父窗口id
	if (msg.data.windowId) {
		if (msg.data.windowId !== "Current" && msg.data.windowId !== "") {
			createProperties.windowId = parseInt(msg.data.windowId); // 窗口ID
		}
	}

	// 创建标签页
	chrome.tabs.create(
		createProperties,
		function (tab) {
			sendReplyToQuicker(true, "new tab created.", { windowId: tab.windowId, tabId: tab.id }, msg.serial);
		});

}





/**
 * 获得标签信息
 * @param {*} msg 
 */
function getTabInfo(msg) {
	var tabId = msg.tabId;
	if (!tabId) {
		//未提供tab的时候，使用当前焦点tab
		chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
			if (tabs.length < 1) {
				sendReplyToQuicker(false, "Can not find active tab.", {}, msg.serial);
				return;
			}
			//console.log(tabs[0].url);
			var tab = tabs[0];
			console.log('GetTabInfo', tabId, tab);
			sendReplyToQuicker(true, "", tab, msg.serial);
		});

		return;
	}

	// 获得tab信息
	chrome.tabs.get(tabId, function (tab) {
		console.log('GetTabInfo', tabId, tab);
		sendReplyToQuicker(true, "", tab, msg.serial);
		return;
	});
}


/**
 * 关闭标签
 * @param {*} msg 
 */
function closeTab(msg) {
	var tabId = msg.tabId;
	if (!tabId) {
		//未提供tab的时候，使用当前焦点tab
		chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
			if (tabs.length < 1) {
				sendReplyToQuicker(false, "Can not find active tab.", {}, msg.serial);
				return;
			}
			//console.log(tabs[0].url);
			chrome.tabs.remove(tabs[0].id);
			sendReplyToQuicker(true, "", {}, msg.serial);
		});

		return;
	}

	// 获得tab信息
	chrome.tabs.remove(tabId);
	sendReplyToQuicker(true, "", {}, msg.serial);
}

/**
 * 使用Eval.Call执行后台脚本
 * @param {*} msg 
 */
function runBackgroundScript(msg) {
	// 脚本内容
	var script = msg.data.script;

	// 将消息序号写入全局变量
	window.qk_msg_serial = msg.serial;

	// 重置结果变量
	window.qk_bgmsg_result = undefined;

	try {
		eval.call(window, script);

		// 后台脚本中如果不含有返回结果的代码，则直接返回。否则由后台脚本返回结果。
		if (!script.includes("sendReplyToQuicker(")) {
			// 读取后台脚本为qk_bgmsg_result的复制
			var result = window.qk_bgmsg_result || {};

			sendReplyToQuicker(true, "ok", result, msg.serial);
		}

	} catch (e) {
		console.error('后台脚本错误：', e);
		sendReplyToQuicker(false, e.message, e, msg.serial);
	}
}

/**
 * 执行脚本
 * @param {*} msg 
 */
function runScript(msg) {
	var tabId = msg.tabId;
	var script = msg.data.script;

	console.log('running script on tab:', script);

	if (!tabId) {
		chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
			if (tabs.length < 1) {
				sendReplyToQuicker(false, "Can not find active tab.", {}, msg.serial);
				return;
			}

			if (IsChromeTabUrl(tabs[0].url)) {
				sendReplyToQuicker(false, "Can not run on this page.", {}, msg.serial)
			} else {
				_runScriptOnTab(tabs[0].id, script, msg);
			}

		});
	} else {
		_runScriptOnTab(tabId, script, msg);
	}
}

// 对指定tab执行脚本
function _runScriptOnTab(tabId, script, msg) {
	chrome.tabs.executeScript(tabId,
		{
			code: script,
			allFrames: true,
		},
		function (result) {
			console.log('run script result:', result);
			sendReplyToQuicker(true, "", result, msg.serial);
		})
}

/**
 * 在指定标签页上执行代码
 * @param {*} msg 
 * @param {*} func 参数：tabId, msg
 */
function executeOnTab(msg, func) {
	var tabId = msg.tabId;


	if (!tabId) {
		chrome.tabs.query({ lastFocusedWindow: true, active: true }, function (tabs) {
			if (tabs.length < 1) {
				sendReplyToQuicker(false, "Can not find active tab.", {}, msg.serial);
				return;
			}

			if (IsChromeTabUrl(tabs[0].url)) {
				sendReplyToQuicker(false, "Can not run on this page.", {}, msg.serial)
			} else {
				func(tabs[0].id, msg);
			}

		});
	} else {
		func(tabId, msg);
	}
}


////#region 其他API：0.5.0 解决提交问题

/**
 * 获取某个URL的cookie
 * @param { data: {url: string}} msg 
 */
function getCookies(msg) {
	chrome.cookies.getAll(msg.data, function (cookies) {
		sendReplyToQuicker(true, "", cookies, msg.serial);
	})
}

/**
 * 清除某个URL的所有cookie
 * @param {data:{url: string}} msg 
 */
function removeCookiesByUrl(msg) {
	chrome.cookies.getAll(msg.data, function (cookies) {
		cookies.forEach(cookie => {
			chrome.cookies.remove({ url: msg.data.url, name: cookie.name })
		})

		sendReplyToQuicker(true, "", cookies, msg.serial);
	});
}

/**
 * 创建Bookmark
 * @param {data:{parentId, index, title, url}} msg 
 */
function createBookmark(msg) {
	chrome.bookmarks.create(msg.data, function (result) {
		sendReplyToQuicker(true, "", result, msg.serial);
	})
}

/**
 * 获取整个收藏夹
 * @param {*} msg 
 */
function getBookmarks(msg) {
	chrome.bookmarks.getTree(function (result) {
		sendReplyToQuicker(true, "", result, msg.serial);
	})
}

/**
 * 搜索收藏夹
 * @param { data:{query: string}} msg 
 */
function searchBookmarks(msg) {
	chrome.bookmarks.search(msg.data.query, function (result) {
		sendReplyToQuicker(true, "", result, msg.serial);
	});
}

/**
 * 清除浏览历史
 * @param {data:{options, dataToRemove} } msg 
 */
function removeBrowsingData(msg) {
	chrome.browsingData.remove(data.options, data.dataToRemove, function () {
		sendReplyToQuicker(true, "", "", msg.serial);
	});
}

/**
 * 获取浏览器TopSites信息
 * @param {*} msg 
 */
function getTopSites(msg) {
	chrome.topSites.get(function (data) {
		sendReplyToQuicker(true, "", data, msg.serial);
	});
}

/**
 * 下载文件
 * @param {*} msg 
 */
function downloadFile(msg) {
	chrome.downloads.download(msg.data, function (downloadId) {
		sendReplyToQuicker(true, "", downloadId, msg.serial);
	});
}

/**
 * Deletes all items from the history.
 * @param {*} msg 
 */
function deleteAllHistory(msg) {
	chrome.history.deleteAll(msg.data, function (downloadId) {
		sendReplyToQuicker(true, "", downloadId, msg.serial);
	});
}

/**
 * 将网页保存为MHTML文件
 * @param {data:{tabId, fileName}} msg 
 */
function saveAsMHTML(msg) {

	executeOnTab(msg, function (tabId, theMsg) {
		chrome.pageCapture.saveAsMHTML({ tabId: tabId }, function (mhtmlData) {
			var url = URL.createObjectURL(mhtmlData);
			chrome.downloads.download({
				url: url,
				filename: msg.data.fileName
			});
		});

		sendReplyToQuicker(true, "", downloadId, msg.serial);
	})
}

/**
 * 恢复关闭的标签页
 * @param {*} msg 
 */
function restoreRecentClosedSession(msg) {
	chrome.sessions.restore(null, function (session) {
		sendReplyToQuicker(true, "", session, msg.serial);
	});
}

/**
 * 获得最近关闭的标签页
 * @param {*} msg 
 */
function getRecentlyClosed(msg) {
	chrome.sessions.getRecentlyClosed({ maxResults: msg.data.maxResults }, function (sessions) {
		sendReplyToQuicker(true, "", sessions, msg.serial);
	});
}

/**
 * 获得所有已安装扩展的信息
 * @param {*} msg 
 */
function managementGetAll(msg) {
	chrome.management.getAll(function (result) {
		sendReplyToQuicker(true, "", result, msg.serial);
	});
}

/**
 * 执行调试命令
 * @param {*} msg 
 */
function sendDebuggerCommand(msg) {
	chrome.debugger.attach(msg.data.target, "0.1", function () {
		chrome.debugger.sendCommand(msg.data.target, msg.data.method, msg.data.commandParams, function (result) {

			console.log('debugger result:', result);

			if (msg.data.callbackScript) {
				eval()
			}

			chrome.debugger.detach(msg.data.target);
		});
	})

	sendReplyToQuicker(true, "", "", msg.serial);
}

/**
 * 截屏整个页面
 * code from : https://stackoverflow.com/q/64343246/3335415
 * @param {*} msg 
 */
function captureFullPage(msg) {

	function captureScreenshot(tabId) {
		console.log(`{page}: captureScreenshot: status=aboutTo, tabId=${tabId}`);

		chrome.debugger.sendCommand(
			{ tabId: tabId },
			"Page.captureScreenshot",
			{
				format: "jpeg",
				quality: 60,
				fromSurface: false,
			},
			(response) => {
				if (chrome.runtime.lastError) {
					console.log(`{back}: captureScreenshot: status=failed, tabId=${tabId}`);
				} else {
					var dataType = typeof response.data;
					console.log(
						`{back}: captureScreenshot: status=success, tabId=${tabId}, dataType=${dataType}`
					);
					let base_64_data = "data:image/jpg;base64," + response.data;
					setTimeout(() => {
						clearDeviceMetricsOverride(tabId, base_64_data);
					}, 500);
				}
			}
		);

		console.log(`{page}: captureScreenshot: status=commandSent, tabId=${tabId}`);
	}

	//---------------------------------------------------------------------------
	function setDeviceMetricsOverride(tabId, height, width) {
		chrome.debugger.sendCommand(
			{
				tabId: tabId,
			},
			"Emulation.setDeviceMetricsOverride",
			{ height: height, width: width, deviceScaleFactor: 1, mobile: false },
			function () {
				setTimeout(() => {
					captureScreenshot(tabId);
				}, 500);
			}
		);
	}


	//---------------------------------------------------------------------------

	function getLayoutMetrics(tabId) {
		chrome.debugger.sendCommand(
			{
				tabId: tabId,
			},
			"Page.getLayoutMetrics",
			{},
			function (object) {
				console.log("---- get layout w: " + object.contentSize.width);
				console.log("---- get layout h: " + object.contentSize.height);
				const { height, width } = object.contentSize;
				setDeviceMetricsOverride(tabId, height, width);
			}
		);
	}

	//---------------------------------------------------------------------------

	function setColorlessBackground(tabId) {
		console.log(`{back}: setColorlessBackground: status=aboutTo, tabId=${tabId}`);

		chrome.debugger.sendCommand(
			{ tabId: tabId },
			"Emulation.setDefaultBackgroundColorOverride",
			{ color: { r: 0, g: 0, b: 0, a: 0 } },
			function () {
				console.log(
					`{back}: setColorlessBackground: status=enabled, tabId=${tabId}`
				);
				getLayoutMetrics(tabId);
			}
		);

		console.log(
			`{back}: setColorlessBackground: status=commandSent, tabId=${tabId}`
		);
	}

	//---------------------------------------------------------------------------

	function enableDTPage(tabId) {
		console.log(`{back}: enableDTPage: status=aboutTo, tabId=${tabId}`);

		chrome.debugger.sendCommand({ tabId: tabId }, "Page.enable", {}, function () {
			console.log(`{back}: enableDTPage: status=enabled, tabId=${tabId}`);
			setColorlessBackground(tabId);
		});

		console.log(`{back}: enableDTPage: status=commandSent, tabId=${tabId}`);
	}

	function clearDeviceMetricsOverride(tabId, base_64_data) {
		chrome.debugger.sendCommand(
			{
				tabId: tabId,
			},
			"Emulation.clearDeviceMetricsOverride",
			function () {
				postData(base_64_data, tabId);
			}
		);
	}

	//---------------------------------------------------------------------------

	function attachToDebugger(tabId) {
		try {

			chrome.debugger.attach({ tabId: tabId }, "1.0", () => {
				if (chrome.runtime.lastError) {
					console.log(
						`{back}: debugger attach failed: error=${chrome.runtime.lastError.message}`
					);
				} else {
					console.log(`{back}: debugger attach success: tabId=${tabId}`);
					enableDTPage(tabId);
				}
			});

		} catch { }
	}

	//
	// main code

	executeOnTab(msg.tabId, function (tabId, theMsg) {
		attachToDebugger(tabId);

		sendReplyToQuicker(true, "", "", msg.serial);
	});
}

////#endregion


/**
 * 将脚本安装到当前已经打开的标签页中
 */
function installToExistingTabs() {

	console.log('installing script into tabs.')

	var scripts = manifest.content_scripts[0].js;


	runScriptOnAllTabs(function (tab) {
		scripts.forEach(script => {
			chrome.tabs.executeScript(tab.id, { file: script });
		});
	});
}

/**
 * call function on each open tab
 * 在每个标签上执行代码
 * @param {tab: Tabs.Tab} func function that should be called on each tab. 
 */
function runScriptOnAllTabs(func) {
	chrome.windows.getAll({
		populate: true
	}, function (windows) {
		windows.forEach(win => {
			win.tabs.forEach(tab => {
				if (!IsChromeTabUrl(tab.url)) {
					func(tab);
				}
			});
		});

	});
}

/**
 * 更新连接状态
 * @param {*} isConnected 是否连接
 */
function updateConnectionState(hostConnected, quickerConnected) {
	_isHostConnected = hostConnected;
	_isQuickerConnected = quickerConnected;

	updateUi();
}

/**
 * 更新popup窗口和图标
 */
function updateUi() {
	var views = chrome.extension.getViews({
		type: "popup"
	});

	

	for (var i = 0; i < views.length; i++) {
		views[i].document.getElementById('msgHostConnection').innerHTML = 
			_isHostConnected ? `<span class='success'>已连接 <span class='version'>${_hostVersion}</span></span>`
				: "<span class='error' title='Quicker或消息代理尚未安装'>未连接</span>";

		views[i].document.getElementById('quickerConnection').innerHTML = 
			_isQuickerConnected ? `<span class='success'>已连接 <span class='version'>${_quickerVersion}</span></span>`
			: "<span class='error' title='Quicker未启动或版本过旧'>未连接</span>";


		views[i].document.getElementById('browser').innerText = _browser;
		views[i].document.getElementById('extVersion').innerHTML = _version;
	}

	if (!_isHostConnected) {
		chrome.browserAction.setBadgeText({ text: "×" });
		chrome.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
	} else if(!_isQuickerConnected){
		chrome.browserAction.setBadgeText({ text: "×" });
		chrome.browserAction.setBadgeBackgroundColor({ color: 'rgb(255, 174, 0)' });	
	}
	else {
		
		chrome.browserAction.setBadgeText({ text: '' });
	}
}

/**
 * 监听popup窗口的消息
 */
chrome.runtime.onMessage.addListener(function (messageFromContentOrPopup, sender, sendResponse) {
	console.log('received message:', messageFromContentOrPopup);
	if (messageFromContentOrPopup.cmd == "update_ui") {
		updateUi();

		sendResponse();
	}

})






//--------------------------------- 辅助 函数-------------------------------------------//

/**
 * 是否在chrome自身的窗口上（这时候不能执行脚本）
 * @param {*} url 
 */
function IsChromeTabUrl(url) {
	if (url
		&& (url.indexOf("chrome") === 0
			|| url.indexOf("https://chrome.google.com/") === 0)
	) {
		return true;
	}
	return false;
}

/**
 * 获得浏览器名称
 */
function getBrowserName() {
	// code from https://stackoverflow.com/a/9851769/3335415
	// Opera 8.0+
	var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

	// Firefox 1.0+
	var isFirefox = navigator.userAgent.indexOf("Firefox") > -1;// typeof InstallTrigger !== 'undefined';

	// Safari 3.0+ "[object HTMLElementConstructor]" 
	var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

	// Internet Explorer 6-11
	var isIE = /*@cc_on!@*/false || !!document.documentMode;

	// Edge 20+
	var isEdge = !isIE && !!window.StyleMedia;

	// Chrome 1 - 79
	var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

	// Edge (based on chromium) detection
	var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);

	// Blink engine detection
	var isBlink = (isChrome || isOpera) && !!window.CSS;

	// if (isBlink){
	// 	return "blink";
	// }
	if (isFirefox) {
		return "firefox";
	}
	if (isEdgeChromium) {
		return "msedge";
	}
	if (isChrome) {
		return "chrome";
	}
	if (isEdge) {
		return "edge";
	}
	if (isIE) {
		return "ie";
	}

	if (isOpera) {
		return "opera";
	}
	if (isSafari) {
		return "safari";
	}

	return "unknown";
}

