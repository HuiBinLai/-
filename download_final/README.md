# 繁星拾忆(历史记录下载器)

## 项目概述

本 Chrome 扩展用于导出浏览历史记录到 CSV 文件，方便用户备份和分析浏览数据。

## 主要功能

- 浏览历史记录导出
- CSV 格式数据下载
- 按时间范围筛选记录

## 安装说明

1. 打开 Chrome 浏览器，进入`chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"，选择本目录

## 运行说明

1. 确保 Chrome 扩展已按安装说明加载
2. 点击浏览器工具栏中的扩展图标
3. 选择时间范围并点击"导出"按钮
   1. 由于权限（也有可能是代码）原因，无法指定文件名和文件保存路径
   2. 为保证项目正常使用，请将下载的数据命名为`data.csv`并保存到路径：`"rag-chrome-extension\data\data.csv"`


## 项目结构

```
.
├── background.js       # 后台脚本
├── manifest.json       # 扩展配置文件
├── popup.html          # 弹出窗口HTML
├── popup.js            # 弹出窗口逻辑
└── icons/              # 图标资源
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

## 版本信息

当前版本：v1.9

## 版权声明

Copyright (c) 2025 繁星拾忆

本软件采用 MIT 许可证发布，详情请参阅 LICENSE 文件。

## 贡献指南

欢迎提交 Pull Request 或 Issue。请确保代码风格一致，并通过所有测试。

## 联系方式

如有任何问题，请联系：

- 邮箱：2022201397@ruc.edu.cn
- GitHub：[@HuiBinLai](https://github.com/HuiBinLai)
