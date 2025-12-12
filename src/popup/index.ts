/**
 * Popup Script
 *
 * Main UI logic for the extension popup.
 */

import browser from 'webextension-polyfill';
import type { ExtractedContent, Template } from '@/types';

// DOM Elements
const pageTitle = document.getElementById('page-title') as HTMLHeadingElement;
const pageUrl = document.getElementById('page-url') as HTMLParagraphElement;
const pageFavicon = document.getElementById('page-favicon') as HTMLDivElement;
const templateSelect = document.getElementById('template-select') as HTMLSelectElement;
const noteNameInput = document.getElementById('note-name') as HTMLInputElement;
const previewContent = document.getElementById('preview-content') as HTMLDivElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;

// State
let currentContent: ExtractedContent | null = null;
let templates: Template[] = [];

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  try {
    // Load templates
    await loadTemplates();

    // Get current tab content
    await loadPageContent();

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Failed to load page content');
  }
}

/**
 * Load templates from storage
 */
async function loadTemplates(): Promise<void> {
  const storage = await browser.storage.local.get('templates');
  templates = storage.templates || getDefaultTemplates();

  // Populate template select
  templateSelect.innerHTML = '';
  for (const template of templates) {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name;
    templateSelect.appendChild(option);
  }
}

/**
 * Get default templates
 */
function getDefaultTemplates(): Template[] {
  return [
    {
      id: 'default',
      name: 'Default',
      behavior: 'create',
      noteNameFormat: '{{title|safe_name}}',
      notePath: '',
      properties: [
        { name: 'source', value: '{{url}}', type: 'text' },
        { name: 'author', value: '{{author}}', type: 'text' },
        { name: 'published', value: '{{published|date:"YYYY-MM-DD"}}', type: 'date' },
        { name: 'created', value: '{{date|date:"YYYY-MM-DD"}}', type: 'date' },
      ],
      noteContent: '{{content}}',
    },
  ];
}

/**
 * Load page content from active tab
 */
async function loadPageContent(): Promise<void> {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getContent' });

    if (!response.success) {
      throw new Error(response.error || 'Failed to get content');
    }

    currentContent = response.data as ExtractedContent;
    updateUI();
  } catch (error) {
    console.error('Failed to load page content:', error);

    // Try to get basic info from current tab
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      pageTitle.textContent = tab.title || 'Unknown';
      pageUrl.textContent = tab.url || '';

      if (tab.favIconUrl) {
        pageFavicon.innerHTML = `<img src="${tab.favIconUrl}" alt="" width="16" height="16">`;
      }
    }

    showError('Could not extract page content. Make sure the page is fully loaded.');
  }
}

/**
 * Update UI with loaded content
 */
function updateUI(): void {
  if (!currentContent) return;

  // Update page info
  pageTitle.textContent = currentContent.title || 'Untitled';
  pageUrl.textContent = currentContent.url;

  if (currentContent.favicon) {
    pageFavicon.innerHTML = `<img src="${currentContent.favicon}" alt="" width="16" height="16">`;
  }

  // Update note name
  noteNameInput.value = sanitizeFileName(currentContent.title);

  // Update preview
  updatePreview();
}

/**
 * Update preview content
 */
function updatePreview(): void {
  if (!currentContent) return;

  // Show first 500 characters of markdown
  const preview = currentContent.markdown.slice(0, 500);
  previewContent.innerHTML = `<pre>${escapeHtml(preview)}${currentContent.markdown.length > 500 ? '...' : ''}</pre>`;
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Template change
  templateSelect.addEventListener('change', () => {
    updatePreview();
  });

  // Copy button
  copyBtn.addEventListener('click', handleCopy);

  // Save button
  saveBtn.addEventListener('click', handleSave);

  // Settings button
  settingsBtn.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
}

/**
 * Handle copy action
 */
async function handleCopy(): Promise<void> {
  if (!currentContent) return;

  try {
    await navigator.clipboard.writeText(currentContent.markdown);
    showSuccess('Copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy:', error);
    showError('Failed to copy to clipboard');
  }
}

/**
 * Handle save action
 */
async function handleSave(): Promise<void> {
  if (!currentContent) return;

  try {
    const filename = noteNameInput.value || sanitizeFileName(currentContent.title);

    // Create blob and download
    const blob = new Blob([currentContent.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    await browser.downloads.download({
      url,
      filename: `${filename}.md`,
      saveAs: true,
    });

    showSuccess('Saved successfully!');
  } catch (error) {
    console.error('Failed to save:', error);
    showError('Failed to save file');
  }
}

/**
 * Show success message
 */
function showSuccess(message: string): void {
  // Simple notification - could be improved with toast
  saveBtn.textContent = '✓ ' + message;
  setTimeout(() => {
    saveBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      Save
    `;
  }, 2000);
}

/**
 * Show error message
 */
function showError(message: string): void {
  previewContent.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
}

/**
 * Sanitize file name
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
