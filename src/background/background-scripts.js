/*
 * 封装常用的标签页管理功能
 */

'use strict';

// --- 辅助函数 ---

/**
 * 获取当前活动标签页
 * @returns {Promise<chrome.tabs.Tab | undefined>}
 */
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab;
}

/**
 * 获取最后聚焦的窗口（包含标签页）及其活动标签页
 * @returns {Promise<{window: chrome.windows.Window | null, activeTab: chrome.tabs.Tab | undefined}>}
 */
async function getWindowAndActiveTab() {
    const win = await chrome.windows.getLastFocused({ populate: true });
    if (!win) return { window: null, activeTab: null };
    const activeTab = win.tabs.find(tab => tab.active);
    return { window: win, activeTab }; // activeTab might be undefined
}


// --- 标签页关闭 ---

/**
 * 关闭其它标签页
 */
async function closeOtherTabs() {
    // 需要窗口和所有标签页，不适合用 getWindowAndActiveTab
    const win = await chrome.windows.getLastFocused({populate: true});
    if (!win) return;
    const activeTab = win.tabs.find(tab => tab.active);
    if (!activeTab) return; // 如果没有活动标签页（理论上不应发生），则不执行任何操作

    for (const tab of win.tabs) {
      // 保留活动标签页和固定的标签页
      if (!tab.active && !tab.pinned && tab.id) {
        try {
            await chrome.tabs.remove(tab.id);
        } catch (error) {
            console.warn(`Failed to remove tab ${tab.id}: ${error.message}`);
        }
      }
    }
}

/**
 * 关闭左侧标签页
 */
async function closeLeftTabs() {
  const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
  if (!win || !currentTab) return;

  const tabsToRemove = win.tabs.filter(tab => tab.index < currentTab.index && !tab.pinned); // 不关闭固定的标签页
  if (tabsToRemove.length > 0) {
      await chrome.tabs.remove(tabsToRemove.map(t => t.id).filter(id => id !== undefined));
  }
}

/**
 * 关闭右侧标签页
 */
async function closeRightTabs() {
  const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
  if (!win || !currentTab) return;

  const tabsToRemove = win.tabs.filter(tab => tab.index > currentTab.index && !tab.pinned); // 不关闭固定的标签页
   if (tabsToRemove.length > 0) {
      await chrome.tabs.remove(tabsToRemove.map(t => t.id).filter(id => id !== undefined));
  }
}

/**
 * 关闭重复标签页 (保留最后一个打开的，不关闭固定的)
 */
async function closeDuplicateTabs() {
  // 需要窗口和所有标签页
  const win = await chrome.windows.getLastFocused({ populate: true });
  if (!win) return;

  const urlMap = new Map();
  const tabsToRemove = [];

  // 从右到左遍历，保留每个 URL 的最后一个标签页，跳过固定标签页
  for (let i = win.tabs.length - 1; i >= 0; i--) {
    const tab = win.tabs[i];
    // 跳过固定的标签页和没有 URL 的特殊页面
    if (tab.pinned || !tab.url || tab.url.startsWith('chrome://')) continue;

    if (urlMap.has(tab.url)) {
        // 如果已记录此 URL，则将当前标签页（非固定的重复项）加入待移除列表
        tabsToRemove.push(tab.id);
    } else {
        // 否则，记录此 URL 对应的（最后一个遇到的）标签页 ID
        urlMap.set(tab.url, tab.id);
    }
  }

  if (tabsToRemove.length > 0) {
      const validIdsToRemove = tabsToRemove.filter(id => id !== undefined);
      if (validIdsToRemove.length > 0) {
        await chrome.tabs.remove(validIdsToRemove);
      }
  }
}

// --- 标签页切换 ---

/**
 * 切换到左侧标签页
 */
async function switchToLeftTab() {
    const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
    if (!win || !currentTab) return;

    let targetIndex = currentTab.index - 1;
    if (targetIndex < 0) {
        targetIndex = win.tabs.length - 1; // 循环到最后一个
    }
    // 确保目标索引有效且对应的标签页存在
    const targetTab = win.tabs.find(tab => tab.index === targetIndex);
    if (targetTab && targetTab.id) {
        await chrome.tabs.update(targetTab.id, { active: true });
    }
}

/**
 * 切换到右侧标签页
 */
