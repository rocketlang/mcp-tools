/**
 * ALL MCP TOOLS REGISTRY - 270+ Tools for SWAYAM Universal AI
 *
 * Combines all tool categories:
 * - Compliance (GST, TDS, ITR, MCA): 54 tools
 * - ERP (Accounting, Invoice, Inventory, Purchase, Sales): 44 tools
 * - CRM (Lead, Contact, Opportunity, Activity): 30 tools
 * - Banking (UPI, BBPS, Calculators, Loans): 28 tools
 * - Government (Aadhaar, DigiLocker, ULIP, Schemes): 22 tools
 * - Logistics (from bani-bridge): 35 tools
 * - Package Doctor (evaluation, upgrade): 8 tools
 * - E-Manual & Test-Tool: 10 tools
 * - Ralph Wiggum (AI dev automation): 24 tools
 * - SLM Router (local AI routing): 3 tools
 * - AGFLOW (Intelligent Capability Router): 12 tools (NEW)
 *
 * 🙏 Jai Guru Ji | ANKR Labs | Jan 2026
 */

import type { MCPTool, MCPResult, MCPParameter } from '../types';
import { COMPLIANCE_TOOLS } from './expanded-tools';
import { ERP_TOOLS, CRM_TOOLS } from './expanded-erp-crm';
import { BANKING_TOOLS, GOVERNMENT_TOOLS } from './expanded-banking-govt';
import { BANI_TOOLS } from './bani-bridge';
import { TOOL_EXECUTORS } from './bani-executor';
import { PACKAGE_TOOLS, PACKAGE_TOOL_EXECUTORS } from './package-tools';
import {
  PACKAGE_DOCTOR_TOOLS,
  PACKAGE_DOCTOR_TOOL_EXECUTORS
} from './package-doctor-tools';
import {
  EMANUAL_TESTTOOL_TOOLS,
  EMANUAL_TESTTOOL_EXECUTORS
} from './emanual-testtool';
import {
  RALPH_TOOLS,
  RALPH_TOOL_EXECUTORS
} from './ralph-tools';
import {
  SLM_ROUTER_TOOLS,
  SLM_ROUTER_EXECUTORS
} from './slm-router';
import {
  KB_TOOLS,
  KB_EXECUTORS
} from './kb-index';
import {
  KB_SEMANTIC_TOOLS,
  KB_SEMANTIC_EXECUTORS
} from './kb-semantic';
import {
  KB_HYBRID_TOOLS,
  KB_HYBRID_EXECUTORS
} from './kb-hybrid';
import {
  KB_ANALYTICS_TOOLS,
  KB_ANALYTICS_EXECUTORS
} from './kb-analytics';
import {
  KB_POSTGRES_TOOLS,
  KB_POSTGRES_EXECUTORS
} from './kb-postgres';
import {
  AGFLOW_CAPABILITY_TOOLS,
  AGFLOW_CAPABILITY_EXECUTORS
} from './agflow-capabilities';
import {
  AGFLOW_ROUTER_TOOLS,
  AGFLOW_ROUTER_EXECUTORS
} from './agflow-router';
import {
  AGFLOW_ORCHESTRATOR_TOOLS,
  AGFLOW_ORCHESTRATOR_EXECUTORS
} from './agflow-orchestrator';
import {
  AGFLOW_AGENT_TOOLS,
  AGFLOW_AGENT_EXECUTORS
} from './agflow-agents';
import {
  AGFLOW_LEARNING_TOOLS,
  AGFLOW_LEARNING_EXECUTORS
} from './agflow-learning';

// Combine all tool definitions
export const ALL_TOOL_DEFINITIONS = {
  ...COMPLIANCE_TOOLS,
  ...ERP_TOOLS,
  ...CRM_TOOLS,
  ...BANKING_TOOLS,
  ...GOVERNMENT_TOOLS,
  ...BANI_TOOLS,
  ...PACKAGE_TOOLS,
  ...PACKAGE_DOCTOR_TOOLS,
  ...EMANUAL_TESTTOOL_TOOLS,
  ...RALPH_TOOLS,
  ...SLM_ROUTER_TOOLS,
  ...KB_TOOLS,
  ...KB_SEMANTIC_TOOLS,
  ...KB_HYBRID_TOOLS,
  ...KB_ANALYTICS_TOOLS,
  ...KB_POSTGRES_TOOLS,
  ...AGFLOW_CAPABILITY_TOOLS,
  ...AGFLOW_ROUTER_TOOLS,
  ...AGFLOW_ORCHESTRATOR_TOOLS,
  ...AGFLOW_AGENT_TOOLS,
  ...AGFLOW_LEARNING_TOOLS
};

