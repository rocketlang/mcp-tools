/**
 * 🦷 RALPH WIGGUM TOOLS - AI-Powered Development Automation
 *
 * 24 tools for ANKR development workflow:
 * - Git: commit, review, release
 * - Code: component, api, schema, refactor, docs, cleanup
 * - Ops: deploy, monitor, backup, migrate, seed, deps, debug
 * - Search: search, explore, fetch, parallel
 * - Quality: test, audit, perf
 * - Convert: convert, i18n
 *
 * 🙏 Jai Guru Ji | ANKR Labs | Jan 2026
 */

import type { MCPResult } from '../types';
import { execSync } from 'child_process';

const FORGE_BIN = '/root/ankr-labs-nx/packages/forge/bin';

// Tool definition interface matching other MCP tools
interface ToolDef {
  name: string;
  description: string;
  descriptionHi: string;
  category: string;
  voiceTriggers: string[];
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Ralph Tool Definitions (24 tools)
 */
export const RALPH_TOOLS: Record<string, ToolDef> = {
  // === Git Operations (3) ===
  'ralph.commit': {
    name: 'ralph.commit',
    description: 'AI-powered git commit with conventional commit messages',
    descriptionHi: 'AI से git commit करो',
    category: 'ralph-git',
    voiceTriggers: ['commit changes', 'git commit', 'save code', 'कमिट करो', 'बदलाव सेव करो'],
    parameters: {
      type: 'object',
      properties: {
        all: { type: 'boolean', description: 'Stage all changes' },
        push: { type: 'boolean', description: 'Push after commit' },
        dryRun: { type: 'boolean', description: 'Preview without committing' },
      },
    },
  },
  'ralph.review': {
    name: 'ralph.review',
    description: 'AI-powered PR review with security and quality checks',
    descriptionHi: 'AI से PR review करो',
    category: 'ralph-git',
    voiceTriggers: ['review pr', 'check pull request', 'PR देखो', 'review करो'],
    parameters: {
      type: 'object',
      properties: {
        pr: { type: 'string', description: 'PR number or URL' },
        local: { type: 'boolean', description: 'Review local changes' },
        focus: { type: 'string', enum: ['security', 'performance', 'style', 'all'] },
      },
    },
  },
  'ralph.release': {
    name: 'ralph.release',
    description: 'Semantic versioning and release automation',
    descriptionHi: 'Release बनाओ',
    category: 'ralph-git',
    voiceTriggers: ['release', 'publish version', 'रिलीज करो'],
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['auto', 'patch', 'minor', 'major'] },
        dryRun: { type: 'boolean' },
      },
    },
  },

  // === Code Generation (6) ===
  'ralph.component': {
    name: 'ralph.component',
    description: 'Generate React component with tests and types',
    descriptionHi: 'React component बनाओ',
    category: 'ralph-code',
    voiceTriggers: ['create component', 'new component', 'कंपोनेंट बनाओ'],
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Component name' },
        type: { type: 'string', enum: ['functional', 'page', 'form', 'modal', 'table'] },
      },
      required: ['name'],
    },
  },
  'ralph.api': {
    name: 'ralph.api',
    description: 'Generate REST/GraphQL API endpoints',
    descriptionHi: 'API बनाओ',
    category: 'ralph-code',
    voiceTriggers: ['generate api', 'create endpoint', 'API बनाओ'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['generate', 'graphql', 'openapi', 'client'] },
        resource: { type: 'string' },
        framework: { type: 'string', enum: ['fastify', 'express', 'hono'] },
      },
    },
  },
  'ralph.schema': {
    name: 'ralph.schema',
    description: 'Generate Prisma/Zod/GraphQL schemas from types',
    descriptionHi: 'Schema बनाओ',
    category: 'ralph-code',
    voiceTriggers: ['generate schema', 'create schema', 'स्कीमा बनाओ'],
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['prisma', 'zod', 'typebox', 'graphql'] },
        source: { type: 'string' },
      },
    },
  },
  'ralph.refactor': {
    name: 'ralph.refactor',
    description: 'AI-powered code refactoring and improvements',
    descriptionHi: 'Code सुधारो',
    category: 'ralph-code',
    voiceTriggers: ['refactor code', 'improve code', 'कोड सुधारो'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['suggest', 'extract', 'rename', 'dedupe'] },
        target: { type: 'string' },
      },
    },
  },
  'ralph.docs': {
    name: 'ralph.docs',
    description: 'Auto-generate documentation (README, API docs, changelog)',
    descriptionHi: 'Documentation बनाओ',
    category: 'ralph-code',
    voiceTriggers: ['generate docs', 'create readme', 'डॉक्स बनाओ'],
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['readme', 'api', 'changelog', 'jsdoc'] },
        target: { type: 'string' },
      },
    },
  },
  'ralph.cleanup': {
    name: 'ralph.cleanup',
    description: 'Find and remove dead code, unused exports',
    descriptionHi: 'Dead code हटाओ',
    category: 'ralph-code',
    voiceTriggers: ['cleanup code', 'remove dead code', 'सफाई करो'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['scan', 'remove', 'imports', 'exports'] },
        dryRun: { type: 'boolean' },
      },
    },
  },

  // === Operations (7) ===
  'ralph.deploy': {
    name: 'ralph.deploy',
    description: 'Deploy services with health checks and rollback',
    descriptionHi: 'Deploy करो',
    category: 'ralph-ops',
    voiceTriggers: ['deploy', 'push to production', 'डिप्लॉय करो', 'production में डालो'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['status', 'app', 'all', 'rollback'] },
        app: { type: 'string' },
      },
    },
  },
  'ralph.monitor': {
    name: 'ralph.monitor',
    description: 'Monitor service health and performance',
    descriptionHi: 'Services चेक करो',
    category: 'ralph-ops',
    voiceTriggers: ['check services', 'monitor', 'health check', 'सर्विस चेक करो'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['status', 'watch', 'ports', 'alert'] },
        interval: { type: 'number' },
      },
    },
  },
  'ralph.backup': {
    name: 'ralph.backup',
    description: 'Backup database, Redis, and configurations',
    descriptionHi: 'Backup बनाओ',
    category: 'ralph-ops',
    voiceTriggers: ['backup', 'create backup', 'बैकअप बनाओ'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['create', 'restore', 'list', 'cleanup'] },
        target: { type: 'string', enum: ['all', 'postgres', 'redis', 'config'] },
      },
    },
  },
  'ralph.migrate': {
    name: 'ralph.migrate',
    description: 'Database migration management (Prisma/Drizzle/SQL)',
    descriptionHi: 'Migration चलाओ',
    category: 'ralph-ops',
    voiceTriggers: ['run migration', 'migrate database', 'माइग्रेशन'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['status', 'generate', 'run', 'rollback'] },
        name: { type: 'string' },
      },
    },
  },
  'ralph.seed': {
    name: 'ralph.seed',
    description: 'Generate realistic test data for databases',
    descriptionHi: 'Test data बनाओ',
    category: 'ralph-ops',
    voiceTriggers: ['seed data', 'generate test data', 'टेस्ट डेटा'],
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['prisma', 'freight', 'types', 'custom'] },
        count: { type: 'number' },
      },
    },
  },
  'ralph.deps': {
    name: 'ralph.deps',
    description: 'Dependency management - check, update, audit',
    descriptionHi: 'Dependencies चेक करो',
    category: 'ralph-ops',
    voiceTriggers: ['check dependencies', 'update packages', 'डिपेंडेंसी'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['check', 'update', 'audit', 'unused'] },
      },
    },
  },
  'ralph.debug': {
    name: 'ralph.debug',
    description: 'AI-powered debugging - analyze logs, trace errors',
    descriptionHi: 'Debug करो',
    category: 'ralph-ops',
    voiceTriggers: ['debug', 'analyze error', 'check logs', 'डीबग करो'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['analyze', 'error', 'trace', 'health', 'watch'] },
        target: { type: 'string' },
      },
    },
  },

  // === Search & Exploration (4) ===
  'ralph.search': {
    name: 'ralph.search',
    description: 'Smart codebase search with AI analysis',
    descriptionHi: 'Code में खोजो',
    category: 'ralph-search',
    voiceTriggers: ['search code', 'find in code', 'कोड में खोजो'],
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern' },
        type: { type: 'string', description: 'File type filter' },
        analyze: { type: 'boolean', description: 'AI analysis of results' },
      },
      required: ['pattern'],
    },
  },
  'ralph.explore': {
    name: 'ralph.explore',
    description: 'AI-powered codebase exploration - ask questions about code',
    descriptionHi: 'Codebase explore करो',
    category: 'ralph-search',
    voiceTriggers: ['explore code', 'explain code', 'कोड समझाओ'],
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Question about the codebase' },
        depth: { type: 'string', enum: ['quick', 'medium', 'thorough'] },
      },
      required: ['question'],
    },
  },
  'ralph.fetch': {
    name: 'ralph.fetch',
    description: 'Fetch and analyze web content with AI',
    descriptionHi: 'Web content लाओ',
    category: 'ralph-search',
    voiceTriggers: ['fetch url', 'get web content', 'URL से लाओ'],
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        prompt: { type: 'string', description: 'What to extract/analyze' },
      },
      required: ['url'],
    },
  },
  'ralph.parallel': {
    name: 'ralph.parallel',
    description: 'Run multiple commands concurrently',
    descriptionHi: 'Parallel में चलाओ',
    category: 'ralph-search',
    voiceTriggers: ['run parallel', 'concurrent tasks'],
    parameters: {
      type: 'object',
      properties: {
        commands: { type: 'array', items: { type: 'string' } },
        wait: { type: 'boolean' },
      },
      required: ['commands'],
    },
  },

  // === Quality & Testing (3) ===
  'ralph.test': {
    name: 'ralph.test',
    description: 'AI-powered test generation and coverage improvement',
    descriptionHi: 'Test बनाओ और चलाओ',
    category: 'ralph-quality',
    voiceTriggers: ['run tests', 'generate tests', 'टेस्ट करो'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['generate', 'coverage', 'fix', 'run'] },
        file: { type: 'string' },
      },
    },
  },
  'ralph.audit': {
    name: 'ralph.audit',
    description: 'Security audit - dependencies, secrets, OWASP checks',
    descriptionHi: 'Security चेक करो',
    category: 'ralph-quality',
    voiceTriggers: ['security audit', 'check security', 'सिक्योरिटी चेक'],
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['all', 'deps', 'secrets', 'owasp', 'licenses'] },
      },
    },
  },
  'ralph.perf': {
    name: 'ralph.perf',
    description: 'Performance analysis - bundle size, API latency, memory',
    descriptionHi: 'Performance चेक करो',
    category: 'ralph-quality',
    voiceTriggers: ['check performance', 'analyze perf', 'परफॉर्मेंस'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['analyze', 'bundle', 'api', 'memory'] },
        target: { type: 'string' },
      },
    },
  },

  // === Conversion & i18n (2) ===
  'ralph.convert': {
    name: 'ralph.convert',
    description: 'Code conversion - Python to TS, JS to TS, Odoo to ANKR',
    descriptionHi: 'Code convert करो',
    category: 'ralph-convert',
    voiceTriggers: ['convert code', 'python to typescript', 'कोड बदलो'],
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['py2ts', 'js2ts', 'odoo2ankr', 'class2hooks'] },
        source: { type: 'string' },
        output: { type: 'string' },
      },
      required: ['type', 'source'],
    },
  },
  'ralph.i18n': {
    name: 'ralph.i18n',
    description: 'Internationalization - extract strings, translate, validate',
    descriptionHi: 'Translation करो',
    category: 'ralph-convert',
    voiceTriggers: ['translate', 'i18n', 'अनुवाद करो'],
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['extract', 'translate', 'validate'] },
        target: { type: 'string' },
        lang: { type: 'string' },
      },
    },
  },
};

