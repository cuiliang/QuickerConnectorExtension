// 本文档由AI自动生成，可能存在错误。

# Quicker Chrome Connector 后台模块文档

## 概述

Quicker Chrome Connector 的后台模块（Service Worker）负责在浏览器扩展与 Quicker 桌面软件之间建立连接、处理各种来源（Quicker、内容脚本、用户脚本、扩展内部）的消息通信、管理标签页、执行浏览器 API 操作、处理用户界面交互和设置等核心功能。后台模块采用模块化设计，通过各个功能独立的 JavaScript 文件组织代码。

## 模块组成

### 1. main.js - 主模块

主模块是扩展的入口点，负责初始化全局状态、启动与 Quicker 的连接、加载设置、设置核心事件监听器等。

**主要功能：**
- 初始化浏览器信息和全局状态
- 启动与 Quicker 的 Native Message Host 连接
- 加载用户设置
- 设置基础的浏览器事件监听（如安装、启动）
- 协调其他模块的初始化

**关键方法 (示例):**
- `initialize()`: 执行扩展的初始化逻辑，例如加载设置、建立连接等。
- `onInstalledHandler()`: 处理扩展首次安装或更新时的逻辑。
- `onStartupHandler()`: 处理浏览器启动时的逻辑。

### 2. connection.js - 连接管理

负责与 Quicker 桌面软件 (通过 Native Message Host `QuickerAgent.exe`) 之间的连接建立、维护和重连机制。

**主要功能：**
- 建立、断开与 Native Message Host 的连接
- 处理连接错误和自动重连逻辑
- 发送和接收 Native Message 消息
- 向 Quicker 发送初始握手信息（浏览器类型、版本）
- 管理连接状态

**关键方法 (示例):**
- `connect()`: 尝试建立与 Native Message Host 的连接。
- `disconnect()`: 主动断开与 Native Message Host 的连接。
- `sendMessageToQuicker()`: 向 Quicker (Native Message Host) 发送消息。
- `onPortMessage()`: 处理从 Native Message Host 端口接收到的消息。
- `onPortDisconnect()`: 处理 Native Message Host 端口断开连接的事件。
- `scheduleReconnect()`: 在连接断开后安排重连尝试。

### 3. quicker-message-handler.js - Quicker 消息处理

处理来自 Quicker (通过 Native Message Host) 的各种命令和消息请求。

**主要功能：**
- 解析并处理 Quicker 发送的各种命令 (如 `openUrl`, `getTabInfo`, `closeTab` 等)
- 处理 Quicker 连接状态变化通知
- 管理由 Quicker 请求注册的右键菜单
- 处理 Quicker 推送的动作

**关键方法 (示例):**
- `processQuickerCmd()`: 处理来自 Quicker 的单个命令消息。
- `handleQuickerStateChange()`: 处理 Quicker 发送的连接状态变化通知。
- `registerContextMenu()`: 根据 Quicker 的请求注册或更新右键菜单项。
- `handlePushActions()`: 处理 Quicker 推送的动作列表。
- `menuItemClicked()`: 处理右键菜单项的点击事件，并将信息转发给 Quicker。

**支持的命令列表：**
- 标签页命令：`OpenUrl`, `GetTabInfo`, `CloseTab`
- 脚本执行：`RunScript`, `BackgroundScript`, `BackgroundCommand`
- Cookie 管理：`GetCookiesByUrl`, `RemoveCookiesByUrl`
- 书签操作：`CreateBookmark`, `GetBookmarks`, `SearchBookmarks`
- 浏览数据：`RemoveBrowsingData`
- 浏览器功能：`GetTopSites`, `DownloadFile`, `DeleteAllHistory`, `SaveAsMHTML`
- 会话管理：`GetRecentlyClosed`, `RestoreRecentClosedSession`
- 扩展管理：`ManagementGetAll`
- 其他：`SendDebuggerCommand`, `CaptureFullPage`, `Speek`

### 4. extension-message-handler.js - 扩展内部消息处理

处理来自扩展其他部分（如内容脚本、弹出页面、选项页面）的消息。

**主要功能：**
- 监听并响应来自内容脚本的请求 (如获取数据、执行后台操作)
- 处理来自弹出页面或选项页面的交互请求
- 协调后台脚本与扩展其他部分的通信

**关键方法 (示例):**
- `handleExtensionMessage()`: 统一处理来自扩展其他部分（内容脚本、弹出页等）的消息。
- `processContentScriptRequest()`: 专门处理来自内容脚本的请求。

**支持的命令：**
- `update_ui`: 更新扩展 UI
- `local_setting_changed`: 处理设置变更
- `send_to_quicker`: 转发消息给 Quicker
- `action_clicked`: 处理动作点击
- `content_loaded`: 网页加载完成事件
- `button_pos_changed`: 处理按钮位置变更
- `reset_floater_position`: 重置浮动按钮位置
- `start_picker`: 启动选择器

### 5. userscript-message-handler.js - 用户脚本消息处理