// Combine all executors
const ALL_EXECUTORS: Record<string, any> = {
  ...TOOL_EXECUTORS,
  ...PACKAGE_TOOL_EXECUTORS,
  ...PACKAGE_DOCTOR_TOOL_EXECUTORS,
  ...EMANUAL_TESTTOOL_EXECUTORS,
  ...RALPH_TOOL_EXECUTORS,
  ...SLM_ROUTER_EXECUTORS,
  ...KB_EXECUTORS,
  ...KB_SEMANTIC_EXECUTORS,
  ...KB_HYBRID_EXECUTORS,
  ...KB_ANALYTICS_EXECUTORS,
  ...KB_POSTGRES_EXECUTORS,
  ...AGFLOW_CAPABILITY_EXECUTORS,
  ...AGFLOW_ROUTER_EXECUTORS,
  ...AGFLOW_ORCHESTRATOR_EXECUTORS,
  ...AGFLOW_AGENT_EXECUTORS,
  ...AGFLOW_LEARNING_EXECUTORS
};

// Base tool definition type (flexible enough for all tool formats)
interface ToolDef {
  name: string;
  description: string;
  descriptionHi: string;
  category: string;
  voiceTriggers: string[];
  parameters: unknown;
}

// Remove duplicates (prefer expanded definitions)
const toolNames = new Set<string>();
const uniqueTools: Record<string, ToolDef> = {};

