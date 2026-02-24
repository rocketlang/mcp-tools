/**
 * Knowledge Base PostgreSQL Search
 *
 * Semantic search using PostgreSQL + pgvector over indexed documentation.
 * Uses Voyage AI embeddings via AI Proxy GraphQL.
 *
 * Database: ankr_eon
 * Tables: knowledge_sources, knowledge_chunks, knowledge_queries
 *
 * @author ANKR Labs
 * @version 1.0.0
 */

import { Pool } from 'pg';
import axios from 'axios';

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://ankr:indrA@0612@localhost:5432/ankr_eon';
const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:4444';

// Lazy-init pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL });
  }
  return pool;
}

// ============================================================
// EMBEDDING GENERATION
// ============================================================

/**
 * Generate embedding for query using AI Proxy GraphQL
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(
      `${AI_PROXY_URL}/graphql`,
      {
        query: `mutation Embed($text: String!) {
          embed(text: $text) {
            embedding
          }
        }`,
        variables: { text }
      },
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data.embed.embedding;
  } catch (error) {
    console.error('[KB Postgres] Embedding error:', error);
    throw error;
  }
}

// ============================================================
// SEARCH FUNCTIONS
// ============================================================

interface SearchResult {
  id: string;
  sourceId: string;
  path: string;
  content: string;
  chunkIndex: number;
  similarity: number;
  metadata: Record<string, any>;
}

/**
 * Semantic search using pgvector cosine similarity
 */
async function semanticSearch(
  query: string,
  limit: number = 10,
  minSimilarity: number = 0.5
): Promise<SearchResult[]> {
  const db = getPool();

  // Generate query embedding
  const embedding = await generateEmbedding(query);
  const embeddingStr = `[${embedding.join(',')}]`;

  // Search using pgvector cosine similarity
  const sql = `
    SELECT
      c.id,
      c.source_id,
      s.path,
      c.content,
      c.chunk_index,
      1 - (c.embedding <=> $1::vector) as similarity,
      c.metadata
    FROM knowledge_chunks c
    JOIN knowledge_sources s ON c.source_id = s.id
    WHERE s.status = 'indexed'
      AND 1 - (c.embedding <=> $1::vector) >= $2
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3
  `;

  const result = await db.query(sql, [embeddingStr, minSimilarity, limit]);

  // Track the query for analytics
  await trackQuery(query, 'semantic', result.rows.length);

  return result.rows.map(row => ({
    id: row.id,
    sourceId: row.source_id,
    path: row.path,
    content: row.content,
    chunkIndex: row.chunk_index,
    similarity: parseFloat(row.similarity),
    metadata: row.metadata || {}
  }));
}

/**
 * Get search results with surrounding context
 */
async function searchWithContext(
  query: string,
  limit: number = 5,
  contextChunks: number = 1
): Promise<SearchResult[]> {
  const results = await semanticSearch(query, limit, 0.5);
  const db = getPool();

  // For each result, get surrounding chunks
  const enrichedResults: SearchResult[] = [];

  for (const result of results) {
    // Get previous and next chunks
    const contextSql = `
      SELECT content, chunk_index
      FROM knowledge_chunks
      WHERE source_id = $1
        AND chunk_index BETWEEN $2 AND $3
      ORDER BY chunk_index
    `;

    const startIdx = Math.max(0, result.chunkIndex - contextChunks);
    const endIdx = result.chunkIndex + contextChunks;

    const contextResult = await db.query(contextSql, [result.sourceId, startIdx, endIdx]);

    // Combine content
    const combinedContent = contextResult.rows
      .map((r: { content: string }) => r.content)
      .join('\n\n---\n\n');

    enrichedResults.push({
      ...result,
      content: combinedContent
    });
  }

  return enrichedResults;
}

/**
 * Track query for analytics
 */
async function trackQuery(
  query: string,
  searchType: string,
  resultsCount: number
): Promise<void> {
  try {
    const db = getPool();
    await db.query(
      `INSERT INTO knowledge_queries (query, search_type, results_count)
       VALUES ($1, $2, $3)`,
      [query, searchType, resultsCount]
    );
  } catch (error) {
    // Non-critical, just log
    console.error('[KB Postgres] Analytics tracking error:', error);
  }
}

/**
 * Get knowledge base statistics
 */
