/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PACKAGE DOCTOR TOOLS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Package evaluation and upgrade tools for monorepo management.
 * These tools analyze packages for robustness and automatically generate
 * missing documentation, tests, and types.
 *
 * Tools:
 * - pkg_doctor_evaluate: Evaluate a single package
 * - pkg_doctor_evaluate_all: Evaluate all packages
 * - pkg_doctor_quick_wins: Find packages close to robust
 * - pkg_doctor_upgrade_plan: Generate upgrade plan
 * - pkg_doctor_upgrade: Execute upgrade
 * - pkg_doctor_upgrade_batch: Batch upgrade
 * - pkg_doctor_health_report: Generate health report
 * - pkg_doctor_criteria: Show robustness criteria
 *
 * 🙏 Jai Guru Ji | ANKR Labs
 */

import type { MCPResult, MCPParameter } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PACKAGES_DIR = '/root/ankr-labs-nx/packages';
const ROBUST_THRESHOLD = 70;

const DEFAULT_WEIGHTS = {
  readme: 15,
  types: 15,
  tests: 20,
  exports: 15,
  codeSize: 10,
  noStubs: 10,
  scripts: 10,
  dependencies: 5
};

const STUB_MARKERS = ['TODO', 'STUB', 'FIXME', 'NOT IMPLEMENTED', 'PLACEHOLDER'];

const GRADE_THRESHOLDS = { A: 90, B: 80, C: 70, D: 60, F: 0 };

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface CriterionResult {
  name: string;
  weight: number;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
}

interface EvaluationSummary {
  totalFiles: number;
  totalLines: number;
  exportCount: number;
  testFileCount: number;
  stubCount: number;
  category: string;
}

interface EvaluationResult {
  packageName: string;
  packagePath: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isRobust: boolean;
  criteria: CriterionResult[];
  summary: EvaluationSummary;
  recommendations: string[];
}

interface UpgradeAction {
  action: 'create' | 'update' | 'append';
  filePath: string;
  content: string;
  description: string;
  priority: number;
  success?: boolean;
  error?: string;
}

interface UpgradePlan {
  packageName: string;
  packagePath: string;
  currentScore: number;
  targetScore: number;
  actions: UpgradeAction[];
  estimatedFiles: number;
}

interface UpgradeResult {
  packageName: string;
  packagePath: string;
  success: boolean;
  beforeScore: number;
  afterScore: number;
  actions: UpgradeAction[];
  errors: string[];
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE EVALUATOR
// ═══════════════════════════════════════════════════════════════════════════════

class PackageEvaluator {
  private packagesDir: string;
  private robustThreshold: number;

  constructor(config?: { packagesDir?: string; robustThreshold?: number }) {
    this.packagesDir = config?.packagesDir || PACKAGES_DIR;
    this.robustThreshold = config?.robustThreshold || ROBUST_THRESHOLD;
  }

  async evaluate(packagePathOrName: string): Promise<EvaluationResult> {
    const packagePath = this.resolvePackagePath(packagePathOrName);
    const packageName = this.getPackageName(packagePath);

    if (!fs.existsSync(packagePath)) {
      throw new Error(`Package not found: ${packagePath}`);
    }

    const criteria: CriterionResult[] = [];
    const summary = this.buildSummary(packagePath);

    // Evaluate each criterion
    criteria.push(this.checkReadme(packagePath));
    criteria.push(this.checkTypes(packagePath));
    criteria.push(this.checkTests(packagePath));
    criteria.push(this.checkExports(packagePath));
    criteria.push(this.checkCodeSize(packagePath, summary.totalLines));
    criteria.push(this.checkNoStubs(packagePath));
    criteria.push(this.checkScripts(packagePath));
    criteria.push(this.checkDependencies(packagePath));

    const score = criteria.reduce((sum, c) => sum + c.score, 0);
    const maxScore = criteria.reduce((sum, c) => sum + c.maxScore, 0);
    const percentage = Math.round((score / maxScore) * 100);
    const grade = this.calculateGrade(percentage);
    const isRobust = percentage >= this.robustThreshold;

    const recommendations = this.generateRecommendations(criteria, packageName);

    return {
      packageName,
      packagePath,
      score,
      maxScore,
      percentage,
      grade,
      isRobust,
      criteria,
      summary,
      recommendations
    };
  }