async function switchToRightTab() {
    const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
    if (!win || !currentTab) return;

    let targetIndex = currentTab.index + 1;
    if (targetIndex >= win.tabs.length) {
        targetIndex = 0; // 循环到第一个
    }
     // 确保目标索引有效且对应的标签页存在
    const targetTab = win.tabs.find(tab => tab.index === targetIndex);
    if (targetTab && targetTab.id) {
        await chrome.tabs.update(targetTab.id, { active: true });
    }
}

/**
 * 切换到第一个标签页
 */
async function switchToFirstTab() {
    // 需要窗口信息来找到第一个标签
    const { window: win } = await getWindowAndActiveTab();
    if (!win) return;
    // 第一个标签页不一定是 index 0 (比如前面有固定的)，但通常是的
    // 查找第一个非固定的标签页可能更健壮，但这里保持简单
    const firstTab = win.tabs.find(tab => tab.index === 0); // 或者查找最小 index 的非固定 tab
    if (firstTab && firstTab.id) {
        await chrome.tabs.update(firstTab.id, { active: true });
    }
}

/**
 * 切换到最后一个标签页
 */
async function switchToLastTab() {
    // 需要窗口信息来找到最后一个标签
    const { window: win } = await getWindowAndActiveTab();
    if (!win || win.tabs.length === 0) return;
    // 最后一个标签页不一定是 length - 1 (比如前面有固定的)，但通常是的
    const lastTab = win.tabs[win.tabs.length - 1]; // 或者查找最大 index 的 tab
    if (lastTab && lastTab.id) {
        await chrome.tabs.update(lastTab.id, { active: true });
    }
}

// --- 标签页移动 ---

/**
 * 移动当前标签页到窗口开始 (第一个非固定标签页之后)
 */
async function moveTabToStart() {
    const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
    if (!win || !currentTab || currentTab.pinned) return; // 不能移动固定标签，或没有当前标签

    // 找到第一个非固定标签页的索引
    const firstNonPinnedIndex = win.tabs.findIndex(tab => !tab.pinned);
    const targetIndex = (firstNonPinnedIndex === -1) ? 0 : firstNonPinnedIndex; // 如果全是固定的，移到最前

    if (currentTab.index > targetIndex && currentTab.id) {
        await chrome.tabs.move(currentTab.id, { index: targetIndex });
    }
}

/**
 * 移动当前标签页到窗口末尾
 */
async function moveTabToEnd() {
    const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
    // 允许移动固定标签页到末尾（虽然通常固定页在前面）
    if (!win || !currentTab) return;

    // 目标索引 -1 表示移动到末尾
    if (currentTab.index < win.tabs.length - 1 && currentTab.id) {
        await chrome.tabs.move(currentTab.id, { index: -1 });
    }
}

/**
 * 向前（右）移动当前标签页
 */
async function moveTabRight() {
    const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
     // 不能移动固定标签页，或已在最右
    if (!win || !currentTab || currentTab.pinned || currentTab.index >= win.tabs.length - 1) return;

    if (currentTab.id) {
        await chrome.tabs.move(currentTab.id, { index: currentTab.index + 1 });
    }
}

/**
 * 向后（左）移动当前标签页
 */
async function moveTabLeft() {
    const { window: win, activeTab: currentTab } = await getWindowAndActiveTab();
    if (!win || !currentTab || currentTab.pinned) return; // 不能移动固定标签

    // 计算目标位置，不能移动到固定标签页区域的左边
    const firstNonPinnedIndex = win.tabs.findIndex(tab => !tab.pinned);
    const targetIndex = currentTab.index - 1;

    if (currentTab.index > firstNonPinnedIndex && targetIndex >= firstNonPinnedIndex && currentTab.id) {
        await chrome.tabs.move(currentTab.id, { index: targetIndex });
    }
}

// --- 标签页状态切换 ---

/**
 * 切换当前标签页静音状态
 */
async function toggleTabMute() {
    const currentTab = await getCurrentTab();
    // 检查 tab 是否存在以及是否有 mutedInfo 属性
    if (currentTab && currentTab.id && typeof currentTab.mutedInfo?.muted !== 'undefined') {
        const currentMutedState = currentTab.mutedInfo.muted;
        await chrome.tabs.update(currentTab.id, { muted: !currentMutedState });
    } else if (currentTab) {
        console.warn(`Tab ${currentTab.id} has no mutedInfo.`);
        // 对于没有 mutedInfo 的标签页（例如某些特殊页面），可能无法静音
    }
}

