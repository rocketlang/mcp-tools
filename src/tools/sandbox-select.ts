/**
 * Sandbox Selection MCP Tool
 *
 * Allows AI agents to determine the correct sandbox for code execution.
 * Uses @ankr/agents SandboxSelector for intelligent routing.
 *
 * Available sandboxes:
 * - code_sandbox: Single code snippets with max security (seccomp, network isolation)
 * - sandbox_risk: Risk-aware execution with approval workflows
 * - sandbox2: Full application deployment with port mapping
 * - tasher: Tasher agent deployment orchestration
 * - native: Direct execution (no sandboxing)
 *
 * @example
 * ```typescript
 * // Select sandbox for untrusted code
 * const result = await sandboxSelectTool.execute({
 *   action: 'select',
 *   code: 'console.log("Hello")',
 *   isUntrusted: true,
 * });
 * // Returns: { sandbox: 'code_sandbox', confidence: 100, reason: '...' }
 *
 * // Validate that correct sandbox was used
 * const validation = await sandboxSelectTool.execute({
 *   action: 'validate',
 *   taskCharacteristics: { isUntrustedCode: true },
 *   actualSandboxUsed: 'native',
 * });
 * // Returns: { valid: false, expected: 'code_sandbox', actual: 'native' }
 * ```
 */

import type { MCPTool, MCPParameter, MCPResult } from '../types.js';

// Inline types to avoid circular dependency
type SandboxType = 'code_sandbox' | 'sandbox_risk' | 'sandbox2' | 'tasher' | 'native';
type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

interface TaskCharacteristics {
  executionType: 'snippet' | 'full_app' | 'command' | 'file_operation' | 'api_call';
  language?: string;
  isUntrustedCode?: boolean;
  isUserSubmitted?: boolean;
  needsNetworkAccess?: boolean;
  needsFileSystemAccess?: boolean;
  needsPortMapping?: boolean;
  needsHealthCheck?: boolean;
  riskLevel?: RiskLevel;
  needsApproval?: boolean;
  isTasherDeployment?: boolean;
  isMultiStep?: boolean;
  hasExternalDependencies?: boolean;
}

interface SelectionResult {
  selectedSandbox: SandboxType;
  reason: string;
  confidence: number;
  warnings: string[];
  matchedRules: string[];
  timestamp: Date;
}