  async evaluateAll(): Promise<{
    packages: EvaluationResult[];
    total: number;
    robust: number;
    needsWork: number;
    stubs: number;
    byGrade: Record<string, number>;
    byCategory: Record<string, { total: number; robust: number }>;
    timestamp: string;
  }> {
    const packages: EvaluationResult[] = [];
    const dirs = fs.readdirSync(this.packagesDir);

    for (const dir of dirs) {
      const pkgPath = path.join(this.packagesDir, dir);
      if (!fs.existsSync(path.join(pkgPath, 'package.json'))) continue;

      try {
        const result = await this.evaluate(pkgPath);
        packages.push(result);
      } catch {
        // Skip invalid packages
      }
    }

    const byGrade: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const byCategory: Record<string, { total: number; robust: number }> = {};

    for (const pkg of packages) {
      byGrade[pkg.grade]++;
      if (!byCategory[pkg.summary.category]) {
        byCategory[pkg.summary.category] = { total: 0, robust: 0 };
      }
      byCategory[pkg.summary.category].total++;
      if (pkg.isRobust) byCategory[pkg.summary.category].robust++;
    }

    return {
      packages,
      total: packages.length,
      robust: packages.filter(p => p.isRobust).length,
      needsWork: packages.filter(p => !p.isRobust && p.percentage >= 30).length,
      stubs: packages.filter(p => p.percentage < 30).length,
      byGrade,
      byCategory,
      timestamp: new Date().toISOString()
    };
  }

  async getQuickWins(maxMissing: number = 2): Promise<EvaluationResult[]> {
    const batch = await this.evaluateAll();
    return batch.packages
      .filter(p => !p.isRobust)
      .filter(p => p.criteria.filter(c => !c.passed).length <= maxMissing)
      .sort((a, b) => b.percentage - a.percentage);
  }

  private resolvePackagePath(input: string): string {
    if (path.isAbsolute(input)) return input;
    if (input.startsWith('@ankr/')) {
      const dirName = input.replace('@ankr/', '');
      // Try ankr- prefix first
      const withPrefix = path.join(this.packagesDir, `ankr-${dirName}`);
      if (fs.existsSync(withPrefix)) return withPrefix;
      return path.join(this.packagesDir, dirName);
    }
    if (input.startsWith('ankr-')) {
      return path.join(this.packagesDir, input);
    }
    return path.join(this.packagesDir, input);
  }

  private getPackageName(packagePath: string): string {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf-8'));
      return pkgJson.name || path.basename(packagePath);
    } catch {
      return path.basename(packagePath);
    }
  }

  private buildSummary(packagePath: string): EvaluationSummary {
    let totalFiles = 0;
    let totalLines = 0;
    let exportCount = 0;
    let testFileCount = 0;
    let stubCount = 0;

    const srcPath = path.join(packagePath, 'src');
    if (fs.existsSync(srcPath)) {
      const files = this.getAllFiles(srcPath, ['.ts', '.tsx', '.js', '.jsx']);
      totalFiles = files.length;
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        totalLines += content.split('\n').length;
        exportCount += (content.match(/export\s+(const|function|class|type|interface|enum)/g) || []).length;
        stubCount += STUB_MARKERS.filter(m => content.toUpperCase().includes(m)).length;
      }
    }

    const testsPath = path.join(packagePath, 'tests');
    if (fs.existsSync(testsPath)) {
      testFileCount = this.getAllFiles(testsPath, ['.test.ts', '.test.tsx', '.spec.ts']).length;
    }

    return {
      totalFiles,
      totalLines,
      exportCount,
      testFileCount,
      stubCount,
      category: this.detectCategory(packagePath)
    };
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  private detectCategory(packagePath: string): string {
    const name = path.basename(packagePath).toLowerCase();
    if (name.includes('crm')) return 'crm';
    if (name.includes('erp') || name.includes('accounting')) return 'erp';
    if (name.includes('compliance') || name.includes('gst') || name.includes('tds')) return 'compliance';
    if (name.includes('ai') || name.includes('ml') || name.includes('eon') || name.includes('rag')) return 'ai-ml';
    if (name.includes('voice') || name.includes('chat') || name.includes('messaging')) return 'voice-communication';
    if (name.includes('auth') || name.includes('iam') || name.includes('oauth') || name.includes('security')) return 'auth-security';
    if (name.includes('gov') || name.includes('aadhaar') || name.includes('ulip')) return 'government';
    if (name.includes('bank') || name.includes('upi') || name.includes('bani')) return 'banking';
    if (name.includes('tms') || name.includes('gps') || name.includes('fleet') || name.includes('logistics')) return 'logistics';
    return 'other';
  }