/**
 * 切换当前标签页固定状态
 */
async function toggleTabPin() {
    const currentTab = await getCurrentTab();
    // 检查 tab 是否存在以及是否有 pinned 属性
    if (currentTab && currentTab.id && typeof currentTab.pinned === 'boolean') {
        const currentPinnedState = currentTab.pinned;
        await chrome.tabs.update(currentTab.id, { pinned: !currentPinnedState });
    }
}

// --- 窗口和书签 ---

/**
 * 创建一个新窗口，打开指定的网址列表。
 * @param {string[]} urls - 要在新窗口中打开的 URL 数组。
 */
async function createNewWindowWithUrls(urls) {
  if (!urls || urls.length === 0) {
    // 如果没有提供 URL，则只打开一个新窗口（默认打开新标签页）
    await chrome.windows.create({});
    return;
  }

  // 创建包含第一个 URL 的新窗口
  const newWindow = await chrome.windows.create({ url: urls[0] });

  // 在新窗口中为剩余的 URL 打开新标签页
  if (urls.length > 1 && newWindow.id) {
    for (let i = 1; i < urls.length; i++) {
      await chrome.tabs.create({ windowId: newWindow.id, url: urls[i] });
    }
  }
}

/**
 * 关闭其它窗口
 */
async function closeOtherWindows() {
    const lastFocusedWindow = await chrome.windows.getLastFocused(); // 不需要 populate
    if (!lastFocusedWindow) return;
    const allWindows = await chrome.windows.getAll(); // 不需要 populate

    for (const win of allWindows) {
        if (win.id !== lastFocusedWindow.id && win.id) {
             try {
                await chrome.windows.remove(win.id);
             } catch (error) {
                 console.warn(`Failed to close window ${win.id}: ${error.message}`);
             }
        }
    }
}

/**
 * 将当前标签页添加书签
 */
async function addBookmarkForCurrentTab() {
    const currentTab = await getCurrentTab();
    if (currentTab && currentTab.url && currentTab.title) {
        try {
            // 检查书签是否已存在 (避免重复添加)
            const existingBookmarks = await chrome.bookmarks.search({ url: currentTab.url });
            if (existingBookmarks.length === 0) {
                await chrome.bookmarks.create({
                    // parentId: '1', // '1' 通常是书签栏，'2' 是其他书签。可以不指定，默认添加到最近使用的文件夹
                    title: currentTab.title,
                    url: currentTab.url
                });
                console.log(`Bookmarked: ${currentTab.title}`);
                // 可选：发送通知给用户
                // chrome.notifications.create({ type: 'basic', iconUrl: 'icon.png', title: '书签已添加', message: currentTab.title });
            } else {
                console.log(`Bookmark already exists for: ${currentTab.url}`);
                // 可选：通知用户书签已存在
            }
        } catch (error) {
            console.error(`Failed to add or search bookmark for ${currentTab.url}:`, error);
            // 可以考虑通知用户添加失败
        }
    } else if (currentTab) {
        console.log("Cannot bookmark tab without URL or title:", currentTab);
    }
}

/**
 * 将当前标签页删除书签 (删除所有匹配 URL 的书签)
 */
async function removeBookmarkForCurrentTab() {
    const currentTab = await getCurrentTab();
    if (currentTab && currentTab.url) {
        try {
            const bookmarks = await chrome.bookmarks.search({ url: currentTab.url });
            if (bookmarks.length > 0) {
                let removedCount = 0;
                for (const bookmark of bookmarks) {
                    try {
                        await chrome.bookmarks.remove(bookmark.id);
                        removedCount++;
                    } catch (removeError) {
                         console.warn(`Failed to remove bookmark ${bookmark.id} for ${currentTab.url}:`, removeError);
                    }
                }
                if (removedCount > 0) {
                    console.log(`Removed ${removedCount} bookmark(s) for: ${currentTab.url}`);
                    // 可选：通知用户
                } else {
                     console.log(`Found bookmarks for ${currentTab.url}, but failed to remove any.`);
                }
            } else {
                console.log(`No bookmark found for: ${currentTab.url}`);
                // 可以考虑通知用户没有找到书签
            }
        } catch (error) {
            console.error(`Failed to search bookmark for ${currentTab.url}:`, error);
        }
    }
}