// Selection rules (same as SandboxSelector but inline for MCP independence)
const SELECTION_RULES = [
  {
    id: 'UNTRUSTED_CODE',
    priority: 100,
    condition: (task: TaskCharacteristics) => task.isUntrustedCode || task.isUserSubmitted,
    sandbox: 'code_sandbox' as SandboxType,
    description: 'Untrusted or user-submitted code requires maximum isolation',
    confidence: 100,
  },
  {
    id: 'HIGH_RISK_APPROVAL',
    priority: 95,
    condition: (task: TaskCharacteristics) =>
      task.riskLevel === 'high' || task.riskLevel === 'critical' || task.needsApproval,
    sandbox: 'sandbox_risk' as SandboxType,
    description: 'High/critical risk operations need risk-aware sandbox with approval',
    confidence: 95,
  },
  {
    id: 'FULL_APP_PORTS',
    priority: 90,
    condition: (task: TaskCharacteristics) =>
      task.executionType === 'full_app' && task.needsPortMapping,
    sandbox: 'sandbox2' as SandboxType,
    description: 'Applications needing port mapping require sandbox2',
    confidence: 95,
  },
  {
    id: 'FULL_APP_HEALTH',
    priority: 89,
    condition: (task: TaskCharacteristics) =>
      task.executionType === 'full_app' && task.needsHealthCheck,
    sandbox: 'sandbox2' as SandboxType,
    description: 'Applications needing health monitoring require sandbox2',
    confidence: 95,
  },
  {
    id: 'TASHER_DEPLOYMENT',
    priority: 85,
    condition: (task: TaskCharacteristics) => task.isTasherDeployment,
    sandbox: 'tasher' as SandboxType,
    description: 'Tasher deployments use dedicated tasher sandbox',
    confidence: 100,
  },
  {
    id: 'NETWORK_ISOLATED_SNIPPET',
    priority: 80,
    condition: (task: TaskCharacteristics) =>
      task.executionType === 'snippet' && !task.needsNetworkAccess,
    sandbox: 'code_sandbox' as SandboxType,
    description: 'Tasks requiring network isolation use CodeSandbox',
    confidence: 90,
  },
  {
    id: 'MULTI_LANGUAGE_SNIPPET',
    priority: 75,
    condition: (task: TaskCharacteristics) =>
      task.executionType === 'snippet' &&
      ['typescript', 'javascript', 'python', 'go', 'rust', 'bash'].includes(task.language || ''),
    sandbox: 'code_sandbox' as SandboxType,
    description: 'Multi-language snippets are best handled by CodeSandbox',
    confidence: 85,
  },
  {
    id: 'API_CALL_RISK',
    priority: 70,
    condition: (task: TaskCharacteristics) =>
      task.executionType === 'api_call' && task.needsNetworkAccess,
    sandbox: 'sandbox_risk' as SandboxType,
    description: 'API calls needing network use risk-aware sandbox',
    confidence: 85,
  },
  {
    id: 'FILE_OPERATION_RISK',
    priority: 65,
    condition: (task: TaskCharacteristics) =>
      task.executionType === 'file_operation' && task.needsFileSystemAccess,
    sandbox: 'sandbox_risk' as SandboxType,
    description: 'File operations needing filesystem use risk-aware sandbox',
    confidence: 80,
  },
  {
    id: 'COMMAND_MEDIUM_RISK',
    priority: 60,
    condition: (task: TaskCharacteristics) =>
      task.executionType === 'command' && task.riskLevel === 'medium',
    sandbox: 'sandbox_risk' as SandboxType,
    description: 'Medium risk commands use risk-aware sandbox',
    confidence: 80,
  },
  {
    id: 'FULL_APP_DEFAULT',
    priority: 50,
    condition: (task: TaskCharacteristics) => task.executionType === 'full_app',
    sandbox: 'sandbox2' as SandboxType,
    description: 'Full applications default to sandbox2',
    confidence: 75,
  },
  {
    id: 'SNIPPET_DEFAULT',
    priority: 40,
    condition: (task: TaskCharacteristics) => task.executionType === 'snippet',
    sandbox: 'code_sandbox' as SandboxType,
    description: 'Code snippets default to CodeSandbox',
    confidence: 70,
  },
  {
    id: 'SAFE_NATIVE',
    priority: 30,
    condition: (task: TaskCharacteristics) => task.riskLevel === 'safe',
    sandbox: 'native' as SandboxType,
    description: 'Safe operations can run natively',
    confidence: 60,
  },
  {
    id: 'LOW_RISK_NATIVE',
    priority: 20,
    condition: (task: TaskCharacteristics) =>
      task.riskLevel === 'low' && !task.needsNetworkAccess && !task.needsFileSystemAccess,
    sandbox: 'native' as SandboxType,
    description: 'Low risk operations without network/filesystem can run natively',
    confidence: 50,
  },
  {
    id: 'DEFAULT_SANDBOX',
    priority: 0,
    condition: () => true,
    sandbox: 'sandbox_risk' as SandboxType,
    description: 'Default to risk-aware sandbox for safety',
    confidence: 40,
  },
];

function selectSandbox(task: TaskCharacteristics): SelectionResult {
  const matchedRules: string[] = [];
  let selectedSandbox: SandboxType = 'sandbox_risk';
  let selectedReason = 'Default selection';
  let confidence = 40;

  // Sort rules by priority (highest first)
  const sortedRules = [...SELECTION_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.condition(task)) {
      matchedRules.push(rule.id);
      if (matchedRules.length === 1) {
        // First match is the selection
        selectedSandbox = rule.sandbox;
        selectedReason = rule.description;
        confidence = rule.confidence;
      }
    }
  }

  // Validate selection
  const warnings: string[] = [];

  if (selectedSandbox === 'native' && task.isUntrustedCode) {
    warnings.push('SECURITY: Native execution selected for untrusted code - consider code_sandbox');
  }
  if (selectedSandbox === 'code_sandbox' && task.needsPortMapping) {
    warnings.push('CAPABILITY: CodeSandbox does not support port mapping - consider sandbox2');
  }
  if (selectedSandbox === 'native' && (task.riskLevel === 'high' || task.riskLevel === 'critical')) {
    warnings.push('RISK: Native execution selected for high-risk operation - consider sandbox_risk');
  }

  return {
    selectedSandbox,
    reason: selectedReason,
    confidence,
    warnings,
    matchedRules,
    timestamp: new Date(),
  };
}