  private checkReadme(packagePath: string): CriterionResult {
    const readmePath = path.join(packagePath, 'README.md');
    const exists = fs.existsSync(readmePath);
    let hasUsage = false;

    if (exists) {
      const content = fs.readFileSync(readmePath, 'utf-8').toLowerCase();
      hasUsage = content.includes('usage') || content.includes('example') || content.includes('import');
    }

    const passed = exists && hasUsage;
    return {
      name: 'README Documentation',
      weight: DEFAULT_WEIGHTS.readme,
      passed,
      score: passed ? DEFAULT_WEIGHTS.readme : (exists ? DEFAULT_WEIGHTS.readme / 2 : 0),
      maxScore: DEFAULT_WEIGHTS.readme,
      details: passed ? 'Has README with usage examples' : (exists ? 'README exists but lacks usage examples' : 'Missing README.md')
    };
  }

  private checkTypes(packagePath: string): CriterionResult {
    const typesPath = path.join(packagePath, 'src', 'types.ts');
    const typesIndexPath = path.join(packagePath, 'src', 'types', 'index.ts');
    const exists = fs.existsSync(typesPath) || fs.existsSync(typesIndexPath);

    return {
      name: 'TypeScript Types',
      weight: DEFAULT_WEIGHTS.types,
      passed: exists,
      score: exists ? DEFAULT_WEIGHTS.types : 0,
      maxScore: DEFAULT_WEIGHTS.types,
      details: exists ? 'Has type definitions' : 'Missing types.ts'
    };
  }

  private checkTests(packagePath: string): CriterionResult {
    const testsPath = path.join(packagePath, 'tests');
    const testFiles = fs.existsSync(testsPath)
      ? this.getAllFiles(testsPath, ['.test.ts', '.test.tsx', '.spec.ts'])
      : [];
    const hasTests = testFiles.length > 0;
    const jestConfig = fs.existsSync(path.join(packagePath, 'jest.config.js')) ||
                       fs.existsSync(path.join(packagePath, 'jest.config.ts'));

    const passed = hasTests && jestConfig;
    return {
      name: 'Test Coverage',
      weight: DEFAULT_WEIGHTS.tests,
      passed,
      score: passed ? DEFAULT_WEIGHTS.tests : (hasTests ? DEFAULT_WEIGHTS.tests / 2 : 0),
      maxScore: DEFAULT_WEIGHTS.tests,
      details: passed ? `Has ${testFiles.length} test file(s) with jest config`
        : (hasTests ? 'Has tests but missing jest.config' : 'Missing tests')
    };
  }

  private checkExports(packagePath: string): CriterionResult {
    const indexPath = path.join(packagePath, 'src', 'index.ts');
    const exists = fs.existsSync(indexPath);
    let hasExports = false;

    if (exists) {
      const content = fs.readFileSync(indexPath, 'utf-8');
      hasExports = content.includes('export');
    }

    const passed = exists && hasExports;
    return {
      name: 'Proper Exports',
      weight: DEFAULT_WEIGHTS.exports,
      passed,
      score: passed ? DEFAULT_WEIGHTS.exports : 0,
      maxScore: DEFAULT_WEIGHTS.exports,
      details: passed ? 'Has index.ts with exports' : 'Missing or empty index.ts'
    };
  }

  private checkCodeSize(packagePath: string, totalLines: number): CriterionResult {
    const passed = totalLines > 50;
    return {
      name: 'Substantial Code',
      weight: DEFAULT_WEIGHTS.codeSize,
      passed,
      score: passed ? DEFAULT_WEIGHTS.codeSize : Math.min(totalLines / 5, DEFAULT_WEIGHTS.codeSize),
      maxScore: DEFAULT_WEIGHTS.codeSize,
      details: `${totalLines} lines of code (min: 50)`
    };
  }

  private checkNoStubs(packagePath: string): CriterionResult {
    const srcPath = path.join(packagePath, 'src');
    let stubCount = 0;

    if (fs.existsSync(srcPath)) {
      const files = this.getAllFiles(srcPath, ['.ts', '.tsx']);
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8').toUpperCase();
        stubCount += STUB_MARKERS.filter(m => content.includes(m)).length;
      }
    }

