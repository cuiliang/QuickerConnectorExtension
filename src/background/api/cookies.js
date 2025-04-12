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
 * 获取单个 Cookie 的信息。
 * @param {CookieDetails} commandParams - 指定要获取的 Cookie 的详细信息 (url, name, storeId)。
 * @returns {Promise<Cookie | null>} 返回匹配的 Cookie 对象，如果找不到则返回 null。
 */
async function get(commandParams) {
  return await chrome.cookies.get(commandParams);
}

/**
 * 获取所有符合指定过滤条件的 Cookie。
 * @param {Object} commandParams - 过滤条件对象。如果省略或为空对象，则获取所有 Cookie。
 * @returns {Promise<Cookie[]>} 返回匹配的 Cookie 对象数组。
 */
async function getAll(commandParams) {
  return await chrome.cookies.getAll(commandParams || {});
}

/**
 * 设置一个 Cookie。
 * @param {SetCookieDetails} commandParams - 要设置的 Cookie 的详细信息。
 * @returns {Promise<Cookie | null>} 返回设置成功的 Cookie 对象。如果设置失败（例如由于无效参数），则返回 null。
 */
async function set(commandParams) {
  return await chrome.cookies.set(commandParams);
}

/**
 * 删除一个 Cookie。
 * @param {DeleteCookieDetails} commandParams - 指定要删除的 Cookie 的详细信息 (url, name, storeId)。
 * @returns {Promise<{url: string, name: string, storeId: string} | null>} 返回包含已删除 Cookie 信息的对象，如果找不到指定 Cookie 则返回 null。
 */
async function remove(commandParams) {
  return await chrome.cookies.remove(commandParams);
}

/**
 * 获取所有可用的 Cookie 存储 (例如，"0" 表示常规存储，"1" 表示隐身窗口存储)。
 * @param {Object} [commandParams] - 命令参数（未使用）。
 * @returns {Promise<CookieStore[]>} 返回 CookieStore 对象数组。
 */
async function getAllCookieStores(commandParams) {
  return await chrome.cookies.getAllCookieStores();
}

export {
  get,
  getAll,
  set,
  remove,
  getAllCookieStores
}; 