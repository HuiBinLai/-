from flask import Flask, request, jsonify
from rank_bm25 import BM25Okapi
from openai import OpenAI
import pandas as pd
import os
import jieba
import math
from datetime import datetime


app = Flask(__name__)
APIKEY = "your_api_key"
# 初始化大模型客户端
client = OpenAI(
    api_key=APIKEY,
    base_url="https://api.deepseek.com"
)
stop_words_path = r"百度停用词表.txt"


def load_data(csv_path):
    print(
        f"\n[DEBUG {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] load_data")
    print(f"Input CSV path: {csv_path}")
    df = pd.read_csv(csv_path)
    df['text'] = "标题:" + df['title'] + "打开时间:" + \
        df['time'] + "内容:" + df['content']
    print("Sample data (first 10 rows):")
    print(df.head(10))
    return df


def generate_keywords(query):
    print(
        f"\n[DEBUG {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] generate_keywords")
    print(f"Input query: {query}")
    response = client.chat.completions.create(
        model="deepseek-reasoner",
        messages=[
            {"role": "system", "content": "你是一个智能信息检索助手，用户需要从历史记录里面找到合适的网页，请从根据用户的自然语言输入，生成3~10个关键词（根据用户的输入自行判断）作为检索关键词，并用顿号（、）隔开，例如，用户输入“我想找到我之前看过的一个杭州的人工智能公司的网页，我忘记了它叫什么”，你可以返回：“杭州、人工智能、AI、公司、企业”"},
            {"role": "user", "content": f"现在用户的输入为：{query}"},
        ],
        stream=False
    )
    keywords = response.choices[0].message.content.split("、")
    print(f"Generated keywords: {keywords}")
    return keywords


def generate_summary(content):
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "你是一个网页摘要助手，请将以下内容总结成不超过80字的摘要"},
            {"role": "user", "content": content},
        ],
        stream=False
    )
    summary = response.choices[0].message.content
    if len(summary) > 100:
        summary = summary[:97] + '...'
    print(f"Generated summary: {summary}")
    return summary


def bm25_search(query, df, stop_words_path=stop_words_path):
    print(
        f"\n[DEBUG {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] bm25_search")
    print(f"Input query: {query}")
    print(f"Dataframe shape: {df.shape}")

    # Calculate dynamic Top-k
    a = min(len(query), 10)  # number of keywords
    # Get initial BM25 scores with fixed k=10 to calculate b
    stop_words = set()
    if stop_words_path:
        with open(stop_words_path, 'r', encoding='utf-8') as f:
            stop_words = set(line.strip() for line in f)

    tokenized_corpus = []
    for doc in df['text'].tolist():
        words = jieba.lcut(doc)
        words = [word for word in words if word not in stop_words]
        tokenized_corpus.append(words)

    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = [word for word in query]
    doc_scores = bm25.get_scores(tokenized_query)

    # Get 10th score for b calculation
    sorted_scores = sorted(doc_scores, reverse=True)
    b = sorted_scores[9] if len(sorted_scores) > 9 else 0
    print(len(doc_scores))
    # Calculate dynamic Top-k
    print(a, b)
    # Ensure top_k is within the range of the dataset length
    top_k = min(len(doc_scores), min(
        int(10 + (1/2)*a + 10 * math.log(b + 1)), 20))
    print(f"Calculated Top-k: {top_k}")

    # Perform search with dynamic Top-k
    top_indices = sorted(range(len(doc_scores)),
                         key=lambda i: -doc_scores[i])[:top_k]

    results = df.iloc[top_indices].copy()
    results['score'] = [round(doc_scores[i], 2) for i in top_indices]
    print(f"\nBM25 search results (top {top_k}):")
    print("=============results==========")
    print(results)
    print(results[['title', 'score']])
    # 重新生成序号
    results.reset_index(drop=True, inplace=True)
    print("=============results new==========")
    print(results)
    return results


def llm_rank_and_summarize(query, results):
    print(
        f"\n[DEBUG {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] llm_rank_and_summarize")
    print(f"Input query: {query}")
    print("Input results:")
    print(results[['title', 'score']])

    context = "\n".join([f"网页{i+1}：{row['title']} - {row['content'][:200]}"
                        for i, row in results.iterrows()])

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": """你是一个智能搜索助手，请根据相关性对以下网页进行排序，
并为每个排序后的网页生成一个80字以内的摘要。请按照以下例子的格式返回结果（网页x只是对应排序的网页，不是特指的）：

排序结果：1,3,5,2,4
摘要：
1. 摘要：[你生成的相关性排序第1的网页的摘要]
2. 摘要：[你生成的相关性排序第2的网页的摘要]
3. 摘要：[你生成的相关性排序第3的网页的摘要]
4. 摘要：[你生成的相关性排序第4的网页的摘要]
5. 摘要：[你生成的相关性排序第5的网页的摘要]

网页列表："""},
            {"role": "user", "content": f"查询：{query}\n\n{context}"},
        ],
        stream=False
    )

    response_text = response.choices[0].message.content
    order_line = response_text.split('\n')[0]
    order = [int(x)-1 for x in order_line.split('：')[1].split(',')[:5]]

    summaries = {}
    for line in response_text.split('\n')[2:7]:
        idx, summary = line.split('. ', 1)
        summaries[int(idx)-1] = summary

    final_results = results.iloc[order].copy()
    final_results['summary'] = [summaries[i] for i in range(len(order))]
    print("\nLLM ranked results:")
    print(final_results[['title', 'score', 'summary']])
    return final_results


def generate_answer(query, context):
    print(
        f"\n[DEBUG {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] generate_answer")
    print(f"Input query: {query}")
    print("Input context (first 200 chars):")
    print(context[:200])

    response = client.chat.completions.create(
        model="deepseek-reasoner",
        messages=[
            {"role": "system", "content": "你是一个信息助手"},
            {"role": "user", "content": f"请你仅根据以下信息回答问题，并告诉用户信息“根据您的历史浏览记录，……”，并告诉用户回答的每个部分是来源于哪个网页;如果用户的提问是想找某个具体的网页，请你先回答“您想找的网页有可能是网页x，这个网页是xx内容”。回答的过程中请好好利用换行。各个网页的内容如下：{context}\n\n问题：{query}"},
        ],
        stream=False
    )
    answer = response.choices[0].message.content
    print("\nGenerated answer:")
    print(answer)
    return answer


@app.route('/generate-keywords', methods=['POST'])
def generate_keywords_api():
    data = request.json
    query = data['query']
    keywords = generate_keywords(query)
    return jsonify({'keywords': keywords})


@app.route('/search', methods=['POST'])
def search():
    data = request.json
    query = data['query']
    csv_path = r"data\data.csv"

    df = load_data(csv_path)
    keywords = generate_keywords(query)
    bm25_results = bm25_search(keywords, df)
    final_results = llm_rank_and_summarize(query, bm25_results)

    context = "\n".join([f"网页{i+1}: {content}"
                        for i, content in enumerate(final_results['content'].tolist())])
    answer = generate_answer(query, context)

    print(
        f"\n[DEBUG {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Final response data")
    print("Keywords:", keywords)
    print("Results:")
    print(final_results[['title', 'url', 'summary']])
    print("Answer (first 200 chars):")
    print(answer[:200])

    response = jsonify({
        'keywords': keywords,
        'results': final_results[['title', 'url', 'summary']].to_dict('records'),
        'answer': answer
    })
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response


if __name__ == '__main__':
    app.run(port=5000)
