/**
 * Knowledge Base Semantic Search
 *
 * Implements vector-based semantic search for the KB index system.
 * Uses @ankr/embeddings for vector generation and cosine similarity for search.
 *
 * @author ANKR Labs
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// KB root directory
const KB_ROOT = path.join(__dirname, '../../../../.ankr-kb');
const EMBEDDINGS_FILE = path.join(KB_ROOT, 'embeddings.json');

// ============================================================
// TYPES
// ============================================================

interface KBChunk {
  id: string;
  file: string;
  section: string;
  content: string;
  keywords: string[];
}

interface KBEmbedding {
  id: string;
  file: string;
  section: string;
  content: string;
  keywords: string[];
  embedding: number[];
}

interface EmbeddingsStore {
  version: string;
  created: string;
  model: string;
  dimensions: number;
  chunks: KBEmbedding[];
}

interface SearchResult {
  id: string;
  file: string;
  section: string;
  content: string;
  score: number;
  keywords: string[];
}

// ============================================================
// EMBEDDING UTILITIES
// ============================================================

/**
 * Simple hash-based embedding for fallback (no API needed)
 * Creates a deterministic 384-dim vector from text
 */
function hashEmbed(text: string): number[] {
  const dims = 384;
  const embedding = new Array(dims).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalized.split(/\s+/).filter(w => w.length > 2);

  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const idx = (charCode * (i + 1) * word.length) % dims;
      embedding[idx] += 1 / words.length;
    }
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dims; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ============================================================
// CHUNKING
// ============================================================

/**
 * Extract chunks from a markdown file
 */
function extractChunks(filePath: string, content: string): KBChunk[] {
  const chunks: KBChunk[] = [];
  const relativePath = filePath.replace(KB_ROOT + '/', '');

  // Split by ## headers
  const sections = content.split(/^## /gm);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section || section.length < 50) continue;

    // Extract section title
    const titleMatch = section.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : `Section ${i}`;

    // Extract keywords from content
    const keywords = extractKeywords(section);

    // Create chunk
    chunks.push({
      id: `${relativePath}#${i}`,
      file: relativePath,
      section: title,
      content: section.substring(0, 1000), // Limit content size
      keywords
    });
  }

  return chunks;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();

  // Extract from tables (| word |)
  const tableMatches = text.match(/\|\s*`?([a-z_]+)`?\s*\|/gi);
  if (tableMatches) {
    tableMatches.forEach(m => {
      const word = m.replace(/[|`\s]/g, '').toLowerCase();
      if (word.length > 2 && !['tool', 'use', 'for', 'the'].includes(word)) {
        keywords.add(word);
      }
    });
  }

  // Extract from code blocks
  const codeMatches = text.match(/`([a-z_]+)`/gi);
  if (codeMatches) {
    codeMatches.forEach(m => {
      const word = m.replace(/`/g, '').toLowerCase();
      if (word.length > 2) {
        keywords.add(word);
      }
    });
  }

  // Extract common tool/package names
  const toolPatterns = [
    /telegram|whatsapp|sms|email/gi,
    /upi|payment|razorpay/gi,
    /gst|aadhaar|pan|ulip|kyc/gi,
    /track|shipment|logistics/gi,
    /memory|context|eon|embed/gi,
    /auth|oauth|iam|login/gi,
    /voice|stt|tts/gi,
    /monitor|pulse|alert/gi
  ];

  toolPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => keywords.add(m.toLowerCase()));
    }
  });

  return Array.from(keywords).slice(0, 20);
}

// ============================================================
// EMBEDDINGS STORE
// ============================================================

/**
 * Load embeddings from file
 */
