/**
 * Content Extractor Module
 *
 * Extracts content and metadata from web pages using defuddle library.
 */

import type { ExtractOptions, ExtractedContent } from '@/types';

// Will use defuddle for content extraction
// import { defuddle } from 'defuddle';

export class ContentExtractor {
  /**
   * Extract content from a URL or HTML string
   */
  async extract(options: ExtractOptions): Promise<ExtractedContent> {
    const { url, html, selector } = options;

    // If HTML is provided directly, parse it
    if (html) {
      return this.extractFromHtml(html, url || '');
    }

    // If URL is provided, we need to fetch the content first
    // This will be handled by the content script in browser context
    if (url) {
      return this.extractFromUrl(url);
    }

    throw new Error('Either url or html must be provided');
  }

  /**
   * Extract content from HTML string
   */
  private extractFromHtml(html: string, url: string): ExtractedContent {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract metadata
    const title = this.extractTitle(doc);
    const author = this.extractMeta(doc, 'author');
    const description = this.extractDescription(doc);
    const published = this.extractPublishedDate(doc);
    const image = this.extractImage(doc);
    const favicon = this.extractFavicon(doc, url);
    const site = this.extractSiteName(doc);

    // Extract main content
    const content = this.extractMainContent(doc);

    // Convert to markdown (placeholder - will use converter)
    const markdown = content; // Will be converted by MarkdownConverter

    // Calculate word count
    const words = this.countWords(content);

    // Parse URL
    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch {
      // Invalid URL
    }

    return {
      title,
      author,
      date: new Date().toISOString(),
      description,
      content,
      markdown,
      url,
      domain,
      favicon,
      image,
      published,
      site,
      words,
      metadata: {
        ogTitle: this.extractMeta(doc, 'og:title', 'property'),
        ogDescription: this.extractMeta(doc, 'og:description', 'property'),
        ogImage: this.extractMeta(doc, 'og:image', 'property'),
        twitterTitle: this.extractMeta(doc, 'twitter:title'),
        twitterDescription: this.extractMeta(doc, 'twitter:description'),
      },
    };
  }

  /**
   * Extract content from URL (to be implemented with fetch)
   */
  private async extractFromUrl(url: string): Promise<ExtractedContent> {
    // This will be called from content script context
    // where we have access to the page DOM
    throw new Error('URL extraction should be handled by content script');
  }

  /**
   * Extract page title
   */
  private extractTitle(doc: Document): string {
    // Try og:title first
    const ogTitle = this.extractMeta(doc, 'og:title', 'property');
    if (ogTitle) return ogTitle;

    // Try twitter:title
    const twitterTitle = this.extractMeta(doc, 'twitter:title');
    if (twitterTitle) return twitterTitle;

    // Fallback to title tag
    return doc.title || '';
  }

  /**
   * Extract meta tag content
   */
  private extractMeta(
    doc: Document,
    name: string,
    attribute: 'name' | 'property' = 'name'
  ): string {
    const meta = doc.querySelector(`meta[${attribute}="${name}"]`);
    return meta?.getAttribute('content') || '';
  }

  /**
   * Extract description
   */
  private extractDescription(doc: Document): string {
    // Try og:description
    const ogDesc = this.extractMeta(doc, 'og:description', 'property');
    if (ogDesc) return ogDesc;

    // Try meta description
    const metaDesc = this.extractMeta(doc, 'description');
    if (metaDesc) return metaDesc;

    // Try twitter:description
    return this.extractMeta(doc, 'twitter:description');
  }

  /**
   * Extract published date
   */
  private extractPublishedDate(doc: Document): string {
    // Try various date meta tags
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[name="DC.date"]',
      'meta[name="pubdate"]',
      'time[datetime]',
    ];

    for (const selector of dateSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const date = element.getAttribute('content') ||
                     element.getAttribute('datetime');
        if (date) return date;
      }
    }

    return '';
  }

  /**
   * Extract share image
   */
  private extractImage(doc: Document): string {
    // Try og:image
    const ogImage = this.extractMeta(doc, 'og:image', 'property');
    if (ogImage) return ogImage;

    // Try twitter:image
    return this.extractMeta(doc, 'twitter:image');
  }

  /**
   * Extract favicon
   */
  private extractFavicon(doc: Document, url: string): string {
    // Try link rel="icon"
    const iconLink = doc.querySelector('link[rel="icon"]') ||
                     doc.querySelector('link[rel="shortcut icon"]');
    if (iconLink) {
      const href = iconLink.getAttribute('href');
      if (href) {
        // Make absolute URL
        try {
          return new URL(href, url).href;
        } catch {
          return href;
        }
      }
    }

    // Fallback to /favicon.ico
    try {
      return new URL('/favicon.ico', url).href;
    } catch {
      return '';
    }
  }

  /**
   * Extract site name
   */
  private extractSiteName(doc: Document): string {
    // Try og:site_name
    const siteName = this.extractMeta(doc, 'og:site_name', 'property');
    if (siteName) return siteName;

    // Try application-name
    return this.extractMeta(doc, 'application-name');
  }

  /**
   * Extract main content (placeholder - will use defuddle)
   */
  private extractMainContent(doc: Document): string {
    // This is a simplified implementation
    // In production, we'll use defuddle for better content extraction

    // Try common article selectors
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        return element.innerHTML;
      }
    }

    // Fallback to body
    return doc.body?.innerHTML || '';
  }

  /**
   * Count words in HTML content
   */
  private countWords(html: string): number {
    // Strip HTML tags and count words
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }
}
