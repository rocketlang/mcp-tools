/**
 * Knowledge Base Analytics
 *
 * Tracks KB usage patterns, token savings, and search effectiveness.
 * Provides insights for optimization.
 *
 * @author ANKR Labs
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// Analytics storage path
const KB_ROOT = path.join(__dirname, '../../../../.ankr-kb');
const ANALYTICS_FILE = path.join(KB_ROOT, 'analytics.json');

// ============================================================
// TYPES
// ============================================================

interface SearchEvent {
  timestamp: string;
  query: string;
  method: 'keyword' | 'semantic' | 'hybrid';
  resultsCount: number;
  topResult?: string;
  tokensUsed: number;
  durationMs: number;
}

interface ToolSelection {
  timestamp: string;
  tool: string;
  source: 'search' | 'suggest' | 'direct';
  query?: string;
}

interface TokenSavings {
  timestamp: string;
  query: string;
  withoutIndex: number;  // Tokens if all tools loaded
  withIndex: number;     // Tokens actually used
  saved: number;         // Difference
  savingsPercent: number;
}

interface AnalyticsStore {
  version: string;
  created: string;
  lastUpdated: string;
  searches: SearchEvent[];
  toolSelections: ToolSelection[];
  tokenSavings: TokenSavings[];
  summary: {
    totalSearches: number;
    totalToolSelections: number;
    totalTokensSaved: number;
    avgSavingsPercent: number;
    topQueries: Array<{ query: string; count: number }>;
    topTools: Array<{ tool: string; count: number }>;
    topIndexes: Array<{ index: string; count: number }>;
  };
}

// ============================================================
// ANALYTICS STORE
// ============================================================

const DEFAULT_STORE: AnalyticsStore = {
  version: '1.0.0',
  created: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  searches: [],
  toolSelections: [],
  tokenSavings: [],
  summary: {
    totalSearches: 0,
    totalToolSelections: 0,
    totalTokensSaved: 0,
    avgSavingsPercent: 0,
    topQueries: [],
    topTools: [],
    topIndexes: []
  }
};

/**
 * Load analytics from file
 */
function loadAnalytics(): AnalyticsStore {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[KB Analytics] Error loading:', e);
  }
  return { ...DEFAULT_STORE };
}

/**
 * Save analytics to file
 */
function saveAnalytics(store: AnalyticsStore): void {
  try {
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('[KB Analytics] Error saving:', e);
  }
}

/**
 * Update summary statistics
 */
function updateSummary(store: AnalyticsStore): void {
  // Total counts
  store.summary.totalSearches = store.searches.length;
  store.summary.totalToolSelections = store.toolSelections.length;
  store.summary.totalTokensSaved = store.tokenSavings.reduce((sum, t) => sum + t.saved, 0);

  // Average savings
  if (store.tokenSavings.length > 0) {
    store.summary.avgSavingsPercent = Math.round(
      store.tokenSavings.reduce((sum, t) => sum + t.savingsPercent, 0) / store.tokenSavings.length
    );
  }

  // Top queries (last 1000 searches)
  const recentSearches = store.searches.slice(-1000);
  const queryCounts: Record<string, number> = {};
  for (const s of recentSearches) {
    const normalized = s.query.toLowerCase().trim();
    queryCounts[normalized] = (queryCounts[normalized] || 0) + 1;
  }
  store.summary.topQueries = Object.entries(queryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Top tools (last 1000 selections)
  const recentSelections = store.toolSelections.slice(-1000);
  const toolCounts: Record<string, number> = {};
  for (const s of recentSelections) {
    toolCounts[s.tool] = (toolCounts[s.tool] || 0) + 1;
  }
  store.summary.topTools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tool, count]) => ({ tool, count }));

  // Top indexes from search results
  const indexCounts: Record<string, number> = {};
  for (const s of recentSearches) {
    if (s.topResult) {
      indexCounts[s.topResult] = (indexCounts[s.topResult] || 0) + 1;
    }
  }
  store.summary.topIndexes = Object.entries(indexCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([index, count]) => ({ index, count }));
}

// ============================================================
// TRACKING FUNCTIONS (called by KB tools)
// ============================================================

// Estimated tokens for all tools loaded (without index)
const ALL_TOOLS_TOKENS = 50000;

