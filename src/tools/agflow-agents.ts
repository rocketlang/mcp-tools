/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGFLOW AGENT MANAGEMENT & TRACKING
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Internal agent lifecycle tracking and monitoring
 *
 * This tool provides observability into AGFLOW's internal agents:
 * - Track agent status (idle, busy, failed)
 * - Monitor task assignments
 * - View agent performance metrics
 * - Manage agent lifecycle (spawn, pause, terminate)
 * - Agent communication and coordination
 *
 * Agents in AGFLOW:
 * 1. AIguru Agent - Domain generation
 * 2. VibeCoder Agent - UI component generation
 * 3. Tasher Agent - Deployment and ops
 * 4. MCP Tool Agent - Integration executor
 * 5. Package Manager Agent - Dependency management
 * 6. Learning Agent - Pattern recognition and EON integration
 * 7. Orchestrator Agent - Master coordinator
 *
 * 🙏 Jai Guru Ji | ANKR Labs | PowerBox IT Solutions Pvt Ltd
 */

import type { MCPResult, MCPParameter } from '../types';

interface Agent {
  id: string;
  name: string;
  type: 'aiguru' | 'vibecoder' | 'tasher' | 'mcp-tool' | 'package-manager' | 'learning' | 'orchestrator';
  status: 'idle' | 'busy' | 'paused' | 'failed' | 'terminated';
  currentTask?: string;
  tasksCompleted: number;
  tasksFailed: number;
  totalCost: number;
  totalTime: number; // milliseconds
  avgTaskTime: number; // milliseconds
  lastActive: number; // timestamp
  capabilities: string[];
  metadata: Record<string, any>;
}

// In-memory agent registry (in production, this would be in a database)
const AGENT_REGISTRY = new Map<string, Agent>();

// Initialize default agents
function initializeDefaultAgents(): void {
  if (AGENT_REGISTRY.size === 0) {
    const defaultAgents: Agent[] = [
      {
        id: 'agent-aiguru-001',
        name: 'AIguru Primary',
        type: 'aiguru',
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        totalCost: 0,
        totalTime: 0,
        avgTaskTime: 0,
        lastActive: Date.now(),
        capabilities: ['domain_generation', 'prisma_schema', 'graphql_schema', 'api_generation'],
        metadata: { version: '1.0', priority: 'high' }
      },
      {
        id: 'agent-vibecoder-001',
        name: 'VibeCoder Primary',
        type: 'vibecoder',
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        totalCost: 0,
        totalTime: 0,
        avgTaskTime: 0,
        lastActive: Date.now(),
        capabilities: ['ui_component', 'react_generation', 'form_builder', 'dashboard'],
        metadata: { version: '1.0', framework: 'react' }
      },
      {
        id: 'agent-tasher-001',
        name: 'Tasher Primary',
        type: 'tasher',
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        totalCost: 0,
        totalTime: 0,
        avgTaskTime: 0,
        lastActive: Date.now(),
        capabilities: ['deployment', 'docker', 'build', 'test', 'environment_setup'],
        metadata: { version: '1.0', autonomous: true }
      },
      {
        id: 'agent-mcp-001',
        name: 'MCP Tool Executor',
        type: 'mcp-tool',
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        totalCost: 0,
        totalTime: 0,
        avgTaskTime: 0,
        lastActive: Date.now(),
        capabilities: ['api_call', 'integration', 'verification', 'data_fetch'],
        metadata: { toolsAvailable: 755 }
      },
      {
        id: 'agent-pkgmgr-001',
        name: 'Package Manager',
        type: 'package-manager',
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        totalCost: 0,
        totalTime: 0,
        avgTaskTime: 0,
        lastActive: Date.now(),
        capabilities: ['package_install', 'dependency_management', 'package_search'],
        metadata: { packagesAvailable: 210 }
      },
      {
        id: 'agent-learning-001',
        name: 'Learning Agent',
        type: 'learning',
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        totalCost: 0,
        totalTime: 0,
        avgTaskTime: 0,
        lastActive: Date.now(),
        capabilities: ['pattern_recognition', 'eon_integration', 'build_memory', 'recommendation'],
        metadata: { eonConnected: true }
      },
      {
        id: 'agent-orchestrator-001',
        name: 'Master Orchestrator',
        type: 'orchestrator',
        status: 'idle',
        tasksCompleted: 0,
        tasksFailed: 0,
        totalCost: 0,
        totalTime: 0,
        avgTaskTime: 0,
        lastActive: Date.now(),
        capabilities: ['task_coordination', 'phase_management', 'decision_making'],
        metadata: { isMaster: true }
      }
    ];

    defaultAgents.forEach(agent => AGENT_REGISTRY.set(agent.id, agent));
  }
}

