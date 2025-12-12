# Open Web Clipper 模板语法文档

## 概述

模板系统允许你自定义裁剪内容的格式。模板使用 `{{variable}}` 语法引用变量，并可以通过过滤器 `{{variable|filter}}` 转换值。

## 基本语法

### 变量

```
{{variableName}}
```

### 过滤器

```
{{variableName|filterName}}
{{variableName|filterName:"argument"}}
{{variableName|filter1|filter2}}
```

### 示例模板

```markdown
---
title: {{title}}
source: {{url}}
author: {{author}}
date: {{date|date:"YYYY-MM-DD"}}
tags:
---

# {{title}}

> {{description}}

{{content}}

---
Clipped from [{{site}}]({{url}}) on {{date|date:"YYYY-MM-DD HH:mm"}}
```

## 变量类型

### 预设变量

| 变量 | 说明 |
|------|------|
| `{{title}}` | 页面标题 |
| `{{author}}` | 作者 |
| `{{content}}` | 正文内容 (Markdown) |
| `{{contentHtml}}` | 正文内容 (HTML) |
| `{{description}}` | 页面描述 |
| `{{url}}` | 页面 URL |
| `{{domain}}` | 域名 |
| `{{site}}` | 站点名称 |
| `{{favicon}}` | Favicon URL |
| `{{image}}` | 社交分享图 |
| `{{published}}` | 发布日期 |
| `{{date}}` | 当前日期时间 |
| `{{selection}}` | 选中的文本 |
| `{{highlights}}` | 高亮内容 |
| `{{words}}` | 字数 |

### Meta 变量

提取页面 `<meta>` 标签内容：

```
{{meta:name:description}}     // <meta name="description">
{{meta:name:author}}          // <meta name="author">
{{meta:property:og:title}}    // <meta property="og:title">
{{meta:property:og:image}}    // <meta property="og:image">
```

### Selector 变量

使用 CSS 选择器提取内容：

```
{{selector:h1}}               // 第一个 h1 元素的文本
{{selector:.author}}          // class="author" 元素的文本
{{selector:img.hero?src}}     // img.hero 的 src 属性
{{selectorHtml:article}}      // article 元素的 HTML
```

### Schema.org 变量

提取 Schema.org JSON-LD 数据：

```
{{schema:@Article:author}}    // Article 的 author
{{schema:@Recipe:name}}       // Recipe 的 name
{{schema:author}}             // 任意类型的 author
{{schema:author.name}}        // 嵌套属性
```

### Prompt 变量

使用 AI 提取/生成内容（需启用 Interpreter）：

```
{{"summarize this page"}}
{{"list the main points"}}
{{"translate to Chinese"}}
{{"a summary of the page"|blockquote}}
```

## 模板行为

### 创建新笔记

```json
{
  "behavior": "create",
  "noteNameFormat": "{{title|safe_name}}",
  "notePath": "Clippings/"
}
```

### 追加到现有笔记

```json
{
  "behavior": "append-top",
  "noteNameFormat": "Reading List"
}
```

### 追加到 Daily Note

```json
{
  "behavior": "daily-bottom",
  "noteNameFormat": "{{date|date:\"YYYY-MM-DD\"}}"
}
```

## 模板触发器

自动选择模板的规则：

### URL 匹配

```
https://github.com           // 以此开头的 URL
https://twitter.com/*/status // 包含通配符
```

### 正则表达式

```
/^https:\/\/www\.youtube\.com\/watch/
/^https:\/\/.*\.notion\.site\//
```

### Schema.org 匹配

```
schema:@Recipe              // 有 Recipe 类型
schema:@Article             // 有 Article 类型
schema:@Product.price       // 有 Product 且包含 price
```

## 完整示例

### 文章模板

```markdown
---
title: "{{title}}"
source: "{{url}}"
author: "{{author}}"
published: {{published|date:"YYYY-MM-DD"|default:"unknown"}}
clipped: {{date|date:"YYYY-MM-DD HH:mm"}}
tags: [clipping, {{domain|replace:"www.":""|replace:".com":""}}]
---

# {{title}}

{{description|blockquote}}

{{content}}

---

Source: [{{site|default:domain}}]({{url}})
```

### GitHub 仓库模板

```markdown
---
title: "{{selector:article h1}}"
repo: "{{url}}"
stars: "{{selector:.Counter|first}}"
language: "{{selector:[itemprop=programmingLanguage]}}"
---

# {{selector:article h1}}

{{selector:.markdown-body|selectorHtml|markdown}}

---

[View on GitHub]({{url}})
```

### 视频模板

```markdown
---
title: "{{title}}"
url: "{{url}}"
channel: "{{meta:property:og:site_name}}"
duration: "{{schema:@VideoObject:duration|duration}}"
---

# {{title}}

![Thumbnail]({{image}})

{{description}}

[Watch Video]({{url}})
```