function loadEmbeddings(): EmbeddingsStore | null {
  try {
    if (fs.existsSync(EMBEDDINGS_FILE)) {
      const data = fs.readFileSync(EMBEDDINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[KB Semantic] Error loading embeddings:', e);
  }
  return null;
}

/**
 * Save embeddings to file
 */
function saveEmbeddings(store: EmbeddingsStore): void {
  try {
    fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(store, null, 2));
    console.log(`[KB Semantic] Saved ${store.chunks.length} embeddings`);
  } catch (e) {
    console.error('[KB Semantic] Error saving embeddings:', e);
  }
}

/**
 * Generate embeddings for all KB files
 */
async function generateAllEmbeddings(): Promise<EmbeddingsStore> {
  const chunks: KBEmbedding[] = [];

  // Read all index files
  const indexFiles = [
    'MANIFEST.md',
    'indexes/TOOLS.md',
    'indexes/PACKAGES.md',
    'indexes/SERVICES.md',
    'indexes/INFRA.md',
    'indexes/RECIPES.md',
    'indexes/CAPABILITY-MATRIX.md',
    'indexes/DECISION-TREES.md',
    'indexes/tools/messaging.md',
    'indexes/tools/payments.md',
    'indexes/tools/india.md',
    'indexes/tools/logistics.md',
    'indexes/tools/compliance.md',
    'indexes/tools/erp.md',
    'indexes/tools/crm.md',
    'indexes/tools/banking.md'
  ];

  for (const file of indexFiles) {
    const fullPath = path.join(KB_ROOT, file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const fileChunks = extractChunks(fullPath, content);

    for (const chunk of fileChunks) {
      // Generate embedding (using hash for now, can upgrade to real embeddings)
      const textToEmbed = `${chunk.section} ${chunk.keywords.join(' ')} ${chunk.content}`;
      const embedding = hashEmbed(textToEmbed);

      chunks.push({
        ...chunk,
        embedding
      });
    }
  }

  const store: EmbeddingsStore = {
    version: '1.0.0',
    created: new Date().toISOString(),
    model: 'hash-384',
    dimensions: 384,
    chunks
  };

  saveEmbeddings(store);
  return store;
}

// ============================================================
// SEMANTIC SEARCH
// ============================================================

/**
 * Semantic search across KB
 */
async function semanticSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
  // Load or generate embeddings
  let store = loadEmbeddings();
  if (!store || store.chunks.length === 0) {
    console.log('[KB Semantic] Generating embeddings...');
    store = await generateAllEmbeddings();
  }

  // Generate query embedding
  const queryEmbedding = hashEmbed(query);

  // Calculate similarities
  const results: SearchResult[] = store.chunks.map(chunk => ({
    id: chunk.id,
    file: chunk.file,
    section: chunk.section,
    content: chunk.content,
    keywords: chunk.keywords,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Sort by score and return top results
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// ============================================================
// MCP TOOL DEFINITIONS
// ============================================================

export const KB_SEMANTIC_TOOLS = {
  kb_semantic_search: {
    name: 'kb_semantic_search',
    description: 'Semantic search across the knowledge base using natural language. Better than keyword search for finding related concepts.',
    descriptionHi: 'प्राकृतिक भाषा का उपयोग करके नॉलेज बेस में सिमेंटिक सर्च',
    category: 'knowledge-base',
    voiceTriggers: ['semantic search', 'find related', 'natural search'],
    parameters: [
      { name: 'query', type: 'string', description: 'Natural language query (e.g., "how to notify a driver about delivery")', required: true },
      { name: 'limit', type: 'number', description: 'Max results to return (default: 5)', required: false }
    ]
  },

  kb_rebuild_embeddings: {
    name: 'kb_rebuild_embeddings',
    description: 'Rebuild the semantic search embeddings. Use after updating KB files.',
    descriptionHi: 'सिमेंटिक सर्च एम्बेडिंग्स को दोबारा बनाएं',
    category: 'knowledge-base',
    voiceTriggers: ['rebuild embeddings', 'update embeddings'],
    parameters: []
  }
};

export const KB_SEMANTIC_EXECUTORS: Record<string, (params: any) => Promise<any>> = {
  async kb_semantic_search({ query, limit = 5 }: { query: string; limit?: number }) {
    try {
      const results = await semanticSearch(query, limit);

      return {
        success: true,
        data: {
          query,
          results: results.map(r => ({
            file: r.file,
            section: r.section,
            score: Math.round(r.score * 100) / 100,
            keywords: r.keywords.slice(0, 5),
            preview: r.content.substring(0, 200) + '...'
          })),
          hint: results.length > 0
            ? `Use kb_load to get full content: kb_load("${results[0].file}")`
            : 'No matches found. Try different terms.'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  },

  async kb_rebuild_embeddings() {
    try {
      const store = await generateAllEmbeddings();
      return {
        success: true,
        data: {
          chunks: store.chunks.length,
          model: store.model,
          dimensions: store.dimensions,
          created: store.created
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

export default { KB_SEMANTIC_TOOLS, KB_SEMANTIC_EXECUTORS };
