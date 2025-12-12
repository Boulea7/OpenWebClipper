# Open Web Clipper

一个开源的网页裁剪工具，灵感来源于 Obsidian Web Clipper。提取网页内容，转换为 Markdown，支持自定义模板和灵活的 API 接口。

## 功能特性

- **内容提取** - 智能提取网页正文、标题、作者、发布日期等元数据
- **Markdown 转换** - 将 HTML 转换为 Markdown，支持 GFM 格式
- **模板系统** - 自定义模板，支持变量和 50+ 过滤器
- **高亮功能** - 在网页上高亮重要内容
- **AI 解释器** - 集成多种 LLM 进行智能提取
- **多种 API** - 消息 API、NPM 包、Web API 三种接入方式
- **跨浏览器** - 支持 Chrome、Firefox、Safari、Edge

## 快速开始

### 安装扩展

从浏览器商店安装（即将发布）：
- Chrome Web Store
- Firefox Add-ons
- Safari Extensions
- Edge Add-ons

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/Boulea7/OpenWebClipper.git
cd OpenWebClipper

# 安装依赖
npm install

# 开发模式
npm run dev          # Chrome
npm run dev:firefox  # Firefox
npm run dev:safari   # Safari

# 生产构建
npm run build
```

### 加载扩展

**Chrome/Edge:**
1. 打开 `chrome://extensions`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist` 目录

**Firefox:**
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击"临时载入附加组件"
3. 选择 `dist_firefox/manifest.json`

## API 集成

### 消息 API（推荐）

其他浏览器扩展可通过消息通信调用：

```javascript
chrome.runtime.sendMessage(
  OPEN_WEB_CLIPPER_ID,
  { action: 'clip', data: { url: 'https://example.com' } },
  (response) => console.log(response)
);
```

### NPM 包

```bash
npm install open-web-clipper
```

```typescript
import { clip, extract, toMarkdown } from 'open-web-clipper';

const result = await clip('https://example.com');
console.log(result.markdown);
```

### Web API

```bash
# 启动本地服务器
npx open-web-clipper serve

# 调用 API
curl -X POST http://localhost:3456/api/clip \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## 模板语法

```markdown
---
title: {{title}}
source: {{url}}
date: {{date|date:"YYYY-MM-DD"}}
---

# {{title}}

{{content}}
```

查看 [模板文档](docs/TEMPLATE.md) 了解更多。

## 文档

- [架构设计](docs/ARCHITECTURE.md)
- [API 文档](docs/API.md)
- [模板语法](docs/TEMPLATE.md)

## 技术栈

- TypeScript 5.x
- Webpack 5
- webextension-polyfill
- defuddle（内容提取）
- turndown（Markdown 转换）
- dayjs（日期处理）

## 参考项目

- [Obsidian Web Clipper](https://github.com/obsidianmd/obsidian-clipper) - 官方 Obsidian 裁剪器

## 路线图

- [x] 基础架构搭建
- [x] 核心提取和转换模块
- [x] 模板系统
- [ ] 消息 API
- [ ] 本地 Web API
- [ ] NPM 包发布
- [ ] AI Interpreter
- [ ] 云端存储适配
- [ ] 发布到浏览器商店

## 贡献

欢迎贡献代码、提交 Issue 或功能建议！

## License

MIT
