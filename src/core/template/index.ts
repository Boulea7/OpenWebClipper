/**
 * Template Engine Module
 *
 * Processes templates with variable substitution and filters.
 */

import type { Template } from '@/types';
import { FilterProcessor } from './filters';
import { VariableProcessor } from './variables';

export class TemplateEngine {
  private filterProcessor: FilterProcessor;
  private variableProcessor: VariableProcessor;

  constructor() {
    this.filterProcessor = new FilterProcessor();
    this.variableProcessor = new VariableProcessor();
  }

  /**
   * Render a template with variables
   */
  render(template: string, variables: Record<string, unknown>): string {
    // Process all variable placeholders
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      return this.processExpression(expression.trim(), variables);
    });
  }

  /**
   * Process a single expression (variable + filters)
   */
  private processExpression(
    expression: string,
    variables: Record<string, unknown>
  ): string {
    // Split expression into variable and filters
    const parts = this.parseExpression(expression);
    const variableName = parts[0];
    const filters = parts.slice(1);

    // Get variable value
    let value = this.variableProcessor.resolve(variableName, variables);

    // Apply filters
    for (const filter of filters) {
      const { name, args } = this.parseFilter(filter);
      value = this.filterProcessor.apply(name, value, ...args);
    }

    // Convert to string
    return this.stringify(value);
  }

  /**
   * Parse expression into variable and filters
   */
  private parseExpression(expression: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let depth = 0;

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];

      if ((char === '"' || char === "'") && expression[i - 1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        }
        current += char;
      } else if (char === '(' && !inQuotes) {
        depth++;
        current += char;
      } else if (char === ')' && !inQuotes) {
        depth--;
        current += char;
      } else if (char === '|' && !inQuotes && depth === 0) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  /**
   * Parse a filter string into name and arguments
   */
  private parseFilter(filter: string): { name: string; args: string[] } {
    const colonIndex = filter.indexOf(':');
    if (colonIndex === -1) {
      return { name: filter, args: [] };
    }

    const name = filter.slice(0, colonIndex).trim();
    const argsString = filter.slice(colonIndex + 1).trim();

    // Parse arguments
    const args = this.parseFilterArgs(argsString);

    return { name, args };
  }

  /**
   * Parse filter arguments
   */
  private parseFilterArgs(argsString: string): string[] {
    // Handle parenthesized arguments
    if (argsString.startsWith('(') && argsString.endsWith(')')) {
      argsString = argsString.slice(1, -1);
    }

    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let depth = 0;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if ((char === '"' || char === "'") && argsString[i - 1] !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        }
        current += char;
      } else if (char === '(' && !inQuotes) {
        depth++;
        current += char;
      } else if (char === ')' && !inQuotes) {
        depth--;
        current += char;
      } else if (char === ',' && !inQuotes && depth === 0) {
        if (current.trim()) {
          args.push(this.unquote(current.trim()));
        }
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(this.unquote(current.trim()));
    }

    return args;
  }

  /**
   * Remove quotes from a string
   */
  private unquote(str: string): string {
    if ((str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))) {
      return str.slice(1, -1);
    }
    return str;
  }

  /**
   * Convert value to string
   */
  private stringify(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}

// Re-export sub-modules
export { FilterProcessor } from './filters';
export { VariableProcessor } from './variables';
