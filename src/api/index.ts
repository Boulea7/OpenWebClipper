/**
 * Open Web Clipper - Public API
 *
 * This module provides the main API for external consumers.
 * It can be used as:
 * 1. NPM package import
 * 2. Browser extension message API
 * 3. Local HTTP API server
 */

import type {
  ClipperAPI,
  ExtractOptions,
  ExtractedContent,
  ConvertOptions,
  ClipOptions,
  ClipResult,
} from '@/types';

import { ContentExtractor } from '@/core/extractor';
import { MarkdownConverter } from '@/core/converter';
import { TemplateEngine } from '@/core/template';

/**
 * Main Clipper API class
 */
export class Clipper implements ClipperAPI {
  private extractor: ContentExtractor;
  private converter: MarkdownConverter;
  private templateEngine: TemplateEngine;

  constructor() {
    this.extractor = new ContentExtractor();
    this.converter = new MarkdownConverter();
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Extract content from a URL or HTML string
   */
  async extract(options: ExtractOptions): Promise<ExtractedContent> {
    return this.extractor.extract(options);
  }

  /**
   * Convert HTML to Markdown
   */
  toMarkdown(html: string, options?: ConvertOptions): string {
    return this.converter.convert(html, options);
  }

  /**
   * Render a template with variables
   */
  render(template: string, variables: Record<string, unknown>): string {
    return this.templateEngine.render(template, variables);
  }

  /**
   * Full clip workflow: extract + convert + render template
   */
  async clip(url: string, options?: ClipOptions): Promise<ClipResult> {
    try {
      // Extract content
      const content = await this.extract({ url });

      // Apply template if provided
      let output: string;
      if (options?.template) {
        const variables = {
          ...content,
          ...options.variables,
        };
        output = this.render(options.template, variables);
      } else {
        output = content.markdown;
      }

      // Determine filename
      const filename = this.generateFilename(content.title);

      return {
        success: true,
        content: output,
        filename,
        path: options?.savePath,
        metadata: content,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {} as ExtractedContent,
      };
    }
  }

  /**
   * Generate a safe filename from title
   */
  private generateFilename(title: string): string {
    return title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200) + '.md';
  }
}

// Export singleton instance
export const clipper = new Clipper();

// Export individual functions for convenience
export const extract = clipper.extract.bind(clipper);
export const toMarkdown = clipper.toMarkdown.bind(clipper);
export const render = clipper.render.bind(clipper);
export const clip = clipper.clip.bind(clipper);

// Re-export types
export * from '@/types';

// Re-export individual modules for advanced usage
export { ContentExtractor } from '@/core/extractor';
export { MarkdownConverter } from '@/core/converter';
export { TemplateEngine } from '@/core/template';
export { FilterProcessor } from '@/core/template/filters';
export { VariableProcessor } from '@/core/template/variables';