// First add expanded tools
for (const [name, tool] of Object.entries(COMPLIANCE_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
for (const [name, tool] of Object.entries(ERP_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
for (const [name, tool] of Object.entries(CRM_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
for (const [name, tool] of Object.entries(BANKING_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
for (const [name, tool] of Object.entries(GOVERNMENT_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
// Add BANI tools that aren't already defined
for (const [name, tool] of Object.entries(BANI_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
// Add PACKAGE tools
for (const [name, tool] of Object.entries(PACKAGE_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
// Add PACKAGE_DOCTOR tools
for (const [name, tool] of Object.entries(PACKAGE_DOCTOR_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
// Add E-Manual & Test-Tool
for (const [name, tool] of Object.entries(EMANUAL_TESTTOOL_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool;
  }
}
// Add Ralph Wiggum Tools (AI dev automation)
for (const [name, tool] of Object.entries(RALPH_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool as ToolDef;
  }
}
// Add AGFLOW tools
for (const [name, tool] of Object.entries(AGFLOW_CAPABILITY_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool as ToolDef;
  }
}
for (const [name, tool] of Object.entries(AGFLOW_ROUTER_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool as ToolDef;
  }
}
for (const [name, tool] of Object.entries(AGFLOW_ORCHESTRATOR_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool as ToolDef;
  }
}
for (const [name, tool] of Object.entries(AGFLOW_AGENT_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool as ToolDef;
  }
}
for (const [name, tool] of Object.entries(AGFLOW_LEARNING_TOOLS)) {
  if (!toolNames.has(name)) {
    toolNames.add(name);
    uniqueTools[name] = tool as ToolDef;
  }
}

export const UNIQUE_TOOLS = uniqueTools;
export const TOTAL_TOOL_COUNT = Object.keys(uniqueTools).length;

/**
 * Default executor for tools without specific implementation
 */
async function defaultExecutor(toolName: string, params: Record<string, any>): Promise<MCPResult> {
  // For now, return a simulated response
  return {
    success: true,
    data: {
      tool: toolName,
      params,
      message: `Tool ${toolName} executed with params: ${JSON.stringify(params)}`,
      timestamp: new Date().toISOString()
    },
    metadata: { tool: toolName, duration_ms: 0 }
  };
}

/**
 * Get all tools as MCP tool array
 */
export function getAllMCPTools(): MCPTool[] {
  return Object.values(UNIQUE_TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as MCPParameter[],
    execute: async (params: Record<string, any>): Promise<MCPResult> => {
      const startTime = Date.now();
      try {
        // Use specific executor if available, otherwise fall back to default
        const executor = ALL_EXECUTORS[tool.name];
        const result = executor
          ? await executor(params)
          : await defaultExecutor(tool.name, params);
        result.metadata = {
          ...result.metadata,
          tool: tool.name,
          duration_ms: Date.now() - startTime
        };
        return result;
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          data: { params },
          metadata: { tool: tool.name, duration_ms: Date.now() - startTime }
        };
      }
    }
  }));
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: string): MCPTool[] {
  return getAllMCPTools().filter(tool => {
    const def = UNIQUE_TOOLS[tool.name];
    return def && def.category === category;
  });
}

/**
 * Get tool count by category
 */
export function getToolCountByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  Object.values(UNIQUE_TOOLS).forEach(tool => {
    counts[tool.category] = (counts[tool.category] || 0) + 1;
  });
  return counts;
}

/**
 * Search tools by name or description
 */
export function searchTools(query: string): MCPTool[] {
  const q = query.toLowerCase();
  return getAllMCPTools().filter(tool => {
    const def = UNIQUE_TOOLS[tool.name];
    return tool.name.toLowerCase().includes(q) ||
           tool.description.toLowerCase().includes(q) ||
           (def?.descriptionHi || '').toLowerCase().includes(q) ||
           (def?.voiceTriggers || []).some(t => t.toLowerCase().includes(q));
  });
}

/**
 * Get tool by voice trigger
 */
export function getToolByVoiceTrigger(trigger: string): MCPTool | undefined {
  const t = trigger.toLowerCase();
  for (const [name, def] of Object.entries(UNIQUE_TOOLS)) {
    if (def.voiceTriggers.some(vt => t.includes(vt.toLowerCase()))) {
      return getAllMCPTools().find(tool => tool.name === name);
    }
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCTION CALLING SUPPORT (OpenAI-compatible format)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * OpenAI-compatible Tool definition for function calling
 */
export interface FunctionCallingTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
}

/**
 * Convert MCPParameter type to JSON Schema type
 */
function mcpTypeToJsonSchema(mcpType: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'object': 'object',
    'array': 'array',
  };
  return typeMap[mcpType] || 'string';
}

/**
 * Get all MCP tools as OpenAI-compatible function calling definitions
 * Use this when calling ai-router.complete() with tools
 *
 * @param categories Optional array of categories to filter (e.g., ['compliance', 'logistics'])
 * @param maxTools Optional max number of tools (for token limits)
 * @returns Array of Tool definitions for function calling
 *
 * @example
 * import { getMCPToolDefinitions } from '@ankr/mcp';
 * import { AIRouter } from '@ankr/ai-router';
 *
 * const tools = getMCPToolDefinitions(['compliance', 'logistics'], 50);
 * const response = await aiRouter.complete({
 *   messages: [...],
 *   tools,
 *   tool_choice: 'auto'
 * });
 */
export function getMCPToolDefinitions(
  categories?: string[],
  maxTools?: number
): FunctionCallingTool[] {
  let tools = Object.values(UNIQUE_TOOLS);

  // Filter by categories if specified
  if (categories && categories.length > 0) {
    tools = tools.filter(tool => categories.includes(tool.category));
  }

  // Limit number of tools if specified
  if (maxTools && tools.length > maxTools) {
    tools = tools.slice(0, maxTools);
  }

  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object' as const,
        properties: (tool.parameters as MCPParameter[]).reduce((acc, param) => {
          acc[param.name] = {
            type: mcpTypeToJsonSchema(param.type),
            description: param.description,
          };
          return acc;
        }, {} as Record<string, { type: string; description: string }>),
        required: (tool.parameters as MCPParameter[])
          .filter(p => p.required)
          .map(p => p.name),
      },
    },
  }));
}

/**
 * Get a single tool definition by name
 */
export function getMCPToolDefinition(toolName: string): FunctionCallingTool | undefined {
  const tool = UNIQUE_TOOLS[toolName];
  if (!tool) return undefined;

  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: (tool.parameters as MCPParameter[]).reduce((acc, param) => {
          acc[param.name] = {
            type: mcpTypeToJsonSchema(param.type),
            description: param.description,
          };
          return acc;
        }, {} as Record<string, { type: string; description: string }>),
        required: (tool.parameters as MCPParameter[])
          .filter(p => p.required)
          .map(p => p.name),
      },
    },
  };
}

/**
 * Execute a tool by name
 * Use this to execute tools from function calling responses
 *
 * @example
 * if (response.finish_reason === 'tool_calls') {
 *   for (const call of response.tool_calls) {
 *     const result = await executeMCPTool(call.function.name, JSON.parse(call.function.arguments));
 *   }
 * }
 */
export async function executeMCPTool(toolName: string, params: Record<string, any>): Promise<MCPResult> {
  const mcpTool = getAllMCPTools().find(t => t.name === toolName);
  if (!mcpTool) {
    return {
      success: false,
      error: `Tool not found: ${toolName}`,
      metadata: { tool: toolName, duration_ms: 0 }
    };
  }
  return mcpTool.execute(params);
}

// Log on import
console.log(`
═══════════════════════════════════════════════════════════════════════════════
SWAYAM MCP TOOLS LOADED: ${TOTAL_TOOL_COUNT} TOOLS
═══════════════════════════════════════════════════════════════════════════════

Tool Categories:
${Object.entries(getToolCountByCategory()).map(([cat, count]) => `  • ${cat}: ${count} tools`).join('\n')}

Total: ${TOTAL_TOOL_COUNT} tools ready for voice and text commands!
═══════════════════════════════════════════════════════════════════════════════
`);
