/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGFLOW INTELLIGENT ROUTER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Routes tasks to the optimal executor based on intent analysis
 *
 * This is Layer 3 of AGFLOW: Orchestration Intelligence
 * - Analyzes intent using BANI's ai-intent system
 * - Routes to AIguru, VibeCoder, Tasher, or MCP tools
 * - Considers complexity, cost, and available capabilities
 *
 * Decision Matrix:
 * - Domain generation → AIguru
 * - UI component → VibeCoder
 * - Complex multi-file refactor → ai-swarm
 * - Deployment/ops → Tasher
 * - Integration/API call → MCP tool
 * - Package installation → Package manager
 *
 * 🙏 Jai Guru Ji | ANKR Labs | PowerBox IT Solutions Pvt Ltd
 */

import type { MCPResult, MCPParameter } from '../types';

interface RoutingDecision {
  executor: 'aiguru' | 'vibecoder' | 'tasher' | 'ai-swarm' | 'mcp-tool' | 'package-manager';
  reasoning: string;
  action: string;
  params: Record<string, any>;
  estimatedCost: string;
  estimatedTime: string;
  confidence: number;
}

// Intent patterns mapped to executors
const INTENT_EXECUTOR_MAP: Record<string, {
  executor: RoutingDecision['executor'];
  patterns: string[];
  costEstimate: string;
  timeEstimate: string;
}> = {
  domain_generation: {
    executor: 'aiguru',
    patterns: [
      'generate domain', 'create domain', 'add domain', 'domain model',
      'prisma schema', 'graphql schema', 'database model'
    ],
    costEstimate: '$0.02-0.05',
    timeEstimate: '2-5 minutes'
  },
  ui_component: {
    executor: 'vibecoder',
    patterns: [
      'create component', 'generate ui', 'add component', 'react component',
      'form', 'dashboard', 'page', 'ui element', 'widget'
    ],
    costEstimate: '$0.01-0.03',
    timeEstimate: '1-3 minutes'
  },
  complex_refactor: {
    executor: 'ai-swarm',
    patterns: [
      'refactor', 'restructure', 'migrate', 'upgrade architecture',
      'multi-file', 'cross-module', 'system-wide'
    ],
    costEstimate: '$0.10-0.30',
    timeEstimate: '10-20 minutes'
  },
  deployment: {
    executor: 'tasher',
    patterns: [
      'deploy', 'start server', 'run app', 'build', 'docker',
      'production', 'setup', 'configure environment'
    ],
    costEstimate: '$0.00',
    timeEstimate: '5-10 minutes'
  },
  integration: {
    executor: 'mcp-tool',
    patterns: [
      'verify', 'check', 'validate', 'fetch', 'send', 'track',
      'api call', 'external service', 'third party'
    ],
    costEstimate: '$0.00',
    timeEstimate: '1-2 minutes'
  },
  package_install: {
    executor: 'package-manager',
    patterns: [
      'install package', 'add dependency', 'npm install', 'use @ankr',
      'add library', 'import package'
    ],
    costEstimate: '$0.00',
    timeEstimate: '1 minute'
  }
};

