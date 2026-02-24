/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PACKAGE-AS-TOOL SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Exposes all @ankr/* packages as MCP tools for LLM-assisted development
 *
 * Features:
 * - Package discovery and search
 * - Package introspection (exports, types, functions)
 * - Code generation using packages
 * - Solution composition from multiple packages
 *
 * 🙏 Jai Guru Ji | ANKR Labs | PowerBox IT Solutions Pvt Ltd
 */

import type { MCPResult, MCPParameter } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Package categories for better organization
const PACKAGE_CATEGORIES: Record<string, string[]> = {
  'ai-ml': [
    'ai-router', 'ankr-ai-sdk', 'ankr-brain', 'ankr-embeddings', 'ankr-eon',
    'ankr-eon-rag', 'ankr-intelligence', 'ankr-intelligence-stack', 'ankr-rag',
    'ankr-context-engine', 'ankr-intent', 'ankr-judge', 'ankr-guardrails'
  ],
  'auth-security': [
    'ankr-auth-gateway', 'ankr-iam', 'ankr-oauth', 'ankr-security', 'ankr-otp-auth',
    'user-keys', 'audit-trail'
  ],
  'crm': [
    'ankr-crm-core', 'ankr-crm-graphql', 'ankr-crm-prisma', 'ankr-crm-ui',
    'ankr-lead-scraper'
  ],
  'erp': [
    'erp', 'erp-accounting', 'erp-ap', 'erp-ar', 'erp-auth', 'erp-dashboard',
    'erp-forms', 'erp-gst', 'erp-inventory', 'erp-prisma', 'erp-procurement',
    'erp-projects', 'erp-receiving', 'erp-reports', 'erp-sales', 'erp-shipping',
    'erp-ui', 'erp-warehouse', 'ankr-accounting', 'ankr-einvoice', 'invoice-generator'
  ],
  'compliance': [
    'compliance-bridge', 'compliance-calendar', 'compliance-core', 'compliance-gst',
    'compliance-itr', 'compliance-mca', 'compliance-tds', 'compliance-tools',
    'complymitra', 'gst-utils', 'tds', 'fiscal-year'
  ],
  'banking': [
    'bani', 'bani-app', 'banking-accounts', 'banking-bbps', 'banking-calculators',
    'banking-upi', 'currency'
  ],
  'government': [
    'gov-aadhaar', 'gov-digilocker', 'gov-schemes', 'gov-ulip', 'ulip-wizard',
    'indian-states', 'hsn-codes'
  ],
  'voice-communication': [
    'ankr-voice', 'ankr-voice-ai', 'ankr-messaging', 'ankr-messaging-free',
    'voice-engine', 'ankr-chat-widget', 'sunosunao'
  ],
  'logistics-tms': [
    'tms', 'wowtruck-gps-standalone', 'wowtruck-mobile-app', 'wowtruck-theme',
    'ankr-fleet-widgets', 'ankr-ocean-tracker', 'ankr-gps-server', 'ankr-driverland',
    'ankr-driver-widgets', 'ankr-nav'
  ],
  'infrastructure': [
    'ankr-mcp', 'ankr-pulse', 'ankr-wire', 'ankr-sandbox', 'ankr-executor',
    'ankr-orchestrator', 'ankr-swarm', 'ankr-deploy', 'ankr-control-api'
  ],
  'ui-frontend': [
    'ankr-widgets', 'ankr-chat-widget', 'saathi-ui', 'ankr-omega-themes',
    'ankr-qr', 'ankr-i18n', 'ankr-templates'
  ],
  'code-generation': [
    'ankr-codegen', 'ankr-backend-generator', 'ankr-frontend-generator',
    'ankr-factory', 'ankr-omega-coder', 'ankr-omega-shell', 'create-ankr'
  ],
  'data-storage': [
    'ankr-entity', 'ankr-dms', 'ankr-docchain', 'document-ai', 'ankr-ocr',
    'universal-memory', 'postmemory', 'ankr-package-memory'
  ],
  'agents-automation': [
    'ankr-agents', 'ankr-devbrain', 'ankr-guru', 'ankr-learning', 'ankr-twin',
    'ankr-gamify', 'wizard-engine', 'workflow-engine', 'work-wizard'
  ],
  'core-utils': [
    'ankr-core', 'ankr-domain', 'ankr-sdk', 'ankr-services', 'ankr-shell',
    'ankr-bff', 'ankr-backend', 'ankr-test', 'ankr-xchg', 'ankr-alerts'
  ],
  'saathi': [
    'saathi-core', 'saathi-modules', 'saathi-ui'
  ],
  'mcp-tools': [
    'mcp-tools', 'ankr-mcp'
  ]
};