专门处理来自已安装的用户脚本（通过 `externally_connectable` 清单配置）的消息。

**主要功能：**
- 监听并验证来自特定用户脚本的消息
- 处理用户脚本请求的后台操作或数据访问
- 确保与用户脚本通信的安全性

**关键方法:**
- `handleUserScriptMessage()`: 处理来自用户脚本的消息
- `setupUserScriptMessageHandlers()`: 设置用户脚本消息监听器
- 使用 `chrome.userScripts.configureWorld()` 设置消息传递

### 6. background-commands.js - 后台命令执行

实现预定义后台命令，替代 Manifest V3 中无法使用的 `eval.call` 方法。

**主要功能：**
- 提供可在 Manifest V3 中安全执行的后台命令
- 为不同类型的操作提供结构化的命令接口

**支持的命令：**
- `qk_open_url`: 打开 URL
- `qk_get_tabs`: 获取标签页信息
- `qk_show_tab`: 显示特定标签页
- `qk_get_bookmarks`: 获取书签
- `qk_query_history`: 查询历史记录
- `qk_delete_bookmark`: 删除书签


### 7. api-functions.js - API 功能封装

提供对各种浏览器 API (如 `chrome.tabs`, `chrome.windows`, `chrome.bookmarks`, `chrome.scripting` 等) 的封装和抽象。

**主要功能：**
- 封装常用的浏览器 API 调用，简化使用
- 提供更高级别的 API 功能组合
- 处理 API 调用中的权限检查和错误

**关键方法 (示例):**
- `getCurrentTab()`: 获取当前活动标签页的信息。
- `createBookmark()`: 创建书签。
- `executeScriptInTab()`: 在指定标签页中执行脚本。
- `getAllCookies()`: 获取指定域名的所有 Cookie。

### 8. tabs.js - 标签页管理

管理浏览器标签页、注入内容脚本、执行脚本以及与标签页相关的特定逻辑。

**主要功能：**
- 在符合条件的标签页中注入内容脚本
- 管理标签页相关的状态或数据
- 在特定标签页或所有标签页上执行脚本函数
- 处理标签页的创建、更新、移除事件

**关键方法 (示例):**
- `injectContentScriptIfNeeded()`: 检查并按需向标签页注入内容脚本。
- `executeScriptOnTab()`: 在单个指定标签页上执行脚本。
- `executeFunctionOnAllTabs()`: 在所有符合条件的标签页上执行某个函数。
- `onTabUpdatedListener()`: 监听并处理标签页更新事件。
- `onTabRemovedListener()`: 监听并处理标签页关闭事件。

### 9. event-handlers.js - 事件处理

集中设置和管理各种浏览器事件监听器 (除了 `main.js` 中设置的基础事件)。

**主要功能：**
- 设置标签页更新、窗口变化等事件的监听
- 设置右键菜单点击事件的监听
- 设置其他必要的浏览器事件监听器
- 将捕获到的事件分发给相应的处理模块

**关键方法 (示例):**
- `setupTabListeners()`: 设置与标签页相关的事件监听器。
- `setupWindowListeners()`: 设置与浏览器窗口相关的事件监听器。
- `setupContextMenuListener()`: 设置右键菜单事件监听器。
- `setupMessageListeners()`: 设置各种消息（内部、外部）监听器。

### 10. ui.js - 用户界面管理

管理与扩展 UI 相关（如图标、弹出窗口状态等）的逻辑。

**主要功能：**
- 根据连接状态、标签页状态等更新浏览器动作图标 (Action icon)
- 管理可能存在的弹出窗口的简单状态同步 (如果适用)
- 处理与后台相关的 UI 更新逻辑

**关键方法 (示例):**
- `updateActionIcon()`: 更新扩展在浏览器工具栏上的图标。
- `updateBadgeText()`: 更新扩展图标上的徽章文本（例如显示状态）。
- `setUiState()`: 根据内部状态统一更新 UI 元素。

### 11. settings.js - 设置管理

负责加载、保存和管理扩展的用户设置。

**主要功能：**
- 从 `chrome.storage` 加载用户设置
- 向 `chrome.storage` 保存用户设置
- 提供获取和更新设置的接口
- 处理设置变更事件 (如果需要实时响应)

**关键方法 (示例):**
- `loadSettings()`: 从 `chrome.storage` 加载扩展设置。
- `saveSettings()`: 将设置保存到 `chrome.storage`。
- `getSetting()`: 获取单个设置项的值。
- `onSettingsChanged()`: 监听并处理设置的变更。

### 12. utils.js - 工具函数

提供各种通用的辅助函数。

**主要功能：**
- 浏览器类型检测
- URL 匹配和验证
- 日志记录封装
- 其他可在多个模块中复用的公共函数

**关键方法 (示例):**
- `getBrowserInfo()`: 获取当前浏览器的名称和版本信息。
- `isUrlMatch()`: 检查 URL 是否匹配指定的模式。
- `logError()`: 封装错误日志记录逻辑。
- `debounce()`: 提供函数防抖功能。

