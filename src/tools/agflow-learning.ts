/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGFLOW LEARNING & MEMORY SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Learns from build patterns and stores knowledge in EON
 *
 * This is Layer 4 of AGFLOW: Learning Intelligence
 * - Stores successful build patterns in EON
 * - Recalls similar past builds for recommendations
 * - Improves routing decisions over time
 * - Tracks what works and what doesn't
 * - Provides build analytics and insights
 *
 * Learning Types:
 * 1. Build Patterns - Complete app builds with outcomes
 * 2. Package Combinations - Which packages work well together
 * 3. Executor Performance - Which executor is best for which task
 * 4. Common Failures - Patterns of failures and their solutions
 * 5. Optimization Opportunities - Where to improve next
 *
 * 🙏 Jai Guru Ji | ANKR Labs | PowerBox IT Solutions Pvt Ltd
 */

import type { MCPResult, MCPParameter } from '../types';

interface BuildPattern {
  id: string;
  intent: string;
  domain: string;
  timestamp: number;
  userId: string;

  // Decisions made
  capabilities: {
    packages: string[];
    mcpTools: string[];
    patterns: string[];
  };
  executors: string[];
  phases: {
    name: string;
    tasks: number;
    parallelized: boolean;
  }[];

  // Outcomes
  success: boolean;
  buildTime: number; // milliseconds
  totalCost: number;
  reusePercentage: number;
  errors: string[];

  // Feedback
  whatWorked: string[];
  whatFailed: string[];
  improvements: string[];
  userRating?: number; // 1-5
}

// In-memory build history (in production, this would be in EON/PostgreSQL)
const BUILD_HISTORY: BuildPattern[] = [];

