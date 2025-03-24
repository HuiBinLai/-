document.addEventListener('DOMContentLoaded', function() {
    // 初始化隐藏
    document.querySelector('.results').style.display = 'none';
    document.querySelector('.answer').style.display = 'none';
    
    const searchBtn = document.getElementById('search-btn');
    const queryInput = document.getElementById('query');
    const resultsList = document.getElementById('results-list');
    const answerText = document.getElementById('answer-text');

    searchBtn.addEventListener('click', async () => {
        const query = queryInput.value.trim();
        if (!query) {
            alert('请输入搜索内容');
            return;
        }

        try {
            // 显示加载状态，隐藏结果部分
            searchBtn.disabled = true;
            searchBtn.textContent = '搜索中...';
            document.getElementById('loading').innerHTML = `
              <div class="spinner"></div>
              <div class="progress-text">正在生成关键词...</div>
            `;
            document.getElementById('loading').style.display = 'flex';
            document.getElementById('keywords').style.display = 'none';
            document.querySelector('.results').style.display = 'none';
            document.querySelector('.answer').style.display = 'none';
            resultsList.innerHTML = '';
            answerText.textContent = '';

            // 第一步：获取关键词
            document.getElementById('loading').innerHTML = `
              <div class="spinner"></div>
              <div class="progress-text">正在生成关键词...</div>
            `;
            
            const keywordsResponse = await fetch('http://localhost:5000/generate-keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query
                })
            });

            if (!keywordsResponse.ok) {
                throw new Error(`HTTP error! status: ${keywordsResponse.status}`);
            }

            const keywordsData = await keywordsResponse.json();

            // 立即显示关键词
            const keywordsList = document.getElementById('keywords-list');
            keywordsList.innerHTML = keywordsData.keywords
                .map(keyword => `<span>${keyword}</span>`)
                .join('');
            document.getElementById('keywords').style.display = 'block';

            // 第二步：获取搜索结果
            document.getElementById('loading').innerHTML = `
              <div class="spinner"></div>
              <div class="progress-text">正在搜索相关内容...</div>
            `;

            const searchResponse = await fetch('http://localhost:5000/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    csv_path: '../data/data.csv'
                })
            });

            if (!searchResponse.ok) {
                throw new Error(`HTTP error! status: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();

            // 第三步：生成回答
            document.getElementById('loading').innerHTML = `
              <div class="spinner"></div>
              <div class="progress-text">正在生成回答...</div>
            `;

            // 显示结果部分
            document.querySelector('.results').style.display = 'block';
            document.querySelector('.answer').style.display = 'block';

            // 显示搜索结果
            resultsList.innerHTML = '';
            searchData.results.forEach((result, index) => {
                const li = document.createElement('li');
                
                // 添加序号
                const indexSpan = document.createElement('span');
                indexSpan.className = 'result-index';
                indexSpan.textContent = `${index + 1}. `;
                
                // 添加标题和链接
                const titleLink = document.createElement('a');
                titleLink.href = result.url;
                titleLink.textContent = result.title;
                titleLink.target = '_blank';
                
                // 添加LLM生成的摘要
                const summary = document.createElement('div');
                summary.className = 'summary';
                summary.textContent = result.summary || '暂无摘要';
                
                // 组装元素
                li.appendChild(indexSpan);
                li.appendChild(titleLink);
                li.appendChild(summary);
                resultsList.appendChild(li);
            });

            // 显示生成的回答
            answerText.textContent = searchData.answer;

        } catch (error) {
            console.error('搜索出错:', error);
            alert('搜索失败，请稍后重试');
        } finally {
            // 恢复按钮状态
            searchBtn.disabled = false;
            searchBtn.textContent = '搜索';
            document.getElementById('loading').style.display = 'none';
        }
    });

    // 支持回车键搜索
    queryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
});