// List all agents
async function listAgents(params: {
  type?: string;
  status?: string;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    initializeDefaultAgents();

    let agents = Array.from(AGENT_REGISTRY.values());

    // Filter by type
    if (params.type) {
      agents = agents.filter(a => a.type === params.type);
    }

    // Filter by status
    if (params.status) {
      agents = agents.filter(a => a.status === params.status);
    }

    return {
      success: true,
      data: {
        agents,
        total: agents.length,
        byType: {
          aiguru: agents.filter(a => a.type === 'aiguru').length,
          vibecoder: agents.filter(a => a.type === 'vibecoder').length,
          tasher: agents.filter(a => a.type === 'tasher').length,
          'mcp-tool': agents.filter(a => a.type === 'mcp-tool').length,
          'package-manager': agents.filter(a => a.type === 'package-manager').length,
          learning: agents.filter(a => a.type === 'learning').length,
          orchestrator: agents.filter(a => a.type === 'orchestrator').length
        },
        byStatus: {
          idle: agents.filter(a => a.status === 'idle').length,
          busy: agents.filter(a => a.status === 'busy').length,
          paused: agents.filter(a => a.status === 'paused').length,
          failed: agents.filter(a => a.status === 'failed').length,
          terminated: agents.filter(a => a.status === 'terminated').length
        }
      },
      metadata: {
        tool: 'agflow_list_agents',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error listing agents',
      metadata: {
        tool: 'agflow_list_agents',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Get agent details
async function getAgent(params: { agentId: string }): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    initializeDefaultAgents();

    const agent = AGENT_REGISTRY.get(params.agentId);

    if (!agent) {
      return {
        success: false,
        error: `Agent ${params.agentId} not found`,
        metadata: {
          tool: 'agflow_get_agent',
          duration_ms: Date.now() - startTime
        }
      };
    }

    return {
      success: true,
      data: agent,
      metadata: {
        tool: 'agflow_get_agent',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting agent',
      metadata: {
        tool: 'agflow_get_agent',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Assign task to agent
async function assignTask(params: {
  agentId: string;
  taskId: string;
  taskDescription: string;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    initializeDefaultAgents();

    const agent = AGENT_REGISTRY.get(params.agentId);

    if (!agent) {
      return {
        success: false,
        error: `Agent ${params.agentId} not found`,
        metadata: {
          tool: 'agflow_assign_task',
          duration_ms: Date.now() - startTime
        }
      };
    }

    if (agent.status === 'busy') {
      return {
        success: false,
        error: `Agent ${params.agentId} is already busy with task: ${agent.currentTask}`,
        metadata: {
          tool: 'agflow_assign_task',
          duration_ms: Date.now() - startTime
        }
      };
    }

    // Assign task
    agent.status = 'busy';
    agent.currentTask = params.taskDescription;
    agent.lastActive = Date.now();

    return {
      success: true,
      data: {
        agentId: params.agentId,
        taskId: params.taskId,
        status: 'assigned',
        message: `Task ${params.taskId} assigned to ${agent.name}`
      },
      metadata: {
        tool: 'agflow_assign_task',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error assigning task',
      metadata: {
        tool: 'agflow_assign_task',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Complete task
async function completeTask(params: {
  agentId: string;
  taskId: string;
  success: boolean;
  cost?: number;
  duration?: number;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    initializeDefaultAgents();

    const agent = AGENT_REGISTRY.get(params.agentId);

    if (!agent) {
      return {
        success: false,
        error: `Agent ${params.agentId} not found`,
        metadata: {
          tool: 'agflow_complete_task',
          duration_ms: Date.now() - startTime
        }
      };
    }

    // Update agent stats
    if (params.success) {
      agent.tasksCompleted++;
    } else {
      agent.tasksFailed++;
    }

    if (params.cost) {
      agent.totalCost += params.cost;
    }

    if (params.duration) {
      agent.totalTime += params.duration;
      agent.avgTaskTime = agent.totalTime / (agent.tasksCompleted + agent.tasksFailed);
    }

    agent.status = 'idle';
    agent.currentTask = undefined;
    agent.lastActive = Date.now();

    return {
      success: true,
      data: {
        agentId: params.agentId,
        taskId: params.taskId,
        taskSuccess: params.success,
        agentStats: {
          tasksCompleted: agent.tasksCompleted,
          tasksFailed: agent.tasksFailed,
          totalCost: agent.totalCost,
          avgTaskTime: agent.avgTaskTime
        }
      },
      metadata: {
        tool: 'agflow_complete_task',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error completing task',
      metadata: {
        tool: 'agflow_complete_task',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Get agent metrics
async function getAgentMetrics(params: { agentId?: string }): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    initializeDefaultAgents();

    if (params.agentId) {
      const agent = AGENT_REGISTRY.get(params.agentId);
      if (!agent) {
        return {
          success: false,
          error: `Agent ${params.agentId} not found`,
          metadata: {
            tool: 'agflow_get_agent_metrics',
            duration_ms: Date.now() - startTime
          }
        };
      }

      return {
        success: true,
        data: {
          agentId: agent.id,
          name: agent.name,
          type: agent.type,
          metrics: {
            tasksCompleted: agent.tasksCompleted,
            tasksFailed: agent.tasksFailed,
            successRate: agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed || 1),
            totalCost: agent.totalCost,
            totalTime: agent.totalTime,
            avgTaskTime: agent.avgTaskTime,
            lastActive: new Date(agent.lastActive).toISOString()
          }
        },
        metadata: {
          tool: 'agflow_get_agent_metrics',
          duration_ms: Date.now() - startTime
        }
      };
    } else {
      // Aggregate metrics across all agents
      const agents = Array.from(AGENT_REGISTRY.values());
      const totalCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
      const totalFailed = agents.reduce((sum, a) => sum + a.tasksFailed, 0);
      const totalCost = agents.reduce((sum, a) => sum + a.totalCost, 0);
      const totalTime = agents.reduce((sum, a) => sum + a.totalTime, 0);

      return {
        success: true,
        data: {
          aggregate: {
            totalAgents: agents.length,
            totalTasksCompleted: totalCompleted,
            totalTasksFailed: totalFailed,
            overallSuccessRate: totalCompleted / (totalCompleted + totalFailed || 1),
            totalCost,
            totalTime,
            avgTimePerTask: totalTime / (totalCompleted + totalFailed || 1)
          },
          byAgent: agents.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            tasksCompleted: a.tasksCompleted,
            tasksFailed: a.tasksFailed,
            totalCost: a.totalCost
          }))
        },
        metadata: {
          tool: 'agflow_get_agent_metrics',
          duration_ms: Date.now() - startTime
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting agent metrics',
      metadata: {
        tool: 'agflow_get_agent_metrics',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Spawn new agent (for scaling)
async function spawnAgent(params: {
  type: Agent['type'];
  name?: string;
  capabilities?: string[];
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    initializeDefaultAgents();

    const agentId = `agent-${params.type}-${Date.now()}`;
    const agent: Agent = {
      id: agentId,
      name: params.name || `${params.type} ${agentId}`,
      type: params.type,
      status: 'idle',
      tasksCompleted: 0,
      tasksFailed: 0,
      totalCost: 0,
      totalTime: 0,
      avgTaskTime: 0,
      lastActive: Date.now(),
      capabilities: params.capabilities || [],
      metadata: { spawned: Date.now() }
    };

    AGENT_REGISTRY.set(agentId, agent);

    return {
      success: true,
      data: {
        agentId,
        message: `New ${params.type} agent spawned successfully`
      },
      metadata: {
        tool: 'agflow_spawn_agent',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error spawning agent',
      metadata: {
        tool: 'agflow_spawn_agent',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// MCP Tool Definitions
export const AGFLOW_AGENT_TOOLS = {
  agflow_list_agents: {
    name: 'agflow_list_agents',
    description: 'List all AGFLOW agents with optional filtering by type or status',
    category: 'agflow',
    parameters: [
      {
        name: 'type',
        type: 'string' as const,
        description: 'Filter by agent type (aiguru, vibecoder, tasher, mcp-tool, package-manager, learning, orchestrator)',
        required: false
      },
      {
        name: 'status',
        type: 'string' as const,
        description: 'Filter by agent status (idle, busy, paused, failed, terminated)',
        required: false
      }
    ] as MCPParameter[],
    voiceTriggers: ['list agents', 'show agents', 'available agents']
  },
  agflow_get_agent: {
    name: 'agflow_get_agent',
    description: 'Get detailed information about a specific agent',
    category: 'agflow',
    parameters: [
      {
        name: 'agentId',
        type: 'string' as const,
        description: 'Agent ID',
        required: true
      }
    ] as MCPParameter[],
    voiceTriggers: ['agent details', 'show agent', 'agent info']
  },
  agflow_assign_task: {
    name: 'agflow_assign_task',
    description: 'Assign a task to a specific agent',
    category: 'agflow',
    parameters: [
      {
        name: 'agentId',
        type: 'string' as const,
        description: 'Agent ID',
        required: true
      },
      {
        name: 'taskId',
        type: 'string' as const,
        description: 'Task ID',
        required: true
      },
      {
        name: 'taskDescription',
        type: 'string' as const,
        description: 'Task description',
        required: true
      }
    ] as MCPParameter[],
    voiceTriggers: ['assign task', 'give task to agent']
  },
  agflow_complete_task: {
    name: 'agflow_complete_task',
    description: 'Mark a task as completed and update agent metrics',
    category: 'agflow',
    parameters: [
      {
        name: 'agentId',
        type: 'string' as const,
        description: 'Agent ID',
        required: true
      },
      {
        name: 'taskId',
        type: 'string' as const,
        description: 'Task ID',
        required: true
      },
      {
        name: 'success',
        type: 'boolean' as const,
        description: 'Whether task completed successfully',
        required: true
      },
      {
        name: 'cost',
        type: 'number' as const,
        description: 'Task cost in USD',
        required: false
      },
      {
        name: 'duration',
        type: 'number' as const,
        description: 'Task duration in milliseconds',
        required: false
      }
    ] as MCPParameter[],
    voiceTriggers: ['complete task', 'finish task', 'task done']
  },
  agflow_get_agent_metrics: {
    name: 'agflow_get_agent_metrics',
    description: 'Get performance metrics for an agent or all agents',
    category: 'agflow',
    parameters: [
      {
        name: 'agentId',
        type: 'string' as const,
        description: 'Agent ID (optional - if not provided, returns aggregate metrics)',
        required: false
      }
    ] as MCPParameter[],
    voiceTriggers: ['agent metrics', 'agent performance', 'agent stats']
  },
  agflow_spawn_agent: {
    name: 'agflow_spawn_agent',
    description: 'Spawn a new agent for scaling (advanced use)',
    category: 'agflow',
    parameters: [
      {
        name: 'type',
        type: 'string' as const,
        description: 'Agent type (aiguru, vibecoder, tasher, mcp-tool, package-manager, learning, orchestrator)',
        required: true
      },
      {
        name: 'name',
        type: 'string' as const,
        description: 'Agent name',
        required: false
      },
      {
        name: 'capabilities',
        type: 'array' as const,
        description: 'Agent capabilities',
        required: false
      }
    ] as MCPParameter[],
    voiceTriggers: ['spawn agent', 'create agent', 'new agent']
  }
};

// MCP Tool Executors
export const AGFLOW_AGENT_EXECUTORS = {
  agflow_list_agents: listAgents,
  agflow_get_agent: getAgent,
  agflow_assign_task: assignTask,
  agflow_complete_task: completeTask,
  agflow_get_agent_metrics: getAgentMetrics,
  agflow_spawn_agent: spawnAgent
};