// Store build pattern
async function rememberBuild(params: {
  intent: string;
  domain: string;
  capabilities: any;
  executors: string[];
  phases: any[];
  success: boolean;
  buildTime: number;
  totalCost: number;
  reusePercentage: number;
  errors: string[];
  whatWorked: string[];
  whatFailed: string[];
  improvements: string[];
  userId?: string;
  userRating?: number;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    const pattern: BuildPattern = {
      id: `build-${Date.now()}`,
      intent: params.intent,
      domain: params.domain,
      timestamp: Date.now(),
      userId: params.userId || 'anonymous',
      capabilities: params.capabilities,
      executors: params.executors,
      phases: params.phases,
      success: params.success,
      buildTime: params.buildTime,
      totalCost: params.totalCost,
      reusePercentage: params.reusePercentage,
      errors: params.errors,
      whatWorked: params.whatWorked,
      whatFailed: params.whatFailed,
      improvements: params.improvements,
      userRating: params.userRating
    };

    BUILD_HISTORY.push(pattern);

    // Keep only last 100 builds in memory
    if (BUILD_HISTORY.length > 100) {
      BUILD_HISTORY.shift();
    }

    return {
      success: true,
      data: {
        buildId: pattern.id,
        message: 'Build pattern stored successfully',
        historySize: BUILD_HISTORY.length
      },
      metadata: {
        tool: 'agflow_remember_build',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error storing build pattern',
      metadata: {
        tool: 'agflow_remember_build',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Recall similar builds
async function recallSimilarBuilds(params: {
  intent: string;
  domain?: string;
  limit?: number;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    const { intent, domain, limit = 5 } = params;

    // Simple similarity scoring based on keyword overlap
    const intentKeywords = new Set(
      intent.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    const scored = BUILD_HISTORY.map(pattern => {
      const patternKeywords = new Set(
        pattern.intent.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      );

      // Keyword overlap score
      let score = 0;
      for (const keyword of intentKeywords) {
        if (patternKeywords.has(keyword)) {
          score += 1;
        }
      }

      // Domain match bonus
      if (domain && pattern.domain === domain) {
        score += 3;
      }

      // Success bonus
      if (pattern.success) {
        score += 2;
      }

      return { pattern, score };
    });

    // Sort by score and take top N
    const similar = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => ({
        buildId: s.pattern.id,
        intent: s.pattern.intent,
        domain: s.pattern.domain,
        similarity: s.score / (intentKeywords.size + 5), // Normalize
        success: s.pattern.success,
        buildTime: s.pattern.buildTime,
        totalCost: s.pattern.totalCost,
        reusePercentage: s.pattern.reusePercentage,
        packagesUsed: s.pattern.capabilities.packages,
        executorsUsed: s.pattern.executors,
        recommendation: s.pattern.success ?
          `This pattern worked well. Consider reusing: ${s.pattern.whatWorked.join(', ')}` :
          `This pattern had issues: ${s.pattern.whatFailed.join(', ')}`
      }));

    return {
      success: true,
      data: {
        query: intent,
        results: similar,
        totalMatches: similar.length,
        recommendation: similar.length > 0 && similar[0].similarity > 0.5 ?
          `Found ${similar.length} similar build(s). Best match: "${similar[0].intent}" with ${Math.round(similar[0].similarity * 100)}% similarity.` :
          'No similar builds found. This is a novel pattern.'
      },
      metadata: {
        tool: 'agflow_recall_builds',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error recalling builds',
      metadata: {
        tool: 'agflow_recall_builds',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Get build analytics
async function getBuildAnalytics(params: {
  domain?: string;
  executor?: string;
  successOnly?: boolean;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    let builds = [...BUILD_HISTORY];

    // Apply filters
    if (params.domain) {
      builds = builds.filter(b => b.domain === params.domain);
    }
    if (params.executor) {
      builds = builds.filter(b => b.executors.includes(params.executor || ''));
    }
    if (params.successOnly) {
      builds = builds.filter(b => b.success);
    }

    if (builds.length === 0) {
      return {
        success: true,
        data: {
          message: 'No builds found matching criteria',
          totalBuilds: 0
        },
        metadata: {
          tool: 'agflow_get_analytics',
          duration_ms: Date.now() - startTime
        }
      };
    }

    // Calculate analytics
    const totalBuilds = builds.length;
    const successfulBuilds = builds.filter(b => b.success).length;
    const failedBuilds = totalBuilds - successfulBuilds;
    const successRate = successfulBuilds / totalBuilds;

    const avgBuildTime = builds.reduce((sum, b) => sum + b.buildTime, 0) / totalBuilds;
    const avgCost = builds.reduce((sum, b) => sum + b.totalCost, 0) / totalBuilds;
    const avgReuse = builds.reduce((sum, b) => sum + b.reusePercentage, 0) / totalBuilds;

    // Most used packages
    const packageCounts = new Map<string, number>();
    builds.forEach(b => {
      b.capabilities.packages.forEach(pkg => {
        packageCounts.set(pkg, (packageCounts.get(pkg) || 0) + 1);
      });
    });
    const topPackages = Array.from(packageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pkg, count]) => ({ package: pkg, uses: count }));

    // Most used executors
    const executorCounts = new Map<string, number>();
    builds.forEach(b => {
      b.executors.forEach(exec => {
        executorCounts.set(exec, (executorCounts.get(exec) || 0) + 1);
      });
    });
    const topExecutors = Array.from(executorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([exec, count]) => ({ executor: exec, uses: count }));

    // Common failures
    const failurePatterns = new Map<string, number>();
    builds.filter(b => !b.success).forEach(b => {
      b.errors.forEach(err => {
        const pattern = err.split(':')[0]; // Extract error type
        failurePatterns.set(pattern, (failurePatterns.get(pattern) || 0) + 1);
      });
    });
    const topFailures = Array.from(failurePatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, occurrences: count }));

    // Insights
    const insights: string[] = [];
    if (successRate > 0.9) {
      insights.push('Excellent success rate! Build patterns are well-optimized.');
    } else if (successRate < 0.7) {
      insights.push('Consider reviewing failed builds to identify improvement opportunities.');
    }

    if (avgReuse > 70) {
      insights.push('High package reuse rate indicates good leverage of existing capabilities.');
    }

    if (avgCost < 0.10) {
      insights.push('Cost optimization is working well. Most builds use free/cheap tiers.');
    }

    return {
      success: true,
      data: {
        summary: {
          totalBuilds,
          successfulBuilds,
          failedBuilds,
          successRate,
          avgBuildTime: `${Math.round(avgBuildTime / 1000)}s`,
          avgCost: `$${avgCost.toFixed(2)}`,
          avgReuse: `${Math.round(avgReuse)}%`
        },
        topPackages,
        topExecutors,
        topFailures,
        insights,
        filters: params
      },
      metadata: {
        tool: 'agflow_get_analytics',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting analytics',
      metadata: {
        tool: 'agflow_get_analytics',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// Get recommendations based on learning
async function getRecommendations(params: {
  intent: string;
  domain?: string;
}): Promise<MCPResult> {
  const startTime = Date.now();

  try {
    // First, recall similar successful builds
    const similarResult = await recallSimilarBuilds({
      intent: params.intent,
      domain: params.domain,
      limit: 3
    });

    if (!similarResult.success || !similarResult.data?.results?.length) {
      return {
        success: true,
        data: {
          recommendations: [
            'No similar builds found. This is a novel pattern.',
            'Consider starting with agflow_discover_capabilities to find relevant packages.',
            'Use agflow_route_task to determine best executor for your task.'
          ],
          confidence: 'low'
        },
        metadata: {
          tool: 'agflow_get_recommendations',
          duration_ms: Date.now() - startTime
        }
      };
    }

    const similar = similarResult.data.results;
    const recommendations: string[] = [];

    // Package recommendations
    const packageFrequency = new Map<string, number>();
    similar.forEach((build: any) => {
      build.packagesUsed.forEach((pkg: string) => {
        packageFrequency.set(pkg, (packageFrequency.get(pkg) || 0) + 1);
      });
    });
    const recommendedPackages = Array.from(packageFrequency.entries())
      .filter(([_, count]) => count >= 2) // Used in at least 2 similar builds
      .map(([pkg]) => pkg);

    if (recommendedPackages.length > 0) {
      recommendations.push(`Based on similar builds, consider using: ${recommendedPackages.join(', ')}`);
    }

    // Executor recommendations
    const executorFrequency = new Map<string, number>();
    similar.forEach((build: any) => {
      build.executorsUsed.forEach((exec: string) => {
        executorFrequency.set(exec, (executorFrequency.get(exec) || 0) + 1);
      });
    });
    const recommendedExecutors = Array.from(executorFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([exec]) => exec);

    if (recommendedExecutors.length > 0) {
      recommendations.push(`Recommended executors: ${recommendedExecutors.join(', ')}`);
    }

    // Time and cost estimates
    const avgTime = similar.reduce((sum: number, b: any) => sum + b.buildTime, 0) / similar.length;
    const avgCost = similar.reduce((sum: number, b: any) => sum + b.totalCost, 0) / similar.length;

    recommendations.push(`Estimated build time: ${Math.round(avgTime / 1000)}s (based on ${similar.length} similar builds)`);
    recommendations.push(`Estimated cost: $${avgCost.toFixed(2)}`);

    // Success rate
    const successRate = similar.filter((b: any) => b.success).length / similar.length;
    if (successRate === 1.0) {
      recommendations.push('High confidence: 100% success rate in similar builds');
    } else if (successRate < 0.7) {
      recommendations.push(`Note: Similar builds have ${Math.round(successRate * 100)}% success rate. Review failures carefully.`);
    }

    return {
      success: true,
      data: {
        recommendations,
        similarBuilds: similar.length,
        confidence: successRate > 0.8 ? 'high' : successRate > 0.5 ? 'medium' : 'low',
        recommendedPackages,
        recommendedExecutors,
        estimates: {
          buildTime: `${Math.round(avgTime / 1000)}s`,
          cost: `$${avgCost.toFixed(2)}`,
          successRate: `${Math.round(successRate * 100)}%`
        }
      },
      metadata: {
        tool: 'agflow_get_recommendations',
        duration_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting recommendations',
      metadata: {
        tool: 'agflow_get_recommendations',
        duration_ms: Date.now() - startTime
      }
    };
  }
}

// MCP Tool Definitions
export const AGFLOW_LEARNING_TOOLS = {
  agflow_remember_build: {
    name: 'agflow_remember_build',
    description: 'Store a build pattern in memory for future learning and recommendations',
    category: 'agflow',
    parameters: [
      { name: 'intent', type: 'string' as const, description: 'Build intent', required: true },
      { name: 'domain', type: 'string' as const, description: 'Domain (finance, logistics, etc.)', required: true },
      { name: 'capabilities', type: 'object' as const, description: 'Capabilities used', required: true },
      { name: 'executors', type: 'array' as const, description: 'Executors used', required: true },
      { name: 'phases', type: 'array' as const, description: 'Execution phases', required: true },
      { name: 'success', type: 'boolean' as const, description: 'Build success', required: true },
      { name: 'buildTime', type: 'number' as const, description: 'Build time in ms', required: true },
      { name: 'totalCost', type: 'number' as const, description: 'Total cost in USD', required: true },
      { name: 'reusePercentage', type: 'number' as const, description: 'Package reuse %', required: true },
      { name: 'errors', type: 'array' as const, description: 'Error messages', required: true },
      { name: 'whatWorked', type: 'array' as const, description: 'What worked well', required: true },
      { name: 'whatFailed', type: 'array' as const, description: 'What failed', required: true },
      { name: 'improvements', type: 'array' as const, description: 'Improvement suggestions', required: true },
      { name: 'userId', type: 'string' as const, description: 'User ID', required: false },
      { name: 'userRating', type: 'number' as const, description: 'User rating 1-5', required: false }
    ] as MCPParameter[],
    voiceTriggers: ['remember build', 'store pattern', 'save learning']
  },
  agflow_recall_builds: {
    name: 'agflow_recall_builds',
    description: 'Find similar past builds for recommendations and learning',
    category: 'agflow',
    parameters: [
      { name: 'intent', type: 'string' as const, description: 'Build intent to match', required: true },
      { name: 'domain', type: 'string' as const, description: 'Domain filter', required: false },
      { name: 'limit', type: 'number' as const, description: 'Max results (default 5)', required: false }
    ] as MCPParameter[],
    voiceTriggers: ['recall builds', 'similar builds', 'past patterns']
  },
  agflow_get_analytics: {
    name: 'agflow_get_analytics',
    description: 'Get analytics and insights from build history',
    category: 'agflow',
    parameters: [
      { name: 'domain', type: 'string' as const, description: 'Filter by domain', required: false },
      { name: 'executor', type: 'string' as const, description: 'Filter by executor', required: false },
      { name: 'successOnly', type: 'boolean' as const, description: 'Only successful builds', required: false }
    ] as MCPParameter[],
    voiceTriggers: ['build analytics', 'build stats', 'performance metrics']
  },
  agflow_get_recommendations: {
    name: 'agflow_get_recommendations',
    description: 'Get AI-powered recommendations based on learned patterns',
    category: 'agflow',
    parameters: [
      { name: 'intent', type: 'string' as const, description: 'Build intent', required: true },
      { name: 'domain', type: 'string' as const, description: 'Domain', required: false }
    ] as MCPParameter[],
    voiceTriggers: ['get recommendations', 'suggest approach', 'how should I build']
  }
};

// MCP Tool Executors
export const AGFLOW_LEARNING_EXECUTORS = {
  agflow_remember_build: rememberBuild,
  agflow_recall_builds: recallSimilarBuilds,
  agflow_get_analytics: getBuildAnalytics,
  agflow_get_recommendations: getRecommendations
};
