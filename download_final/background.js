// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'exportHistory') {
        const { startTime, endTime } = request;
        
        // 获取指定时间范围内的历史记录
        chrome.history.search({
            text: '',
            startTime,
            endTime,
            maxResults: 1000 // 限制最大结果数
        }, async (historyItems) => {
            const results = [];
            const totalItems = historyItems.length;
            let currentItem = 0;
            
            // 获取每个页面的详细信息
            for (const item of historyItems) {
                try {
                    const tab = await new Promise(resolve => {
                        chrome.tabs.create({ url: item.url, active: false }, tab => {
                            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                                if (tabId === tab.id && changeInfo.status === 'complete') {
                                    chrome.tabs.onUpdated.removeListener(listener);
                                    resolve(tab);
                                }
                            });
                        });
                    });

                    const pageContent = await new Promise(resolve => {
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: () => document.body.innerText
                        }, (results) => {
                            chrome.tabs.remove(tab.id);
                            resolve(results[0].result);
                        });
                    });

                    results.push({
                        url: item.url,
                        title: item.title,
                        lastVisitTime: new Date(item.lastVisitTime).toLocaleString(),
                        content: pageContent
                    });

                    // 更新进度
                    currentItem++;
                    chrome.runtime.sendMessage({
                        action: 'updateProgress',
                        current: currentItem,
                        total: totalItems
                    });
                } catch (error) {
                    console.error(`Error processing ${item.url}:`, error);
                }
            }

            // 将结果发送回popup
            sendResponse(results);
        });

        return true; // 保持消息通道开放以支持异步响应
    }
});