// Flatten categories to package -> category mapping
const PACKAGE_TO_CATEGORY: Record<string, string> = {};
for (const [category, packages] of Object.entries(PACKAGE_CATEGORIES)) {
  for (const pkg of packages) {
    PACKAGE_TO_CATEGORY[pkg] = category;
  }
}

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  category: string;
  keywords: string[];
  exports: string[];
  dependencies: string[];
  peerDependencies: string[];
  hasTypes: boolean;
  readme: string;
  examples: string[];
  robust: boolean;
  score: number;
  lineCount: number;
}

// Pre-computed robust packages list (score >= 40, has code, has exports, not stub)
const ROBUST_PACKAGES: Set<string> = new Set([
  '@ankr/bani', '@ankr/embeddings', '@ankr/omega-shell', '@ankr/pulse', '@ankr/shell',
  '@ankr/wire', '@ankr/orchestrator', '@ankr/banking-bbps', '@ankr/compliance-itr',
  '@ankr/compliance-mca', '@ankr/gov-schemes', '@ankr/hsn-codes', '@ankr/saathi-core',
  '@ankr/ai-router', '@ankr/agents', '@ankr/ai-sdk', '@ankr/control-api', '@ankr/core',
  '@ankr/devbrain', '@ankr/driver-widgets', '@ankr/eon', '@ankr/fleet-widgets',
  '@ankr/wowtruck-gps', '@ankr/iam', '@ankr/learning', '@ankr/messaging', '@ankr/oauth',
  '@ankr/omega-themes', '@ankr/sdk', '@ankr/swarm', '@ankr/wa-scraper', '@ankr/postmemory',
  '@ankr/voice-engine', '@ankr/domain', '@ankr/einvoice', '@ankr/guardrails',
  '@ankr/banking-upi', '@ankr/compliance-bridge', '@ankr/compliance-calendar',
  '@ankr/compliance-core', '@ankr/compliance-tds', '@ankr/erp-accounting', '@ankr/erp-gst',
  '@ankr/erp-procurement', '@ankr/erp-reports', '@ankr/erp-sales', '@ankr/gov-aadhaar',
  '@ankr/gov-digilocker', '@ankr/gov-ulip', '@ankr/gst-utils', '@ankr/mcp-tools',
  '@ankr/tms', '@ankr/ulip-wizard', '@ankr/work-wizard', '@ankr/driverland', '@ankr/guru',
  '@ankr/ocr', '@ankr/otp-auth', '@ankr/voice-ai', '@ankr/accounting', '@ankr/alerts',
  '@ankr/brain', '@ankr/frontend', '@ankr/i18n', '@ankr/intelligence', '@ankr/messaging-free',
  '@ankr/rag', '@ankr/sandbox', '@ankr/services', '@ankr/sms-gps', '@ankr/templates',
  '@ankr/xchg', '@ankr/audit-trail', '@ankr/compliance-gst', '@ankr/compliance-tools',
  '@ankr/erp-ap', '@ankr/erp-ar', '@ankr/erp-auth', '@ankr/erp-dashboard', '@ankr/erp-inventory',
  '@ankr/erp-receiving', '@ankr/erp-shipping', '@ankr/erp-warehouse', '@ankr/fiscal-year',
  '@ankr/invoice-generator', '@ankr/tds', '@ankr/test', '@ankr-labs/context-engine'
]);

interface PackageExport {
  name: string;
  type: 'function' | 'class' | 'const' | 'type' | 'interface' | 'enum';
  signature?: string;
  description?: string;
}

const PACKAGES_DIR = '/root/ankr-labs-nx/packages';

/**
 * Scan all packages and build metadata
 */
