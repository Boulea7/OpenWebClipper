/**
 * Filter Processor Module
 *
 * Provides filters for transforming variable values in templates.
 */

import type { FilterFunction } from '@/types';

export class FilterProcessor {
  private filters: Map<string, FilterFunction>;

  constructor() {
    this.filters = new Map();
    this.registerBuiltinFilters();
  }

  /**
   * Register a custom filter
   */
  register(name: string, fn: FilterFunction): void {
    this.filters.set(name, fn);
  }

  /**
   * Apply a filter to a value
   */
  apply(name: string, value: unknown, ...args: string[]): unknown {
    const filter = this.filters.get(name);
    if (!filter) {
      console.warn(`Unknown filter: ${name}`);
      return value;
    }
    return filter(value, ...args);
  }

  /**
   * Register all built-in filters
   */
  private registerBuiltinFilters(): void {
    // Date filters
    this.register('date', (value, format = 'YYYY-MM-DD') => {
      const date = new Date(String(value));
      if (isNaN(date.getTime())) return value;
      // Simple date formatting (use dayjs in production)
      return format
        .replace('YYYY', String(date.getFullYear()))
        .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(date.getDate()).padStart(2, '0'))
        .replace('HH', String(date.getHours()).padStart(2, '0'))
        .replace('mm', String(date.getMinutes()).padStart(2, '0'))
        .replace('ss', String(date.getSeconds()).padStart(2, '0'));
    });

    // Text case filters
    this.register('lower', (value) => String(value).toLowerCase());
    this.register('upper', (value) => String(value).toUpperCase());
    this.register('capitalize', (value) => {
      const str = String(value);
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });
    this.register('title', (value) => {
      return String(value).replace(/\b\w/g, (c) => c.toUpperCase());
    });

    // Text transformation filters
    this.register('trim', (value) => String(value).trim());
    this.register('replace', (value, search, replace = '') => {
      return String(value).replace(new RegExp(search, 'g'), replace);
    });
    this.register('slice', (value, start, end) => {
      const str = String(value);
      return str.slice(Number(start), end ? Number(end) : undefined);
    });

    // Case conversion filters
    this.register('camel', (value) => {
      return String(value)
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^./, (c) => c.toLowerCase());
    });
    this.register('pascal', (value) => {
      return String(value)
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^./, (c) => c.toUpperCase());
    });
    this.register('snake', (value) => {
      return String(value)
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
    });
    this.register('kebab', (value) => {
      return String(value)
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase();
    });

    // File name filter
    this.register('safe_name', (value) => {
      return String(value)
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    });

    // Markdown formatting filters
    this.register('blockquote', (value) => {
      return String(value)
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    });
    this.register('wikilink', (value, alias) => {
      if (Array.isArray(value)) {
        return value.map((v) => `[[${v}]]`);
      }
      if (alias) {
        return `[[${value}|${alias}]]`;
      }
      return `[[${value}]]`;
    });
    this.register('link', (value, text) => {
      if (text) {
        return `[${text}](${value})`;
      }
      return `[${value}](${value})`;
    });

    // Array filters
    this.register('join', (value, separator = ', ') => {
      if (Array.isArray(value)) {
        return value.join(separator);
      }
      return value;
    });
    this.register('split', (value, separator = ',') => {
      return String(value).split(separator);
    });
    this.register('first', (value) => {
      if (Array.isArray(value)) {
        return value[0];
      }
      return value;
    });
    this.register('last', (value) => {
      if (Array.isArray(value)) {
        return value[value.length - 1];
      }
      return value;
    });
    this.register('unique', (value) => {
      if (Array.isArray(value)) {
        return [...new Set(value)];
      }
      return value;
    });

    // List formatting filter
    this.register('list', (value, type = 'bullet') => {
      if (!Array.isArray(value)) return value;

      return value
        .map((item, index) => {
          switch (type) {
            case 'numbered':
              return `${index + 1}. ${item}`;
            case 'task':
              return `- [ ] ${item}`;
            case 'numbered-task':
              return `${index + 1}. [ ] ${item}`;
            default:
              return `- ${item}`;
          }
        })
        .join('\n');
    });

    // Length filter
    this.register('length', (value) => {
      if (Array.isArray(value) || typeof value === 'string') {
        return value.length;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length;
      }
      return 0;
    });

    // Default filter
    this.register('default', (value, defaultValue = '') => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      return value;
    });

    // JSON filters
    this.register('json', (value) => JSON.stringify(value, null, 2));
    this.register('parse_json', (value) => {
      try {
        return JSON.parse(String(value));
      } catch {
        return value;
      }
    });

    // HTML strip filter
    this.register('strip_html', (value) => {
      return String(value).replace(/<[^>]*>/g, '');
    });

    // Markdown strip filter
    this.register('strip_md', (value) => {
      return String(value)
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#+\s*/gm, '')
        .replace(/^>\s*/gm, '')
        .replace(/^[-*+]\s*/gm, '')
        .replace(/^\d+\.\s*/gm, '');
    });
  }
}
