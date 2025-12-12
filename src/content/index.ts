/**
 * Content Script
 *
 * Runs in the context of web pages to extract content and handle highlights.
 */

import browser from 'webextension-polyfill';
import type { ExtractedContent, Message } from '@/types';
import { ContentExtractor } from '@/core/extractor';
import { MarkdownConverter } from '@/core/converter';

// Initialize modules
const extractor = new ContentExtractor();
const converter = new MarkdownConverter();

/**
 * Listen for messages from background script
 */
browser.runtime.onMessage.addListener(async (message: Message) => {
  switch (message.action) {
    case 'getPageContent':
      return getPageContent();

    case 'clipSelection':
      return clipSelection(message.data as { text: string });

    case 'quickClip':
      return quickClip();

    case 'highlight':
      return handleHighlight(message.data as { color?: string });

    default:
      return { success: false, error: `Unknown action: ${message.action}` };
  }
});

/**
 * Get full page content
 */
async function getPageContent(): Promise<ExtractedContent> {
  const html = document.documentElement.outerHTML;
  const url = window.location.href;

  // Extract content
  const content = await extractor.extract({ html, url });

  // Convert to markdown
  content.markdown = converter.convert(content.content);

  // Get selection if any
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    content.selection = selection.toString();
  }

  return content;
}

/**
 * Clip selected text
 */
async function clipSelection(data: { text: string }): Promise<{ success: boolean; content: string }> {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) {
    return { success: false, content: '' };
  }

  // Get the selection HTML
  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const div = document.createElement('div');
  div.appendChild(fragment);
  const html = div.innerHTML;

  // Convert to markdown
  const markdown = converter.convert(html);

  return { success: true, content: markdown };
}

/**
 * Quick clip - clip page with default template
 */
async function quickClip(): Promise<{ success: boolean }> {
  const content = await getPageContent();

  // Send to background for processing
  await browser.runtime.sendMessage({
    action: 'clip',
    data: { url: window.location.href, content },
  });

  return { success: true };
}

/**
 * Handle highlight request
 */
function handleHighlight(data: { color?: string }): { success: boolean } {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) {
    return { success: false };
  }

  const range = selection.getRangeAt(0);
  const highlight = document.createElement('mark');
  highlight.className = 'owc-highlight';
  highlight.style.backgroundColor = data.color || '#ffff00';
  highlight.setAttribute('data-owc-highlight', Date.now().toString());

  try {
    range.surroundContents(highlight);
    selection.removeAllRanges();
    return { success: true };
  } catch (error) {
    // Handle case where selection spans multiple elements
    console.error('Failed to highlight:', error);
    return { success: false };
  }
}

/**
 * Inject highlight styles
 */
function injectStyles(): void {
  if (document.getElementById('owc-styles')) return;

  const style = document.createElement('style');
  style.id = 'owc-styles';
  style.textContent = `
    .owc-highlight {
      background-color: #ffff00;
      padding: 0 2px;
      border-radius: 2px;
    }
    .owc-highlight:hover {
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

// Initialize
injectStyles();
console.log('Open Web Clipper content script loaded');
