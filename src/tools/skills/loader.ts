/**
 * Skill Loader - Load skill files for agent consumption
 *
 * Instead of 231+ MCP tools bloating context, agents read skill files on-demand.
 * This loader provides utilities for discovering and loading skill files.
 *
 * @package @powerpbox/mcp
 * @version 1.4.0
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MCPTool, MCPResult } from '../../types';

// ============================================================================
// Configuration
// ============================================================================

const SKILLS_DIR = path.join(__dirname, '../../..', 'skills');

// ============================================================================
// Types
// ============================================================================

export interface Skill {
  name: string;
  category: string;
  path: string;
  description?: string;
}

export interface SkillContent {
  name: string;
  category: string;
  content: string;
  path: string;
}

// ============================================================================
// Skill Discovery
// ============================================================================

/**
 * List all available skill categories
 */
export function listSkillCategories(): string[] {
  try {
    const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    return [];
  }
}

/**
 * List all skills in a category
 */
export function listSkillsInCategory(category: string): Skill[] {
  try {
    const categoryDir = path.join(SKILLS_DIR, category);
    const files = fs.readdirSync(categoryDir);

    return files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        name: file.replace('.md', ''),
        category,
        path: path.join(categoryDir, file),
      }));
  } catch {
    return [];
  }
}

/**
 * List all available skills
 */
export function listAllSkills(): Skill[] {
  const categories = listSkillCategories();
  const skills: Skill[] = [];

  for (const category of categories) {
    skills.push(...listSkillsInCategory(category));
  }

  return skills;
}

/**
 * Search skills by keyword
 */
export function searchSkills(keyword: string): Skill[] {
  const allSkills = listAllSkills();
  const lowerKeyword = keyword.toLowerCase();

  return allSkills.filter(skill =>
    skill.name.toLowerCase().includes(lowerKeyword) ||
    skill.category.toLowerCase().includes(lowerKeyword)
  );
}

// ============================================================================
// Skill Loading
// ============================================================================

/**
 * Load a skill by name (searches all categories)
 */
export function loadSkill(name: string): SkillContent | null {
  const allSkills = listAllSkills();
  const skill = allSkills.find(s => s.name.toLowerCase() === name.toLowerCase());

  if (!skill) return null;

  try {
    const content = fs.readFileSync(skill.path, 'utf-8');
    return {
      name: skill.name,
      category: skill.category,
      content,
      path: skill.path,
    };
  } catch {
    return null;
  }
}

/**
 * Load a skill by category and name
 */
export function loadSkillFromCategory(category: string, name: string): SkillContent | null {
  const skillPath = path.join(SKILLS_DIR, category, `${name}.md`);

  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    return {
      name,
      category,
      content,
      path: skillPath,
    };
  } catch {
    return null;
  }
}

/**
 * Load multiple skills at once
 */
export function loadSkills(names: string[]): SkillContent[] {
  return names
    .map(name => loadSkill(name))
    .filter((skill): skill is SkillContent => skill !== null);
}

// ============================================================================
// Skill Index
// ============================================================================

/**
 * Get skill index (lightweight list for agent discovery)
 */
export function getSkillIndex(): Record<string, string[]> {
  const categories = listSkillCategories();
  const index: Record<string, string[]> = {};

  for (const category of categories) {
    const skills = listSkillsInCategory(category);
    index[category] = skills.map(s => s.name);
  }

  return index;
}

/**
 * Get skill index as formatted string
 */
export function getSkillIndexFormatted(): string {
  const index = getSkillIndex();
  let output = '# Available Skills\n\n';

  for (const [category, skills] of Object.entries(index)) {
    output += `## ${category}\n`;
    for (const skill of skills) {
      output += `- ${skill}\n`;
    }
    output += '\n';
  }

  return output;
}

// ============================================================================
// MCP Tools for Skills
// ============================================================================

/**
 * Create MCP tool for listing skills
 */
export function createSkillListTool(): MCPTool {
  return {
    name: 'skill_list',
    description: `List all available skills that can be loaded for learning APIs and procedures.

Skills are organized by category:
- india: GST, UPI, ULIP, Aadhaar, DigiLocker
- logistics: Tracking, Compliance, Routing, RAG
- messaging: Telegram, WhatsApp
- payments: Razorpay, UPI
- global: HTTP

Use this to discover what skills are available before loading one.`,
    parameters: [
      {
        name: 'category',
        type: 'string',
        description: 'Optional: Filter by category (india, logistics, messaging, payments, global)',
        required: false,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        let skills: Skill[];

        if (params.category) {
          skills = listSkillsInCategory(params.category as string);
        } else {
          skills = listAllSkills();
        }

        return {
          success: true,
          data: {
            skills: skills.map(s => ({ name: s.name, category: s.category })),
            total: skills.length,
            categories: listSkillCategories(),
          },
          metadata: {
            tool: 'skill_list',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'skill_list',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Create MCP tool for loading a skill
 */
export function createSkillLoadTool(): MCPTool {
  return {
    name: 'skill_load',
    description: `Load a skill file to learn how to use an API or perform a procedure.

Skills contain:
- API specifications and endpoints
- Code examples
- Environment variables needed
- Common patterns and best practices

Load a skill when you need to interact with an external service or follow a procedure.`,
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'Skill name (e.g., "telegram", "gst", "tracking")',
        required: true,
      },
      {
        name: 'category',
        type: 'string',
        description: 'Optional: Skill category to narrow search',
        required: false,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        let skill: SkillContent | null;

        if (params.category) {
          skill = loadSkillFromCategory(params.category as string, params.name as string);
        } else {
          skill = loadSkill(params.name as string);
        }

        if (!skill) {
          return {
            success: false,
            error: `Skill "${params.name}" not found. Use skill_list to see available skills.`,
            metadata: {
              tool: 'skill_load',
              duration_ms: Date.now() - startTime,
            },
          };
        }

        return {
          success: true,
          data: {
            name: skill.name,
            category: skill.category,
            content: skill.content,
          },
          metadata: {
            tool: 'skill_load',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'skill_load',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

/**
 * Create MCP tool for searching skills
 */
export function createSkillSearchTool(): MCPTool {
  return {
    name: 'skill_search',
    description: 'Search for skills by keyword. Returns matching skills across all categories.',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query (e.g., "payment", "tracking", "compliance")',
        required: true,
      },
    ],
    execute: async (params): Promise<MCPResult> => {
      const startTime = Date.now();

      try {
        const skills = searchSkills(params.query as string);

        return {
          success: true,
          data: {
            query: params.query,
            results: skills.map(s => ({ name: s.name, category: s.category })),
            total: skills.length,
          },
          metadata: {
            tool: 'skill_search',
            duration_ms: Date.now() - startTime,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: 'skill_search',
            duration_ms: Date.now() - startTime,
          },
        };
      }
    },
  };
}

// ============================================================================
// Export all skill tools
// ============================================================================

export const SKILL_TOOLS = {
  list: createSkillListTool,
  load: createSkillLoadTool,
  search: createSkillSearchTool,
};

export function getAllSkillTools(): MCPTool[] {
  return Object.values(SKILL_TOOLS).map(fn => fn());
}

export function getSkillToolCount(): number {
  return Object.keys(SKILL_TOOLS).length;
}
