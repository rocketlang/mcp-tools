/**
 * Knowledge Base Index Tools for ANKR MCP
 *
 * Implements the "Files Are All You Need" pattern:
 * - kb_manifest: Load the root manifest (always small)
 * - kb_search: Search indexes by keyword
 * - kb_load: Load specific index/doc files
 * - kb_suggest: Get tool/package suggestions for a query
 *
 * @author ANKR Labs
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

// KB root directory
const KB_ROOT = path.join(__dirname, '../../../../.ankr-kb');

// Index file paths
const MANIFEST_PATH = path.join(KB_ROOT, 'MANIFEST.md');
const INDEXES_PATH = path.join(KB_ROOT, 'indexes');
const DOCS_PATH = path.join(KB_ROOT, 'docs');

/**
 * Read a file from the KB
 */
function readKBFile(relativePath: string): string | null {
  const fullPath = path.join(KB_ROOT, relativePath);
  try {
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
  } catch (e) {
    console.error(`[KB] Error reading ${relativePath}:`, e);
  }
  return null;
}

/**
 * List files in a KB directory
 */
function listKBFiles(relativePath: string): string[] {
  const fullPath = path.join(KB_ROOT, relativePath);
  try {
    if (fs.existsSync(fullPath)) {
      return fs.readdirSync(fullPath).filter(f => f.endsWith('.md'));
    }
  } catch (e) {
    console.error(`[KB] Error listing ${relativePath}:`, e);
  }
  return [];
}

/**
 * Search content for keywords
 */
function searchContent(content: string, keywords: string[]): number {
  const lowerContent = content.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    const regex = new RegExp(kw.toLowerCase(), 'gi');
    const matches = lowerContent.match(regex);
    if (matches) {
      score += matches.length;
    }
  }
  return score;
}

// ============================================================
// KB TOOL DEFINITIONS
// ============================================================

export const KB_TOOLS = {
  kb_manifest: {
    name: 'kb_manifest',
    description: 'Load the ANKR Knowledge Base manifest (root index). Use this FIRST to understand what indexes are available.',
    descriptionHi: 'ANKR नॉलेज बेस मैनिफेस्ट लोड करें',
    category: 'knowledge-base',
    voiceTriggers: ['manifest', 'kb index', 'knowledge base'],
    parameters: []
  },

  kb_search: {
    name: 'kb_search',
    description: 'Search the knowledge base indexes by keywords. Returns matching indexes and file paths.',
    descriptionHi: 'कीवर्ड द्वारा नॉलेज बेस इंडेक्स खोजें',
    category: 'knowledge-base',
    voiceTriggers: ['search kb', 'find in kb', 'kb search'],
    parameters: [
      { name: 'query', type: 'string', description: 'Search query (keywords)', required: true },
      { name: 'category', type: 'string', description: 'Filter by category: tools, packages, services, infra', required: false }
    ]
  },

  kb_load: {
    name: 'kb_load',
    description: 'Load one or more knowledge base files. Use after kb_search to get full content.',
    descriptionHi: 'नॉलेज बेस फाइलें लोड करें',
    category: 'knowledge-base',
    voiceTriggers: ['load kb', 'get kb file', 'kb load'],
    parameters: [
      { name: 'paths', type: 'string', description: 'Comma-separated file paths relative to .ankr-kb/ (e.g., "indexes/TOOLS.md,indexes/tools/messaging.md")', required: true }
    ]
  },

  kb_suggest: {
    name: 'kb_suggest',
    description: 'Get tool and package suggestions for a query. Returns the most relevant tools/packages without loading full docs.',
    descriptionHi: 'क्वेरी के लिए टूल और पैकेज सुझाव प्राप्त करें',
    category: 'knowledge-base',
    voiceTriggers: ['suggest tools', 'what tool', 'recommend'],
    parameters: [
      { name: 'query', type: 'string', description: 'What do you want to do? (e.g., "send whatsapp message", "verify gst number")', required: true },
      { name: 'limit', type: 'number', description: 'Max suggestions to return (default: 5)', required: false }
    ]
  },

  kb_list: {
    name: 'kb_list',
    description: 'List all available knowledge base indexes and their contents.',
    descriptionHi: 'सभी उपलब्ध नॉलेज बेस इंडेक्स सूचीबद्ध करें',
    category: 'knowledge-base',
    voiceTriggers: ['list kb', 'kb contents', 'what indexes'],
    parameters: []
  }
};

// ============================================================
// KB TOOL EXECUTORS
// ============================================================

