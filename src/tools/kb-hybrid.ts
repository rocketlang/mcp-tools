/**
 * Knowledge Base Hybrid Search
 *
 * Combines keyword search + semantic search for best results.
 * Uses RRF (Reciprocal Rank Fusion) to merge rankings.
 *
 * @author ANKR Labs
 * @version 1.0.0
 */

import { KB_EXECUTORS } from './kb-index';
import { KB_SEMANTIC_EXECUTORS } from './kb-semantic';
import { trackSearch } from './kb-analytics';

// ============================================================
// TYPES
// ============================================================

interface HybridResult {
  file: string;
  section?: string;
  score: number;
  keywordScore: number;
  semanticScore: number;
  keywords: string[];
  preview: string;
  matchType: 'keyword' | 'semantic' | 'both';
}

// ============================================================
// HYBRID SEARCH LOGIC
// ============================================================

/**
 * Reciprocal Rank Fusion (RRF) scoring
 * Combines rankings from multiple sources
 */
function rrfScore(rank: number, k: number = 60): number {
  return 1 / (k + rank);
}

/**
 * Merge and deduplicate results from keyword and semantic search
 */
function mergeResults(
  keywordResults: any[],
  semanticResults: any[],
  keywordWeight: number = 0.4,
  semanticWeight: number = 0.6
): HybridResult[] {
  const merged = new Map<string, HybridResult>();

  // Process keyword results
  keywordResults.forEach((r, idx) => {
    const key = r.path || r.file;
    const rrfK = rrfScore(idx);

    merged.set(key, {
      file: key,
      section: r.title || r.section,
      score: rrfK * keywordWeight,
      keywordScore: r.score || rrfK * 100,
      semanticScore: 0,
      keywords: r.keywords || [],
      preview: r.preview || r.content?.substring(0, 200) || '',
      matchType: 'keyword'
    });
  });

  // Process semantic results
  semanticResults.forEach((r, idx) => {
    const key = r.file;
    const rrfK = rrfScore(idx);

    if (merged.has(key)) {
      // Combine scores - found in both!
      const existing = merged.get(key)!;
      existing.score += rrfK * semanticWeight;
      existing.semanticScore = r.score || rrfK;
      existing.matchType = 'both';
      if (r.keywords) {
        existing.keywords = [...new Set([...existing.keywords, ...r.keywords])];
      }
      if (!existing.preview && r.preview) {
        existing.preview = r.preview;
      }
    } else {
      // New result from semantic only
      merged.set(key, {
        file: key,
        section: r.section,
        score: rrfK * semanticWeight,
        keywordScore: 0,
        semanticScore: r.score || rrfK,
        keywords: r.keywords || [],
        preview: r.preview || '',
        matchType: 'semantic'
      });
    }
  });

  // Sort by combined score
  const results = Array.from(merged.values());
  results.sort((a, b) => b.score - a.score);

  // Boost "both" matches (found in both keyword and semantic)
  results.forEach(r => {
    if (r.matchType === 'both') {
      r.score *= 1.5; // 50% boost for matches in both
    }
  });

  // Re-sort after boost
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Extract keywords from query for highlighting
 */
function extractQueryKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['the', 'and', 'for', 'how', 'what', 'can', 'does'].includes(w));
}

// ============================================================
// MCP TOOL DEFINITIONS
// ============================================================

export const KB_HYBRID_TOOLS = {
  kb_hybrid_search: {
    name: 'kb_hybrid_search',
    description: 'Hybrid search combining keyword matching and semantic similarity. Best for finding relevant KB content. Use this as your primary search tool.',
    descriptionHi: 'कीवर्ड और सिमेंटिक सर्च का संयोजन - सबसे अच्छे परिणाम',
    category: 'knowledge-base',
    voiceTriggers: ['search', 'find', 'hybrid search', 'kb'],
    parameters: [
      { name: 'query', type: 'string', description: 'Search query (natural language or keywords)', required: true },
      { name: 'limit', type: 'number', description: 'Max results (default: 5)', required: false },
      { name: 'keyword_weight', type: 'number', description: 'Weight for keyword results 0-1 (default: 0.4)', required: false },
      { name: 'semantic_weight', type: 'number', description: 'Weight for semantic results 0-1 (default: 0.6)', required: false }
    ]
  },

  kb_smart_suggest: {
    name: 'kb_smart_suggest',
    description: 'Smart suggestions using hybrid search. Returns tools and packages with relevance explanation.',
    descriptionHi: 'हाइब्रिड सर्च से स्मार्ट सुझाव',
    category: 'knowledge-base',
    voiceTriggers: ['suggest', 'recommend', 'what should i use'],
    parameters: [
      { name: 'query', type: 'string', description: 'What do you want to do?', required: true },
      { name: 'include_docs', type: 'boolean', description: 'Include doc snippets (default: false)', required: false }
    ]
  }
};