### 13. constants.js - 常量定义

定义全局使用的常量、枚举或配置值。

**主要内容：**
- 消息类型标识符
- Native Message Host 名称 (`com.getquicker.chromeagent`)
- 右键菜单 ID 前缀
- 默认设置值
- 其他硬编码的字符串或数值常量

## 工作流程 (大致)

1.  **启动流程**:
    *   浏览器启动或扩展安装/更新时，`main.js` 作为 Service Worker 入口被执行。
    *   `main.js` 初始化全局状态，加载 `settings.js` 获取设置。
    *   `main.js` 调用 `connection.js` 的 `connect()` 尝试连接 Native Message Host。
    *   `main.js` 或 `event-handlers.js` 设置必要的事件监听器 (如 `onInstalled`, `onStartup`, 消息监听等)。
    *   `tabs.js` 可能在启动时检查现有标签页并注入脚本。

2.  **连接流程**:
    *   `connection.js` 尝试连接 Native Message Host。
    *   连接成功后发送 Hello 消息，并开始监听来自 Quicker 的消息。
    *   连接失败或断开时，`connection.js` 会根据策略尝试重连。
    *   连接状态变化会通知 `ui.js` 更新图标等。

3.  **消息处理流程**:
    *   **来自 Quicker**: Native Message Host 端口收到消息，`connection.js` 将其传递给 `quicker-message-handler.js` 的 `processQuickerCmd()`。该函数解析命令并调用 `background-commands.js` 或 `api-functions.js` 中的函数执行，然后通过 `connection.js` 发回响应。
    *   **来自扩展内部**: `chrome.runtime.onMessage` 监听器 (可能在 `event-handlers.js` 或 `extension-message-handler.js` 中设置) 接收到消息，`extension-message-handler.js` 处理并调用相应后台功能。
    *   **来自用户脚本**: `chrome.runtime.onMessageExternal` 监听器 (可能在 `event-handlers.js` 或 `userscript-message-handler.js` 中设置) 接收到消息，`userscript-message-handler.js` 处理并调用相应后台功能。

4.  **标签页管理流程**:
    *   `event-handlers.js` 监听 `chrome.tabs.onUpdated` 等事件。
    *   当标签页 URL 变化或加载完成时，`tabs.js` 检查是否需要注入内容脚本或执行特定操作。
    *   `tabs.js` 提供接口供其他模块 (如 `background-commands.js`) 在特定标签页执行脚本 (`chrome.scripting.executeScript`)。

5.  **右键菜单流程**:
    *   `quicker-message-handler.js` 接收 Quicker 的菜单注册消息，并使用 `chrome.contextMenus` API 创建菜单项。
    *   `event-handlers.js` 设置 `chrome.contextMenus.onClicked` 监听器。
    *   用户点击菜单项时，监听器触发，并将点击事件信息发送给 Quicker (通过 `quicker-message-handler.js` 和 `connection.js`)。

## 技术实现

1.  **Service Worker**: 后台逻辑运行在非持久化的 Service Worker 中，遵循 Manifest V3 规范。
2.  **模块化设计**: 使用 ES6 模块 (`import`/`export`) 组织代码，确保高内聚、低耦合。
3.  **消息通信**:
    *   与 Quicker: `chrome.runtime.connectNative()` 和端口消息传递。
    *   扩展内部: `chrome.runtime.sendMessage`/`onMessage`。
    *   与内容脚本: `chrome.tabs.sendMessage`/`onMessage`。
    *   与用户脚本: `chrome.runtime.sendMessage`/`onMessageExternal` (需要 `externally_connectable` 配置)。
4.  **异步处理**: 大量使用 `async`/`await` 处理异步的浏览器 API 调用和消息传递。
5.  **脚本注入**: 使用 `chrome.scripting.executeScript()` 向标签页动态注入和执行脚本。
6.  **状态管理**: 通过模块作用域或导出的变量/对象管理全局或模块级状态。
7.  **错误处理**: 使用 `try...catch` 块和 `.catch()` 处理 Promise 错误，确保扩展稳定性。
8.  **存储**: 使用 `chrome.storage.local` 或 `chrome.storage.sync` 存储用户设置。

## 注意事项

1.  **Service Worker 生命周期**: 代码需要适应 Service Worker 可能随时休眠和唤醒的特性，避免依赖持久内存状态（应存入 `chrome.storage`）。事件监听器应在顶层作用域注册。
2.  **模块依赖**: 保持清晰的模块依赖关系，避免循环依赖。
3.  **消息格式**: 与 Quicker、内容脚本、用户脚本通信时，需确保消息格式和协议一致。
4.  **权限**: 确保 `manifest.json` 中声明了所有需要的权限。API 调用前可进行可选权限检查。
5.  **错误处理**: 对所有可能失败的操作（尤其是异步操作和 API 调用）进行充分的错误处理。 