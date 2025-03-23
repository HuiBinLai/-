# 繁星拾忆项目

## 项目概述

本项目包含两个 Chrome 扩展：

1. **历史记录下载器**（download_final）：用于导出浏览历史记录到 CSV 文件
2. **RAG 搜索扩展**（rag-chrome-extension）：基于 RAG（Retrieval-Augmented Generation）技术的智能信息检索工具

## 主要功能

### 历史记录下载器

- 浏览历史记录导出
- CSV 格式数据下载
- 按时间范围筛选记录

### RAG 搜索扩展

- 网页内容提取与存储
- 智能信息检索
- 个性化记忆提示
- 数据可视化分析

## 安装说明

### 历史记录下载器

1. 打开 Chrome 浏览器，进入`chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"，选择`download_final`目录

### RAG 搜索扩展

1. 克隆本仓库
2. 打开 Chrome 浏览器，进入`chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"，选择`rag-chrome-extension`目录

## 运行说明

**请先运行历史记录下载器再运行RAG，请仔细观察两个文件的readme文档！！**

### 历史记录下载器

1. 确保 Chrome 扩展已按安装说明加载
2. 点击浏览器工具栏中的扩展图标即可使用

### RAG 搜索扩展

1. 安装 Python 依赖：
   ```bash
   cd rag-chrome-extension/server
   pip install -r requirements.txt
   ```
2. 启动服务器：
   ```bash
   python server.py
   ```
3. 确保服务器在`localhost:5000`运行
4. 点击浏览器工具栏中的扩展图标即可使用

## 项目结构

```
.
├── download_final/         # 历史记录下载器
│   ├── background.js       # 后台脚本
│   ├── manifest.json       # 扩展配置文件
│   ├── popup.html          # 弹出窗口HTML
│   ├── popup.js            # 弹出窗口逻辑
│   └── icons/              # 图标资源
│       ├── icon16.svg
│       ├── icon48.svg
│       └── icon128.svg
├── rag-chrome-extension/   # RAG搜索扩展
│   ├── background.js       # 后台脚本
│   ├── manifest.json       # 扩展配置文件
│   ├── README.md           # 原始文档
│   ├── requirements.txt    # Python依赖
│   ├── data/               # 数据文件
│   │   ├── data.csv        # 核心数据
│   │   └── 百度停用词表.txt # 中文停用词表
│   ├── icons/              # 图标资源
│   │   ├── icon.png
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── popup/              # 弹出窗口
│   │   ├── popup.css
│   │   ├── popup.html
│   │   └── popup.js
│   └── server/             # 服务器端
│       └── server.py       # Python服务端脚本
```

## 版本信息

- 历史记录下载器：v1.9
- RAG 搜索扩展：v2.0

## 版权声明

Copyright (c) 2025 繁星拾忆

本软件采用 MIT 许可证发布，详情请参阅 LICENSE 文件。

## 贡献指南

欢迎提交 Pull Request 或 Issue。请确保代码风格一致，并通过所有测试。

## 联系方式

如有任何问题，请联系：

- 邮箱：2022201397@ruc.edu.cn
- GitHub：[@HuiBinLai](https://github.com/HuiBinLai)
