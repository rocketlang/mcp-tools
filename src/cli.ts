#!/usr/bin/env node
/**
 * PowerBox MCP Server - Standalone CLI
 *
 * Run as MCP server for Claude Desktop, Cursor, or any MCP-compatible client
 *
 * Usage:
 *   npx @powerpbox/mcp
 *   powerpbox-mcp
 *
 * Environment variables:
 *   LOGISTICS_RAG_URL - LogisticsRAG API endpoint (default: http://localhost:4005)
 *   DATABASE_URL - PostgreSQL connection for EON
 *   TELEGRAM_BOT_TOKEN - Telegram bot token
 *   WHATSAPP_TOKEN - WhatsApp API token
 *
 * @package @powerpbox/mcp
 * @version 1.3.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getToolRegistry, ToolRegistry } from './core/ToolRegistry';
import { setupDefaultTools, setupLogisticsRAGTools } from './index';
import { getAllLogisticsRAGTools } from './tools/logistics/rag';

// Version info
const VERSION = '1.3.0';
const NAME = 'powerpbox-mcp';

async function main() {
  console.error(`[PowerBox] Starting MCP server v${VERSION}...`);

  // Initialize server
  const server = new Server(
    {
      name: NAME,
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Setup tools
  console.error('[PowerBox] Registering tools...');
  setupDefaultTools();
  setupLogisticsRAGTools();

  const registry = getToolRegistry();

  // Get all registered tools for MCP
  const allTools = registry.getAll();
  const ragTools = getAllLogisticsRAGTools();

  // Combine all tools
  const toolDefinitions = [
    ...allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object' as const,
        properties: Object.fromEntries(
          tool.parameters.map(p => [
            p.name,
            {
              type: p.type,
              description: p.description,
              default: p.default,
            },
          ])
        ),
        required: tool.parameters.filter(p => p.required).map(p => p.name),
      },
    })),
  ];

  console.error(`[PowerBox] Registered ${toolDefinitions.length} tools`);

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
  }));

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Find tool in registry
    const tool = allTools.find(t => t.name === name);

    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const result = await tool.execute(args || {});

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: typeof result.data === 'string'
                ? result.data
                : JSON.stringify(result.data, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [{ type: 'text', text: `Error: ${result.error}` }],
          isError: true,
        };
      }
    } catch (error) {
      const err = error as Error;
      return {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup info
  const categories = registry.getCategories();
  console.error(`[PowerBox] MCP server running`);
  console.error(`[PowerBox] Categories: ${Object.keys(categories).join(', ')}`);
  console.error(`[PowerBox] Total tools: ${toolDefinitions.length}`);
  console.error(`[PowerBox] LogisticsRAG tools: ${ragTools.length}`);
}

// Run
main().catch((error) => {
  console.error('[PowerBox] Fatal error:', error);
  process.exit(1);
});