/**
 * 打开收藏夹管理
 */
async function openBookmarksManager() {
    await chrome.tabs.create({ url: 'chrome://bookmarks' });
}

/**
 * 转到上一级目录
 */
async function goToParentDirectory() {
    const currentTab = await getCurrentTab();
    if (currentTab && currentTab.id && currentTab.url) {
        try {
            const currentUrl = new URL(currentTab.url);
            let parentUrl = '';

            // 处理路径部分
            if (currentUrl.pathname && currentUrl.pathname !== '/' && currentUrl.pathname !== '') {
                // /path/to/dir/ -> /path/to/
                // /path/to/file -> /path/to/
                // /path/ -> /
                // /file -> /
                let pathParts = currentUrl.pathname.split('/').filter(Boolean); // 移除空字符串
                pathParts.pop(); // 移除最后一部分（目录或文件名）
                parentUrl = `${currentUrl.protocol}//${currentUrl.host}/${pathParts.join('/')}${pathParts.length > 0 ? '/' : ''}`; // 如果路径不为空，则添加末尾斜杠
            }
            // 如果没有路径但有查询参数或哈希，则移除它们回到域名根目录
            else if (currentUrl.search || currentUrl.hash) {
                 parentUrl = `${currentUrl.protocol}//${currentUrl.host}/`;
            }

            // 只有在计算出有效的父 URL 时才导航
            if (parentUrl && parentUrl !== currentUrl.href.split('?')[0].split('#')[0]) { // 确保 URL 确实改变了
                await chrome.tabs.update(currentTab.id, { url: parentUrl });
            } else {
                console.log("Already at root or cannot determine parent directory for:", currentUrl.href);
            }
        } catch (error) {
            // URL 解析失败或不支持的协议等
            console.error("Failed to navigate to parent directory for:", currentTab.url, error);
        }
    }
}


// --- 滚动功能辅助函数 ---
async function executeScroll(scrollFunc) {
    const currentTab = await getCurrentTab();
    // 增加对 file:// 协议的检查，如果需要支持的话
    if (currentTab && currentTab.id && currentTab.url && !currentTab.url.startsWith('chrome://') && !currentTab.url.startsWith('about:')) {
         try {
             await chrome.scripting.executeScript({
                 target: { tabId: currentTab.id },
                 func: scrollFunc,
                 // world: 'MAIN' // 可选，指定执行脚本的世界
             });
         } catch (error) {
             // 常见错误：目标页面限制脚本执行（如 Chrome Web Store），或没有活动标签页
             console.warn(`Failed to execute scroll function on tab ${currentTab.id} (${currentTab.url}):`, error.message);
         }
    } else if (currentTab) {
        console.log(`Cannot execute scroll script on current tab (URL: ${currentTab.url}, ID: ${currentTab.id}). It might be a restricted page.`);
    } else {
         console.log("Cannot execute scroll script: No active tab found.");
    }
}


// --- 滚动功能 ---

/**
 * 向上滚动 (一页)
 */
async function scrollUp() {
    await executeScroll(() => window.scrollBy(0, -window.innerHeight * 0.8));
}

/**
 * 向下滚动 (一页)
 */
async function scrollDown() {
    await executeScroll(() => window.scrollBy(0, window.innerHeight * 0.8));
}

/**
 * 到顶部
 */
async function scrollToTop() {
    await executeScroll(() => window.scrollTo(0, 0));
}

/**
 * 到底部
 */
