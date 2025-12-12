/**
 * Variable Processor Module
 *
 * Resolves variable references in templates.
 */

export class VariableProcessor {
  /**
   * Resolve a variable name to its value
   */
  resolve(name: string, variables: Record<string, unknown>): unknown {
    // Check for prompt variable (starts with quotes)
    if (name.startsWith('"') && name.endsWith('"')) {
      // Prompt variables need interpreter - return placeholder
      return `{{${name}}}`;
    }

    // Check for meta variable
    if (name.startsWith('meta:')) {
      return this.resolveMeta(name.slice(5), variables);
    }

    // Check for selector variable
    if (name.startsWith('selector:')) {
      return this.resolveSelector(name.slice(9), variables);
    }

    // Check for selectorHtml variable
    if (name.startsWith('selectorHtml:')) {
      return this.resolveSelectorHtml(name.slice(13), variables);
    }

    // Check for schema variable
    if (name.startsWith('schema:')) {
      return this.resolveSchema(name.slice(7), variables);
    }

    // Resolve nested property (e.g., "metadata.author")
    return this.resolveProperty(name, variables);
  }

  /**
   * Resolve a nested property path
   */
  private resolveProperty(path: string, obj: Record<string, unknown>): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return '';
      }

      // Handle array index notation
      const match = part.match(/^(\w+)\[(\d+|\*)\]$/);
      if (match) {
        const [, key, index] = match;
        current = (current as Record<string, unknown>)[key];

        if (Array.isArray(current)) {
          if (index === '*') {
            // Return all items
            return current;
          } else {
            current = current[parseInt(index, 10)];
          }
        }
      } else {
        current = (current as Record<string, unknown>)[part];
      }
    }

    return current ?? '';
  }

  /**
   * Resolve meta variable (from page meta tags)
   */
  private resolveMeta(expression: string, variables: Record<string, unknown>): unknown {
    const metadata = variables.metadata as Record<string, unknown> | undefined;
    if (!metadata) return '';

    // Handle meta:name:value or meta:property:value
    const parts = expression.split(':');
    if (parts.length >= 2) {
      const [type, name] = parts;
      if (type === 'name' || type === 'property') {
        return metadata[`meta_${type}_${name}`] ?? '';
      }
    }

    return metadata[expression] ?? '';
  }

  /**
   * Resolve selector variable (CSS selector)
   */
  private resolveSelector(selector: string, variables: Record<string, unknown>): unknown {
    // Selector resolution is handled by content script
    // Here we just return a placeholder if not pre-resolved
    const selectors = variables._selectors as Record<string, unknown> | undefined;
    if (selectors && selectors[selector]) {
      return selectors[selector];
    }
    return '';
  }

  /**
   * Resolve selectorHtml variable
   */
  private resolveSelectorHtml(selector: string, variables: Record<string, unknown>): unknown {
    const selectorsHtml = variables._selectorsHtml as Record<string, unknown> | undefined;
    if (selectorsHtml && selectorsHtml[selector]) {
      return selectorsHtml[selector];
    }
    return '';
  }

  /**
   * Resolve schema.org variable
   */
  private resolveSchema(expression: string, variables: Record<string, unknown>): unknown {
    const schema = variables._schema as Record<string, unknown> | undefined;
    if (!schema) return '';

    // Parse schema expression (e.g., "@Recipe:author" or just "author")
    if (expression.startsWith('@')) {
      const colonIndex = expression.indexOf(':');
      if (colonIndex > -1) {
        const type = expression.slice(1, colonIndex);
        const path = expression.slice(colonIndex + 1);
        const schemaType = schema[type] as Record<string, unknown> | undefined;
        if (schemaType) {
          return this.resolveProperty(path, schemaType);
        }
      }
    } else {
      // Search all schema types for the property
      for (const type of Object.values(schema)) {
        if (typeof type === 'object' && type !== null) {
          const value = this.resolveProperty(expression, type as Record<string, unknown>);
          if (value !== '') {
            return value;
          }
        }
      }
    }

    return '';
  }
}