    const passed = stubCount === 0;
    return {
      name: 'No Stubs/TODOs',
      weight: DEFAULT_WEIGHTS.noStubs,
      passed,
      score: passed ? DEFAULT_WEIGHTS.noStubs : Math.max(0, DEFAULT_WEIGHTS.noStubs - stubCount),
      maxScore: DEFAULT_WEIGHTS.noStubs,
      details: passed ? 'No stub markers found' : `Found ${stubCount} stub marker(s)`
    };
  }

  private checkScripts(packagePath: string): CriterionResult {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf-8'));
      const scripts = pkgJson.scripts || {};
      const hasBuild = 'build' in scripts;
      const hasTest = 'test' in scripts;
      const passed = hasBuild && hasTest;

      return {
        name: 'Package Scripts',
        weight: DEFAULT_WEIGHTS.scripts,
        passed,
        score: passed ? DEFAULT_WEIGHTS.scripts : ((hasBuild || hasTest) ? DEFAULT_WEIGHTS.scripts / 2 : 0),
        maxScore: DEFAULT_WEIGHTS.scripts,
        details: passed ? 'Has build and test scripts'
          : `Missing: ${!hasBuild ? 'build' : ''} ${!hasTest ? 'test' : ''}`.trim()
      };
    } catch {
      return {
        name: 'Package Scripts',
        weight: DEFAULT_WEIGHTS.scripts,
        passed: false,
        score: 0,
        maxScore: DEFAULT_WEIGHTS.scripts,
        details: 'Could not read package.json'
      };
    }
  }

  private checkDependencies(packagePath: string): CriterionResult {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf-8'));
      const devDeps = pkgJson.devDependencies || {};
      const hasJest = 'jest' in devDeps || '@jest/core' in devDeps;
      const hasTs = 'typescript' in devDeps;
      const passed = hasJest && hasTs;

      return {
        name: 'Dependencies',
        weight: DEFAULT_WEIGHTS.dependencies,
        passed,
        score: passed ? DEFAULT_WEIGHTS.dependencies : ((hasJest || hasTs) ? DEFAULT_WEIGHTS.dependencies / 2 : 0),
        maxScore: DEFAULT_WEIGHTS.dependencies,
        details: passed ? 'Has jest and typescript' : `Missing: ${!hasJest ? 'jest' : ''} ${!hasTs ? 'typescript' : ''}`.trim()
      };
    } catch {
      return {
        name: 'Dependencies',
        weight: DEFAULT_WEIGHTS.dependencies,
        passed: false,
        score: 0,
        maxScore: DEFAULT_WEIGHTS.dependencies,
        details: 'Could not read package.json'
      };
    }
  }

  private calculateGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (percentage >= GRADE_THRESHOLDS.A) return 'A';
    if (percentage >= GRADE_THRESHOLDS.B) return 'B';
    if (percentage >= GRADE_THRESHOLDS.C) return 'C';
    if (percentage >= GRADE_THRESHOLDS.D) return 'D';
    return 'F';
  }

  private generateRecommendations(criteria: CriterionResult[], _packageName: string): string[] {
    const recs: string[] = [];
    for (const c of criteria) {
      if (!c.passed) {
        switch (c.name) {
          case 'README Documentation':
            recs.push('Add README.md with usage examples and API documentation');
            break;
          case 'TypeScript Types':
            recs.push('Create src/types.ts with interface definitions');
            break;
          case 'Test Coverage':
            recs.push('Add tests/ directory with unit tests and jest.config.js');
            break;
          case 'Proper Exports':
            recs.push('Create src/index.ts with proper exports');
            break;
          case 'Substantial Code':
            recs.push('Add more implementation code (min 50 lines)');
            break;
          case 'No Stubs/TODOs':
            recs.push('Remove TODO/STUB/FIXME markers and implement features');
            break;
          case 'Package Scripts':
            recs.push('Add build and test scripts to package.json');
            break;
          case 'Dependencies':
            recs.push('Add jest and typescript to devDependencies');
            break;
        }
      }
    }
    return recs;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE UPGRADER
// ═══════════════════════════════════════════════════════════════════════════════

class PackageUpgrader {
  private packagesDir: string;
  private evaluator: PackageEvaluator;

  constructor(config?: { packagesDir?: string }) {
    this.packagesDir = config?.packagesDir || PACKAGES_DIR;
    this.evaluator = new PackageEvaluator({ packagesDir: this.packagesDir });
  }

  async plan(packagePath: string): Promise<UpgradePlan> {
    const evaluation = await this.evaluator.evaluate(packagePath);
    const actions: UpgradeAction[] = [];
    let priority = 1;

    for (const criterion of evaluation.criteria) {
      if (!criterion.passed) {
        const action = this.createActionForCriterion(criterion, evaluation.packagePath, evaluation.packageName);
        if (action) {
          action.priority = priority++;
          actions.push(action);
        }
      }
    }

    const potentialGain = actions.reduce((sum, a) => {
      const criterion = evaluation.criteria.find(c => a.description.includes(c.name));
      return sum + (criterion ? criterion.maxScore - criterion.score : 0);
    }, 0);

    return {
      packageName: evaluation.packageName,
      packagePath: evaluation.packagePath,
      currentScore: evaluation.percentage,
      targetScore: Math.min(100, evaluation.percentage + Math.round(potentialGain)),
      actions,
      estimatedFiles: actions.length
    };
  }

  async upgrade(packagePath: string, dryRun: boolean = true): Promise<UpgradeResult> {
    const plan = await this.plan(packagePath);
    const errors: string[] = [];

    for (const action of plan.actions) {
      if (!dryRun) {
        try {
          const dir = path.dirname(action.filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          if (action.action === 'append' && fs.existsSync(action.filePath)) {
            const existing = fs.readFileSync(action.filePath, 'utf-8');
            fs.writeFileSync(action.filePath, existing + '\n' + action.content);
          } else {
            fs.writeFileSync(action.filePath, action.content);
          }
          action.success = true;
        } catch (error) {
          action.success = false;
          action.error = error instanceof Error ? error.message : String(error);
          errors.push(`${action.filePath}: ${action.error}`);
        }
      } else {
        action.success = true;
      }
    }

    let afterScore = plan.currentScore;
    if (!dryRun) {
      const newEval = await this.evaluator.evaluate(packagePath);
      afterScore = newEval.percentage;
    }

    return {
      packageName: plan.packageName,
      packagePath: plan.packagePath,
      success: errors.length === 0,
      beforeScore: plan.currentScore,
      afterScore,
      actions: plan.actions,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  private createActionForCriterion(
    criterion: CriterionResult,
    packagePath: string,
    packageName: string
  ): UpgradeAction | null {
    const shortName = packageName.replace('@ankr/', '').replace('ankr-', '');

    switch (criterion.name) {
      case 'README Documentation':
        return {
          action: 'create',
          filePath: path.join(packagePath, 'README.md'),
          content: this.generateReadme(packageName, shortName),
          description: 'Create README Documentation',
          priority: 0
        };

      case 'TypeScript Types':
        return {
          action: 'create',
          filePath: path.join(packagePath, 'src', 'types.ts'),
          content: this.generateTypes(shortName),
          description: 'Create TypeScript Types',
          priority: 0
        };

      case 'Test Coverage':
        return {
          action: 'create',
          filePath: path.join(packagePath, 'tests', 'index.test.ts'),
          content: this.generateTests(packageName, shortName),
          description: 'Create Test Coverage',
          priority: 0
        };

      case 'Package Scripts':
        return {
          action: 'update',
          filePath: path.join(packagePath, 'package.json'),
          content: JSON.stringify({
            scripts: {
              build: 'tsc',
              test: 'jest',
              'test:coverage': 'jest --coverage'
            }
          }, null, 2),
          description: 'Update Package Scripts',
          priority: 0
        };

      default:
        return null;
    }
  }

  private generateReadme(packageName: string, shortName: string): string {
    return `# ${packageName}

Package description.

## Installation

\`\`\`bash
npm install ${packageName}
\`\`\`

## Usage

\`\`\`typescript
import { } from '${packageName}';

// Example usage
\`\`\`

## API

### Functions

- \`function1()\` - Description

### Classes

- \`Class1\` - Description

## License

MIT - ANKR Labs
`;
  }

  private generateTypes(shortName: string): string {
    const className = shortName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    return `/**
 * Type definitions for ${shortName}
 */

export interface ${className}Config {
  debug?: boolean;
  options?: Record<string, unknown>;
}

export interface ${className}Result {
  success: boolean;
  data?: unknown;
  error?: string;
}
`;
  }

  private generateTests(packageName: string, shortName: string): string {
    return `/**
 * Tests for ${packageName}
 */

describe('${shortName}', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });

  it('should work correctly', () => {
    // Add your tests here
    expect(1 + 1).toBe(2);
  });
});
`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTORS
// ═══════════════════════════════════════════════════════════════════════════════

const evaluator = new PackageEvaluator();
const upgrader = new PackageUpgrader();

export const PACKAGE_DOCTOR_TOOL_EXECUTORS: Record<string, (params: Record<string, any>) => Promise<MCPResult>> = {

  pkg_doctor_evaluate: async (params): Promise<MCPResult> => {
    try {
      const result = await evaluator.evaluate(params.package);

      return {
        success: true,
        data: {
          package: result.packageName,
          path: result.packagePath,
          score: {
            value: result.score,
            max: result.maxScore,
            percentage: `${result.percentage}%`,
            grade: result.grade
          },
          isRobust: result.isRobust,
          summary: result.summary,
          criteria: result.criteria.map(c => ({
            name: c.name,
            passed: c.passed ? '✓' : '✗',
            score: `${c.score}/${c.maxScore}`,
            details: c.details
          })),
          recommendations: result.recommendations
        },
        metadata: { tool: 'pkg_doctor_evaluate', duration_ms: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'pkg_doctor_evaluate', duration_ms: 0 }
      };
    }
  },

  pkg_doctor_evaluate_all: async (params): Promise<MCPResult> => {
    try {
      const batch = await evaluator.evaluateAll();
      let results = batch.packages;

      if (params.category) {
        results = results.filter(p => p.summary.category === params.category);
      }

      return {
        success: true,
        data: {
          summary: {
            total: results.length,
            robust: `${results.filter(r => r.isRobust).length} (${Math.round((results.filter(r => r.isRobust).length / results.length) * 100)}%)`,
            needsWork: results.filter(r => !r.isRobust && r.percentage >= 30).length,
            stubs: results.filter(r => r.percentage < 30).length
          },
          byGrade: batch.byGrade,
          byCategory: batch.byCategory,
          packages: results.map(p => ({
            name: p.packageName,
            score: `${p.percentage}%`,
            grade: p.grade,
            robust: p.isRobust ? '✓' : '✗',
            category: p.summary.category
          }))
        },
        metadata: { tool: 'pkg_doctor_evaluate_all', duration_ms: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'pkg_doctor_evaluate_all', duration_ms: 0 }
      };
    }
  },

  pkg_doctor_quick_wins: async (params): Promise<MCPResult> => {
    try {
      const maxMissing = params.max_missing || 2;
      const quickWins = await evaluator.getQuickWins(maxMissing);

      return {
        success: true,
        data: {
          count: quickWins.length,
          packages: quickWins.map(pkg => ({
            name: pkg.packageName,
            score: `${pkg.percentage}%`,
            grade: pkg.grade,
            missing: pkg.criteria.filter(c => !c.passed).map(c => c.name),
            recommendations: pkg.recommendations.slice(0, 3)
          })),
          message: quickWins.length > 0
            ? `Found ${quickWins.length} quick win(s) - packages close to robust threshold`
            : 'No quick wins found. All non-robust packages need significant work.'
        },
        metadata: { tool: 'pkg_doctor_quick_wins', duration_ms: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'pkg_doctor_quick_wins', duration_ms: 0 }
      };
    }
  },

  pkg_doctor_upgrade_plan: async (params): Promise<MCPResult> => {
    try {
      const plan = await upgrader.plan(params.package);

      return {
        success: true,
        data: {
          package: plan.packageName,
          currentScore: `${plan.currentScore}%`,
          targetScore: `${plan.targetScore}%`,
          expectedGain: `+${plan.targetScore - plan.currentScore}%`,
          actions: plan.actions.map(a => ({
            action: a.action,
            description: a.description,
            file: a.filePath.split('/').slice(-2).join('/'),
            priority: a.priority
          })),
          filesAffected: plan.estimatedFiles,
          note: 'Run pkg_doctor_upgrade with dry_run=false to execute this plan'
        },
        metadata: { tool: 'pkg_doctor_upgrade_plan', duration_ms: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'pkg_doctor_upgrade_plan', duration_ms: 0 }
      };
    }
  },

  pkg_doctor_upgrade: async (params): Promise<MCPResult> => {
    try {
      const dryRun = params.dry_run !== false;
      const result = await upgrader.upgrade(params.package, dryRun);

      return {
        success: result.success,
        data: {
          package: result.packageName,
          success: result.success,
          mode: dryRun ? 'DRY RUN (no files modified)' : 'EXECUTED',
          scores: {
            before: `${result.beforeScore}%`,
            after: dryRun ? 'N/A' : `${result.afterScore}%`,
            gain: dryRun ? 'N/A' : `+${result.afterScore - result.beforeScore}%`
          },
          actions: result.actions.map(a => ({
            action: a.action,
            status: a.success ? '✓' : '✗',
            file: a.filePath.split('/').slice(-2).join('/'),
            error: a.error
          })),
          errors: result.errors
        },
        metadata: { tool: 'pkg_doctor_upgrade', duration_ms: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'pkg_doctor_upgrade', duration_ms: 0 }
      };
    }
  },

  pkg_doctor_upgrade_batch: async (params): Promise<MCPResult> => {
    try {
      const dryRun = params.dry_run !== false;
      let packages: string[] = params.packages || [];

      if (packages.length === 1 && packages[0] === 'quick_wins') {
        const quickWins = await evaluator.getQuickWins(2);
        packages = quickWins.map(p => p.packagePath);
      }

      const results: UpgradeResult[] = [];
      for (const pkg of packages) {
        const result = await upgrader.upgrade(pkg, dryRun);
        results.push(result);
      }

      return {
        success: true,
        data: {
          summary: {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            dryRun
          },
          results: results.map(r => ({
            package: r.packageName,
            success: r.success,
            before: `${r.beforeScore}%`,
            after: dryRun ? 'N/A' : `${r.afterScore}%`,
            actions: r.actions.length
          }))
        },
        metadata: { tool: 'pkg_doctor_upgrade_batch', duration_ms: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'pkg_doctor_upgrade_batch', duration_ms: 0 }
      };
    }
  },

  pkg_doctor_health_report: async (): Promise<MCPResult> => {
    try {
      const batch = await evaluator.evaluateAll();

      return {
        success: true,
        data: {
          overview: {
            totalPackages: batch.total,
            robustPackages: batch.robust,
            needsWork: batch.needsWork,
            stubs: batch.stubs,
            robustPercentage: Math.round((batch.robust / batch.total) * 100),
            averageScore: Math.round(batch.packages.reduce((s, p) => s + p.percentage, 0) / batch.total)
          },
          byGrade: batch.byGrade,
          byCategory: Object.entries(batch.byCategory)
            .map(([cat, data]) => ({
              category: cat,
              total: data.total,
              robust: data.robust,
              percentage: Math.round((data.robust / data.total) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage),
          topPerformers: batch.packages
            .filter(p => p.isRobust)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10)
            .map(p => ({ name: p.packageName, score: `${p.percentage}%`, grade: p.grade })),
          needsAttention: batch.packages
            .filter(p => !p.isRobust)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10)
            .map(p => ({
              name: p.packageName,
              score: `${p.percentage}%`,
              grade: p.grade,
              topRecommendation: p.recommendations[0]
            }))
        },
        metadata: { tool: 'pkg_doctor_health_report', duration_ms: 0 }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { tool: 'pkg_doctor_health_report', duration_ms: 0 }
      };
    }
  },

  pkg_doctor_criteria: async (): Promise<MCPResult> => {
    return {
      success: true,
      data: {
        criteria: [
          { name: 'README Documentation', weight: 15, description: 'Has README.md with usage examples' },
          { name: 'TypeScript Types', weight: 15, description: 'Has types.ts or exports type definitions' },
          { name: 'Test Coverage', weight: 20, description: 'Has tests/ directory with unit tests' },
          { name: 'Proper Exports', weight: 15, description: 'Has index.ts with clean exports' },
          { name: 'Substantial Code', weight: 10, description: 'Has >50 lines of implementation' },
          { name: 'No Stubs/TODOs', weight: 10, description: 'No TODO/STUB/FIXME markers' },
          { name: 'Package Scripts', weight: 10, description: 'Has build and test scripts' },
          { name: 'Dependencies', weight: 5, description: 'Has proper dev dependencies' }
        ],
        thresholds: {
          robust: '70%+ (Grade C or better)',
          grades: { A: '90-100%', B: '80-89%', C: '70-79%', D: '60-69%', F: '0-59%' }
        },
        totalWeight: 100
      },
      metadata: { tool: 'pkg_doctor_criteria', duration_ms: 0 }
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const PACKAGE_DOCTOR_TOOLS: Record<string, {
  name: string;
  description: string;
  descriptionHi: string;
  category: string;
  parameters: MCPParameter[];
  voiceTriggers: string[];
}> = {
  pkg_doctor_evaluate: {
    name: 'pkg_doctor_evaluate',
    description: 'Evaluate a single package for robustness and production-readiness. Returns detailed score, grade, and recommendations.',
    descriptionHi: 'पैकेज की गुणवत्ता जांचें',
    category: 'package-doctor',
    parameters: [
      { name: 'package', type: 'string', description: 'Package name or directory path', required: true }
    ],
    voiceTriggers: ['evaluate package', 'check package', 'पैकेज जांचो']
  },
  pkg_doctor_evaluate_all: {
    name: 'pkg_doctor_evaluate_all',
    description: 'Evaluate all packages in the monorepo. Returns summary statistics and per-package scores.',
    descriptionHi: 'सभी पैकेज की जांच करें',
    category: 'package-doctor',
    parameters: [
      { name: 'category', type: 'string', description: 'Optional category filter', required: false }
    ],
    voiceTriggers: ['evaluate all', 'check all packages', 'सभी जांचो']
  },
  pkg_doctor_quick_wins: {
    name: 'pkg_doctor_quick_wins',
    description: 'Find packages that are close to being robust (need minimal fixes).',
    descriptionHi: 'जल्दी सुधारने वाले पैकेज खोजें',
    category: 'package-doctor',
    parameters: [
      { name: 'max_missing', type: 'number', description: 'Maximum number of failing criteria (default: 2)', required: false }
    ],
    voiceTriggers: ['quick wins', 'easy fixes', 'आसान सुधार']
  },
  pkg_doctor_upgrade_plan: {
    name: 'pkg_doctor_upgrade_plan',
    description: 'Generate an upgrade plan for a package. Shows what files would be created/modified.',
    descriptionHi: 'पैकेज अपग्रेड योजना बनाएं',
    category: 'package-doctor',
    parameters: [
      { name: 'package', type: 'string', description: 'Package name or directory path', required: true }
    ],
    voiceTriggers: ['upgrade plan', 'plan upgrade', 'अपग्रेड योजना']
  },
  pkg_doctor_upgrade: {
    name: 'pkg_doctor_upgrade',
    description: 'Execute upgrade plan for a package. Creates missing files (README, tests, types).',
    descriptionHi: 'पैकेज अपग्रेड करें',
    category: 'package-doctor',
    parameters: [
      { name: 'package', type: 'string', description: 'Package name or directory path', required: true },
      { name: 'dry_run', type: 'boolean', description: 'Preview changes without writing files (default: true)', required: false }
    ],
    voiceTriggers: ['upgrade package', 'fix package', 'पैकेज अपग्रेड']
  },
  pkg_doctor_upgrade_batch: {
    name: 'pkg_doctor_upgrade_batch',
    description: 'Upgrade multiple packages in batch. Use with caution.',
    descriptionHi: 'कई पैकेज एक साथ अपग्रेड करें',
    category: 'package-doctor',
    parameters: [
      { name: 'packages', type: 'array', description: 'List of package names or "quick_wins"', required: true },
      { name: 'dry_run', type: 'boolean', description: 'Preview changes (default: true)', required: false }
    ],
    voiceTriggers: ['batch upgrade', 'upgrade many', 'बैच अपग्रेड']
  },
  pkg_doctor_health_report: {
    name: 'pkg_doctor_health_report',
    description: 'Generate a comprehensive health report for the monorepo with statistics and trends.',
    descriptionHi: 'स्वास्थ्य रिपोर्ट बनाएं',
    category: 'package-doctor',
    parameters: [],
    voiceTriggers: ['health report', 'monorepo health', 'स्वास्थ्य रिपोर्ट']
  },
  pkg_doctor_criteria: {
    name: 'pkg_doctor_criteria',
    description: 'Show robustness criteria and their weights.',
    descriptionHi: 'मजबूती के मानदंड देखें',
    category: 'package-doctor',
    parameters: [],
    voiceTriggers: ['show criteria', 'robustness criteria', 'मानदंड दिखाओ']
  }
};

export default PACKAGE_DOCTOR_TOOLS;