async function getStats(): Promise<{
  totalSources: number;
  indexedSources: number;
  totalChunks: number;
  totalTokens: number;
  recentQueries: number;
}> {
  const db = getPool();

  const statsResult = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM knowledge_sources) as total_sources,
      (SELECT COUNT(*) FROM knowledge_sources WHERE status = 'indexed') as indexed_sources,
      (SELECT COUNT(*) FROM knowledge_chunks) as total_chunks,
      (SELECT COALESCE(SUM(token_count), 0) FROM knowledge_chunks) as total_tokens,
      (SELECT COUNT(*) FROM knowledge_queries WHERE created_at > NOW() - INTERVAL '24 hours') as recent_queries
  `);

  const stats = statsResult.rows[0];
  return {
    totalSources: parseInt(stats.total_sources),
    indexedSources: parseInt(stats.indexed_sources),
    totalChunks: parseInt(stats.total_chunks),
    totalTokens: parseInt(stats.total_tokens),
    recentQueries: parseInt(stats.recent_queries)
  };
}

/**
 * Get recent popular queries
 */
async function getPopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
  const db = getPool();

  const result = await db.query(`
    SELECT query, COUNT(*) as count
    FROM knowledge_queries
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY query
    ORDER BY count DESC
    LIMIT $1
  `, [limit]);

  return result.rows.map((row: { query: string; count: string }) => ({
    query: row.query,
    count: parseInt(row.count)
  }));
}

// ============================================================
// MCP TOOL DEFINITIONS
// ============================================================

export const KB_POSTGRES_TOOLS = {
  kb_search_postgres: {
    name: 'kb_search_postgres',
    description: 'Semantic search over ANKR documentation using PostgreSQL + pgvector. Uses Voyage AI embeddings for accurate similarity matching. Best for finding documentation on specific topics.',
    descriptionHi: 'PostgreSQL + pgvector का उपयोग करके ANKR डॉक्यूमेंटेशन पर सिमेंटिक सर्च',
    category: 'knowledge-base',
    voiceTriggers: ['search docs', 'find documentation', 'db search'],
    parameters: [
      { name: 'query', type: 'string', description: 'Natural language search query', required: true },
      { name: 'limit', type: 'number', description: 'Maximum results to return (default: 10)', required: false },
      { name: 'min_similarity', type: 'number', description: 'Minimum similarity threshold 0-1 (default: 0.5)', required: false }
    ]
  },

  kb_search_with_context: {
    name: 'kb_search_with_context',
    description: 'Search documentation and include surrounding context from the same document. Better for understanding complete sections.',
    descriptionHi: 'आसपास के संदर्भ के साथ डॉक्यूमेंटेशन खोजें',
    category: 'knowledge-base',
    voiceTriggers: ['search with context', 'full section'],
    parameters: [
      { name: 'query', type: 'string', description: 'Natural language search query', required: true },
      { name: 'limit', type: 'number', description: 'Maximum results (default: 5)', required: false },
      { name: 'context_chunks', type: 'number', description: 'Number of surrounding chunks to include (default: 1)', required: false }
    ]
  },

  kb_stats_postgres: {
    name: 'kb_stats_postgres',
    description: 'Get statistics about the PostgreSQL knowledge base - indexed files, chunks, tokens, and query analytics.',
    descriptionHi: 'नॉलेज बेस के आंकड़े प्राप्त करें',
    category: 'knowledge-base',
    voiceTriggers: ['kb stats', 'knowledge stats'],
    parameters: []
  },

  kb_popular_queries: {
    name: 'kb_popular_queries',
    description: 'Get the most popular search queries from the last 7 days.',
    descriptionHi: 'पिछले 7 दिनों की लोकप्रिय खोजें',
    category: 'knowledge-base',
    voiceTriggers: ['popular searches', 'top queries'],
    parameters: [
      { name: 'limit', type: 'number', description: 'Number of queries to return (default: 10)', required: false }
    ]
  }
};

export const KB_POSTGRES_EXECUTORS: Record<string, (params: any) => Promise<any>> = {
  async kb_search_postgres({
    query,
    limit = 10,
    min_similarity = 0.5
  }: {
    query: string;
    limit?: number;
    min_similarity?: number;
  }) {
    try {
      const startTime = Date.now();
      const results = await semanticSearch(query, limit, min_similarity);
      const durationMs = Date.now() - startTime;

      return {
        success: true,
        data: {
          query,
          results: results.map(r => ({
            path: r.path,
            content: r.content.substring(0, 500) + (r.content.length > 500 ? '...' : ''),
            similarity: Math.round(r.similarity * 100) / 100,
            chunkIndex: r.chunkIndex,
            metadata: r.metadata
          })),
          stats: {
            totalResults: results.length,
            durationMs,
            minSimilarity: min_similarity
          },
          hint: results.length > 0
            ? `Top match: ${results[0].path} (${Math.round(results[0].similarity * 100)}% similar)`
            : 'No matches found. Try broader search terms.'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        hint: 'Make sure AI Proxy is running (pm2 start ai-proxy) and database is accessible.'
      };
    }
  },

  async kb_search_with_context({
    query,
    limit = 5,
    context_chunks = 1
  }: {
    query: string;
    limit?: number;
    context_chunks?: number;
  }) {
    try {
      const startTime = Date.now();
      const results = await searchWithContext(query, limit, context_chunks);
      const durationMs = Date.now() - startTime;

      return {
        success: true,
        data: {
          query,
          results: results.map(r => ({
            path: r.path,
            content: r.content,
            similarity: Math.round(r.similarity * 100) / 100,
            chunkIndex: r.chunkIndex
          })),
          stats: {
            totalResults: results.length,
            durationMs,
            contextChunks: context_chunks
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  },

  async kb_stats_postgres() {
    try {
      const stats = await getStats();

      return {
        success: true,
        data: {
          ...stats,
          estimatedCoverage: stats.indexedSources > 0
            ? `${stats.indexedSources} documentation files indexed`
            : 'No files indexed yet. Run the indexer.',
          tokensFormatted: stats.totalTokens.toLocaleString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  },

  async kb_popular_queries({ limit = 10 }: { limit?: number }) {
    try {
      const queries = await getPopularQueries(limit);

      return {
        success: true,
        data: {
          period: 'last 7 days',
          queries,
          insight: queries.length > 0
            ? `Most searched: "${queries[0].query}" (${queries[0].count} times)`
            : 'No queries recorded yet.'
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

export default { KB_POSTGRES_TOOLS, KB_POSTGRES_EXECUTORS };
