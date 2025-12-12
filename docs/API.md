# Open Web Clipper API 文档

## 概述

Open Web Clipper 提供三种 API 接入方式：

1. **消息 API** - 浏览器扩展间通信
2. **NPM 包** - Node.js / 前端项目集成
3. **Web API** - HTTP REST 接口

## 消息 API

最轻量的集成方式，适用于其他浏览器扩展调用。

### 基本用法

```typescript
// 获取 Open Web Clipper 扩展 ID
const CLIPPER_EXTENSION_ID = 'your-extension-id';

// 发送消息
chrome.runtime.sendMessage(
  CLIPPER_EXTENSION_ID,
  {
    action: 'clip',
    data: { url: 'https://example.com' }
  },
  (response) => {
    if (response.success) {
      console.log('Clipped:', response.data);
    } else {
      console.error('Error:', response.error);
    }
  }
);
```

### 支持的 Actions

#### `clip` - 完整裁剪

```typescript
{
  action: 'clip',
  data: {
    url: string;          // 要裁剪的 URL
    options?: {
      template?: string;  // 模板内容
      templateId?: string; // 模板 ID
      outputFormat?: 'markdown' | 'html' | 'json';
      variables?: Record<string, unknown>;
    }
  }
}

// 响应
{
  success: boolean;
  data?: {
    content: string;      // 裁剪结果
    filename: string;     // 建议的文件名
    metadata: ExtractedContent;
  };
  error?: string;
}
```

#### `extract` - 提取内容

```typescript
{
  action: 'extract',
  data: {
    html: string;         // HTML 内容
    url: string;          // 原始 URL
  }
}

// 响应
{
  success: boolean;
  data?: ExtractedContent;
  error?: string;
}
```

#### `toMarkdown` - HTML 转 Markdown

```typescript
{
  action: 'toMarkdown',
  data: {
    html: string;         // HTML 内容
  }
}

// 响应
{
  success: boolean;
  data?: string;          // Markdown 内容
  error?: string;
}
```

#### `render` - 渲染模板

```typescript
{
  action: 'render',
  data: {
    template: string;     // 模板字符串
    variables: Record<string, unknown>;
  }
}

// 响应
{
  success: boolean;
  data?: string;          // 渲染结果
  error?: string;
}
```

## NPM 包

适用于 Node.js 后端或前端项目。

### 安装

```bash
npm install open-web-clipper
```

### 基本用法

```typescript
import { clip, extract, toMarkdown, render } from 'open-web-clipper';

// 完整裁剪
const result = await clip('https://example.com', {
  template: '# {{title}}\n\n{{content}}'
});
console.log(result.content);

// 仅提取
const content = await extract({ url: 'https://example.com' });
console.log(content.title, content.author);

// HTML 转 Markdown
const md = toMarkdown('<h1>Hello</h1><p>World</p>');
console.log(md); // # Hello\n\nWorld

// 渲染模板
const output = render('Hello {{name}}!', { name: 'World' });
console.log(output); // Hello World!
```

### 高级用法

```typescript
import { ContentExtractor, MarkdownConverter, TemplateEngine } from 'open-web-clipper';

// 自定义提取器
const extractor = new ContentExtractor();
const content = await extractor.extract({
  html: '<html>...</html>',
  url: 'https://example.com',
  selector: 'article'  // 仅提取 article 内容
});

// 自定义转换选项
const converter = new MarkdownConverter();
const md = converter.convert(html, {
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// 自定义模板引擎
const engine = new TemplateEngine();
engine.registerFilter('reverse', (value) => String(value).split('').reverse().join(''));
const output = engine.render('{{title|reverse}}', { title: 'Hello' });
```

## Web API

通过本地 HTTP 服务器提供 REST API。

### 启动服务器

```bash
# 启动 API 服务器 (默认端口 3456)
npx open-web-clipper serve --port 3456
```

### 端点

#### `POST /api/clip`

```bash
curl -X POST http://localhost:3456/api/clip \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

请求体：
```json
{
  "url": "https://example.com",
  "options": {
    "template": "# {{title}}\n\n{{content}}",
    "outputFormat": "markdown"
  }
}
```

响应：
```json
{
  "success": true,
  "data": {
    "content": "# Page Title\n\nPage content...",
    "filename": "Page Title.md",
    "metadata": {
      "title": "Page Title",
      "author": "Author Name",
      "url": "https://example.com"
    }
  }
}
```

#### `POST /api/extract`

```bash
curl -X POST http://localhost:3456/api/extract \
  -H "Content-Type: application/json" \
  -d '{"html": "<html>...</html>", "url": "https://example.com"}'
```

#### `POST /api/toMarkdown`

```bash
curl -X POST http://localhost:3456/api/toMarkdown \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Hello</h1>"}'
```

#### `POST /api/render`

```bash
curl -X POST http://localhost:3456/api/render \
  -H "Content-Type: application/json" \
  -d '{"template": "# {{title}}", "variables": {"title": "Hello"}}'
```

## 类型定义

### ExtractedContent

```typescript
interface ExtractedContent {
  title: string;
  author: string;
  date: string;
  description: string;
  content: string;      // HTML
  markdown: string;     // Markdown
  url: string;
  domain: string;
  favicon: string;
  image: string;
  published: string;
  site: string;
  words: number;
  metadata: Record<string, unknown>;
  highlights?: Highlight[];
  selection?: string;
}
```

### ClipOptions

```typescript
interface ClipOptions {
  template?: string;
  templateId?: string;
  outputFormat?: 'markdown' | 'html' | 'json';
  savePath?: string;
  variables?: Record<string, unknown>;
  interpret?: boolean;
}
```

### ClipResult

```typescript
interface ClipResult {
  success: boolean;
  content: string;
  filename: string;
  path?: string;
  error?: string;
  metadata: ExtractedContent;
}
```
