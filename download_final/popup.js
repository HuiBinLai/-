document.addEventListener('DOMContentLoaded', () => {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const exportBtn = document.getElementById('export-btn');
    const statusDiv = document.getElementById('status');

    // 设置默认日期范围
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 1);
    
    startDateInput.valueAsDate = oneWeekAgo;
    endDateInput.valueAsDate = today;

    // 更新进度显示
    function updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        document.getElementById('progress-text').textContent = 
            `共有 ${total} 条历史记录\n正在导出 ${current}/${total} (${percent}%)`;
        document.getElementById('progress-bar-fill').style.width = `${percent}%`;
    }

    exportBtn.addEventListener('click', async () => {
        const startTime = new Date(startDateInput.value).getTime();
        const endTime = new Date(endDateInput.value).getTime();

        if (startTime > endTime) {
            showStatus('错误：开始日期不能晚于结束日期', 'error');
            return;
        }

        exportBtn.disabled = true;
        showStatus('正在导出历史记录...', 'loading');
        document.getElementById('progress-container').style.display = 'block';
        updateProgress(0, 0); // 初始化进度显示

        try {
            const historyData = await chrome.runtime.sendMessage({
                action: 'exportHistory',
                startTime,
                endTime
            });

            const csvContent = convertToCSV(historyData);
            downloadCSV(csvContent);
            showStatus('导出成功！', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            showStatus('导出失败，请重试', 'error');
        } finally {
            exportBtn.disabled = false;
        }
    });

    function validateFilename(filename) {
        // 只允许字母、数字、下划线和连字符
        return /^[a-zA-Z0-9_-]+$/.test(filename);
    }

    function downloadCSV(content) {
        const filenameInput = document.getElementById('filename').value.trim();
        let filename = filenameInput || `history_export`;
        
        // 验证文件名
        if (filenameInput && !validateFilename(filenameInput)) {
            showStatus('文件名只能包含字母、数字、下划线和连字符', 'error');
            return;
        }

        // 添加BOM头以确保Excel正确识别UTF-8编码
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: `${filename}.csv`,
            saveAs: true // 总是显示保存对话框
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                showStatus('下载失败: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            showStatus('文件已保存', 'success');
        });
    }

    function convertToCSV(data) {
        if (!data || data.length === 0) {
            throw new Error('没有可导出的历史记录');
        }

        const headers = ['index', 'url', 'title', 'time', 'content'];
        const rows = data.map((item, index) => [
            `"${index + 1}"`,
            `"${item.url}"`,
            `"${item.title}"`,
            `"${item.lastVisitTime}"`,
            `"${item.content.replace(/"/g, '""')}"`
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // 监听进度更新
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'updateProgress') {
            updateProgress(request.current, request.total);
        }
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        statusDiv.className = type;
    }
});