function scanPackages(): PackageInfo[] {
  const packages: PackageInfo[] = [];

  try {
    const dirs = fs.readdirSync(PACKAGES_DIR);

    for (const dir of dirs) {
      if (dir.endsWith('.zip') || dir.endsWith('.md') || dir.endsWith('.js') || dir.endsWith('.ts') || dir.endsWith('.sh')) {
        continue;
      }

      const pkgPath = path.join(PACKAGES_DIR, dir);
      const pkgJsonPath = path.join(pkgPath, 'package.json');

      if (!fs.existsSync(pkgJsonPath)) continue;

      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const readmePath = path.join(pkgPath, 'README.md');
        const readme = fs.existsSync(readmePath)
          ? fs.readFileSync(readmePath, 'utf-8').substring(0, 500)
          : '';

        // Check for index.ts exports
        const indexPath = path.join(pkgPath, 'src', 'index.ts');
        let exports: string[] = [];
        if (fs.existsSync(indexPath)) {
          const indexContent = fs.readFileSync(indexPath, 'utf-8');
          const exportMatches = indexContent.match(/export\s+(?:const|function|class|type|interface|enum)\s+(\w+)/g) || [];
          exports = exportMatches.map(m => m.split(/\s+/).pop() || '');

          // Also get re-exports
          const reExports = indexContent.match(/export\s+\*\s+from/g) || [];
          if (reExports.length > 0) {
            exports.push(`...and ${reExports.length} module re-exports`);
          }
        }

        const pkgName = pkgJson.name || `@ankr/${dir}`;
        packages.push({
          name: pkgName,
          version: pkgJson.version || '0.0.0',
          description: pkgJson.description || '',
          category: PACKAGE_TO_CATEGORY[dir] || 'other',
          keywords: pkgJson.keywords || [],
          exports: exports.slice(0, 20),
          dependencies: Object.keys(pkgJson.dependencies || {}).filter(d => d.startsWith('@ankr')),
          peerDependencies: Object.keys(pkgJson.peerDependencies || {}),
          hasTypes: fs.existsSync(path.join(pkgPath, 'src', 'types.ts')) ||
                    fs.existsSync(path.join(pkgPath, 'src', 'types', 'index.ts')),
          readme: readme,
          examples: [],
          robust: ROBUST_PACKAGES.has(pkgName),
          score: ROBUST_PACKAGES.has(pkgName) ? 50 : 20,
          lineCount: 0
        });
      } catch (e) {
        // Skip invalid packages
      }
    }
  } catch (e) {
    console.error('Error scanning packages:', e);
  }

  return packages;
}

/**
 * Get detailed exports from a package
 */
function getPackageExports(packageName: string): PackageExport[] {
  const exports: PackageExport[] = [];
  const dirName = packageName.replace('@ankr/', '').replace('@powerpbox/', '');
  const pkgPath = path.join(PACKAGES_DIR, dirName);
  const indexPath = path.join(pkgPath, 'src', 'index.ts');

  if (!fs.existsSync(indexPath)) return exports;

  const content = fs.readFileSync(indexPath, 'utf-8');

  // Parse exports
  const patterns = [
    { regex: /export\s+function\s+(\w+)\s*\(([^)]*)\)/g, type: 'function' as const },
    { regex: /export\s+class\s+(\w+)/g, type: 'class' as const },
    { regex: /export\s+const\s+(\w+)/g, type: 'const' as const },
    { regex: /export\s+type\s+(\w+)/g, type: 'type' as const },
    { regex: /export\s+interface\s+(\w+)/g, type: 'interface' as const },
    { regex: /export\s+enum\s+(\w+)/g, type: 'enum' as const },
  ];

  for (const { regex, type } of patterns) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      exports.push({
        name: match[1],
        type,
        signature: type === 'function' ? `${match[1]}(${match[2]})` : undefined
      });
    }
  }

  return exports;
}

/**
 * Generate usage example for a package
 */
