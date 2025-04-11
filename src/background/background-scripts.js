'use strict';

/**
 * 一些封装好的后台脚本
 */


/**
 * 关闭除当前标签页外的所有标签页（仅限当前窗口）
 */
async function closeOtherTabs() {
    try {
        // 获取当前窗口中的活动标签页
        const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        
        if (!activeTab) {
            throw new Error('未找到当前活动标签页');
        }
        
        // 获取当前窗口中的所有标签页
        const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
        
        // 筛选出需要关闭的标签页ID（排除当前活动标签页）
        const tabIdsToClose = allTabs
            .filter(tab => tab.id !== activeTab.id)
            .map(tab => tab.id);
        
        // 如果有需要关闭的标签页，则关闭它们
        if (tabIdsToClose.length > 0) {
            await chrome.tabs.remove(tabIdsToClose);
        }
        
        return { 
            success: true, 
            closedCount: tabIdsToClose.length 
        };
    } catch (error) {
        console.error('关闭其他标签页时出错:', error);
        throw error;
    }
}

