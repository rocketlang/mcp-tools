/**
 * @ankr/mcp - Model Context Protocol
 * India-first AI tools for LLMs
 *
 * PLUG & PLAY ARCHITECTURE:
 * - Register any tool at runtime
 * - Add new tools without code changes
 * - Categorized for easy discovery
 */

// Core
export * from './core/MCPServer';
export * from './core/ToolRegistry';
export * from './types';

// All Tools & Execution
export { executeMCPTool, getAllMCPTools, getMCPToolDefinitions, UNIQUE_TOOLS, TOTAL_TOOL_COUNT } from './tools/all-tools';

// Messaging Tools (Ready)
export * from './tools/telegram';
export * from './tools/whatsapp';

// Payment Tools
export * from './tools/upi';

// Government Tools
export * from './tools/ulip';

// India Tools (Stubs)
export * from './tools/india/digilocker';
export * from './tools/india/aadhaar';
export * from './tools/india/vahan';
export * from './tools/india/sarathi';
export * from './tools/india/gst';
export * from './tools/india/ondc';

// Global Tools
export * from './tools/global/http';
export * from './tools/global/email';
export * from './tools/global/calendar';
export * from './tools/global/storage';

// Logistics Tools
export * from './tools/logistics/tracking';
export * from './tools/logistics/routing';
export * from './tools/logistics/pod';

// GPS Tracking
export * from './tools/logistics/gps-sim';

// Sandbox Selection (intelligent routing)
export * from './tools/sandbox-select';

// LogisticsRAG Tools (AI-powered knowledge base)
export * from './tools/logistics/rag';
export {
  LOGISTICS_RAG_TOOLS,
  getAllLogisticsRAGTools,
  getLogisticsRAGToolCount,
  createLogisticsSearchTool,
  createLogisticsRetrieveTool,
  createLogisticsIngestTool,
  createLogisticsStatsTool,
  createLogisticsComplianceTool,
  createLogisticsRouteTool,
  createLogisticsDeleteTool,
} from './tools/logistics/rag';

// Quick setup - all tools registered
import { getToolRegistry } from './core/ToolRegistry';
import { createTelegramTool } from './tools/telegram';
import { createWhatsAppTool } from './tools/whatsapp';
import { createUPITool } from './tools/upi';
import { createULIPTool } from './tools/ulip';
import { createHTTPTool } from './tools/global/http';
import { createTrackingTool } from './tools/logistics/tracking';
import { getAllLogisticsRAGTools } from './tools/logistics/rag';
import { createSandboxSelectTool } from './tools/sandbox-select';

export function setupDefaultTools(): void {
  const registry = getToolRegistry();

  // Messaging
  registry.register(createTelegramTool(), 'messaging');
  registry.register(createWhatsAppTool(), 'messaging');

  // Payments
  registry.register(createUPITool(), 'payments');

  // Government
  registry.register(createULIPTool(), 'government');

  // Global
  registry.register(createHTTPTool(), 'global');

  // Logistics
  registry.register(createTrackingTool(), 'logistics');

  // Sandbox Selection (intelligent routing for code execution)
  registry.register(createSandboxSelectTool(), 'global');

  console.log('[MCP] Default tools registered');
}

// Setup LogisticsRAG tools (AI-powered knowledge base)
export function setupLogisticsRAGTools(): void {
  const registry = getToolRegistry();
  const ragTools = getAllLogisticsRAGTools();

  for (const tool of ragTools) {
    registry.register(tool, 'logistics');
  }

  console.log(`[MCP] LogisticsRAG tools registered (${ragTools.length} tools)`);
}

// Setup BANI Bridge tools (40+ India-first tools)
import { getBaniTools, BANI_TOOLS } from './tools/bani-bridge';
import { getAllMCPTools, UNIQUE_TOOLS, TOTAL_TOOL_COUNT } from './tools/all-tools';

export function setupBaniTools(): void {
  const registry = getToolRegistry();

  // Use ALL tools (212+) from all-tools.ts, not just BANI_TOOLS (62)
  const allTools = getAllMCPTools();

  for (const tool of allTools) {
    const category = UNIQUE_TOOLS[tool.name]?.category || 'india';
    registry.register(tool, category);
  }

  console.log(`[MCP] All tools registered (${allTools.length} tools)`);
}

// Setup all tools including LogisticsRAG and BANI
export async function setupAllTools(options?: { databaseUrl?: string }): Promise<void> {
  setupDefaultTools();
  setupLogisticsRAGTools();
  setupBaniTools();

  if (options?.databaseUrl || process.env.DATABASE_URL) {
    await setupEonTools(options?.databaseUrl);
  }

  console.log('[MCP] All tools registered');
}

// EON Context Engineering Setup (optional - requires @ankr/eon peer dependency)
export async function setupEonTools(databaseUrl?: string): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency
    const { EON, registerEonMCPTools } = await import('@ankr/eon');

    const eon = new EON({
      databaseUrl: databaseUrl || process.env.DATABASE_URL || process.env.ANKR_EON_DATABASE_URL || '',
    });
    registerEonMCPTools(getToolRegistry() as any, eon);
    console.log('[MCP] EON context tools registered');
  } catch (error) {
    console.warn('[MCP] @ankr/eon not available - skipping EON tools registration');
    console.warn('[MCP] Install @ankr/eon to enable context engineering tools');
  }
}

// Tool map for quick access
export const tools = {
  telegram: createTelegramTool,
  whatsapp: createWhatsAppTool,
  upi: createUPITool,
  ulip: createULIPTool,
  http: createHTTPTool,
  tracking: createTrackingTool,
  sandbox_select: createSandboxSelectTool,
};

// ═══════════════════════════════════════════════════════════════════════════════
// BANI TOOLS INTEGRATION (40+ India-first tools)
// ═══════════════════════════════════════════════════════════════════════════════
export * from './tools/bani-bridge';
export { BANI_TOOLS, getBaniTools, getToolCountByCategory, getTotalToolCount, findToolByVoiceTrigger } from './tools/bani-bridge';

// Skills injection (legacy)
export * from './tools/skills';

// ═══════════════════════════════════════════════════════════════════════════════
// SKILL LOADER (Files Are All You Need pattern)
// Instead of 231+ tools, agents read skill files on-demand
// ═══════════════════════════════════════════════════════════════════════════════
export {
  Skill as FileSkill,
  SkillContent as FileSkillContent,
} from './tools/skills/loader';
export {
  SKILL_TOOLS,
  getAllSkillTools,
  getSkillToolCount,
  createSkillListTool,
  createSkillLoadTool,
  createSkillSearchTool,
  listSkillCategories,
  listSkillsInCategory,
  listAllSkills,
  searchSkills,
  loadSkill,
  loadSkillFromCategory,
  loadSkills,
  getSkillIndex,
  getSkillIndexFormatted,
} from './tools/skills/loader';

// Setup skill tools
import { getAllSkillTools } from './tools/skills/loader';

export function setupSkillTools(): void {
  const registry = getToolRegistry();
  const skillTools = getAllSkillTools();

  for (const tool of skillTools) {
    registry.register(tool, 'skills');
  }

  console.log(`[MCP] Skill tools registered (${skillTools.length} tools)`);
}
