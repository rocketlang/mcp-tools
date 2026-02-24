/**
 * SLM Router Tools for ANKR MCP
 * Local SLM-first routing with LLM fallback + EON Memory
 *
 * Architecture (4 Tiers):
 *   Tier 0: EON Memory (cached results, similar queries)
 *   Tier 1: Deterministic (regex patterns)
 *   Tier 2: SLM (local Ollama)
 *   Tier 3: LLM (AI Proxy fallback)
 *
 * Tools:
 * - slm_route: Route a query through the SLM cascade
 * - slm_health: Check Ollama, AI Proxy, and EON health
 * - slm_benchmark: Run routing benchmarks
 * - slm_learn: Store feedback to improve future routing
 * - slm_recall: Search memory for past routings
 */

import axios from 'axios';
import type { MCPTool, MCPResult } from '../types';

// Configuration from environment
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';
const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:4444';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7');
const DATABASE_URL = process.env.DATABASE_URL || process.env.ANKR_EON_DATABASE_URL || '';
const ENABLE_EON_MEMORY = process.env.ENABLE_EON_MEMORY !== 'false';
const ENABLE_KNOWLEDGE_BASE = process.env.ENABLE_KNOWLEDGE_BASE !== 'false';

// EON Memory Integration
let eonInstance: any = null;

// Knowledge Base Integration (for code context)
let kbInstance: any = null;

async function getKnowledgeBase() {
  if (!ENABLE_KNOWLEDGE_BASE) return null;

  if (!kbInstance) {
    try {
      const { KnowledgeBase } = await import('@ankr/knowledge-base');
      kbInstance = new KnowledgeBase();
      await kbInstance.initialize();
      console.log('[SLM Router] Knowledge Base initialized');
    } catch (error) {
      console.warn('[SLM Router] Knowledge Base not available:', error);
      return null;
    }
  }
  return kbInstance;
}

// Code-related query patterns (trigger knowledge base search)
const CODE_QUERY_PATTERNS = [
  /how\s+(?:does|do|to|is)/i,
  /where\s+is/i,
  /find\s+(?:the|a)?\s*(?:function|class|component|service)/i,
  /what\s+(?:is|does)/i,
  /show\s+me/i,
  /package|module|import|export/i,
  /implementation|code|example/i,
  /ankr|vibecoder|swayam|tasher|mcp|eon/i,
];

async function getEON() {
  if (!ENABLE_EON_MEMORY || !DATABASE_URL) return null;

  if (!eonInstance) {
    try {
      const { EON } = await import('@ankr/eon');
      eonInstance = new EON({ databaseUrl: DATABASE_URL });
      console.log('[SLM Router] EON memory initialized');
    } catch (error) {
      console.warn('[SLM Router] EON not available:', error);
      return null;
    }
  }
  return eonInstance;
}

// Tool definitions for routing
const ROUTING_TOOLS = [
  { name: 'gst_verify', description: 'Verify GST number' },
  { name: 'freight_trucks', description: 'Find trucks for freight' },
  { name: 'eway_generate', description: 'Generate E-Way bill' },
  { name: 'toll_estimate', description: 'Estimate toll charges' },
  { name: 'hsn_lookup', description: 'Look up HSN code' },
  { name: 'vehicle_track', description: 'Track a vehicle' },
  { name: 'emi_calc', description: 'Calculate EMI' },
  { name: 'freight_rates', description: 'Get freight rates' },
];

// Deterministic patterns for Tier 1
const DETERMINISTIC_PATTERNS: Array<{
  pattern: RegExp;
  tool: string;
  extractor: (match: RegExpMatchArray) => Record<string, unknown>;
}> = [
  {
    pattern: /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i,
    tool: 'gst_verify',
    extractor: (m) => ({ gstin: m[1].toUpperCase() }),
  },
  {
    pattern: /([A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4})/i,
    tool: 'vehicle_track',
    extractor: (m) => ({ vehicle_number: m[1].toUpperCase() }),
  },
  {
    pattern: /hsn\s*(?:code)?\s*[:\s]*(\d{4,8})/i,
    tool: 'hsn_lookup',
    extractor: (m) => ({ query: m[1] }),
  },
];

