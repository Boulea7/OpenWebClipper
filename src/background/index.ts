/**
 * Background Service Worker
 *
 * Handles extension background tasks, message routing, and external API.
 */

import browser from 'webextension-polyfill';
import type { Message, MessageResponse, ExtractedContent, ClipOptions } from '@/types';
import { Clipper } from '@/api';

// Initialize clipper instance
const clipper = new Clipper();

/**
 * Handle messages from content scripts and popup
 */
browser.runtime.onMessage.addListener(
  async (message: Message, sender): Promise<MessageResponse> => {
    try {
      switch (message.action) {
        case 'clip':
          return await handleClip(message.data as { url: string; options?: ClipOptions });

        case 'extract':
          return await handleExtract(message.data as { html: string; url: string });

        case 'toMarkdown':
          return handleToMarkdown(message.data as { html: string });

        case 'render':
          return handleRender(message.data as { template: string; variables: Record<string, unknown> });

        case 'getContent':
          return await handleGetContent(sender.tab?.id);

        default:
          return { success: false, error: `Unknown action: ${message.action}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

/**
 * Handle external messages from other extensions
 */
browser.runtime.onMessageExternal.addListener(
  async (message: Message, sender): Promise<MessageResponse> => {
    // Validate sender (optional - could whitelist specific extension IDs)
    console.log(`External message from: ${sender.id}`);

    // Process the message same as internal messages
    return browser.runtime.sendMessage(message);
  }
);

/**
 * Handle clip action
 */
async function handleClip(data: { url: string; options?: ClipOptions }): Promise<MessageResponse> {
  const result = await clipper.clip(data.url, data.options);
  return { success: result.success, data: result, error: result.error };
}

/**
 * Handle extract action
 */
async function handleExtract(data: { html: string; url: string }): Promise<MessageResponse> {
  const content = await clipper.extract({ html: data.html, url: data.url });
  return { success: true, data: content };
}

/**
 * Handle toMarkdown action
 */
function handleToMarkdown(data: { html: string }): MessageResponse {
  const markdown = clipper.toMarkdown(data.html);
  return { success: true, data: markdown };
}

/**
 * Handle render action
 */
function handleRender(data: { template: string; variables: Record<string, unknown> }): MessageResponse {
  const rendered = clipper.render(data.template, data.variables);
  return { success: true, data: rendered };
}

/**
 * Handle getContent action - get content from active tab
 */
async function handleGetContent(tabId?: number): Promise<MessageResponse<ExtractedContent>> {
  if (!tabId) {
    return { success: false, error: 'No active tab' };
  }

  try {
    // Send message to content script to get page content
    const response = await browser.tabs.sendMessage(tabId, { action: 'getPageContent' });
    return { success: true, data: response as ExtractedContent };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get content',
    };
  }
}

/**
 * Create context menu items
 */
browser.runtime.onInstalled.addListener(() => {
  // Create context menu for quick clip
  browser.contextMenus.create({
    id: 'quick-clip',
    title: 'Clip Page',
    contexts: ['page'],
  });

  // Create context menu for clip selection
  browser.contextMenus.create({
    id: 'clip-selection',
    title: 'Clip Selection',
    contexts: ['selection'],
  });
});

/**
 * Handle context menu clicks
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case 'quick-clip':
      // Open popup or trigger quick clip
      await browser.action.openPopup();
      break;

    case 'clip-selection':
      // Clip the selected text
      if (info.selectionText) {
        await browser.tabs.sendMessage(tab.id, {
          action: 'clipSelection',
          data: { text: info.selectionText },
        });
      }
      break;
  }
});

/**
 * Handle keyboard shortcuts
 */
browser.commands.onCommand.addListener(async (command) => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  switch (command) {
    case 'quick_clip':
      // Trigger quick clip
      await browser.tabs.sendMessage(tab.id, { action: 'quickClip' });
      break;
  }
});

console.log('Open Web Clipper background script loaded');