function inferCharacteristics(code: string, context?: Record<string, unknown>): TaskCharacteristics {
  const characteristics: TaskCharacteristics = {
    executionType: 'snippet',
    riskLevel: 'low',
  };

  // Detect language
  if (code.includes('import ') && (code.includes(' from ') || code.includes('require('))) {
    if (code.includes(': ') || code.includes('interface ') || code.includes('<')) {
      characteristics.language = 'typescript';
    } else {
      characteristics.language = 'javascript';
    }
  } else if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
    characteristics.language = 'python';
  } else if (code.includes('func ') || code.includes('package ')) {
    characteristics.language = 'go';
  } else if (code.includes('fn ') || code.includes('let mut ')) {
    characteristics.language = 'rust';
  } else if (code.includes('#!/bin/bash') || code.includes('#!/bin/sh')) {
    characteristics.language = 'bash';
  }

  // Detect execution type
  if (code.includes('package.json') || code.includes('npm start') || code.includes('yarn start')) {
    characteristics.executionType = 'full_app';
    characteristics.needsPortMapping = true;
  }

  // Detect network needs
  if (
    code.includes('fetch(') ||
    code.includes('axios') ||
    code.includes('http.') ||
    code.includes('https.') ||
    code.includes('urllib') ||
    code.includes('requests.')
  ) {
    characteristics.needsNetworkAccess = true;
  }

  // Detect filesystem needs
  if (
    code.includes('fs.') ||
    code.includes('readFile') ||
    code.includes('writeFile') ||
    code.includes('open(') ||
    code.includes('os.path')
  ) {
    characteristics.needsFileSystemAccess = true;
  }

  // Detect risk level
  if (
    code.includes('eval(') ||
    code.includes('exec(') ||
    code.includes('spawn(') ||
    code.includes('child_process') ||
    code.includes('subprocess') ||
    code.includes('rm -rf') ||
    code.includes('DROP TABLE')
  ) {
    characteristics.riskLevel = 'high';
  } else if (characteristics.needsNetworkAccess || characteristics.needsFileSystemAccess) {
    characteristics.riskLevel = 'medium';
  }

  // Apply context overrides
  if (context) {
    if (context.isUntrusted) characteristics.isUntrustedCode = true;
    if (context.isUserSubmitted) characteristics.isUserSubmitted = true;
    if (context.isTasherDeployment) characteristics.isTasherDeployment = true;
    if (context.needsApproval) characteristics.needsApproval = true;
    if (context.riskLevel) characteristics.riskLevel = context.riskLevel as RiskLevel;
  }

  return characteristics;
}

export class SandboxSelectTool implements MCPTool {
  name = 'sandbox_select';
  description = `Select the correct sandbox for code execution. Returns the optimal sandbox type based on code characteristics, security requirements, and risk level.

Actions:
- select: Choose the best sandbox for given code/characteristics
- validate: Verify that the correct sandbox was used
- infer: Auto-detect task characteristics from code

Sandbox types:
- code_sandbox: Maximum security for untrusted code (seccomp, network isolation)
- sandbox_risk: Risk-aware execution with approval workflows
- sandbox2: Full application deployment with port mapping
- tasher: Tasher agent deployments
- native: Direct execution (safe operations only)`;

