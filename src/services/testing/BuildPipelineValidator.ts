import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface BuildStage {
  name: string;
  command: string;
  args: string[];
  cwd?: string;
  timeout?: number;
  required: boolean;
  dependencies?: string[];
}

interface BuildResult {
  stage: string;
  status: 'success' | 'failure' | 'timeout' | 'skipped';
  duration: number;
  output?: string;
  error?: string;
  exitCode?: number;
  artifacts?: string[];
}

interface BuildReport {
  timestamp: Date;
  environment: string;
  totalStages: number;
  successful: number;
  failed: number;
  skipped: number;
  totalDuration: number;
  results: BuildResult[];
  systemResources: {
    memoryUsed: number;
    diskSpace: number;
    nodeVersion: string;
    npmVersion: string;
    rustVersion?: string;
  };
}

export class BuildPipelineValidator {
  private buildStages: BuildStage[] = [];
  private results: BuildResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.setupBuildStages();
  }

  private setupBuildStages() {
    this.buildStages = [
      // Environment Setup
      {
        name: 'Environment Check',
        command: 'node',
        args: ['-v'],
        timeout: 5000,
        required: true
      },
      {
        name: 'NPM Version Check',
        command: 'npm',
        args: ['--version'],
        timeout: 5000,
        required: true
      },
      {
        name: 'Rust Toolchain Check',
        command: 'rustc',
        args: ['--version'],
        timeout: 10000,
        required: true
      },

      // Dependency Installation
      {
        name: 'Root Dependencies',
        command: 'npm',
        args: ['install'],
        timeout: 120000, // 2 minutes
        required: true,
        dependencies: ['Environment Check', 'NPM Version Check']
      },
      {
        name: 'Web App Dependencies',
        command: 'npm',
        args: ['install'],
        cwd: 'web-app',
        timeout: 120000,
        required: true,
        dependencies: ['Environment Check', 'NPM Version Check']
      },
      {
        name: 'Rust Dependencies',
        command: 'cargo',
        args: ['fetch'],
        cwd: 'src-tauri',
        timeout: 180000, // 3 minutes
        required: true,
        dependencies: ['Rust Toolchain Check']
      },

      // Code Quality Checks
      {
        name: 'TypeScript Type Check',
        command: 'npm',
        args: ['run', 'type-check'],
        timeout: 60000,
        required: true,
        dependencies: ['Root Dependencies']
      },
      {
        name: 'Web App Type Check',
        command: 'npm',
        args: ['run', 'type-check'],
        cwd: 'web-app',
        timeout: 60000,
        required: true,
        dependencies: ['Web App Dependencies']
      },
      {
        name: 'ESLint Check',
        command: 'npm',
        args: ['run', 'lint'],
        timeout: 60000,
        required: false,
        dependencies: ['Root Dependencies']
      },
      {
        name: 'Rust Clippy',
        command: 'cargo',
        args: ['clippy', '--', '-D', 'warnings'],
        cwd: 'src-tauri',
        timeout: 120000,
        required: false,
        dependencies: ['Rust Dependencies']
      },

      // Build Stages
      {
        name: 'Web App Build',
        command: 'npm',
        args: ['run', 'build'],
        cwd: 'web-app',
        timeout: 300000, // 5 minutes
        required: true,
        dependencies: ['Web App Type Check', 'Web App Dependencies']
      },
      {
        name: 'Rust Build Debug',
        command: 'cargo',
        args: ['build'],
        cwd: 'src-tauri',
        timeout: 300000,
        required: true,
        dependencies: ['Rust Dependencies']
      },
      {
        name: 'Tauri Development Build',
        command: 'npm',
        args: ['run', 'tauri:build', '--', '--debug'],
        timeout: 600000, // 10 minutes
        required: false,
        dependencies: ['Web App Build', 'Rust Build Debug']
      },
      {
        name: 'Tauri Production Build',
        command: 'npm',
        args: ['run', 'tauri:build'],
        timeout: 900000, // 15 minutes
        required: false,
        dependencies: ['Web App Build', 'Rust Build Debug']
      },

      // Testing
      {
        name: 'Unit Tests',
        command: 'npm',
        args: ['test', '--', '--run'],
        timeout: 120000,
        required: false,
        dependencies: ['TypeScript Type Check']
      },
      {
        name: 'Rust Tests',
        command: 'cargo',
        args: ['test'],
        cwd: 'src-tauri',
        timeout: 180000,
        required: false,
        dependencies: ['Rust Build Debug']
      }
    ];
  }

  async validateFullPipeline(): Promise<BuildReport> {
    console.log('🏗️  Starting Build Pipeline Validation...\n');
    this.startTime = Date.now();
    this.results = [];

    // Run stages in dependency order
    const completed = new Set<string>();

    while (completed.size < this.buildStages.length) {
      const availableStages = this.buildStages.filter(stage =>
        !completed.has(stage.name) &&
        (stage.dependencies?.every(dep => completed.has(dep)) ?? true)
      );

      if (availableStages.length === 0) {
        // Find remaining stages and mark as skipped due to dependencies
        const remainingStages = this.buildStages.filter(stage => !completed.has(stage.name));
        for (const stage of remainingStages) {
          this.results.push({
            stage: stage.name,
            status: 'skipped',
            duration: 0,
            error: 'Dependencies failed or skipped'
          });
          completed.add(stage.name);
        }
        break;
      }

      // Run available stages (can be run in parallel, but for simplicity, run sequentially)
      for (const stage of availableStages) {
        const result = await this.runBuildStage(stage);
        this.results.push(result);
        completed.add(stage.name);

        // If required stage fails, mark dependent stages as skipped
        if (stage.required && result.status === 'failure') {
          const dependentStages = this.buildStages.filter(s =>
            s.dependencies?.includes(stage.name)
          );

          for (const depStage of dependentStages) {
            if (!completed.has(depStage.name)) {
              this.markDependenciesAsSkipped(depStage.name, completed);
            }
          }
        }
      }
    }

    const report = await this.generateBuildReport();
    await this.saveBuildReport(report);
    this.printBuildSummary(report);

    return report;
  }

  async validateQuickBuild(): Promise<BuildResult[]> {
    console.log('⚡ Running Quick Build Validation...\n');

    const quickStages = [
      'Environment Check',
      'NPM Version Check',
      'TypeScript Type Check',
      'Web App Type Check',
      'ESLint Check'
    ];

    const results = [];
    for (const stageName of quickStages) {
      const stage = this.buildStages.find(s => s.name === stageName);
      if (stage) {
        const result = await this.runBuildStage(stage);
        results.push(result);
        console.log(`${result.status === 'success' ? '✅' : '❌'} ${stageName}`);
      }
    }

    return results;
  }

  private async runBuildStage(stage: BuildStage): Promise<BuildResult> {
    console.log(`🔨 Running: ${stage.name}...`);
    const startTime = Date.now();

    try {
      const result = await this.executeCommand(
        stage.command,
        stage.args,
        stage.cwd,
        stage.timeout
      );

      const duration = Date.now() - startTime;
      const status = result.exitCode === 0 ? 'success' : 'failure';

      // Check for build artifacts
      const artifacts = await this.findBuildArtifacts(stage);

      console.log(`  ${status === 'success' ? '✅' : '❌'} ${stage.name} (${duration}ms)`);

      return {
        stage: stage.name,
        status,
        duration,
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        artifacts
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`  ❌ ${stage.name} - ${(error as Error).message}`);

      return {
        stage: stage.name,
        status: error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'failure',
        duration,
        error: (error as Error).message
      };
    }
  }

  private async executeCommand(
    command: string,
    args: string[],
    cwd?: string,
    timeout?: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: cwd || process.cwd(),
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutHandler = timeout ? setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout) : null;

      child.on('close', (code) => {
        if (timeoutHandler) clearTimeout(timeoutHandler);
        resolve({ exitCode: code || 0, stdout, stderr });
      });

      child.on('error', (error) => {
        if (timeoutHandler) clearTimeout(timeoutHandler);
        reject(error);
      });
    });
  }

  private async findBuildArtifacts(stage: BuildStage): Promise<string[]> {
    const artifacts: string[] = [];
    const basePath = stage.cwd || process.cwd();

    try {
      const artifactPaths = [
        // Next.js build artifacts
        path.join(basePath, '.next'),
        path.join(basePath, 'out'),
        path.join(basePath, 'dist'),

        // Rust build artifacts
        path.join(basePath, 'target/debug'),
        path.join(basePath, 'target/release'),

        // Tauri artifacts
        path.join(basePath, 'target/debug/bundle'),
        path.join(basePath, 'target/release/bundle'),

        // Node modules
        path.join(basePath, 'node_modules')
      ];

      for (const artifactPath of artifactPaths) {
        try {
          const stats = await fs.stat(artifactPath);
          if (stats.isDirectory()) {
            artifacts.push(artifactPath);
          }
        } catch {
          // Path doesn't exist, skip
        }
      }
    } catch (error) {
      // Error finding artifacts, continue
    }

    return artifacts;
  }

  private markDependenciesAsSkipped(stageName: string, completed: Set<string>) {
    const stage = this.buildStages.find(s => s.name === stageName);
    if (!stage || completed.has(stageName)) return;

    this.results.push({
      stage: stageName,
      status: 'skipped',
      duration: 0,
      error: 'Required dependency failed'
    });
    completed.add(stageName);

    // Recursively skip dependent stages
    const dependentStages = this.buildStages.filter(s =>
      s.dependencies?.includes(stageName)
    );

    for (const depStage of dependentStages) {
      this.markDependenciesAsSkipped(depStage.name, completed);
    }
  }

  private async generateBuildReport(): Promise<BuildReport> {
    const totalDuration = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failure').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    // Gather system resource info
    const systemResources = await this.getSystemResources();

    return {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      totalStages: this.results.length,
      successful,
      failed,
      skipped,
      totalDuration,
      results: this.results,
      systemResources
    };
  }

  private async getSystemResources(): Promise<BuildReport['systemResources']> {
    const nodeVersion = process.version;
    let npmVersion = 'unknown';
    let rustVersion = undefined;

    try {
      const npmResult = await this.executeCommand('npm', ['--version']);
      npmVersion = npmResult.stdout.trim();
    } catch {}

    try {
      const rustResult = await this.executeCommand('rustc', ['--version']);
      rustVersion = rustResult.stdout.trim();
    } catch {}

    return {
      memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
      diskSpace: 0, // Would need additional implementation
      nodeVersion,
      npmVersion,
      rustVersion
    };
  }

  private async saveBuildReport(report: BuildReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports');

    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `build-pipeline-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Build report saved to: ${filepath}`);
  }

  private printBuildSummary(report: BuildReport): void {
    console.log('\n🏗️  Build Pipeline Summary');
    console.log('═'.repeat(50));
    console.log(`📊 Total Stages: ${report.totalStages}`);
    console.log(`✅ Successful: ${report.successful}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`⏭️  Skipped: ${report.skipped}`);
    console.log(`⏱️  Total Duration: ${(report.totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`💾 Memory Used: ${report.systemResources.memoryUsed}MB`);
    console.log(`📦 Node: ${report.systemResources.nodeVersion}`);
    console.log(`📋 NPM: ${report.systemResources.npmVersion}`);
    if (report.systemResources.rustVersion) {
      console.log(`🦀 Rust: ${report.systemResources.rustVersion}`);
    }
    console.log('═'.repeat(50));

    if (report.failed > 0) {
      console.log('\n❌ Failed Stages:');
      report.results
        .filter(r => r.status === 'failure')
        .forEach(result => {
          console.log(`  • ${result.stage}: ${result.error}`);
        });
    }

    if (report.skipped > 0) {
      console.log('\n⏭️  Skipped Stages:');
      report.results
        .filter(r => r.status === 'skipped')
        .forEach(result => {
          console.log(`  • ${result.stage}`);
        });
    }

    const successRate = ((report.successful / report.totalStages) * 100).toFixed(1);
    console.log(`\n🎯 Build Success Rate: ${successRate}%`);

    if (report.successful === report.totalStages) {
      console.log('🎉 All stages passed! Build pipeline is healthy.');
    } else if (parseFloat(successRate) >= 80) {
      console.log('⚠️  Most stages passed. Review failed stages.');
    } else {
      console.log('🚨 Build pipeline needs attention. Multiple failures detected.');
    }
  }

  async checkBuildHealth(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check if essential build tools are available
    try {
      await this.executeCommand('node', ['-v'], undefined, 5000);
    } catch {
      issues.push('Node.js not available');
    }

    try {
      await this.executeCommand('npm', ['--version'], undefined, 5000);
    } catch {
      issues.push('NPM not available');
    }

    try {
      await this.executeCommand('rustc', ['--version'], undefined, 5000);
    } catch {
      issues.push('Rust toolchain not available');
    }

    // Check essential files exist
    const essentialFiles = ['package.json', 'tsconfig.json', 'src-tauri/Cargo.toml'];
    for (const file of essentialFiles) {
      try {
        await fs.access(file);
      } catch {
        issues.push(`Missing essential file: ${file}`);
      }
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

export default BuildPipelineValidator;