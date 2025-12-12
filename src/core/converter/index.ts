/**
 * Markdown Converter Module
 *
 * Converts HTML to Markdown using turndown library.
 */

import type { ConvertOptions } from '@/types';

// Will use turndown for HTML to Markdown conversion
// import TurndownService from 'turndown';
// import { gfm } from 'turndown-plugin-gfm';

export class MarkdownConverter {
  private defaultOptions: ConvertOptions = {
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
  };

  /**
   * Convert HTML to Markdown
   */
  convert(html: string, options?: ConvertOptions): string {
    const opts = { ...this.defaultOptions, ...options };

    // Simple HTML to Markdown conversion
    // In production, we'll use turndown with GFM plugin
    let markdown = html;

    // Convert headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Convert bold
    markdown = markdown.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, `${opts.strongDelimiter}$2${opts.strongDelimiter}`);

    // Convert italic
    markdown = markdown.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, `${opts.emDelimiter}$2${opts.emDelimiter}`);

    // Convert links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert images
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

    // Convert unordered lists
    markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, `${opts.bulletListMarker} $1\n`) + '\n';
    });

    // Convert ordered lists
    let listCounter = 0;
    markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
      listCounter = 0;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
        listCounter++;
        return `${listCounter}. $1\n`;
      }) + '\n';
    });

    // Convert code blocks
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, `${opts.fence}\n$1\n${opts.fence}\n\n`);

    // Convert inline code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
      return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n';
    });

    // Convert horizontal rules
    markdown = markdown.replace(/<hr[^>]*\/?>/gi, `\n${opts.hr}\n\n`);

    // Convert line breaks
    markdown = markdown.replace(/<br[^>]*\/?>/gi, '\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    markdown = this.decodeHtmlEntities(markdown);

    // Clean up whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    markdown = markdown.trim();

    return markdown;
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '…',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
    };

    let result = text;
    for (const [entity, char] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, 'g'), char);
    }

    // Decode numeric entities
    result = result.replace(/&#(\d+);/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 10));
    });

    result = result.replace(/&#x([0-9a-f]+);/gi, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });

    return result;
  }
}
