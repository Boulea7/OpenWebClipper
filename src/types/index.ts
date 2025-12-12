/**
 * Open Web Clipper - Type Definitions
 */

// Extracted content from a web page
export interface ExtractedContent {
  title: string;
  author: string;
  date: string;
  description: string;
  content: string;          // HTML content
  markdown: string;         // Markdown content
  url: string;
  domain: string;
  favicon: string;
  image: string;            // Social share image
  published: string;
  site: string;
  words: number;
  metadata: Record<string, unknown>;
  highlights?: Highlight[];
  selection?: string;
}

// Highlight data
export interface Highlight {
  text: string;
  html: string;
  timestamp: number;
  color?: string;
  note?: string;
}

// Extract options
export interface ExtractOptions {
  url?: string;
  html?: string;
  selector?: string;
  includeImages?: boolean;
  includeLinks?: boolean;
  includeHighlights?: boolean;
}

// Markdown conversion options
export interface ConvertOptions {
  headingStyle?: 'setext' | 'atx';
  hr?: string;
  bulletListMarker?: '-' | '+' | '*';
  codeBlockStyle?: 'indented' | 'fenced';
  fence?: '```' | '~~~';
  emDelimiter?: '_' | '*';
  strongDelimiter?: '__' | '**';
  linkStyle?: 'inlined' | 'referenced';
  linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
}

// Clip options
export interface ClipOptions {
  template?: string;
  templateId?: string;
  outputFormat?: 'markdown' | 'html' | 'json';
  savePath?: string;
  variables?: Record<string, unknown>;
  interpret?: boolean;
}

// Clip result
export interface ClipResult {
  success: boolean;
  content: string;
  filename: string;
  path?: string;
  error?: string;
  metadata: ExtractedContent;
}

// Template definition
export interface Template {
  id: string;
  name: string;
  behavior: 'create' | 'append-top' | 'append-bottom' | 'daily-top' | 'daily-bottom';
  noteNameFormat: string;
  notePath: string;
  properties: TemplateProperty[];
  noteContent: string;
  triggers?: string[];
  interpreterContext?: string;
}

// Template property
export interface TemplateProperty {
  name: string;
  value: string;
  type: 'text' | 'number' | 'checkbox' | 'date' | 'datetime' | 'tags' | 'aliases';
}

// Variable types
export type VariableType = 'preset' | 'prompt' | 'meta' | 'selector' | 'schema';

// Filter function type
export type FilterFunction = (value: unknown, ...args: string[]) => unknown;

// Storage data
export interface StorageData {
  templates: Template[];
  settings: Settings;
  interpreterProviders: InterpreterProvider[];
  interpreterModels: InterpreterModel[];
}

// Settings
export interface Settings {
  defaultTemplate: string;
  defaultVault: string;
  defaultPath: string;
  showNotifications: boolean;
  autoSave: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

// Interpreter provider
export interface InterpreterProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  isCustom?: boolean;
}

// Interpreter model
export interface InterpreterModel {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
}

// Message types for extension communication
export type MessageAction =
  | 'clip'
  | 'extract'
  | 'toMarkdown'
  | 'render'
  | 'getContent'
  | 'getHighlights'
  | 'interpret'
  | 'save';

export interface Message {
  action: MessageAction;
  data?: unknown;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// API types for external communication
export interface ClipperAPI {
  extract(options: ExtractOptions): Promise<ExtractedContent>;
  toMarkdown(html: string, options?: ConvertOptions): string;
  render(template: string, variables: Record<string, unknown>): string;
  clip(url: string, options?: ClipOptions): Promise<ClipResult>;
}