function generateUsageExample(packageName: string): string {
  const exports = getPackageExports(packageName);
  const functions = exports.filter(e => e.type === 'function');
  const classes = exports.filter(e => e.type === 'class');

  let example = `// Using ${packageName}\n`;
  example += `import { ${exports.slice(0, 5).map(e => e.name).join(', ')} } from '${packageName}';\n\n`;

  if (functions.length > 0) {
    example += `// Example function usage:\n`;
    example += `const result = await ${functions[0].name}({ /* params */ });\n`;
  }

  if (classes.length > 0) {
    example += `\n// Example class usage:\n`;
    example += `const instance = new ${classes[0].name}({ /* config */ });\n`;
  }

  return example;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE TOOL EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════════

export const PACKAGE_TOOL_EXECUTORS: Record<string, (params: Record<string, any>) => Promise<MCPResult>> = {

  /**
   * List all available packages
   */
  pkg_list: async (params): Promise<MCPResult> => {
    const category = params.category as string | undefined;
    const packages = scanPackages();

    let filtered = packages;
    if (category) {
      filtered = packages.filter(p => p.category === category);
    }

    return {
      success: true,
      data: {
        totalPackages: packages.length,
        filteredCount: filtered.length,
        categories: Object.keys(PACKAGE_CATEGORIES),
        packages: filtered.map(p => ({
          name: p.name,
          version: p.version,
          category: p.category,
          description: p.description.substring(0, 100)
        }))
      },
      metadata: { tool: 'pkg_list', duration_ms: 0 }
    };
  },

  /**
   * Search packages by keyword
   */
  pkg_search: async (params): Promise<MCPResult> => {
    const query = (params.query as string || '').toLowerCase();
    const packages = scanPackages();

    const matches = packages.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.keywords.some(k => k.toLowerCase().includes(query)) ||
      p.category.includes(query)
    );

    return {
      success: true,
      data: {
        query,
        matchCount: matches.length,
        packages: matches.map(p => ({
          name: p.name,
          version: p.version,
          category: p.category,
          description: p.description,
          keywords: p.keywords.slice(0, 5),
          relevance: p.name.toLowerCase().includes(query) ? 'high' : 'medium'
        }))
      },
      metadata: { tool: 'pkg_search', duration_ms: 0 }
    };
  },

  /**
   * Get detailed info about a package
   */
  pkg_info: async (params): Promise<MCPResult> => {
    const packageName = params.package as string;
    const packages = scanPackages();

    // Normalize the search - try multiple formats
    const searchTerms = [
      packageName,
      `@ankr/${packageName}`,
      `@ankr/${packageName.replace('ankr-', '')}`,
      packageName.replace('@ankr/', ''),
      packageName.replace('ankr-', '')
    ];

    const pkg = packages.find(p =>
      searchTerms.some(term =>
        p.name === term ||
        p.name.toLowerCase() === term.toLowerCase() ||
        p.name.endsWith(`/${term}`)
      )
    );

    if (!pkg) {
      // Suggest similar packages
      const similar = packages.filter(p =>
        p.name.toLowerCase().includes(packageName.toLowerCase().replace('ankr-', '').replace('@ankr/', ''))
      ).slice(0, 5);

      return {
        success: false,
        error: `Package ${packageName} not found`,
        data: {
          suggestions: similar.map(p => p.name),
          hint: 'Try using @ankr/package-name format or just the package name'
        },
        metadata: { tool: 'pkg_info', duration_ms: 0 }
      };
    }

    const exports = getPackageExports(pkg.name);

    return {
      success: true,
      data: {
        ...pkg,
        exports: exports.slice(0, 30),
        exportCount: exports.length,
        usageExample: generateUsageExample(pkg.name)
      },
      metadata: { tool: 'pkg_info', duration_ms: 0 }
    };
  },

  /**
   * Get package exports (functions, classes, types)
   */
  pkg_exports: async (params): Promise<MCPResult> => {
    const packageName = params.package as string;
    const exports = getPackageExports(packageName);

    return {
      success: true,
      data: {
        package: packageName,
        exports: exports,
        summary: {
          functions: exports.filter(e => e.type === 'function').length,
          classes: exports.filter(e => e.type === 'class').length,
          types: exports.filter(e => e.type === 'type' || e.type === 'interface').length,
          constants: exports.filter(e => e.type === 'const').length,
          enums: exports.filter(e => e.type === 'enum').length
        }
      },
      metadata: { tool: 'pkg_exports', duration_ms: 0 }
    };
  },

  /**
   * Get packages by category
   */
  pkg_category: async (params): Promise<MCPResult> => {
    const category = params.category as string;
    const packageNames = PACKAGE_CATEGORIES[category] || [];
    const packages = scanPackages().filter(p => packageNames.includes(p.name.replace('@ankr/', '')));

    return {
      success: true,
      data: {
        category,
        description: getCategoryDescription(category),
        packageCount: packages.length,
        packages: packages.map(p => ({
          name: p.name,
          description: p.description,
          exports: p.exports.slice(0, 5)
        }))
      },
      metadata: { tool: 'pkg_category', duration_ms: 0 }
    };
  },

  /**
   * Find packages that solve a specific problem
   */
  pkg_solve: async (params): Promise<MCPResult> => {
    const problem = (params.problem as string || '').toLowerCase();
    const packages = scanPackages();

    // Problem -> package mapping
    const solutionMap: Record<string, string[]> = {
      'authentication': ['ankr-iam', 'ankr-oauth', 'ankr-auth-gateway', 'ankr-otp-auth'],
      'login': ['ankr-iam', 'ankr-oauth', 'ankr-auth-gateway'],
      'user management': ['ankr-iam', 'user-keys'],
      'gst': ['compliance-gst', 'gst-utils', 'ankr-einvoice'],
      'invoice': ['invoice-generator', 'ankr-einvoice', 'erp-ar'],
      'billing': ['erp-ar', 'invoice-generator', 'banking-accounts'],
      'payment': ['banking-upi', 'bani', 'banking-bbps'],
      'upi': ['banking-upi', 'bani'],
      'crm': ['ankr-crm-core', 'ankr-crm-graphql', 'ankr-crm-ui'],
      'lead': ['ankr-crm-core', 'ankr-lead-scraper'],
      'inventory': ['erp-inventory', 'erp-warehouse'],
      'accounting': ['ankr-accounting', 'erp-accounting'],
      'voice': ['ankr-voice', 'ankr-voice-ai', 'voice-engine'],
      'chat': ['ankr-chat-widget', 'ankr-messaging'],
      'sms': ['ankr-messaging', 'ankr-sms-gps'],
      'whatsapp': ['ankr-messaging', 'ankr-wa-scraper'],
      'ai': ['ai-router', 'ankr-ai-sdk', 'ankr-brain', 'ankr-intelligence'],
      'embeddings': ['ankr-embeddings', 'ankr-eon-rag'],
      'rag': ['ankr-rag', 'ankr-eon-rag'],
      'document': ['document-ai', 'ankr-dms', 'ankr-ocr'],
      'ocr': ['ankr-ocr', 'document-ai'],
      'tracking': ['ankr-gps-server', 'wowtruck-gps-standalone', 'ankr-ocean-tracker'],
      'gps': ['ankr-gps-server', 'wowtruck-gps-standalone', 'ankr-nav'],
      'fleet': ['ankr-fleet-widgets', 'tms', 'ankr-driverland'],
      'logistics': ['tms', 'ankr-fleet-widgets', 'ankr-ocean-tracker'],
      'shipping': ['erp-shipping', 'ankr-ocean-tracker'],
      'compliance': ['compliance-core', 'compliance-tools', 'complymitra'],
      'tds': ['compliance-tds', 'tds'],
      'itr': ['compliance-itr'],
      'mca': ['compliance-mca'],
      'aadhaar': ['gov-aadhaar'],
      'kyc': ['gov-aadhaar', 'gov-digilocker'],
      'digilocker': ['gov-digilocker'],
      'workflow': ['workflow-engine', 'ankr-orchestrator'],
      'automation': ['ankr-agents', 'workflow-engine', 'ankr-executor'],
      'code generation': ['ankr-codegen', 'ankr-backend-generator', 'ankr-frontend-generator'],
      'backend': ['ankr-backend', 'ankr-backend-generator', 'ankr-bff'],
      'frontend': ['ankr-frontend-generator', 'ankr-widgets', 'ankr-templates'],
      'api': ['ankr-bff', 'ankr-control-api', 'ankr-sdk'],
      'monitoring': ['ankr-pulse', 'ankr-alerts'],
      'security': ['ankr-security', 'ankr-guardrails', 'audit-trail'],
    };

    // Find matching solutions
    const solutions: string[] = [];
    for (const [keyword, pkgs] of Object.entries(solutionMap)) {
      if (problem.includes(keyword)) {
        solutions.push(...pkgs);
      }
    }

    // Dedupe and get package details
    const uniqueSolutions = [...new Set(solutions)];

    // Match packages by normalizing names
    const solutionPackages = packages.filter(p => {
      const normalizedPkgName = p.name.replace('@ankr/', '').replace('ankr-', '').toLowerCase();
      return uniqueSolutions.some(s => {
        const normalizedSolution = s.replace('@ankr/', '').replace('ankr-', '').toLowerCase();
        return normalizedPkgName === normalizedSolution ||
               normalizedPkgName.includes(normalizedSolution) ||
               normalizedSolution.includes(normalizedPkgName);
      });
    });

    return {
      success: true,
      data: {
        problem,
        solutionCount: solutionPackages.length,
        recommendedPackages: solutionPackages.map(p => ({
          name: p.name,
          description: p.description,
          category: p.category,
          whyRecommended: `Solves: ${problem}`
        })),
        alternativeKeywords: Object.keys(solutionMap).filter(k => k !== problem).slice(0, 10)
      },
      metadata: { tool: 'pkg_solve', duration_ms: 0 }
    };
  },

  /**
   * Generate code using multiple packages
   */
  pkg_compose: async (params): Promise<MCPResult> => {
    const packages = params.packages as string[] || [];
    const goal = params.goal as string || '';

    // Generate imports
    let code = `/**\n * Generated solution for: ${goal}\n * Using packages: ${packages.join(', ')}\n */\n\n`;

    for (const pkg of packages) {
      const exports = getPackageExports(pkg);
      const mainExports = exports.slice(0, 3).map(e => e.name);
      if (mainExports.length > 0) {
        code += `import { ${mainExports.join(', ')} } from '${pkg}';\n`;
      }
    }

    code += `\n// TODO: Implement your solution\n`;
    code += `async function main() {\n`;
    code += `  // Your code here\n`;
    code += `}\n\n`;
    code += `main().catch(console.error);\n`;

    return {
      success: true,
      data: {
        goal,
        packages,
        generatedCode: code,
        nextSteps: [
          'Review the generated imports',
          'Implement the main() function',
          'Add error handling',
          'Add tests'
        ]
      },
      metadata: { tool: 'pkg_compose', duration_ms: 0 }
    };
  },

  /**
   * Get package dependencies graph
   */
  pkg_deps: async (params): Promise<MCPResult> => {
    const packageName = params.package as string;
    const packages = scanPackages();
    const pkg = packages.find(p => p.name === packageName || p.name.endsWith(`/${packageName}`));

    if (!pkg) {
      return {
        success: false,
        error: `Package ${packageName} not found`,
        metadata: { tool: 'pkg_deps', duration_ms: 0 }
      };
    }

    // Find packages that depend on this package
    const dependents = packages.filter(p =>
      p.dependencies.includes(pkg.name) ||
      p.dependencies.includes(packageName)
    );

    return {
      success: true,
      data: {
        package: pkg.name,
        dependencies: pkg.dependencies,
        peerDependencies: pkg.peerDependencies,
        dependents: dependents.map(d => d.name),
        graph: {
          upstream: pkg.dependencies,
          downstream: dependents.map(d => d.name)
        }
      },
      metadata: { tool: 'pkg_deps', duration_ms: 0 }
    };
  },

  /**
   * Get all categories with descriptions
   */
  pkg_categories: async (): Promise<MCPResult> => {
    const categories = Object.entries(PACKAGE_CATEGORIES).map(([name, packages]) => ({
      name,
      description: getCategoryDescription(name),
      packageCount: packages.length,
      samplePackages: packages.slice(0, 3)
    }));

    return {
      success: true,
      data: {
        totalCategories: categories.length,
        categories
      },
      metadata: { tool: 'pkg_categories', duration_ms: 0 }
    };
  },

  /**
   * Read package README
   */
  pkg_readme: async (params): Promise<MCPResult> => {
    const packageName = params.package as string;
    const dirName = packageName.replace('@ankr/', '').replace('@powerpbox/', '');
    const readmePath = path.join(PACKAGES_DIR, dirName, 'README.md');

    if (!fs.existsSync(readmePath)) {
      return {
        success: false,
        error: `README not found for ${packageName}`,
        metadata: { tool: 'pkg_readme', duration_ms: 0 }
      };
    }

    const content = fs.readFileSync(readmePath, 'utf-8');

    return {
      success: true,
      data: {
        package: packageName,
        readme: content.substring(0, 5000),
        truncated: content.length > 5000
      },
      metadata: { tool: 'pkg_readme', duration_ms: 0 }
    };
  },

  /**
   * Get only robust (production-ready) packages
   */
  pkg_robust: async (params): Promise<MCPResult> => {
    const category = params.category as string | undefined;
    const packages = scanPackages().filter(p => p.robust);

    let filtered = packages;
    if (category) {
      filtered = packages.filter(p => p.category === category);
    }

    // Group by category
    const byCategory: Record<string, typeof packages> = {};
    for (const pkg of filtered) {
      if (!byCategory[pkg.category]) byCategory[pkg.category] = [];
      byCategory[pkg.category].push(pkg);
    }

    return {
      success: true,
      data: {
        totalRobust: packages.length,
        filteredCount: filtered.length,
        message: 'These packages are production-ready with documentation, types, and substantial code',
        byCategory: Object.entries(byCategory).map(([cat, pkgs]) => ({
          category: cat,
          count: pkgs.length,
          packages: pkgs.map(p => ({
            name: p.name,
            description: p.description.substring(0, 80),
            exports: p.exports.length
          }))
        })),
        topPackages: filtered.slice(0, 20).map(p => ({
          name: p.name,
          category: p.category,
          description: p.description.substring(0, 100)
        }))
      },
      metadata: { tool: 'pkg_robust', duration_ms: 0 }
    };
  },

  /**
   * Get quick stats about all packages
   */
  pkg_stats: async (): Promise<MCPResult> => {
    const packages = scanPackages();

    const byCategory: Record<string, number> = {};
    for (const pkg of packages) {
      byCategory[pkg.category] = (byCategory[pkg.category] || 0) + 1;
    }

    const robust = packages.filter(p => p.robust);
    const withTypes = packages.filter(p => p.hasTypes).length;
    const withDocs = packages.filter(p => p.readme.length > 0).length;

    return {
      success: true,
      data: {
        totalPackages: packages.length,
        robustPackages: robust.length,
        robustPercent: Math.round((robust.length / packages.length) * 100),
        needsWork: packages.length - robust.length,
        byCategory,
        withTypes,
        withDocs,
        topCategories: Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count })),
        recommendation: `Use pkg_robust to get ${robust.length} production-ready packages`
      },
      metadata: { tool: 'pkg_stats', duration_ms: 0 }
    };
  }
};