export const KB_EXECUTORS: Record<string, (params: any) => Promise<any>> = {
  async kb_manifest() {
    const content = readKBFile('MANIFEST.md');
    if (!content) {
      return {
        success: false,
        error: 'MANIFEST.md not found. KB may not be initialized.',
        data: { path: MANIFEST_PATH }
      };
    }
    return {
      success: true,
      data: {
        content,
        path: 'MANIFEST.md',
        tokens: Math.ceil(content.length / 4) // Rough token estimate
      }
    };
  },

  async kb_search({ query, category }: { query: string; category?: string }) {
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    const results: Array<{ path: string; score: number; title: string }> = [];

    // Search main indexes
    const mainIndexes = ['TOOLS.md', 'PACKAGES.md', 'SERVICES.md', 'INFRA.md'];
    for (const idx of mainIndexes) {
      if (category && !idx.toLowerCase().includes(category.toLowerCase())) continue;

      const content = readKBFile(`indexes/${idx}`);
      if (content) {
        const score = searchContent(content, keywords);
        if (score > 0) {
          results.push({ path: `indexes/${idx}`, score, title: idx.replace('.md', '') });
        }
      }
    }

    // Search sub-indexes
    const subDirs = ['tools', 'packages'];
    for (const dir of subDirs) {
      if (category && !dir.includes(category)) continue;

      const files = listKBFiles(`indexes/${dir}`);
      for (const file of files) {
        const content = readKBFile(`indexes/${dir}/${file}`);
        if (content) {
          const score = searchContent(content, keywords);
          if (score > 0) {
            results.push({
              path: `indexes/${dir}/${file}`,
              score,
              title: `${dir}/${file.replace('.md', '')}`
            });
          }
        }
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return {
      success: true,
      data: {
        query,
        keywords,
        results: results.slice(0, 10),
        total: results.length
      }
    };
  },

  async kb_load({ paths }: { paths: string }) {
    const pathList = paths.split(',').map(p => p.trim());
    const loaded: Array<{ path: string; content: string; tokens: number }> = [];
    const errors: string[] = [];

    for (const p of pathList) {
      const content = readKBFile(p);
      if (content) {
        loaded.push({
          path: p,
          content,
          tokens: Math.ceil(content.length / 4)
        });
      } else {
        errors.push(p);
      }
    }

    const totalTokens = loaded.reduce((sum, f) => sum + f.tokens, 0);

    return {
      success: loaded.length > 0,
      data: {
        loaded,
        errors: errors.length > 0 ? errors : undefined,
        totalTokens,
        fileCount: loaded.length
      }
    };
  },

  async kb_suggest({ query, limit = 5 }: { query: string; limit?: number }) {
    // Quick keyword extraction
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    // Keyword to suggestion mapping (hardcoded for speed)
    const suggestions: Array<{ type: 'tool' | 'package'; name: string; description: string; score: number }> = [];

    // Tool suggestions based on keywords
    const toolKeywords: Record<string, { name: string; description: string }> = {
      'telegram': { name: 'telegram', description: 'Send Telegram messages (FREE)' },
      'whatsapp': { name: 'whatsapp', description: 'Send WhatsApp messages (India)' },
      'wa': { name: 'whatsapp', description: 'Send WhatsApp messages (India)' },
      'sms': { name: 'sms', description: 'Send SMS messages' },
      'message': { name: 'telegram', description: 'Send messages (telegram is FREE)' },
      'notify': { name: 'telegram', description: 'Send notifications (FREE via telegram)' },
      'alert': { name: 'telegram', description: 'Send alerts (FREE via telegram)' },
      'upi': { name: 'upi', description: 'Create UPI payment links' },
      'payment': { name: 'upi', description: 'Process UPI payments' },
      'pay': { name: 'upi', description: 'Create payment links' },
      'qr': { name: 'upi', description: 'Generate UPI QR codes' },
      'gst': { name: 'gst_verify', description: 'Verify GST number' },
      'gstin': { name: 'gst_verify', description: 'Verify GSTIN' },
      'aadhaar': { name: 'aadhaar_verify', description: 'Verify Aadhaar number' },
      'kyc': { name: 'aadhaar_verify', description: 'KYC via Aadhaar verification' },
      'pan': { name: 'pan_verify', description: 'Verify PAN card' },
      'track': { name: 'tracking', description: 'Track shipments (multi-carrier)' },
      'shipment': { name: 'tracking', description: 'Track shipment status' },
      'awb': { name: 'tracking', description: 'Track by AWB number' },
      'vehicle': { name: 'ulip_vehicle', description: 'Get vehicle info from ULIP' },
      'rc': { name: 'rc_verify', description: 'Verify vehicle RC' },
      'fastag': { name: 'ulip_fastag', description: 'Get Fastag transactions' },
      'eway': { name: 'ulip_eway', description: 'Get E-way bill info' },
      'search': { name: 'logistics_search', description: 'Search logistics documents (RAG)' },
      'docs': { name: 'logistics_search', description: 'Search documentation' },
      'rag': { name: 'logistics_retrieve', description: 'Get LLM-ready context' },
      'compliance': { name: 'logistics_compliance', description: 'Get compliance info (HOS, DOT)' },
      'hos': { name: 'logistics_compliance', description: 'Hours of Service rules' },
      'dot': { name: 'logistics_compliance', description: 'DOT regulations' },
      'license': { name: 'driving_license', description: 'Verify driving license' },
      'dl': { name: 'driving_license', description: 'Verify DL number' },
    };

    // Package suggestions based on keywords
    const packageKeywords: Record<string, { name: string; description: string }> = {
      'memory': { name: '@ankr/eon', description: 'Memory & context engine' },
      'context': { name: '@ankr/eon', description: 'Context assembly & RAG' },
      'remember': { name: '@ankr/eon', description: 'Store memories' },
      'eon': { name: '@ankr/eon', description: 'Universal memory engine' },
      'llm': { name: '@ankr/ai-router', description: 'Multi-provider LLM routing' },
      'gpt': { name: '@ankr/ai-router', description: 'LLM routing (15 providers)' },
      'claude': { name: '@ankr/ai-router', description: 'LLM routing with Anthropic' },
      'embed': { name: '@ankr/embeddings', description: 'Vector embeddings' },
      'vector': { name: '@ankr/embeddings', description: 'Generate embeddings' },
      'auth': { name: '@ankr/oauth', description: 'OAuth 2.0 (9 providers)' },
      'login': { name: '@ankr/oauth', description: 'Authentication' },
      'oauth': { name: '@ankr/oauth', description: 'OAuth integration' },
      'permission': { name: '@ankr/iam', description: 'IAM & RBAC' },
      'rbac': { name: '@ankr/iam', description: 'Role-based access control' },
      'role': { name: '@ankr/iam', description: 'Role management' },
      'voice': { name: '@ankr/voice-ai', description: 'Voice STT/TTS (100+ languages)' },
      'stt': { name: '@ankr/voice-ai', description: 'Speech to text' },
      'tts': { name: '@ankr/voice-ai', description: 'Text to speech' },
      'monitor': { name: '@ankr/pulse', description: 'Service monitoring' },
      'pulse': { name: '@ankr/pulse', description: 'Monitoring & control' },
    };

    // Match keywords to suggestions
    const seen = new Set<string>();
    for (const kw of keywords) {
      // Check tool keywords
      if (toolKeywords[kw] && !seen.has(toolKeywords[kw].name)) {
        suggestions.push({
          type: 'tool',
          name: toolKeywords[kw].name,
          description: toolKeywords[kw].description,
          score: 10
        });
        seen.add(toolKeywords[kw].name);
      }

      // Check package keywords
      if (packageKeywords[kw] && !seen.has(packageKeywords[kw].name)) {
        suggestions.push({
          type: 'package',
          name: packageKeywords[kw].name,
          description: packageKeywords[kw].description,
          score: 8
        });
        seen.add(packageKeywords[kw].name);
      }
    }

    // Sort by score and limit
    suggestions.sort((a, b) => b.score - a.score);

    return {
      success: true,
      data: {
        query,
        suggestions: suggestions.slice(0, limit),
        hint: suggestions.length > 0
          ? `Use kb_load to get full documentation for these ${suggestions[0].type}s`
          : 'No direct matches. Try kb_search for broader results.'
      }
    };
  },

  async kb_list() {
    const indexes: Array<{ category: string; files: string[] }> = [];

    // Main indexes
    const mainFiles = listKBFiles('indexes');
    if (mainFiles.length > 0) {
      indexes.push({ category: 'main', files: mainFiles });
    }

    // Sub-indexes
    for (const subDir of ['tools', 'packages']) {
      const subFiles = listKBFiles(`indexes/${subDir}`);
      if (subFiles.length > 0) {
        indexes.push({ category: subDir, files: subFiles });
      }
    }

    // Docs
    for (const docDir of ['tools', 'packages', 'services', 'skills']) {
      const docFiles = listKBFiles(`docs/${docDir}`);
      if (docFiles.length > 0) {
        indexes.push({ category: `docs/${docDir}`, files: docFiles });
      }
    }

    return {
      success: true,
      data: {
        kbRoot: KB_ROOT,
        indexes,
        totalFiles: indexes.reduce((sum, idx) => sum + idx.files.length, 0)
      }
    };
  }
};

// Export for registration
export default { KB_TOOLS, KB_EXECUTORS };