// Escalation keywords that trigger LLM
const ESCALATION_KEYWORDS = ['why', 'explain', 'help me understand', 'plan', 'strategy', 'optimize', 'compare', 'analyze'];

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 0: EON MEMORY LOOKUP
// ═══════════════════════════════════════════════════════════════════════════════

interface MemoryMatch {
  query: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  confidence: number;
  similarity: number;
  feedback?: 'correct' | 'incorrect';
}

/**
 * Search EON memory for similar past queries (Tier 0)
 */
async function searchMemory(query: string, userId?: string): Promise<MemoryMatch | null> {
  const eon = await getEON();
  if (!eon) return null;

  try {
    const memories = await eon.memory.search(`slm_routing: ${query}`, userId);

    if (memories && memories.length > 0) {
      // Find a high-confidence match with positive feedback
      for (const mem of memories) {
        if (mem.metadata?.feedback !== 'incorrect' && mem.metadata?.confidence >= 0.8) {
          // Check if query is similar enough (simple word overlap for now)
          const similarity = calculateSimilarity(query, mem.metadata?.original_query || '');
          if (similarity >= 0.7) {
            return {
              query: mem.metadata?.original_query as string,
              tool_name: mem.metadata?.tool_name as string,
              parameters: mem.metadata?.parameters as Record<string, unknown>,
              confidence: mem.metadata?.confidence as number,
              similarity,
              feedback: mem.metadata?.feedback as 'correct' | 'incorrect' | undefined,
            };
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.warn('[SLM Router] Memory search failed:', error);
    return null;
  }
}

/**
 * Store routing result in EON memory
 */
async function storeInMemory(
  query: string,
  result: {
    tool_name: string | null;
    parameters: Record<string, unknown>;
    confidence: number;
    tier: number;
  },
  userId?: string
): Promise<void> {
  const eon = await getEON();
  if (!eon || !result.tool_name) return;

  try {
    await eon.memory.store({
      content: `slm_routing: ${query} → ${result.tool_name}`,
      type: 'learning',
      importance: result.confidence,
      userId,
      metadata: {
        original_query: query,
        tool_name: result.tool_name,
        parameters: result.parameters,
        confidence: result.confidence,
        tier: result.tier,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.warn('[SLM Router] Memory store failed:', error);
  }
}

/**
 * Update memory with user feedback
 */
async function updateMemoryFeedback(
  query: string,
  feedback: 'correct' | 'incorrect',
  correctTool?: string,
  correctParams?: Record<string, unknown>
): Promise<void> {
  const eon = await getEON();
  if (!eon) return;

  try {
    if (feedback === 'correct') {
      // Boost importance of correct routing
      await eon.memory.store({
        content: `slm_routing_feedback: ${query} → correct`,
        type: 'feedback',
        importance: 0.9,
        metadata: {
          original_query: query,
          feedback: 'correct',
          timestamp: new Date().toISOString(),
        },
      });
    } else if (feedback === 'incorrect' && correctTool) {
      // Store the correct routing for future
      await eon.memory.store({
        content: `slm_routing: ${query} → ${correctTool}`,
        type: 'learning',
        importance: 0.95, // High importance for corrections
        metadata: {
          original_query: query,
          tool_name: correctTool,
          parameters: correctParams || {},
          confidence: 1.0, // User-confirmed
          feedback: 'user_corrected',
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.warn('[SLM Router] Feedback store failed:', error);
  }
}

/**
 * Simple word overlap similarity
 */
function calculateSimilarity(query1: string, query2: string): number {
  const words1 = new Set(query1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(query2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }

  return overlap / Math.max(words1.size, words2.size);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 1: DETERMINISTIC MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

function tryDeterministic(query: string): { tool: string; parameters: Record<string, unknown> } | null {
  for (const { pattern, tool, extractor } of DETERMINISTIC_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      return { tool, parameters: extractor(match) };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 2: SLM (OLLAMA)
// ═══════════════════════════════════════════════════════════════════════════════

async function callOllama(
  query: string,
  memoryContext?: string,
  codeContext?: string
): Promise<{
  tool_name: string | null;
  parameters: Record<string, unknown>;
  confidence: number;
  escalate: boolean;
  codeAnswer?: string;
}> {
  const toolList = ROUTING_TOOLS.map(t => `- ${t.name}: ${t.description}`).join('\n');

  // Build prompt with all available context
  let contextSection = '';

  if (memoryContext) {
    contextSection += `\nPast similar routings (for reference):\n${memoryContext}\n`;
  }

  if (codeContext) {
    contextSection += `\nRelevant code from ANKR packages:\n${codeContext}\n`;
  }

  // If code context exists, allow the SLM to answer code questions directly
  const outputFormat = codeContext
    ? 'Output JSON with: tool_name (or null if answering code question), parameters, confidence (0-1), escalate (boolean), codeAnswer (string if answering code question)'
    : 'Output ONLY JSON with: tool_name, parameters, confidence (0-1), escalate (boolean)';

  const prompt = `You are a tool router and code assistant for ANKR. ${outputFormat}.
${contextSection}
Available tools:
${toolList}

Query: ${query}`;

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      format: 'json',
      stream: false,
      options: { temperature: 0.1, num_predict: 256 },
    }, { timeout: 30000 });

    const parsed = JSON.parse(response.data.response);
    return {
      tool_name: parsed.tool_name || null,
      parameters: parsed.parameters || {},
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      escalate: parsed.escalate === true || (parsed.confidence || 0.5) < CONFIDENCE_THRESHOLD,
      codeAnswer: parsed.codeAnswer || undefined,
    };
  } catch (error) {
    return { tool_name: null, parameters: {}, confidence: 0, escalate: true };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIER 3: LLM (AI PROXY)
// ═══════════════════════════════════════════════════════════════════════════════

async function callAIProxy(query: string): Promise<string> {
  try {
    const response = await axios.post(`${AI_PROXY_URL}/v1/chat/completions`, {
      model: 'claude-sonnet',
      messages: [
        { role: 'system', content: 'You are an AI assistant for ANKR, an Indian logistics and compliance platform.' },
        { role: 'user', content: query },
      ],
      max_tokens: 1024,
    }, { timeout: 60000 });

    return response.data.choices?.[0]?.message?.content || 'No response from LLM';
  } catch (error) {
    return `LLM error: ${error}`;
  }
}

/**
 * Check if query should escalate to LLM
 */
function shouldEscalate(query: string, confidence: number, slmEscalate: boolean): boolean {
  if (slmEscalate) return true;
  if (confidence < CONFIDENCE_THRESHOLD) return true;

  const lowerQuery = query.toLowerCase();
  return ESCALATION_KEYWORDS.some(kw => lowerQuery.includes(kw));
}

/**
 * Build memory context for SLM prompt injection
 */
async function buildMemoryContext(query: string): Promise<string | undefined> {
  const eon = await getEON();
  if (!eon) return undefined;

  try {
    const context = await eon.memory.buildContext(`slm_routing: ${query}`);
    if (context && context.length > 50) {
      return context.substring(0, 500); // Limit context size
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Check if query is code-related (should search knowledge base)
 */
function isCodeRelatedQuery(query: string): boolean {
  return CODE_QUERY_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * Extract potential code identifiers from query
 */
function extractCodeIdentifiers(query: string): string[] {
  const identifiers: string[] = [];

  // Match camelCase, PascalCase, snake_case identifiers
  const matches = query.match(/\b([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*|[A-Z][a-zA-Z0-9]+|[a-z]+_[a-z_]+)\b/g);
  if (matches) {
    identifiers.push(...matches);
  }

  // Also try quoted strings
  const quoted = query.match(/"([^"]+)"|'([^']+)'/g);
  if (quoted) {
    identifiers.push(...quoted.map(q => q.replace(/['"]/g, '')));
  }

  return [...new Set(identifiers)];
}

/**
 * Build code context from Knowledge Base
 * Used when query is about ANKR code/packages
 * Uses hybrid: exact name search + query search
 */
async function buildCodeContext(query: string): Promise<string | undefined> {
  if (!isCodeRelatedQuery(query)) return undefined;

  const kb = await getKnowledgeBase();
  if (!kb) return undefined;

  try {
    let results: any[] = [];

    // First: try to find by exact name (better for function/class lookups)
    const identifiers = extractCodeIdentifiers(query);
    for (const id of identifiers.slice(0, 2)) {
      const exactResults = kb.findByName(id, { limit: 1 });
      if (exactResults.length > 0) {
        results.push(...exactResults);
      }
    }

    // Second: if no exact matches, fall back to query search
    if (results.length === 0) {
      results = kb.query(query, { limit: 2 });
    }

    if (results.length === 0) return undefined;

    // Format for SLM context - include more content for better understanding
    let context = '\n[Relevant ANKR Code]\n';
    for (const result of results.slice(0, 2)) {
      const chunk = result.chunk;
      context += `### ${chunk.name || chunk.fileName} (${chunk.package})\n`;
      context += `File: ${chunk.filePath}:${chunk.lineStart}\n`;
      context += '```typescript\n';
      context += chunk.content.slice(0, 600);
      context += '\n```\n\n';
    }

    return context.slice(0, 1200); // Allow more context for code
  } catch {
    return undefined;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLM ROUTER TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

export const SLM_ROUTER_TOOLS: Record<string, {
  name: string;
  description: string;
  descriptionHi: string;
  category: string;
  voiceTriggers: string[];
  parameters: Record<string, { type: string; description: string; required: boolean }>;
}> = {
  slm_route: {
    name: 'slm_route',
    description: 'Route a query through SLM-first cascade (Memory → Deterministic → Ollama → LLM)',
    descriptionHi: 'SLM राउटर के माध्यम से क्वेरी रूट करें (मेमोरी सहित)',
    category: 'ai',
    voiceTriggers: ['route query', 'smart route', 'slm route'],
    parameters: {
      query: { type: 'string', description: 'The query to route', required: true },
      context: { type: 'string', description: 'Optional context as JSON string', required: false },
      userId: { type: 'string', description: 'User ID for personalized memory', required: false },
      skipMemory: { type: 'boolean', description: 'Skip memory lookup (default: false)', required: false },
    },
  },
  slm_health: {
    name: 'slm_health',
    description: 'Check health status of SLM router services (Ollama, AI Proxy, EON)',
    descriptionHi: 'SLM राउटर सेवाओं की स्थिति जांचें',
    category: 'ai',
    voiceTriggers: ['slm health', 'check ollama', 'router status'],
    parameters: {},
  },
  slm_benchmark: {
    name: 'slm_benchmark',
    description: 'Run benchmark tests on the SLM router',
    descriptionHi: 'SLM राउटर पर बेंचमार्क टेस्ट चलाएं',
    category: 'ai',
    voiceTriggers: ['slm benchmark', 'test router', 'benchmark routing'],
    parameters: {},
  },
  slm_learn: {
    name: 'slm_learn',
    description: 'Provide feedback on routing to improve future results',
    descriptionHi: 'भविष्य के परिणामों में सुधार के लिए फीडबैक दें',
    category: 'ai',
    voiceTriggers: ['slm learn', 'correct routing', 'teach router'],
    parameters: {
      query: { type: 'string', description: 'The original query', required: true },
      feedback: { type: 'string', description: 'correct or incorrect', required: true },
      correctTool: { type: 'string', description: 'The correct tool (if feedback is incorrect)', required: false },
      correctParams: { type: 'string', description: 'Correct parameters as JSON (if feedback is incorrect)', required: false },
    },
  },
  slm_recall: {
    name: 'slm_recall',
    description: 'Search memory for past routing results',
    descriptionHi: 'पिछले राउटिंग परिणामों के लिए मेमोरी खोजें',
    category: 'ai',
    voiceTriggers: ['slm recall', 'search memory', 'past routes'],
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      userId: { type: 'string', description: 'Filter by user ID', required: false },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════════

export const SLM_ROUTER_EXECUTORS: Record<string, (args: Record<string, unknown>) => Promise<MCPResult>> = {
  slm_route: async (args) => {
    const query = args.query as string;
    if (!query) {
      return { success: false, error: 'query is required' };
    }

    const startTime = Date.now();
    const userId = args.userId as string | undefined;
    const skipMemory = args.skipMemory === true;

    // Tier 0: Memory lookup (if enabled)
    if (!skipMemory) {
      const memoryMatch = await searchMemory(query, userId);
      if (memoryMatch && memoryMatch.similarity >= 0.8) {
        return {
          success: true,
          data: {
            tier: 0,
            tier_name: 'memory',
            tool_name: memoryMatch.tool_name,
            parameters: memoryMatch.parameters,
            confidence: memoryMatch.confidence,
            similarity: memoryMatch.similarity,
            latency_ms: Date.now() - startTime,
            escalated: false,
            from_memory: true,
          },
        };
      }
    }

    // Tier 1: Deterministic
    const deterministicResult = tryDeterministic(query);
    if (deterministicResult) {
      const result = {
        tier: 1,
        tier_name: 'deterministic',
        tool_name: deterministicResult.tool,
        parameters: deterministicResult.parameters,
        confidence: 1.0,
        latency_ms: Date.now() - startTime,
        escalated: false,
      };

      // Store in memory for future recall
      await storeInMemory(query, { ...result, tool_name: result.tool_name }, userId);

      return { success: true, data: result };
    }

    // Build memory context for SLM
    const memoryContext = await buildMemoryContext(query);

    // Build code context for code-related queries
    const codeContext = await buildCodeContext(query);

    // Tier 2: SLM (Ollama) - now with code context
    const slmResult = await callOllama(query, memoryContext, codeContext);
    const slmLatency = Date.now() - startTime;

    // If SLM answered a code question directly, return that
    if (slmResult.codeAnswer && !slmResult.tool_name) {
      return {
        success: true,
        data: {
          tier: 2,
          tier_name: 'slm_code',
          answer: slmResult.codeAnswer,
          confidence: slmResult.confidence,
          latency_ms: slmLatency,
          escalated: false,
          code_context_used: true,
        },
      };
    }

    // Check if we should escalate
    if (!shouldEscalate(query, slmResult.confidence, slmResult.escalate) && slmResult.tool_name) {
      const result = {
        tier: 2,
        tier_name: 'slm',
        tool_name: slmResult.tool_name,
        parameters: slmResult.parameters,
        confidence: slmResult.confidence,
        latency_ms: slmLatency,
        escalated: false,
        memory_context_used: !!memoryContext,
        code_context_used: !!codeContext,
      };

      // Store in memory
      await storeInMemory(query, { ...result, tool_name: result.tool_name }, userId);

      return { success: true, data: result };
    }

    // Tier 3: LLM (AI Proxy)
    const llmResponse = await callAIProxy(query);
    const result = {
      tier: 3,
      tier_name: 'llm',
      tool_name: slmResult.tool_name,
      parameters: slmResult.parameters,
      confidence: 0.9,
      latency_ms: Date.now() - startTime,
      escalated: true,
      escalate_reason: slmResult.confidence < CONFIDENCE_THRESHOLD ? 'low_confidence' : 'complex_query',
      llm_response: llmResponse,
    };

    // Store in memory (even escalated results can be useful)
    if (result.tool_name) {
      await storeInMemory(query, { ...result, tool_name: result.tool_name }, userId);
    }

    return { success: true, data: result };
  },

  slm_health: async () => {
    const results: Record<string, boolean> = {};

    // Check Ollama
    try {
      const ollamaResp = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
      results.ollama = ollamaResp.status === 200;
    } catch {
      results.ollama = false;
    }

    // Check AI Proxy
    try {
      const proxyResp = await axios.get(`${AI_PROXY_URL}/health`, { timeout: 5000 });
      results.aiProxy = proxyResp.status === 200;
    } catch {
      try {
        const altResp = await axios.get(`${AI_PROXY_URL}/v1/models`, { timeout: 5000 });
        results.aiProxy = altResp.status === 200;
      } catch {
        results.aiProxy = false;
      }
    }

    // Check EON
    try {
      const eon = await getEON();
      results.eon = eon !== null;
    } catch {
      results.eon = false;
    }

    results.overall = results.ollama; // SLM is required

    return {
      success: true,
      data: {
        services: results,
        config: {
          ollama_url: OLLAMA_URL,
          ollama_model: OLLAMA_MODEL,
          ai_proxy_url: AI_PROXY_URL,
          confidence_threshold: CONFIDENCE_THRESHOLD,
          eon_enabled: ENABLE_EON_MEMORY,
          eon_database: DATABASE_URL ? 'configured' : 'not configured',
        },
      },
    };
  },

  slm_benchmark: async () => {
    const tests = [
      { query: 'Check GST 27AAPFU0939F1ZV', expected: 'gst_verify' },
      { query: 'Mumbai se Delhi truck chahiye', expected: 'freight_trucks' },
      { query: 'Toll from Pune to Bangalore', expected: 'toll_estimate' },
      { query: 'Track vehicle MH12AB1234', expected: 'vehicle_track' },
    ];

    const results: Array<{
      query: string;
      expected: string;
      actual: string | null;
      tier: number;
      latency_ms: number;
      passed: boolean;
      from_memory?: boolean;
    }> = [];

    for (const test of tests) {
      const startTime = Date.now();

      // Use slm_route executor
      const routeResult = await SLM_ROUTER_EXECUTORS.slm_route({
        query: test.query,
        skipMemory: true // Skip memory for fair benchmarking
      });

      if (routeResult.success && routeResult.data) {
        results.push({
          query: test.query,
          expected: test.expected,
          actual: routeResult.data.tool_name,
          tier: routeResult.data.tier,
          latency_ms: Date.now() - startTime,
          passed: routeResult.data.tool_name === test.expected,
          from_memory: routeResult.data.from_memory,
        });
      } else {
        results.push({
          query: test.query,
          expected: test.expected,
          actual: null,
          tier: -1,
          latency_ms: Date.now() - startTime,
          passed: false,
        });
      }
    }

    const passed = results.filter(r => r.passed).length;
    const avgLatency = results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length;

    return {
      success: true,
      data: {
        total: tests.length,
        passed,
        failed: tests.length - passed,
        accuracy: `${((passed / tests.length) * 100).toFixed(1)}%`,
        avg_latency_ms: Math.round(avgLatency),
        results,
      },
    };
  },

  slm_learn: async (args) => {
    const query = args.query as string;
    const feedback = args.feedback as string;

    if (!query || !feedback) {
      return { success: false, error: 'query and feedback are required' };
    }

    if (feedback !== 'correct' && feedback !== 'incorrect') {
      return { success: false, error: 'feedback must be "correct" or "incorrect"' };
    }

    let correctParams: Record<string, unknown> | undefined;
    if (args.correctParams) {
      try {
        correctParams = JSON.parse(args.correctParams as string);
      } catch {
        // Ignore parse errors
      }
    }

    await updateMemoryFeedback(
      query,
      feedback as 'correct' | 'incorrect',
      args.correctTool as string | undefined,
      correctParams
    );

    return {
      success: true,
      data: {
        message: feedback === 'correct'
          ? 'Positive feedback recorded. This routing will be preferred in future.'
          : 'Correction recorded. Future queries will use the correct routing.',
        query,
        feedback,
        correctTool: args.correctTool,
      },
    };
  },

  slm_recall: async (args) => {
    const query = args.query as string;
    if (!query) {
      return { success: false, error: 'query is required' };
    }

    const eon = await getEON();
    if (!eon) {
      return { success: false, error: 'EON memory not available' };
    }

    try {
      const memories = await eon.memory.search(`slm_routing: ${query}`, args.userId as string);

      const results = memories?.map((mem: any) => ({
        query: mem.metadata?.original_query,
        tool_name: mem.metadata?.tool_name,
        parameters: mem.metadata?.parameters,
        confidence: mem.metadata?.confidence,
        tier: mem.metadata?.tier,
        feedback: mem.metadata?.feedback,
        timestamp: mem.metadata?.timestamp,
      })).filter((r: any) => r.tool_name) || [];

      return {
        success: true,
        data: {
          count: results.length,
          results,
        },
      };
    } catch (error) {
      return { success: false, error: `Memory search failed: ${error}` };
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MCP TOOL FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createSLMRouteTool(): MCPTool {
  return {
    name: 'slm_route',
    description: SLM_ROUTER_TOOLS.slm_route.description,
    parameters: [
      { name: 'query', type: 'string', description: 'The query to route', required: true },
      { name: 'context', type: 'string', description: 'Optional context as JSON', required: false },
      { name: 'userId', type: 'string', description: 'User ID for personalized memory', required: false },
      { name: 'skipMemory', type: 'boolean', description: 'Skip memory lookup', required: false },
    ],
    execute: async (args: Record<string, unknown>) => SLM_ROUTER_EXECUTORS.slm_route(args),
  };
}

export function createSLMHealthTool(): MCPTool {
  return {
    name: 'slm_health',
    description: SLM_ROUTER_TOOLS.slm_health.description,
    parameters: [],
    execute: async () => SLM_ROUTER_EXECUTORS.slm_health({}),
  };
}

export function createSLMBenchmarkTool(): MCPTool {
  return {
    name: 'slm_benchmark',
    description: SLM_ROUTER_TOOLS.slm_benchmark.description,
    parameters: [],
    execute: async () => SLM_ROUTER_EXECUTORS.slm_benchmark({}),
  };
}

export function createSLMLearnTool(): MCPTool {
  return {
    name: 'slm_learn',
    description: SLM_ROUTER_TOOLS.slm_learn.description,
    parameters: [
      { name: 'query', type: 'string', description: 'The original query', required: true },
      { name: 'feedback', type: 'string', description: 'correct or incorrect', required: true },
      { name: 'correctTool', type: 'string', description: 'The correct tool if feedback is incorrect', required: false },
      { name: 'correctParams', type: 'string', description: 'Correct parameters as JSON', required: false },
    ],
    execute: async (args: Record<string, unknown>) => SLM_ROUTER_EXECUTORS.slm_learn(args),
  };
}

export function createSLMRecallTool(): MCPTool {
  return {
    name: 'slm_recall',
    description: SLM_ROUTER_TOOLS.slm_recall.description,
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'userId', type: 'string', description: 'Filter by user ID', required: false },
    ],
    execute: async (args: Record<string, unknown>) => SLM_ROUTER_EXECUTORS.slm_recall(args),
  };
}

export function getAllSLMRouterTools(): MCPTool[] {
  return [
    createSLMRouteTool(),
    createSLMHealthTool(),
    createSLMBenchmarkTool(),
    createSLMLearnTool(),
    createSLMRecallTool(),
  ];
}

export function getSLMRouterToolCount(): number {
  return Object.keys(SLM_ROUTER_TOOLS).length;
}
