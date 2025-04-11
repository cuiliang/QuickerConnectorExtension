'use strict';

/**
 * 封装chrome.cookies API
 */

/**
 * Cookie详情
 * @typedef {Object} Cookie
 * @property {string} domain - Cookie的域
 * @property {string} name - Cookie的名称
 * @property {string} value - Cookie的值
 * @property {boolean} secure - 是否只在HTTPS连接上发送
 * @property {boolean} httpOnly - 是否只能通过HTTP(S)协议访问
 * @property {boolean} [hostOnly] - 是否只对设置的主机有效
 * @property {string} [path] - Cookie的路径
 * @property {boolean} [sameSite] - Cookie的SameSite状态
 * @property {number} [expirationDate] - Cookie的过期时间（UNIX时间，秒）
 * @property {string} [storeId] - Cookie所属的存储ID
 * @property {boolean} [session] - 是否为会话Cookie
 */

/**
 * Cookie详情
 * @typedef {Object} CookieDetails
 * @property {string} url - 与Cookie关联的URL
 * @property {string} [name] - Cookie的名称
 * @property {string} [storeId] - Cookie存储的ID
 * @property {string} [domain] - Cookie的域
 * @property {string} [path] - Cookie的路径
 * @property {boolean} [secure] - 是否只在HTTPS连接上发送
 * @property {boolean} [httpOnly] - 是否只能通过HTTP(S)协议访问
 * @property {string} [sameSite] - Cookie的SameSite状态
 */

/**
 * Cookie设置详情
 * @typedef {Object} SetCookieDetails
 * @property {string} url - 与Cookie关联的URL
 * @property {string} name - Cookie的名称
 * @property {string} value - Cookie的值
 * @property {string} [domain] - Cookie的域
 * @property {string} [path] - Cookie的路径
 * @property {boolean} [secure] - 是否只在HTTPS连接上发送
 * @property {boolean} [httpOnly] - 是否只能通过HTTP(S)协议访问
 * @property {string} [sameSite] - Cookie的SameSite状态
 * @property {number} [expirationDate] - Cookie的过期时间（UNIX时间，秒）
 * @property {string} [storeId] - Cookie所属的存储ID
 */

/**
 * Cookie删除详情
 * @typedef {Object} DeleteCookieDetails
 * @property {string} url - 与Cookie关联的URL
 * @property {string} name - Cookie的名称
 * @property {string} [storeId] - Cookie所属的存储ID
 */

/**
 * Cookie存储对象
 * @typedef {Object} CookieStore
 * @property {string} id - 存储ID
 * @property {string} [tabIds] - 与存储关联的标签页ID数组
 */

/**
 * 获取指定Cookie
 * @param {Object} commandParams - 命令参数
 * @param {CookieDetails} commandParams.details - Cookie详情
 * @returns {Promise<Cookie>} 返回Cookie对象
 */
async function get(commandParams) {
  const { details } = commandParams;
  return await chrome.cookies.get(details);
}

/**
 * 获取所有符合条件的Cookie
 * @param {Object} commandParams - 命令参数
 * @param {CookieDetails} [commandParams.details] - Cookie筛选条件
 * @returns {Promise<Cookie[]>} 返回Cookie对象数组
 */
async function getAll(commandParams) {
  const { details } = commandParams || {};
  return await chrome.cookies.getAll(details);
}

/**
 * 设置Cookie
 * @param {Object} commandParams - 命令参数
 * @param {SetCookieDetails} commandParams.details - Cookie设置详情
 * @returns {Promise<Cookie>} 返回设置的Cookie对象
 */
async function set(commandParams) {
  const { details } = commandParams;
  return await chrome.cookies.set(details);
}

/**
 * 删除Cookie
 * @param {Object} commandParams - 命令参数
 * @param {DeleteCookieDetails} commandParams.details - Cookie删除详情
 * @returns {Promise<{name: string, url: string, storeId: string}>} 返回删除的Cookie详情
 */
async function remove(commandParams) {
  const { details } = commandParams;
  return await chrome.cookies.remove(details);
}

/**
 * 获取所有Cookie存储
 * @returns {Promise<CookieStore[]>} 返回Cookie存储数组
 */
async function getAllCookieStores() {
  return await chrome.cookies.getAllCookieStores();
}

module.exports = {
  get,
  getAll,
  set,
  remove,
  getAllCookieStores
}; 