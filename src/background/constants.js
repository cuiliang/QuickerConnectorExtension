"use strict";

/**
 * 常量定义文件
 */

// 消息类型常量
export const MSG_UPDATE_QUICKER_STATE = 11;  // 更新Quicker的连接状态。是ChromeAgent发送给浏览器扩展的。
export const MSG_REPORT_ACTIVE_TAB_STATE = 5;  // 报告活动tab的最新网址
export const MSG_COMMAND_RESP = 3;  // 命令响应消息
export const MSG_REGISTER_CONTEXT_MENU = 6;  // 注册右键菜单。是从Quicker下发的。
export const MSG_MENU_CLICK = 7;  // 菜单点击
export const MSG_PUSH_ACTIONS = 21;  // 向扩展推送动作列表。是从Quicker下发的。
export const MSG_ACTION_CLICKED = 22;  // 动作点击了
export const MSG_START_PICKER = 23;  // 启动选择器

// 默认按钮位置
export const DEFAULT_BUTTON_POSITION = {
  classList: ['left', 'bottom'],
  left: '50px',
  right: 'auto',
  top: 'auto',
  bottom: '50px'
};

// Native Message Host名称
export const HOST_NAME = "com.getquicker.chromeagent";

// 右键菜单ID
export const QUICKER_ROOT_MENU_ID = "quicker_root_menu"; 