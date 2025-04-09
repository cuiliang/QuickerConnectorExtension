# Popup/content script/user script <=> Service worker

## FROM Popup or content or userscript to service worker

using  chrome.runtime.sendMessage()

message structure:
```
{
    cmd: 'command text',
    data: {} //optional data
}
```

cmd:
- update-ui:  更新popup中显示的信息
- send_to_quicker: 发送消息给Quicker。 
- local_setting_changed: 通知后台脚本更新设置





# Service Worker <==> ChromeAgent

## Hello Message
当浏览器连接到ChromeAgent后，向ChromeAgent发送的第一个消息。
用于报告当前浏览器的名称和扩展版本。

```c#
public class HelloMessage
{
    public int ReplyTo { get; set; }
    public string Browser { get; set; }
    public string Version { get; set; }
}
```

## Quicker 向 ServiceWorker 发送的消息

在文件中处理接收到的消息。
- connection.js / onPortMessage 
- quicker-message-handler.js / processQuickerCmd

```csharp
// 向浏览器发送的指令消息
public class ChromeCommandMessage<T>
{
    public int Serial { get; set; } // 命令序号
    public int? ReplyTo { get; set; } // 响应哪条消息
    public int MessageType { get; set; } // 消息类型
    public string Cmd { get; set; } // 指令类型
    public int? TabId { get; set; } // 要操作的tabId
    public int TimeoutMs { get; set; } // 超时毫秒数
    public string Target { get; set; } // 要操作的目标控件id、element？
    public bool WaitComplete { get; set; } // 等待完成
    public T Data { get; set; } // 指令参数
}
```

其中，消息类型：
```c#
internal enum BrowserMessageType
{
    NA = 0,

    // MessageHost <=> Quicker
    BrowserInfo = 1,       //注册， 浏览器启动后注册MessageHost
    BrowserInfoResp = 2,   //注册响应

    // Quicker <=> MessageHost <=> Browser
    Command = 3,        //命令，请浏览器执行命令
    CommandResp = 4,    //命令响应，返回浏览器执行结果
    ReportActiveTabState = 5,   //报告状态，标签页网址、
    RegisterContextMenus = 6,   //注册右键菜单
    ContextMenuClick = 7,   //报告浏览器右键菜单点击


    CopyData = 9,         // 复制内容

    // MessageHost <=> Browser
    UpdateQuickerConnectionStatus = 11,

    PushActions = 21, // 向扩展推送动作列表
    ActionButtonClick = 22, // 动作按钮点击
    StartPicker = 23, // 启动选择器
}
```


