# Quicker Chrome Connector 后台模块文档

## 概述

Quicker Chrome Connector 的后台模块负责在浏览器扩展与 Quicker 桌面软件之间建立连接、处理消息通信、管理标签页、处理用户操作等核心功能。后台模块采用模块化设计，通过各个功能独立的 JavaScript 文件组织代码。

## 模块组成

### 1. main.js - 主模块

主模块是扩展的入口点，负责初始化全局状态、启动连接、设置事件监听等。

**主要功能：**
- 初始化浏览器信息和全局状态
- 启动与 Quicker 的连接
- 加载用户设置
- 设置各种事件监听器
- 处理扩展的安装和更新事件

**关键方法：**
- `reportUrlChange()`: 向 Quicker 报告网址变更
- `OnPortMessage()`: 处理来自 Quicker 的消息
- `onMessagePushActions()`: 处理推送动作消息
- `menuItemClicked()`: 处理右键菜单点击事件

### 2. connection.js - 连接管理

负责与 Quicker 桌面软件之间的连接建立、维护和重连机制。

**主要功能：**
- 建立与 Native Message Host (QuickerAgent.exe) 的连接
- 处理连接断开和重连
- 发送问候消息
- 管理消息传递端口

**关键方法：**
- `connect()`: 连接到 Native Message Host
- `sendHelloMessage()`: 发送问候消息，报告浏览器类型和版本
- `scheduleReconnect()`: 安排重连尝试
- `onPortDisconnect()`: 处理端口断开事件
- `notifyClearActions()`: 通知标签页清除动作
- `sendMessageToQuicker()`: 向 Quicker 发送消息

### 3. message-handler.js - 消息处理

处理来自 Quicker 的各种命令和消息请求。

**主要功能：**
- 处理 Quicker 发送的各种命令
- 处理连接状态变化
- 注册和管理右键菜单
- 处理动作推送

**关键方法：**
- `processQuickerCmd()`: 处理 Quicker 命令
- `onMsgQuickerStateChange()`: 处理 Quicker 连接状态变化
- `onMessageRegisterContextMenu()`: 注册右键菜单
- `menuItemClicked()`: 处理菜单点击
- `onMessagePushActions()`: 处理动作推送
- 各种命令处理函数：`openUrl()`, `getTabInfo()`, `closeTab()` 等

### 4. tabs.js - 标签页管理

管理浏览器标签页、注入脚本和设置动作按钮。

**主要功能：**
- 在标签页中安装和运行内容脚本
- 为标签页设置动作按钮
- 在标签页上执行脚本

**关键方法：**
- `installToExistingTabs()`: 将脚本安装到已打开的标签页
- `runScriptOnAllTabs()`: 在所有标签页上执行函数
- `setupActionsForAllTabs()`: 为所有标签页设置动作按钮
- `setupActionsForTab()`: 为单个标签页设置动作按钮
- `executeOnTab()`: 在指定标签页上执行函数
- `runScriptOnTab()`: 在标签页上运行脚本

### 5. messaging.js - 消息传递

处理消息传递和格式化，确保消息能正确地在扩展与 Quicker 之间传递。

**主要功能：**
- 向 Quicker 发送响应消息
- 标准化消息格式

**关键方法：**
- `sendReplyToQuicker()`: 向 Quicker 发送回复消息
- `reportUrlChange()`: 报告 URL 变更

### 6. ui.js - 用户界面管理

管理用户界面状态和更新。

**主要功能：**
- 更新连接状态
- 管理按钮位置
- 更新界面元素

**关键方法：**
- `updateConnectionState()`: 更新连接状态
- `updateUi()`: 更新用户界面
- `onButtonPositionChanged()`: 处理按钮位置变更
- `resetButtonPosition()`: 重置按钮位置

### 7. settings.js - 设置管理

管理用户设置和首选项。

**主要功能：**
- 加载和保存用户设置
- 处理设置变更

**关键方法：**
- `loadSettings()`: 加载用户设置
- `saveSettings()`: 保存用户设置

### 8. utils.js - 工具函数

提供各种实用工具函数。

**主要功能：**
- 浏览器检测
- URL 匹配
- 其他辅助功能

**关键方法：**
- `getBrowserName()`: 获取浏览器名称
- `isChromeTabUrl()`: 检查是否为 Chrome 内部标签页 URL
- `isUrlMatch()`: 检查 URL 是否匹配模式

### 9. api-functions.js - API 功能

提供对各种浏览器 API 的封装。

**主要功能：**
- 提供对书签、历史记录、Cookie 等浏览器 API 的访问
- 封装复杂的 API 调用

**关键方法：**
- 各种 API 功能封装函数

### 10. constants.js - 常量定义

定义全局使用的常量。

**主要内容：**
- 消息类型常量
- 默认按钮位置
- Native Message Host 名称
- 菜单 ID 常量

### 11. event-handlers.js - 事件处理

设置和管理各种浏览器事件。

**主要功能：**
- 设置报告功能
- 设置右键菜单监听
- 设置消息监听

**关键方法：**
- `setupReports()`: 设置报告功能
- `setupContextMenuListener()`: 设置右键菜单监听
- `setupMessageListener()`: 设置消息监听

## 工作流程

1. **启动流程**：
   - `main.js` 初始化全局状态
   - 调用 `connect()` 尝试连接到 Quicker
   - 加载用户设置
   - 设置事件监听器

2. **连接流程**：
   - `connection.js` 尝试连接到 Native Message Host
   - 连接成功后发送 Hello 消息
   - 连接失败或断开时会自动重连

3. **消息处理流程**：
   - 收到来自 Quicker 的消息时，通过 `processQuickerCmd()` 处理
   - 根据消息类型和命令分发到不同的处理函数

4. **标签页管理流程**：
   - 在新标签页加载完成时注入内容脚本
   - 根据 URL 匹配规则为标签页设置相应的动作按钮

5. **右键菜单流程**：
   - Quicker 发送菜单配置
   - 扩展注册右键菜单
   - 用户点击菜单项时发送消息给 Quicker

## 技术实现

1. **模块化设计**：使用 ES6 模块系统组织代码，每个文件负责特定功能。

2. **消息通信**：
   - 使用 `chrome.runtime.connectNative()` 与 Native Message Host 建立连接
   - 使用 `chrome.runtime.onMessage` 处理内部消息
   - 使用 `chrome.tabs.sendMessage()` 与内容脚本通信

3. **错误处理**：
   - 实现了完善的错误捕获和处理机制
   - 在连接断开时自动重连

4. **状态管理**：
   - 使用全局状态对象管理扩展状态
   - 实现了状态更新和UI同步机制

## 注意事项

1. 在修改代码时，需要保持模块间的依赖关系，避免循环依赖。

2. 添加新功能时，应当遵循现有的模块划分和命名规范。

3. 涉及与 Quicker 通信的部分，需要确保消息格式符合约定。

4. 处理浏览器事件时，需要注意兼容性和错误处理。 