export const KB_HYBRID_EXECUTORS: Record<string, (params: any) => Promise<any>> = {
  async kb_hybrid_search({
    query,
    limit = 5,
    keyword_weight = 0.4,
    semantic_weight = 0.6
  }: {
    query: string;
    limit?: number;
    keyword_weight?: number;
    semantic_weight?: number;
  }) {
    const startTime = Date.now();
    try {
      // Run both searches in parallel
      const [keywordResult, semanticResult] = await Promise.all([
        KB_EXECUTORS.kb_search({ query, category: undefined }),
        KB_SEMANTIC_EXECUTORS.kb_semantic_search({ query, limit: limit * 2 })
      ]);

      const keywordResults = keywordResult.success ? keywordResult.data.results : [];
      const semanticResults = semanticResult.success ? semanticResult.data.results : [];

      // Merge results
      const merged = mergeResults(
        keywordResults,
        semanticResults,
        keyword_weight,
        semantic_weight
      );

      // Take top N
      const topResults = merged.slice(0, limit);

      // Extract query keywords for context
      const queryKeywords = extractQueryKeywords(query);

      const durationMs = Date.now() - startTime;

      // Estimate tokens used (MANIFEST + top results previews)
      const tokensUsed = 500 + topResults.reduce((sum, r) => sum + Math.ceil(r.preview.length / 4), 0);

      // Track analytics (async, don't wait)
      trackSearch({
        query,
        method: 'hybrid',
        resultsCount: topResults.length,
        topResult: topResults[0]?.file,
        tokensUsed,
        durationMs
      });

      return {
        success: true,
        data: {
          query,
          queryKeywords,
          results: topResults.map(r => ({
            file: r.file,
            section: r.section,
            score: Math.round(r.score * 1000) / 1000,
            matchType: r.matchType,
            keywords: r.keywords.slice(0, 5),
            preview: r.preview.substring(0, 150) + '...'
          })),
          stats: {
            keywordMatches: keywordResults.length,
            semanticMatches: semanticResults.length,
            bothMatches: topResults.filter(r => r.matchType === 'both').length,
            durationMs,
            tokensUsed
          },
          hint: topResults.length > 0
            ? `Load top result: kb_load("${topResults[0].file}")`
            : 'No matches. Try different terms.'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  },

  async kb_smart_suggest({
    query,
    include_docs = false
  }: {
    query: string;
    include_docs?: boolean;
  }) {
    try {
      // Get hybrid search results
      const searchResult = await KB_HYBRID_EXECUTORS.kb_hybrid_search({
        query,
        limit: 5,
        keyword_weight: 0.5,
        semantic_weight: 0.5
      });

      if (!searchResult.success) {
        return searchResult;
      }

      // Also get direct suggestions
      const suggestResult = await KB_EXECUTORS.kb_suggest({ query, limit: 3 });
      const directSuggestions = suggestResult.success ? suggestResult.data.suggestions : [];

      // Build smart response
      const suggestions: Array<{
        type: 'tool' | 'package' | 'doc';
        name: string;
        reason: string;
        confidence: 'high' | 'medium' | 'low';
      }> = [];

      // Add direct suggestions (high confidence)
      directSuggestions.forEach((s: any) => {
        suggestions.push({
          type: s.type,
          name: s.name,
          reason: s.description,
          confidence: 'high'
        });
      });

      // Add doc suggestions from search (medium confidence)
      searchResult.data.results.forEach((r: any) => {
        if (r.matchType === 'both') {
          suggestions.push({
            type: 'doc',
            name: r.file,
            reason: `Matches both keywords and meaning (${r.section || 'general'})`,
            confidence: 'high'
          });
        } else if (r.score > 0.01) {
          suggestions.push({
            type: 'doc',
            name: r.file,
            reason: `${r.matchType} match: ${r.section || 'related content'}`,
            confidence: r.matchType === 'keyword' ? 'medium' : 'low'
          });
        }
      });

      // Deduplicate
      const seen = new Set<string>();
      const uniqueSuggestions = suggestions.filter(s => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      });

      // Optionally load doc content
      let docContent: string | undefined;
      if (include_docs && searchResult.data.results.length > 0) {
        const topDoc = searchResult.data.results[0].file;
        const loadResult = await KB_EXECUTORS.kb_load({ paths: topDoc });
        if (loadResult.success && loadResult.data.loaded.length > 0) {
          docContent = loadResult.data.loaded[0].content.substring(0, 500) + '...';
        }
      }

      return {
        success: true,
        data: {
          query,
          suggestions: uniqueSuggestions.slice(0, 8),
          topDoc: include_docs ? docContent : undefined,
          action: uniqueSuggestions.length > 0
            ? `Recommended: Use ${uniqueSuggestions[0].type} "${uniqueSuggestions[0].name}"`
            : 'No clear recommendation. Try kb_load("indexes/TOOLS.md") for full list.'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
};

export default { KB_HYBRID_TOOLS, KB_HYBRID_EXECUTORS };