/**
 * Track a search event
 */
export function trackSearch(params: {
  query: string;
  method: 'keyword' | 'semantic' | 'hybrid';
  resultsCount: number;
  topResult?: string;
  tokensUsed: number;
  durationMs: number;
}): void {
  const store = loadAnalytics();

  // Add search event
  store.searches.push({
    timestamp: new Date().toISOString(),
    ...params
  });

  // Calculate token savings
  const saved = ALL_TOOLS_TOKENS - params.tokensUsed;
  const savingsPercent = Math.round((saved / ALL_TOOLS_TOKENS) * 100);

  store.tokenSavings.push({
    timestamp: new Date().toISOString(),
    query: params.query,
    withoutIndex: ALL_TOOLS_TOKENS,
    withIndex: params.tokensUsed,
    saved,
    savingsPercent
  });

  // Keep only last 10000 events
  if (store.searches.length > 10000) {
    store.searches = store.searches.slice(-10000);
  }
  if (store.tokenSavings.length > 10000) {
    store.tokenSavings = store.tokenSavings.slice(-10000);
  }

  updateSummary(store);
  saveAnalytics(store);
}

/**
 * Track tool selection
 */
export function trackToolSelection(params: {
  tool: string;
  source: 'search' | 'suggest' | 'direct';
  query?: string;
}): void {
  const store = loadAnalytics();

  store.toolSelections.push({
    timestamp: new Date().toISOString(),
    ...params
  });

  // Keep only last 10000 events
  if (store.toolSelections.length > 10000) {
    store.toolSelections = store.toolSelections.slice(-10000);
  }

  updateSummary(store);
  saveAnalytics(store);
}

// ============================================================
// MCP TOOL DEFINITIONS
// ============================================================

export const KB_ANALYTICS_TOOLS = {
  kb_stats: {
    name: 'kb_stats',
    description: 'Get KB usage statistics including token savings, top queries, and tool selection patterns.',
    descriptionHi: 'KB उपयोग आंकड़े प्राप्त करें',
    category: 'knowledge-base',
    voiceTriggers: ['kb stats', 'usage stats', 'token savings'],
    parameters: [
      { name: 'period', type: 'string', description: 'Period: today, week, month, all (default: all)', required: false },
      { name: 'detail', type: 'string', description: 'Detail level: summary, full (default: summary)', required: false }
    ]
  },

  kb_token_savings: {
    name: 'kb_token_savings',
    description: 'Calculate token savings for the KB index system vs loading all tools.',
    descriptionHi: 'टोकन बचत की गणना करें',
    category: 'knowledge-base',
    voiceTriggers: ['token savings', 'cost savings'],
    parameters: []
  },

  kb_top_tools: {
    name: 'kb_top_tools',
    description: 'Get the most frequently selected tools from KB searches.',
    descriptionHi: 'सबसे ज्यादा चुने गए टूल्स',
    category: 'knowledge-base',
    voiceTriggers: ['top tools', 'popular tools'],
    parameters: [
      { name: 'limit', type: 'number', description: 'Number of tools to return (default: 10)', required: false }
    ]
  },

  kb_reset_analytics: {
    name: 'kb_reset_analytics',
    description: 'Reset KB analytics data. Use with caution.',
    descriptionHi: 'KB analytics रीसेट करें',
    category: 'knowledge-base',
    voiceTriggers: ['reset analytics'],
    parameters: [
      { name: 'confirm', type: 'boolean', description: 'Must be true to confirm reset', required: true }
    ]
  }
};

