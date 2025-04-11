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
 * 获取热门网站
 * @returns {Promise<MostVisitedURL[]>} 返回热门网站数组
 */
async function get() {
  return await chrome.topSites.get();
}

module.exports = {
  get
}; 