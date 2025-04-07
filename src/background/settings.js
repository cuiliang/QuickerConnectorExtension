"use strict";

import { DEFAULT_BUTTON_POSITION } from './constants.js';

/**
 * 加载设置. 返回一个 Promise，在所有设置加载完成后 resolve。
 * @returns {Promise<void>}
 */
export function loadSettings() {
  // Note: This module directly modifies global window.state.
  // Consider a more robust state management approach.
  return new Promise((resolve, reject) => {
    let settingsLoaded = 0;
    const totalSettings = 2;

    const checkCompletion = () => {
      settingsLoaded++;
      if (settingsLoaded === totalSettings) {
        console.log("All settings loaded.");
        resolve();
      }
    };

    // 加载状态报告设置 (sync)
    chrome.storage.sync.get({ 'enableReport': true }, function (data) { // Provide default value
      if (chrome.runtime.lastError) {
        console.error(`Error loading enableReport setting: ${chrome.runtime.lastError.message}`);
        // Optionally reject or resolve partially, depending on desired error handling
      } else {
        console.log('Loaded enableReport setting:', data.enableReport);
        self.state._enableReport = data.enableReport;
      }
      checkCompletion();
    });

    // 加载按钮位置 (local)
    chrome.storage.local.get({ 'button_position': DEFAULT_BUTTON_POSITION }, function (data) { // Provide default value
      if (chrome.runtime.lastError) {
        console.error(`Error loading button_position setting: ${chrome.runtime.lastError.message}`);
        // Optionally reject or resolve partially
      } else {
        console.log('Loaded button_position setting:', data.button_position);
        // Ensure loaded position has all required properties, fallback to default if not
        self.state._buttonPosition = data.button_position && typeof data.button_position === 'object'
                                      ? { ...DEFAULT_BUTTON_POSITION, ...data.button_position }
                                      : DEFAULT_BUTTON_POSITION;
      }
      checkCompletion();
    });
  });
}

/**
 * 设置状态报告开关
 * @param {boolean} enabled 是否启用状态报告
 */
export function setReportEnabled(enabled) {
  // Note: Direct modification of global state.
  self.state._enableReport = enabled;

  // 保存到存储
  chrome.storage.sync.set({ 'enableReport': enabled }, function() {
    if (chrome.runtime.lastError) {
      console.error(`Error saving enableReport setting: ${chrome.runtime.lastError.message}`);
    } else {
      console.log('Report setting saved:', enabled);
    }
  });
}

/**
 * 设置按钮位置
 * @param {object} position 按钮位置对象
 */
export function setButtonPosition(position) {
  // Note: Direct modification of global state.
  // Basic validation or sanitization of the position object might be needed here.
  self.state._buttonPosition = position;

  // 保存到存储
  chrome.storage.local.set({ 'button_position': position }, function() {
    if (chrome.runtime.lastError) {
      console.error(`Error saving button_position setting: ${chrome.runtime.lastError.message}`);
    } else {
      console.log('Button position saved:', position);
    }
  });
} 