/**
 * Get category description
 */
function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'ai-ml': 'AI/ML tools including LLM routing, embeddings, RAG, and intelligence',
    'auth-security': 'Authentication, authorization, OAuth, IAM, and security',
    'crm': 'Customer Relationship Management - leads, contacts, opportunities',
    'erp': 'Enterprise Resource Planning - accounting, inventory, procurement, sales',
    'compliance': 'Indian compliance - GST, TDS, ITR, MCA filings',
    'banking': 'Banking integrations - UPI, BBPS, accounts, calculators',
    'government': 'Government APIs - Aadhaar, DigiLocker, ULIP, schemes',
    'voice-communication': 'Voice AI, messaging, chat, SMS, WhatsApp',
    'logistics-tms': 'Transport Management - GPS, fleet, ocean tracking',
    'infrastructure': 'MCP, monitoring, orchestration, sandboxing',
    'ui-frontend': 'UI components, widgets, themes, templates',
    'code-generation': 'Code generators for backend, frontend, full-stack',
    'data-storage': 'Document management, OCR, storage, memory',
    'agents-automation': 'AI agents, workflow automation, wizards',
    'core-utils': 'Core utilities, SDK, services, domain logic',
    'saathi': 'Saathi AI assistant modules',
    'mcp-tools': 'Model Context Protocol tools'
  };
  return descriptions[category] || 'Miscellaneous packages';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const PACKAGE_TOOLS: Record<string, {
  name: string;
  description: string;
  descriptionHi: string;
  category: string;
  parameters: MCPParameter[];
  voiceTriggers: string[];
}> = {
  pkg_list: {
    name: 'pkg_list',
    description: 'List all available @ankr packages. Filter by category optionally.',
    descriptionHi: 'सभी @ankr पैकेज की सूची देखें',
    category: 'packages',
    parameters: [
      { name: 'category', type: 'string', description: 'Filter by category (ai-ml, auth-security, crm, erp, etc.)', required: false }
    ],
    voiceTriggers: ['list packages', 'show packages', 'पैकेज दिखाओ']
  },
  pkg_search: {
    name: 'pkg_search',
    description: 'Search packages by keyword, name, or description',
    descriptionHi: 'पैकेज खोजें',
    category: 'packages',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true }
    ],
    voiceTriggers: ['search packages', 'find package', 'पैकेज खोजो']
  },
  pkg_info: {
    name: 'pkg_info',
    description: 'Get detailed information about a specific package including exports, dependencies, and usage example',
    descriptionHi: 'पैकेज की विस्तृत जानकारी',
    category: 'packages',
    parameters: [
      { name: 'package', type: 'string', description: 'Package name (e.g., @ankr/iam or ankr-iam)', required: true }
    ],
    voiceTriggers: ['package info', 'about package', 'पैकेज जानकारी']
  },
  pkg_exports: {
    name: 'pkg_exports',
    description: 'Get all exports (functions, classes, types) from a package',
    descriptionHi: 'पैकेज के exports देखें',
    category: 'packages',
    parameters: [
      { name: 'package', type: 'string', description: 'Package name', required: true }
    ],
    voiceTriggers: ['package exports', 'what does package export', 'exports दिखाओ']
  },
  pkg_category: {
    name: 'pkg_category',
    description: 'Get all packages in a specific category',
    descriptionHi: 'श्रेणी के पैकेज',
    category: 'packages',
    parameters: [
      { name: 'category', type: 'string', description: 'Category name (ai-ml, auth-security, crm, erp, compliance, banking, etc.)', required: true }
    ],
    voiceTriggers: ['packages in category', 'category packages', 'श्रेणी पैकेज']
  },
  pkg_solve: {
    name: 'pkg_solve',
    description: 'Find packages that solve a specific problem (e.g., "authentication", "gst filing", "invoice generation")',
    descriptionHi: 'समस्या का समाधान करने वाले पैकेज खोजें',
    category: 'packages',
    parameters: [
      { name: 'problem', type: 'string', description: 'Problem description (e.g., "user authentication", "gst compliance", "payment processing")', required: true }
    ],
    voiceTriggers: ['solve problem', 'package for', 'समस्या हल करो']
  },
  pkg_compose: {
    name: 'pkg_compose',
    description: 'Generate starter code using multiple packages to achieve a goal',
    descriptionHi: 'कई पैकेज से कोड बनाएं',
    category: 'packages',
    parameters: [
      { name: 'packages', type: 'array', description: 'List of package names to use', required: true },
      { name: 'goal', type: 'string', description: 'What you want to achieve', required: true }
    ],
    voiceTriggers: ['compose packages', 'combine packages', 'पैकेज मिलाओ']
  },
  pkg_deps: {
    name: 'pkg_deps',
    description: 'Get dependency graph for a package - what it depends on and what depends on it',
    descriptionHi: 'पैकेज dependencies',
    category: 'packages',
    parameters: [
      { name: 'package', type: 'string', description: 'Package name', required: true }
    ],
    voiceTriggers: ['package dependencies', 'depends on', 'dependencies दिखाओ']
  },
  pkg_categories: {
    name: 'pkg_categories',
    description: 'List all package categories with descriptions and counts',
    descriptionHi: 'सभी श्रेणियां',
    category: 'packages',
    parameters: [],
    voiceTriggers: ['list categories', 'show categories', 'श्रेणियां दिखाओ']
  },
  pkg_readme: {
    name: 'pkg_readme',
    description: 'Read the README documentation for a package',
    descriptionHi: 'पैकेज का README पढ़ें',
    category: 'packages',
    parameters: [
      { name: 'package', type: 'string', description: 'Package name', required: true }
    ],
    voiceTriggers: ['read readme', 'package readme', 'readme दिखाओ']
  },
  pkg_stats: {
    name: 'pkg_stats',
    description: 'Get statistics about all packages - counts, categories, documentation coverage',
    descriptionHi: 'पैकेज आंकड़े',
    category: 'packages',
    parameters: [],
    voiceTriggers: ['package stats', 'statistics', 'आंकड़े दिखाओ']
  },
  pkg_robust: {
    name: 'pkg_robust',
    description: 'Get only ROBUST production-ready packages that can be used immediately without additional work. These have documentation, types, tests, and substantial code.',
    descriptionHi: 'तैयार पैकेज',
    category: 'packages',
    parameters: [
      { name: 'category', type: 'string' as const, description: 'Filter by category (ai-ml, auth, erp, compliance, etc.)', required: false }
    ],
    voiceTriggers: ['robust packages', 'ready packages', 'production ready', 'तैयार पैकेज']
  }
};

export default PACKAGE_TOOLS;
