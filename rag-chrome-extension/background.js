chrome.runtime.onInstalled.addListener(() => {
    console.log('RAG Search Extension installed');
});

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'search') {
        fetch('http://localhost:5000/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: message.query,
                csv_path: '../data/data.csv'
            })
        })
        .then(response => response.json())
        .then(data => sendResponse(data))
        .catch(error => {
            console.error('Error:', error);
            sendResponse({error: error.message});
        });
        
        return true; // 保持消息通道打开以支持异步响应
    }
});