// Analyze intent and determine best executor
function analyzeIntent(intent: string): {
  intentType: string;
  confidence: number;
  keywords: string[];
} {
  const lower = intent.toLowerCase();
  let bestMatch = 'integration'; // Default fallback
  let bestScore = 0;
  const matchedKeywords: string[] = [];

  for (const [intentType, config] of Object.entries(INTENT_EXECUTOR_MAP)) {
    let score = 0;
    for (const pattern of config.patterns) {
      if (lower.includes(pattern)) {
        score += 1;
        matchedKeywords.push(pattern);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = intentType;
    }
  }

  const confidence = Math.min(1.0, bestScore * 0.3 + 0.3);

  return {
    intentType: bestMatch,
    confidence,
    keywords: matchedKeywords
  };
}

// Extract entities from intent for executor parameters
function extractEntities(intent: string, intentType: string): Record<string, any> {
  const entities: Record<string, any> = {};
  const lower = intent.toLowerCase();

  // Extract domain names for AIguru
  if (intentType === 'domain_generation') {
    const domainMatch = intent.match(/(?:generate|create|add)\s+(?:domain\s+)?(\w+)/i);
    if (domainMatch) {
      entities.domainName = domainMatch[1];
    }

    // Extract fields if mentioned
    if (lower.includes('with fields') || lower.includes('with properties')) {
      const fieldsMatch = intent.match(/with\s+(?:fields|properties)[\s:]+([^.]+)/i);
      if (fieldsMatch) {
        entities.fields = fieldsMatch[1].split(',').map(f => f.trim());
      }
    }
  }

  // Extract component names for VibeCoder
  if (intentType === 'ui_component') {
    const componentMatch = intent.match(/(?:create|generate|add)\s+(?:component\s+)?(\w+)/i);
    if (componentMatch) {
      entities.componentName = componentMatch[1];
    }

    // Extract framework
    if (lower.includes('react')) entities.framework = 'react';
    if (lower.includes('vue')) entities.framework = 'vue';
  }

  // Extract tool names for MCP
  if (intentType === 'integration') {
    const toolMatch = intent.match(/(verify|check|validate|fetch|send|track)\s+(\w+)/i);
    if (toolMatch) {
      entities.action = toolMatch[1];
      entities.target = toolMatch[2];
    }
  }

  // Extract package names
  if (intentType === 'package_install') {
    const pkgMatch = intent.match(/@ankr\/[\w-]+/);
    if (pkgMatch) {
      entities.packageName = pkgMatch[0];
    }
  }

  return entities;
}

// Main routing function
async function routeTask(params: {
  intent: string;
  context?: string;
  capabilities?: {
    packages: string[];
    mcpTools: string[];
  };
  userId?: string;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    const { intent, context, capabilities, userId } = params;

    // Analyze intent
    const analysis = analyzeIntent(intent);
    const executorConfig = INTENT_EXECUTOR_MAP[analysis.intentType];

    // Extract entities for parameters
    const entities = extractEntities(intent, analysis.intentType);

    // Build routing decision
    const decision: RoutingDecision = {
      executor: executorConfig.executor,
      reasoning: `Intent type: ${analysis.intentType}. Matched patterns: ${analysis.keywords.join(', ')}. Best executor for this task is ${executorConfig.executor}.`,
      action: intent,
      params: entities,
      estimatedCost: executorConfig.costEstimate,
      estimatedTime: executorConfig.timeEstimate,
      confidence: analysis.confidence
    };

    // Add capability-specific routing hints
    if (capabilities) {
      if (capabilities.packages.length > 0) {
        decision.params.suggestedPackages = capabilities.packages;
      }
      if (capabilities.mcpTools.length > 0) {
        decision.params.suggestedTools = capabilities.mcpTools;
      }
    }

    // Special case: If multiple executors needed, use ai-swarm
    const needsMultipleExecutors =
      intent.toLowerCase().includes('and') ||
      intent.toLowerCase().includes('then') ||
      (capabilities && capabilities.packages.length > 3);

    if (needsMultipleExecutors && decision.executor !== 'ai-swarm') {
      decision.executor = 'ai-swarm';
      decision.reasoning += ' Task complexity requires multi-agent orchestration.';
      decision.estimatedCost = '$0.10-0.30';
      decision.estimatedTime = '10-20 minutes';
    }

    return {
      success: true,
      data: decision,
      metadata: {
        tool: 'agflow_route_task',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in task routing',
      metadata: {
        tool: 'agflow_route_task',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Get available executors and their capabilities
async function getExecutors(): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    const executors = [
      {
        name: 'aiguru',
        description: 'Domain-driven code generation (Prisma schemas, GraphQL types, backend domains)',
        capabilities: ['domain_generation', 'schema_design', 'api_generation'],
        costPerTask: '$0.02-0.05',
        avgTime: '2-5 minutes',
        available: true
      },
      {
        name: 'vibecoder',
        description: 'UI component generation (React components, forms, dashboards)',
        capabilities: ['ui_component', 'react_generation', 'form_builder'],
        costPerTask: '$0.01-0.03',
        avgTime: '1-3 minutes',
        available: true
      },
      {
        name: 'tasher',
        description: 'Autonomous agent for deployment, ops, and system tasks',
        capabilities: ['deployment', 'docker', 'environment_setup', 'build'],
        costPerTask: '$0.00',
        avgTime: '5-10 minutes',
        available: true
      },
      {
        name: 'ai-swarm',
        description: 'Multi-agent orchestration for complex refactoring and architecture changes',
        capabilities: ['refactoring', 'architecture', 'multi_file_changes', 'migration'],
        costPerTask: '$0.10-0.30',
        avgTime: '10-20 minutes',
        available: false, // Only in openclaude-ide currently
        note: 'Available in openclaude-ide, not yet integrated with ankr-universe'
      },
      {
        name: 'mcp-tool',
        description: '755+ MCP tools for integrations, verifications, and API calls',
        capabilities: ['verification', 'api_call', 'integration', 'data_fetch'],
        costPerTask: '$0.00',
        avgTime: '1-2 minutes',
        available: true
      },
      {
        name: 'package-manager',
        description: 'Install and manage @ankr packages',
        capabilities: ['package_install', 'dependency_management'],
        costPerTask: '$0.00',
        avgTime: '1 minute',
        available: true
      }
    ];

    return {
      success: true,
      data: {
        executors,
        total: executors.length,
        available: executors.filter(e => e.available).length
      },
      metadata: {
        tool: 'agflow_get_executors',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting executors',
      metadata: {
        tool: 'agflow_get_executors',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// MCP Tool Definitions
export const AGFLOW_ROUTER_TOOLS = {
  agflow_route_task: {
    name: 'agflow_route_task',
    description: 'Route a task to the optimal executor (AIguru, VibeCoder, Tasher, ai-swarm, or MCP tool) based on intelligent analysis',
    category: 'agflow',
    parameters: [
      {
        name: 'intent',
        type: 'string' as const,
        description: 'The task to route (e.g., "Generate Order domain with Prisma")',
        required: true
      },
      {
        name: 'context',
        type: 'string' as const,
        description: 'Additional context about the task',
        required: false
      },
      {
        name: 'capabilities',
        type: 'object' as const,
        description: 'Discovered capabilities from agflow_discover_capabilities',
        required: false
      },
      {
        name: 'userId',
        type: 'string' as const,
        description: 'User ID for personalized routing',
        required: false
      }
    ] as MCPParameter[],
    voiceTriggers: ['route task', 'which executor', 'how should I build']
  },
  agflow_get_executors: {
    name: 'agflow_get_executors',
    description: 'Get list of available executors and their capabilities',
    category: 'agflow',
    parameters: [] as MCPParameter[],
    voiceTriggers: ['list executors', 'available agents', 'what can build']
  }
};

// MCP Tool Executors
export const AGFLOW_ROUTER_EXECUTORS = {
  agflow_route_task: routeTask,
  agflow_get_executors: getExecutors
};
