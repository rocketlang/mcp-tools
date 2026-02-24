# @powerpbox/mcp — India-first MCP Tools for AI Agents

[![npm](https://img.shields.io/npm/v/@powerpbox/mcp)](https://www.npmjs.com/package/@powerpbox/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**282 production-ready MCP (Model Context Protocol) tools** for Indian enterprise workflows — designed for Claude, GPT-4, Gemini, and any LLM with function-calling.

> Built by [ANKR Labs](https://ankr.in) (Powerp Box IT Solutions Pvt Ltd) — Gurgaon, India.

## Why?

Most MCP tool libraries focus on Western markets. Indian businesses need tools that speak GST, VAHAN, SARATHI, FASTag, GSTR-3B, IMO regulations, and ICD dwell times natively. This library does exactly that.

## Tool Categories (282 tools)

| Category | Count | Examples |
|----------|-------|---------|
| **Compliance** | 56 | GST verify, e-Invoice (IRN), e-Way bill, GSTR-3B, TDS, PAN verify |
| **ERP** | 46 | Invoice create, purchase order, inventory check, P&L, balance sheet |
| **CRM** | 32 | Lead create/search, contact management, opportunity pipeline |
| **Banking** | 28 | EMI calc, SIP returns, FASTag balance, UPI status |
| **Government** | 25 | VAHAN (vehicle registration), SARATHI (driving licence), EPF balance, PM-KISAN |
| **Logistics** | 11 | Container tracking, vessel search, Indian port lookup, freight loads |
| **Fleet** | 10 | Real-time vehicle position, toll estimate, distance calc, trip management |
| **Messaging** | 5 | Telegram, WhatsApp, Email, SMS alerts |
| **Utilities** | 12 | Web search, weather, calculator, PIN code info |
| **AI/Agent** | 57 | Code generation (Ralph), AGFlow orchestration, codebase search |

## Quick Start

```bash
npm install @powerpbox/mcp
# or
bun add @powerpbox/mcp
```

```typescript
import { setupAllTools, getAllMCPTools, executeMCPTool } from '@powerpbox/mcp';

// Wire up all 282 tools
await setupAllTools();

// List available tools
const tools = getAllMCPTools();
console.log(`${tools.length} tools ready`);

// Execute a tool
const result = await executeMCPTool('gst_verify', { gstin: '29ABCDE1234F1Z5' });
console.log(result.data); // { tradeName, status, registrationDate, ... }
```

## HTTP Bridge (MCP Server Mode)

Run as a standalone HTTP server — every tool becomes a REST endpoint:

```bash
bun server/mcp-bridge.ts
# or
PORT=4573 bun server/mcp-bridge.ts
```

```bash
# List all tools
GET /tools
GET /tools?category=compliance
GET /tools?q=gst

# Execute a tool
POST /execute
{ "tool": "container_track", "params": { "container_number": "TEMU1234567" } }

# Categories
GET /categories
```

## Use with Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { getMCPToolDefinitions, executeMCPTool } from '@powerpbox/mcp';

const client = new Anthropic();
const tools = getMCPToolDefinitions(); // Returns Claude-compatible tool schemas

const response = await client.messages.create({
  model: 'claude-opus-4-5',
  max_tokens: 1024,
  tools,
  messages: [{ role: 'user', content: 'Verify GSTIN 29ABCDE1234F1Z5 and calculate GST on ₹50,000' }],
});

// Handle tool_use blocks
for (const block of response.content) {
  if (block.type === 'tool_use') {
    const result = await executeMCPTool(block.name, block.input);
    // Continue conversation with result...
  }
}
```

## Example: Indian Logistics Agent

```typescript
await setupAllTools();

// Track a shipment end-to-end
const container = await executeMCPTool('container_track', { container_number: 'MSCU1234567' });
const vessel    = await executeMCPTool('vessel_search',   { query: container.data.vesselName });
const port      = await executeMCPTool('port_search',     { query: 'JNPT' });

// Generate e-Way bill for inland movement
const eway = await executeMCPTool('eway_generate', {
  shipment_data: { from: 'JNPT', to: 'Delhi ICD', value: 250000, hsn: '84713020' }
});
```

## Tool Schema

Each tool follows the MCP standard:

```typescript
interface MCPTool {
  name: string;
  description: string;
  parameters: MCPParameter[];
  execute(params: Record<string, any>): Promise<MCPResult>;
}

interface MCPResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: { duration_ms: number; source?: string };
}
```

## TROVE Integration

If you're running the ANKR platform, these tools are automatically surfaced in the TROVE callable registry alongside your GraphQL and REST service operations:

```bash
GET http://localhost:4059/api/trove/registry/mcp
# Returns all 282 tools as TROVE callables
```

## License

MIT — free for commercial and non-commercial use.

---

*Part of the [ANKR Platform](https://ankr.in) — India's AI-native enterprise operating system.*  
*ANKR Labs · Powerp Box IT Solutions Pvt Ltd · Gurgaon, India*