async function scrollToBottom() {
    await executeScroll(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * 向左滚动 (一页)
 */
async function scrollLeft() {
    await executeScroll(() => window.scrollBy(-window.innerWidth * 0.8, 0));
}

/**
 * 向右滚动 (一页)
 */
async function scrollRight() {
    await executeScroll(() => window.scrollBy(window.innerWidth * 0.8, 0));
}


// --- 标签页刷新与恢复 ---

/**
 * 刷新当前标签页
 */
async function reloadTab() {
    const currentTab = await getCurrentTab();
    if (currentTab && currentTab.id && !currentTab.url?.startsWith('chrome://')) { // 避免刷新特殊页面
        try {
            await chrome.tabs.reload(currentTab.id);
        } catch (error) {
            console.warn(`Could not reload tab ${currentTab.id}: ${error.message}`);
        }
    }
}

/**
 * 强制刷新当前标签页（不使用缓存）
 */
async function forceReloadTab() {
    const currentTab = await getCurrentTab();
     if (currentTab && currentTab.id && !currentTab.url?.startsWith('chrome://')) { // 避免刷新特殊页面
         try {
            await chrome.tabs.reload(currentTab.id, { bypassCache: true });
         } catch (error) {
            console.warn(`Could not force reload tab ${currentTab.id}: ${error.message}`);
        }
    }
}

/**
 * 刷新所有标签页 (非特殊页面)
 */
async function reloadAllTabs() {
    // 需要窗口和所有标签页
    const win = await chrome.windows.getLastFocused({ populate: true });
    if (!win || !win.tabs) return;

    for (const tab of win.tabs) {
        // 仅刷新普通页面，跳过 chrome://, about:, file:// 等
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') /* && !tab.url.startsWith('file://') */ ) {
             try {
                await chrome.tabs.reload(tab.id);
             } catch (error) {
                // 某些页面可能不允许刷新（例如正在加载或错误的页面）
                console.warn(`Could not reload tab ${tab.id} (${tab.url}): ${error.message}`);
             }
        }
    }
}

/**
 * 重新打开关闭的标签页
 */
async function reopenClosedTab() {
    try {
        await chrome.sessions.restore();
    } catch (error) {
        console.error("Failed to restore closed tab/session:", error);
        // 可能没有关闭的标签页可恢复
    }
}

// --- 标签页创建与管理 ---

/**
 * 新建标签页 (在当前标签页右侧)
 */
async function createNewTab() {
     const currentTab = await getCurrentTab();
     const options = currentTab ? { index: currentTab.index + 1 } : {}; // 如果获取到当前页，则在其后打开
     await chrome.tabs.create(options);
}

/**
 * 复制当前标签页
 */
async function duplicateCurrentTab() {
    const currentTab = await getCurrentTab();
    if (currentTab && currentTab.id) {
        await chrome.tabs.duplicate(currentTab.id);
    }
}

/**
 * 分离标签页到新窗口
 */
async function detachCurrentTab() {
    const currentTab = await getCurrentTab();
    // 确保标签页存在且不是固定的（通常不分离固定标签页）
    if (currentTab && currentTab.id && !currentTab.pinned) {
        try {
            await chrome.windows.create({ tabId: currentTab.id });
        } catch (error) {
            console.error(`Failed to detach tab ${currentTab.id}:`, error);
        }
    } else if (currentTab?.pinned) {
        console.log("Cannot detach a pinned tab.");
    }
}

/**
 * 固定当前标签页 (注：togglePinTab 已实现此功能)
 * 此函数可以保留用于明确的"固定"操作，而不是"切换"
 */
async function pinCurrentTab() {
    const currentTab = await getCurrentTab();
    if (currentTab && currentTab.id && !currentTab.pinned) { // 只有在未固定时才固定
         await chrome.tabs.update(currentTab.id, { pinned: true });
    }
}

// --- 窗口管理 ---

/**
 * 合并所有窗口的标签页到当前窗口
 */
async function mergeAllWindows() {
    const lastFocusedWindow = await chrome.windows.getLastFocused(); // 不需要 populate
    if (!lastFocusedWindow || !lastFocusedWindow.id) return;

    const allWindows = await chrome.windows.getAll({ populate: true }); // 需要 populate 获取 tabs

    if (allWindows.length <= 1) return; // 不需要合并

    for (const win of allWindows) {
        // 跳过当前窗口和没有标签页的窗口
        if (win.id === lastFocusedWindow.id || !win.tabs || win.tabs.length === 0) {
            continue;
        }

        // 获取需要移动的标签页 ID (排除当前窗口已有的)
        const tabIdsToMove = win.tabs
            .map(tab => tab.id)
            .filter(id => id !== undefined); // Type assertion for filtering undefined

        if (tabIdsToMove.length > 0) {
            try {
                // 移动标签页到当前窗口末尾
                await chrome.tabs.move(tabIdsToMove, { windowId: lastFocusedWindow.id, index: -1 });
                // 移动成功后，尝试关闭原窗口 (如果它现在空了)
                // 再次检查以防万一
                 const updatedWin = await chrome.windows.get(win.id, { populate: true });
                 if (updatedWin.tabs.length === 0) {
                     try {
                         await chrome.windows.remove(win.id);
                     } catch (closeError) {
                         console.warn(`Failed to close empty window ${win.id} after merge:`, closeError);
                     }
                 }

            } catch (error) {
                 console.error(`Failed to move tabs from window ${win.id} to ${lastFocusedWindow.id}:`, error);
                 // 即使移动失败，也尝试关闭原窗口（如果它是意外创建的空窗口等）
                 // 但更安全的方式是记录错误，避免意外关闭包含重要标签的窗口
            }
        } else {
             // 如果窗口没有可移动的标签页（例如全是 undefined id?），尝试关闭它
             try {
                  await chrome.windows.remove(win.id);
             } catch (closeError) {
                console.warn(`Failed to close window ${win.id} with no movable tabs:`, closeError);
             }
        }
    }
}

/**
 * 新建窗口
 */
async function createNewWindow() {
    await chrome.windows.create({});
}

/**
 * 新建隐身窗口
 */
async function createNewIncognitoWindow() {
    await chrome.windows.create({ incognito: true });
}

/**
 * 关闭当前窗口
 */
async function closeLastFocusedWindow() {
    const lastFocusedWindow = await chrome.windows.getLastFocused(); // 不需要 populate
    if (lastFocusedWindow && lastFocusedWindow.id) {
         try {
            await chrome.windows.remove(lastFocusedWindow.id);
         } catch (error) {
            // 如果是最后一个窗口，关闭可能会失败（取决于浏览器设置）
            console.warn(`Failed to close window ${lastFocusedWindow.id}:`, error);
         }
    }
}

/**
 * 关闭所有窗口 (谨慎使用!)
 */
async function closeAllWindows() {
    const allWindows = await chrome.windows.getAll();
    for (const win of allWindows) {
        if (win.id) {
            try {
                await chrome.windows.remove(win.id);
            } catch (error) {
                console.error(`Failed to close window ${win.id}:`, error);
                // 继续尝试关闭其他窗口
            }
        }
    }
}

/**
 * 切换全屏状态
 */
async function toggleFullscreen() {
    const lastFocusedWindow = await chrome.windows.getLastFocused(); // 不需要 populate
    if (lastFocusedWindow && lastFocusedWindow.id) {
        try {
            const currentWin = await chrome.windows.get(lastFocusedWindow.id); // 获取最新状态
            const currentState = currentWin.state;
            let nextState = 'normal';

            if (currentState === 'normal' || currentState === 'maximized' || currentState === 'minimized') {
                nextState = 'fullscreen';
            } else if (currentState === 'fullscreen') {
                // 退出全屏通常恢复到 'maximized' 或 'normal'
                // 为简单起见，尝试恢复到 'normal'。如果需要恢复到之前的状态，会更复杂。
                nextState = 'normal';
            }
             // 注意：某些系统或窗口管理器可能不允许程序化地从未全屏状态最大化/最小化后直接全屏
            await chrome.windows.update(lastFocusedWindow.id, { state: nextState });

        } catch (error) {
            console.error(`Failed to toggle fullscreen for window ${lastFocusedWindow.id}:`, error);
        }
    }
}

// --- 导出 ---

export {
  // 标签页关闭
  closeOtherTabs,
  closeLeftTabs,
  closeRightTabs,
  closeDuplicateTabs,
  // 标签页切换
  switchToLeftTab,
  switchToRightTab,
  switchToFirstTab,
  switchToLastTab,
  // 标签页移动
  moveTabToStart,
  moveTabToEnd,
  moveTabRight,
  moveTabLeft,
  // 标签页状态
  toggleTabMute,
  toggleTabPin,
  pinCurrentTab, // 保留明确的 pin 操作
  // 书签与导航
  addBookmarkForCurrentTab,
  removeBookmarkForCurrentTab,
  openBookmarksManager,
  goToParentDirectory,
  // 滚动
  scrollUp,
  scrollDown,
  scrollToTop,
  scrollToBottom,
  scrollLeft,
  scrollRight,
  // 刷新与恢复
  reloadTab,
  forceReloadTab,
  reloadAllTabs,
  reopenClosedTab,
  // 创建与管理
  createNewTab,
  duplicateCurrentTab,
  detachCurrentTab,
  // 窗口操作
  createNewWindow,
  createNewIncognitoWindow,
  createNewWindowWithUrls,
  closeOtherWindows,
  mergeAllWindows,
  closeLastFocusedWindow,
  closeAllWindows,
  toggleFullscreen
}
