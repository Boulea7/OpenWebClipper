# Open Web Clipper 架构设计文档

## 概述

Open Web Clipper 是一个开源的网页裁剪工具，灵感来源于 Obsidian Web Clipper。它可以提取网页正文内容和元数据，转换为 Markdown 格式，并提供灵活的 API 接口供其他工具集成。

## 技术栈

- **语言**: TypeScript 5.x
- **构建**: Webpack 5
- **样式**: SCSS
- **跨浏览器**: webextension-polyfill
- **内容提取**: defuddle
- **Markdown 转换**: turndown + GFM 插件

## 目录结构

```
src/
├── api/                    # 公共 API 接口
│   └── index.ts            # API 入口和导出
├── background/             # 后台服务脚本
│   └── index.ts            # Service Worker
├── content/                # 内容脚本
│   └── index.ts            # 注入到网页的脚本
├── popup/                  # 弹窗界面
│   ├── index.ts            # 弹窗逻辑
│   ├── popup.html          # 弹窗 HTML
│   └── popup.scss          # 弹窗样式
├── core/                   # 核心模块
│   ├── extractor/          # 内容提取
│   ├── converter/          # Markdown 转换
│   ├── template/           # 模板引擎
│   │   ├── index.ts        # 模板处理
│   │   ├── filters.ts      # 过滤器
│   │   └── variables.ts    # 变量处理
│   ├── storage/            # 存储管理
│   └── interpreter/        # AI 解释器
├── types/                  # TypeScript 类型定义
│   └── index.ts            # 所有类型导出
├── utils/                  # 工具函数
│   └── browser-polyfill.ts # 浏览器兼容
├── styles/                 # 全局样式
├── icons/                  # 图标资源
├── _locales/               # 多语言文件
└── manifest.*.json         # 各浏览器 manifest
```

## 核心模块

### 1. 内容提取 (ContentExtractor)

负责从网页中提取：
- 标题、作者、描述
- 发布日期
- 正文内容 (HTML)
- 社交分享图片
- Favicon
- Meta 数据
- Schema.org 数据

### 2. Markdown 转换 (MarkdownConverter)

将 HTML 转换为 Markdown：
- 支持标题、段落、列表
- 代码块和内联代码
- 链接和图片
- 表格 (GFM)
- 任务列表 (GFM)

### 3. 模板引擎 (TemplateEngine)

处理模板变量和过滤器：
- 预设变量: `{{title}}`, `{{content}}`, `{{url}}`
- Meta 变量: `{{meta:name:description}}`
- Selector 变量: `{{selector:h1}}`
- Schema 变量: `{{schema:@Article:author}}`
- Prompt 变量: `{{"summarize the page"}}`

### 4. 过滤器系统 (FilterProcessor)

提供 30+ 内置过滤器：
- 日期: `date`, `date_modify`
- 文本: `lower`, `upper`, `capitalize`, `title`
- 格式: `blockquote`, `wikilink`, `list`
- 数组: `join`, `split`, `first`, `last`

## 数据流

```
用户点击扩展
    │
    ▼
内容脚本获取 DOM
    │
    ▼
ContentExtractor 提取内容
    │
    ▼
MarkdownConverter 转换格式
    │
    ▼
TemplateEngine 应用模板
    │
    ▼
输出 Markdown 文件
```

## API 接口

### 消息 API (扩展间通信)

```typescript
// 其他扩展调用
chrome.runtime.sendMessage(
  EXTENSION_ID,
  { action: 'clip', url: 'https://example.com' },
  (response) => console.log(response)
);
```

### NPM 包

```typescript
import { clip, extract, toMarkdown } from 'open-web-clipper';

const result = await clip('https://example.com', {
  template: '# {{title}}\n\n{{content}}'
});
```

### Web API

```typescript
// POST http://localhost:3456/api/clip
fetch('http://localhost:3456/api/clip', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});
```

## 扩展点

1. **自定义提取器**: 针对特定网站的内容提取
2. **自定义过滤器**: 扩展模板过滤器
3. **存储适配器**: 支持不同存储后端
4. **AI 提供商**: 支持不同 LLM 服务
