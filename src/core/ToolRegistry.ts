/**
 * Tool Registry - Plug & Play Architecture
 * 
 * Add new tools without changing core code!
 * 
 * Usage:
 *   registry.register('mytool', MyToolClass);
 *   registry.get('mytool').execute(params);
 */

import type { MCPTool } from '../types';

export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private categories: Map<string, string[]> = new Map();

  constructor() {
    // Initialize categories
    this.categories.set('india', []);      // India-specific
    this.categories.set('global', []);     // Works everywhere
    this.categories.set('logistics', []);  // Logistics-specific
    this.categories.set('messaging', []);  // Communication
    this.categories.set('payments', []);   // Payment tools
    this.categories.set('government', []); // Govt portals
  }

  /**
   * Register a tool
   */
  register(tool: MCPTool, category?: string): void {
    this.tools.set(tool.name, tool);
    
    if (category && this.categories.has(category)) {
      this.categories.get(category)!.push(tool.name);
    }
    
    console.log(`[ToolRegistry] ✅ Registered: ${tool.name}${category ? ` (${category})` : ''}`);
  }

  /**
   * Get a tool by name
   */
  get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAll(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): MCPTool[] {
    const toolNames = this.categories.get(category) || [];
    return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
  }

  /**
   * List available tools (for LLM)
   */
  listTools(): { name: string; description: string; category?: string }[] {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  /**
   * Get tool definitions for LLM (OpenAI/Anthropic format)
   */
  getToolDefinitions(): any[] {
    return this.getAll().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            tool.parameters.map(p => [
              p.name,
              { 
                type: p.type, 
                description: p.description,
                ...(p.default !== undefined && { default: p.default }),
              },
            ])
          ),
          required: tool.parameters.filter(p => p.required).map(p => p.name),
        },
      },
    }));
  }

  /**
   * Check if tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }
}

// Singleton
let registryInstance: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registryInstance) {
    registryInstance = new ToolRegistry();
  }
  return registryInstance;
}
