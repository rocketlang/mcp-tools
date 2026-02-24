/**
 * MCP Server - Tool orchestration for LLMs
 * 
 * This server exposes tools to LLMs in MCP format
 * Compatible with Anthropic's MCP specification
 */

import type { MCPTool, MCPResult, MCPToolCall } from '../types';

export class MCPServer {
  private tools: Map<string, MCPTool> = new Map();

  constructor() {
    console.log('[MCPServer] Initialized');
  }

  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    console.log(`[MCPServer] Registered tool: ${tool.name}`);
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): any[] {
    return this.getTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: Object.fromEntries(
          tool.parameters.map(p => [
            p.name,
            { type: p.type, description: p.description },
          ])
        ),
        required: tool.parameters.filter(p => p.required).map(p => p.name),
      },
    }));
  }

  async executeTool(toolCall: MCPToolCall): Promise<MCPResult> {
    const tool = this.tools.get(toolCall.tool);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolCall.tool}`,
        metadata: { tool: toolCall.tool, duration_ms: 0 },
      };
    }

    return tool.execute(toolCall.parameters);
  }

  async executeTools(toolCalls: MCPToolCall[]): Promise<MCPResult[]> {
    return Promise.all(toolCalls.map(tc => this.executeTool(tc)));
  }
}

// Singleton instance
let serverInstance: MCPServer | null = null;

export function getMCPServer(): MCPServer {
  if (!serverInstance) {
    serverInstance = new MCPServer();
  }
  return serverInstance;
}

export function createMCPServer(): MCPServer {
  return new MCPServer();
}