  parameters: MCPParameter[] = [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform: select, validate, or infer',
      required: true,
    },
    {
      name: 'code',
      type: 'string',
      description: 'Code to analyze (for select/infer actions)',
      required: false,
    },
    {
      name: 'characteristics',
      type: 'object',
      description:
        'Task characteristics object (executionType, language, isUntrustedCode, needsNetworkAccess, etc)',
      required: false,
    },
    {
      name: 'actualSandboxUsed',
      type: 'string',
      description: 'The sandbox that was actually used (for validate action)',
      required: false,
    },
    {
      name: 'context',
      type: 'object',
      description: 'Additional context (isUntrusted, isUserSubmitted, isTasherDeployment, etc)',
      required: false,
    },
  ];

  async execute(params: Record<string, unknown>): Promise<MCPResult> {
    const startTime = Date.now();
    const action = String(params.action || 'select').toLowerCase();

    try {
      switch (action) {
        case 'select': {
          let characteristics: TaskCharacteristics;

          if (params.characteristics) {
            characteristics = params.characteristics as TaskCharacteristics;
          } else if (params.code) {
            characteristics = inferCharacteristics(
              String(params.code),
              params.context as Record<string, unknown>
            );
          } else {
            return {
              success: false,
              error: 'Either code or characteristics must be provided for select action',
              metadata: { tool: 'sandbox_select', duration_ms: Date.now() - startTime },
            };
          }

          const result = selectSandbox(characteristics);

          return {
            success: true,
            data: {
              sandbox: result.selectedSandbox,
              reason: result.reason,
              confidence: result.confidence,
              warnings: result.warnings,
              matchedRules: result.matchedRules,
              characteristics,
            },
            metadata: {
              tool: 'sandbox_select',
              duration_ms: Date.now() - startTime,
            },
          };
        }

        case 'validate': {
          const actualSandbox = params.actualSandboxUsed as SandboxType;
          if (!actualSandbox) {
            return {
              success: false,
              error: 'actualSandboxUsed is required for validate action',
              metadata: { tool: 'sandbox_select', duration_ms: Date.now() - startTime },
            };
          }

          let characteristics: TaskCharacteristics;
          if (params.characteristics) {
            characteristics = params.characteristics as TaskCharacteristics;
          } else if (params.code) {
            characteristics = inferCharacteristics(
              String(params.code),
              params.context as Record<string, unknown>
            );
          } else {
            return {
              success: false,
              error: 'Either code or characteristics must be provided for validate action',
              metadata: { tool: 'sandbox_select', duration_ms: Date.now() - startTime },
            };
          }

          const expected = selectSandbox(characteristics);
          const isValid = expected.selectedSandbox === actualSandbox;

          return {
            success: true,
            data: {
              valid: isValid,
              expected: expected.selectedSandbox,
              actual: actualSandbox,
              expectedReason: expected.reason,
              confidence: expected.confidence,
              message: isValid
                ? `Correct sandbox used: ${actualSandbox}`
                : `Sandbox mismatch: expected ${expected.selectedSandbox} but got ${actualSandbox}`,
              warnings: expected.warnings,
            },
            metadata: {
              tool: 'sandbox_select',
              duration_ms: Date.now() - startTime,
            },
          };
        }

        case 'infer': {
          if (!params.code) {
            return {
              success: false,
              error: 'code is required for infer action',
              metadata: { tool: 'sandbox_select', duration_ms: Date.now() - startTime },
            };
          }

          const characteristics = inferCharacteristics(
            String(params.code),
            params.context as Record<string, unknown>
          );

          return {
            success: true,
            data: {
              characteristics,
              suggestedSandbox: selectSandbox(characteristics).selectedSandbox,
            },
            metadata: {
              tool: 'sandbox_select',
              duration_ms: Date.now() - startTime,
            },
          };
        }

        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Valid actions: select, validate, infer`,
            metadata: { tool: 'sandbox_select', duration_ms: Date.now() - startTime },
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'sandbox_select', duration_ms: Date.now() - startTime },
      };
    }
  }
}

export function createSandboxSelectTool(): SandboxSelectTool {
  return new SandboxSelectTool();
}

// Export inline functions for direct use
export { selectSandbox, inferCharacteristics };
export type { TaskCharacteristics, SelectionResult, SandboxType, RiskLevel };
