'use strict';

/**
 * 封装chrome.topSites API
 */

/**
 * 热门网站信息
 * @typedef {Object} MostVisitedURL
 * @property {string} url - 网站URL
 * @property {string} title - 网站标题
 */

/**
 * 获取用户最常访问的网站列表（热门网站）。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<MostVisitedURL[]>} 返回包含热门网站信息的对象数组。
 */
async function get(commandParams) {
  // chrome.topSites.get() 不需要参数
  return await chrome.topSites.get();
}

export {
  get
}; 