export const KB_ANALYTICS_EXECUTORS: Record<string, (params: any) => Promise<any>> = {
  async kb_stats({ period = 'all', detail = 'summary' }: { period?: string; detail?: string }) {
    const store = loadAnalytics();

    // Filter by period
    let searches = store.searches;
    let tokenSavings = store.tokenSavings;
    let toolSelections = store.toolSelections;

    const now = new Date();
    let cutoff: Date | null = null;

    if (period === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (cutoff) {
      const cutoffStr = cutoff.toISOString();
      searches = searches.filter(s => s.timestamp >= cutoffStr);
      tokenSavings = tokenSavings.filter(t => t.timestamp >= cutoffStr);
      toolSelections = toolSelections.filter(t => t.timestamp >= cutoffStr);
    }

    // Calculate period stats
    const periodStats = {
      period,
      searches: searches.length,
      toolSelections: toolSelections.length,
      tokensSaved: tokenSavings.reduce((sum, t) => sum + t.saved, 0),
      avgSavingsPercent: tokenSavings.length > 0
        ? Math.round(tokenSavings.reduce((sum, t) => sum + t.savingsPercent, 0) / tokenSavings.length)
        : 0,
      avgSearchDurationMs: searches.length > 0
        ? Math.round(searches.reduce((sum, s) => sum + s.durationMs, 0) / searches.length)
        : 0
    };

    // Estimate cost savings (at $0.003 per 1K tokens for Claude)
    const costSaved = (periodStats.tokensSaved / 1000) * 0.003;

    const result: any = {
      success: true,
      data: {
        period,
        stats: periodStats,
        costSavings: {
          tokensSaved: periodStats.tokensSaved,
          estimatedUSD: `$${costSaved.toFixed(4)}`,
          note: 'Based on $0.003/1K tokens'
        },
        allTime: store.summary
      }
    };

    if (detail === 'full') {
      result.data.recentSearches = searches.slice(-20).reverse();
      result.data.recentSelections = toolSelections.slice(-20).reverse();
    }

    return result;
  },

  async kb_token_savings() {
    const store = loadAnalytics();

    const totalSearches = store.tokenSavings.length;
    const totalWithoutIndex = totalSearches * ALL_TOOLS_TOKENS;
    const totalWithIndex = store.tokenSavings.reduce((sum, t) => sum + t.withIndex, 0);
    const totalSaved = store.tokenSavings.reduce((sum, t) => sum + t.saved, 0);
    const avgSavings = totalSearches > 0 ? Math.round(totalSaved / totalSearches) : 0;
    const avgPercent = totalSearches > 0
      ? Math.round((totalSaved / totalWithoutIndex) * 100)
      : 0;

    // Cost projections
    const costPerToken = 0.000003; // $0.003 per 1K tokens
    const monthlyCostWithout = totalSearches > 0
      ? (totalWithoutIndex / totalSearches) * 10000 * costPerToken // Project to 10K monthly queries
      : 0;
    const monthlyCostWith = totalSearches > 0
      ? (totalWithIndex / totalSearches) * 10000 * costPerToken
      : 0;

    return {
      success: true,
      data: {
        totalSearches,
        tokenStats: {
          withoutIndex: totalWithoutIndex,
          withIndex: totalWithIndex,
          saved: totalSaved,
          avgSavedPerQuery: avgSavings,
          savingsPercent: avgPercent
        },
        costProjection: {
          monthlyQueries: 10000,
          withoutIndex: `$${monthlyCostWithout.toFixed(2)}`,
          withIndex: `$${monthlyCostWith.toFixed(2)}`,
          monthlySavings: `$${(monthlyCostWithout - monthlyCostWith).toFixed(2)}`
        },
        comparison: {
          before: `${ALL_TOOLS_TOKENS.toLocaleString()} tokens/query (all 258 tools)`,
          after: `~${Math.round(totalWithIndex / Math.max(totalSearches, 1)).toLocaleString()} tokens/query (indexed)`,
          reduction: `${avgPercent}% reduction`
        }
      }
    };
  },

  async kb_top_tools({ limit = 10 }: { limit?: number }) {
    const store = loadAnalytics();

    return {
      success: true,
      data: {
        topTools: store.summary.topTools.slice(0, limit),
        topQueries: store.summary.topQueries.slice(0, limit),
        topIndexes: store.summary.topIndexes.slice(0, limit),
        totalSelections: store.summary.totalToolSelections
      }
    };
  },

  async kb_reset_analytics({ confirm }: { confirm: boolean }) {
    if (!confirm) {
      return {
        success: false,
        error: 'Must set confirm=true to reset analytics'
      };
    }

    const newStore = { ...DEFAULT_STORE, created: new Date().toISOString() };
    saveAnalytics(newStore);

    return {
      success: true,
      data: {
        message: 'Analytics reset successfully',
        timestamp: newStore.created
      }
    };
  }
};

export default { KB_ANALYTICS_TOOLS, KB_ANALYTICS_EXECUTORS, trackSearch, trackToolSelection };
