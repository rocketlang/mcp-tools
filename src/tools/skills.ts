/**
 * Skills Tool - Inject .claude/skills into AI requests
 * 
 * Loads ANKR skills and injects them as context for any AI provider.
 * Works with your existing ai-proxy routing.
 * 
 * SETUP:
 * 1. Ensure .claude/skills/ exists with SKILL.md files
 * 2. Register this tool in your MCP registry
 * 3. Call inject_skills before AI completion requests
 * 
 * © Powerp Box IT Solutions Pvt Ltd
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { MCPTool, MCPParameter, MCPResult } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type Product = 'swayam' | 'wowtruck' | 'complimtrx' | 'saathi' | 'baniai' | 'ankr-internal' | string;

export interface SkillContent {
  name: string;
  content: string;
  tokens: number;  // Approximate
}

export interface SkillInjectionResult {
  skills: string[];
  systemPrompt: string;
  tokensAdded: number;
  product: Product;
}

// ============================================================================
// PRODUCT → SKILL MAPPINGS
// ============================================================================

const PRODUCT_SKILLS: Record<Product, string[]> = {
  'swayam': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-tms-dev', 'ankr-llmbox'],
  'wowtruck': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-tms-dev', 'ankr-voice-hindi', 'ankr-logistics-rag', 'ankr-eon-memory'],
  'complimtrx': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-tms-dev', 'ankr-logistics-rag'],
  'saathi': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-voice-hindi', 'ankr-eon-memory'],
  'baniai': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-tms-dev', 'ankr-logistics-rag'],
  'ankr-internal': ['ankr-intent-router', 'ankr-mcp-tools', 'ankr-tms-dev', 'ankr-eon-memory', 'ankr-llmbox', 'ankr-logistics-rag', 'ankr-voice-hindi'],
};

// ============================================================================
// SKILL AUTO-DETECTION PATTERNS
// ============================================================================

const SKILL_PATTERNS: Record<string, string[]> = {
  'ankr-intent-router': ['karo', 'banao', 'dikhao', 'batao', 'hatao', 'create', 'make', 'show', 'list', 'do', 'run', 'help', 'kar', 'bana'],
  'ankr-mcp-tools': ['tool', 'mcp', 'invoke', 'call', 'execute', 'port', 'gst', 'invoice', 'commit', 'component', 'deploy', 'check'],
  'ankr-tms-dev': ['module', 'service', 'controller', 'nestjs', 'prisma', 'crud', 'api', 'dto', 'entity'],
  'ankr-eon-memory': ['memory', 'episode', 'learn', 'remember', 'pattern', 'context', 'eon'],
  'ankr-voice-hindi': ['voice', 'hindi', 'tamil', 'telugu', 'बोलो', 'சொல்', 'చెப்పు', 'speak', 'audio'],
  'ankr-llmbox': ['llm', 'provider', 'cost', 'groq', 'deepseek', 'route', 'model'],
  'ankr-logistics-rag': ['search', 'find', 'shipment', 'carrier', 'route', 'track', 'delivery', 'freight'],
};

// ============================================================================
// SKILLS TOOL CLASS
// ============================================================================

export class SkillsTool implements MCPTool {
  name = 'inject_skills';
  description = 'Load and inject ANKR skills based on product/query. Enhances AI responses with domain knowledge.';

  private skillsPath: string;
  private cache: Map<string, SkillContent> = new Map();
  private maxTokens: number;

  parameters: MCPParameter[] = [
    { 
      name: 'product', 
      type: 'string', 
      description: 'Product name: swayam, wowtruck, complimtrx, saathi, baniai', 
      required: false,
      default: 'ankr-internal'
    },
    { 
      name: 'query', 
      type: 'string', 
      description: 'User query - used for auto-detecting relevant skills', 
      required: false 
    },
    { 
      name: 'skills', 
      type: 'array', 
      description: 'Explicit skill names to load (overrides auto-detection)', 
      required: false 
    },
    { 
      name: 'max_tokens', 
      type: 'number', 
      description: 'Maximum tokens for skill content', 
      required: false,
      default: 4000
    },
  ];

  constructor(skillsPath?: string, maxTokens: number = 4000) {
    // Try multiple paths
    const possiblePaths = [
      skillsPath,
      process.env.SKILLS_PATH,
      join(process.cwd(), '.claude/skills'),
      join(process.env.HOME || '~', 'ankr-labs-nx/.claude/skills'),
      '/root/ankr-labs-nx/.claude/skills',
    ].filter(Boolean) as string[];

    this.skillsPath = possiblePaths.find(p => existsSync(p)) || possiblePaths[0];
    this.maxTokens = maxTokens;

    if (existsSync(this.skillsPath)) {
      console.log(`[SkillsTool] ✅ Skills path: ${this.skillsPath}`);
      console.log(`[SkillsTool] ✅ Available: ${this.listAvailableSkills().join(', ')}`);
    } else {
      console.warn(`[SkillsTool] ⚠️ Skills path not found: ${this.skillsPath}`);
    }
  }

  // --------------------------------------------------------------------------
  // MAIN EXECUTE METHOD
  // --------------------------------------------------------------------------

  async execute(params: Record<string, any>): Promise<MCPResult> {
    const startTime = Date.now();

    try {
      const product = (params.product || 'ankr-internal') as Product;
      const query = params.query || '';
      const explicitSkills = params.skills as string[] | undefined;
      const maxTokens = params.max_tokens || this.maxTokens;

      // Determine which skills to load
      const skillNames = explicitSkills || this.determineSkills(product, query);

      // Load skill contents
      const skills = this.loadSkills(skillNames, maxTokens);

      // Build system prompt injection
      const systemPrompt = this.buildSystemPrompt(skills, product);

      const result: SkillInjectionResult = {
        skills: skills.map(s => s.name),
        systemPrompt,
        tokensAdded: skills.reduce((sum, s) => sum + s.tokens, 0),
        product,
      };

      return {
        success: true,
        data: result,
        metadata: {
          tool: 'inject_skills',
          duration_ms: Date.now() - startTime,
          cost: 0,
          
          
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          tool: 'inject_skills',
          duration_ms: Date.now() - startTime,
        },
      };
    }
  }

  // --------------------------------------------------------------------------
  // SKILL DETERMINATION
  // --------------------------------------------------------------------------

  private determineSkills(product: Product, query: string): string[] {
    // Start with product defaults
    const productSkills = PRODUCT_SKILLS[product] || PRODUCT_SKILLS['ankr-internal'];

    // If no query, return product defaults
    if (!query) {
      return productSkills.slice(0, 3);  // Max 3 skills
    }

    // Auto-detect from query
    const detected = this.autoDetectSkills(query);

    // Merge: detected first, then product defaults
    const merged = [...new Set([...detected, ...productSkills])];

    // Return top 3
    return merged.slice(0, 3);
  }

  private autoDetectSkills(query: string): string[] {
    const queryLower = query.toLowerCase();
    const scores: Record<string, number> = {};

    for (const [skill, keywords] of Object.entries(SKILL_PATTERNS)) {
      scores[skill] = keywords.filter(k => queryLower.includes(k)).length;
    }

    // Return skills with score > 0, sorted by score
    return Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([skill]) => skill);
  }

  // --------------------------------------------------------------------------
  // SKILL LOADING
  // --------------------------------------------------------------------------

  private loadSkills(skillNames: string[], maxTokens: number): SkillContent[] {
    const skills: SkillContent[] = [];
    let totalTokens = 0;

    for (const name of skillNames) {
      // Check cache
      if (this.cache.has(name)) {
        const cached = this.cache.get(name)!;
        if (totalTokens + cached.tokens <= maxTokens) {
          skills.push(cached);
          totalTokens += cached.tokens;
        }
        continue;
      }

      // Load from file
      const skillPath = join(this.skillsPath, name, 'SKILL.md');
      if (!existsSync(skillPath)) {
        console.warn(`[SkillsTool] Skill not found: ${name}`);
        continue;
      }

      const content = readFileSync(skillPath, 'utf-8');
      const tokens = this.estimateTokens(content);

      // Check if fits
      if (totalTokens + tokens > maxTokens) {
        // Try to compress
        const compressed = this.compressSkill(content, maxTokens - totalTokens);
        if (compressed) {
          const skill: SkillContent = {
            name,
            content: compressed.content,
            tokens: compressed.tokens,
          };
          skills.push(skill);
          totalTokens += compressed.tokens;
        }
        continue;
      }

      const skill: SkillContent = { name, content, tokens };
      this.cache.set(name, skill);
      skills.push(skill);
      totalTokens += tokens;
    }

    return skills;
  }

  private compressSkill(content: string, maxTokens: number): { content: string; tokens: number } | null {
    // Extract key sections
    const sections = ['## Overview', '## Usage', '## Examples', '## Key Patterns'];
    const lines = content.split('\n');
    const compressed: string[] = [];

    let currentSection = '';
    let inRelevantSection = false;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentSection = line;
        inRelevantSection = sections.some(s => line.includes(s.replace('## ', '')));
      }

      if (inRelevantSection || line.startsWith('# ')) {
        compressed.push(line);
      }
    }

    const result = compressed.join('\n');
    const tokens = this.estimateTokens(result);

    if (tokens <= maxTokens) {
      return { content: result, tokens };
    }

    // Still too big - take first N lines
    const truncated = result.split('\n').slice(0, 50).join('\n');
    return { content: truncated, tokens: this.estimateTokens(truncated) };
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  // --------------------------------------------------------------------------
  // SYSTEM PROMPT BUILDING
  // --------------------------------------------------------------------------

  private buildSystemPrompt(skills: SkillContent[], product: Product): string {
    if (skills.length === 0) {
      return '';
    }

    const skillsContent = skills.map(s => s.content).join('\n\n---\n\n');

    return `<ankr_skills product="${product}">
${skillsContent}
</ankr_skills>

You are an AI assistant for ${product.toUpperCase()}, part of ANKR Labs ecosystem by Powerp Box IT Solutions Pvt Ltd.
Follow the patterns and guidelines from the skills above.
Be concise, practical, and cost-conscious.`;
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------

  listAvailableSkills(): string[] {
    if (!existsSync(this.skillsPath)) {
      return [];
    }

    return readdirSync(this.skillsPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .filter(d => existsSync(join(this.skillsPath, d.name, 'SKILL.md')))
      .map(d => d.name);
  }

  getProductSkills(product: Product): string[] {
    return PRODUCT_SKILLS[product] || PRODUCT_SKILLS['ankr-internal'];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSkillsTool(skillsPath?: string, maxTokens?: number): SkillsTool {
  return new SkillsTool(skillsPath, maxTokens);
}

// ============================================================================
// HELPER: Direct skill injection (for use in ai-proxy)
// ============================================================================

let skillsToolInstance: SkillsTool | null = null;

export function getSkillsTool(): SkillsTool {
  if (!skillsToolInstance) {
    skillsToolInstance = new SkillsTool();
  }
  return skillsToolInstance;
}

/**
 * Quick helper to inject skills into messages array
 * Use this in ai-proxy before calling any provider
 */
export async function injectSkillsIntoMessages(
  messages: Array<{ role: string; content: string }>,
  options: { product?: Product; query?: string; skills?: string[] } = {}
): Promise<Array<{ role: string; content: string }>> {
  const tool = getSkillsTool();
  
  const result = await tool.execute({
    product: options.product || 'ankr-internal',
    query: options.query || messages[messages.length - 1]?.content || '',
    skills: options.skills,
  });

  if (!result.success || !result.data?.systemPrompt) {
    return messages;
  }

  // Prepend skill context to system message or add new one
  const systemPrompt = result.data.systemPrompt;
  
  if (messages[0]?.role === 'system') {
    return [
      { role: 'system', content: systemPrompt + '\n\n' + messages[0].content },
      ...messages.slice(1),
    ];
  }

  return [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];
}