/**
 * Execute a Ralph tool by calling the bash script
 */
function executeRalphScript(
  toolName: string,
  params: Record<string, unknown>
): Promise<MCPResult> {
  const scriptName = toolName.replace('ralph.', 'ralph-');
  const script = `${FORGE_BIN}/${scriptName}.sh`;

  // Build command args
  const args: string[] = [];

  // Handle command as first positional arg
  if (params.command) {
    args.push(String(params.command));
  }

  // Handle other params
  for (const [key, value] of Object.entries(params)) {
    if (key === 'command') continue;

    if (typeof value === 'boolean' && value) {
      args.push(`--${key}`);
    } else if (value !== undefined && value !== null && value !== false) {
      // Special handling for positional args
      if (['pattern', 'question', 'name', 'url', 'source'].includes(key)) {
        args.unshift(String(value));
      } else {
        args.push(`--${key}=${value}`);
      }
    }
  }

  const cmd = `${script} ${args.join(' ')}`;

  return new Promise((resolve) => {
    try {
      const output = execSync(cmd, {
        encoding: 'utf8',
        timeout: 300000,
        env: { ...process.env, FORCE_COLOR: '0' },
        cwd: process.cwd(),
      });

      resolve({
        success: true,
        data: { output, command: cmd },
      });
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      resolve({
        success: false,
        error: e.message || 'Execution failed',
        data: { stdout: e.stdout, stderr: e.stderr, command: cmd },
      });
    }
  });
}

/**
 * Tool Executors - maps tool names to execution functions
 */
export const RALPH_TOOL_EXECUTORS: Record<
  string,
  (params: Record<string, unknown>) => Promise<MCPResult>
> = {};

// Generate executors for all Ralph tools
for (const toolName of Object.keys(RALPH_TOOLS)) {
  RALPH_TOOL_EXECUTORS[toolName] = (params) => executeRalphScript(toolName, params);
}

// Export count
export const RALPH_TOOL_COUNT = Object.keys(RALPH_TOOLS).length;

// Log on import
console.log(`🦷 Ralph Wiggum Tools: ${RALPH_TOOL_COUNT} tools loaded`);
