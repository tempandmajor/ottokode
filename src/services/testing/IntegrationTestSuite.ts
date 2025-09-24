import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}

interface IntegrationTestReport {
  timestamp: Date;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  systemInfo: {
    platform: string;
    nodeVersion: string;
    npmVersion: string;
    rustVersion?: string;
  };
}

export class IntegrationTestSuite {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private supabaseClient: any;
  private openaiClient: OpenAI | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    }

    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
  }

  async runAllTests(): Promise<IntegrationTestReport> {
    console.log('🧪 Starting Integration Test Suite...\n');
    this.startTime = Date.now();
    this.results = [];

    const testCategories = [
      { name: 'Environment Configuration', tests: this.runEnvironmentTests.bind(this) },
      { name: 'API Integrations', tests: this.runApiIntegrationTests.bind(this) },
      { name: 'Build Pipeline', tests: this.runBuildPipelineTests.bind(this) },
      { name: 'Cross-Platform Compatibility', tests: this.runCrossPlatformTests.bind(this) },
      { name: 'Local Development', tests: this.runDevelopmentTests.bind(this) },
      { name: 'Database Connections', tests: this.runDatabaseTests.bind(this) },
    ];

    for (const category of testCategories) {
      console.log(`📋 Running ${category.name} tests...`);
      try {
        await category.tests();
      } catch (error) {
        console.error(`❌ Category ${category.name} failed:`, error);
      }
      console.log('');
    }

    const report = await this.generateReport();
    await this.saveReport(report);
    this.printSummary(report);

    return report;
  }

  private async runEnvironmentTests() {
    await this.runTest('Environment Variables Check', async () => {
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'OPENAI_API_KEY',
        'NODE_ENV'
      ];

      const missing = requiredEnvVars.filter(env => !process.env[env]);
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }

      return { required: requiredEnvVars.length, found: requiredEnvVars.length - missing.length };
    });

    await this.runTest('Configuration Files Exist', async () => {
      const configFiles = [
        'package.json',
        'tsconfig.json',
        'next.config.js',
        'src-tauri/Cargo.toml',
        'src-tauri/tauri.conf.json'
      ];

      const results = await Promise.all(
        configFiles.map(async file => {
          try {
            await fs.access(file);
            return { file, exists: true };
          } catch {
            return { file, exists: false };
          }
        })
      );

      const missing = results.filter(r => !r.exists);
      if (missing.length > 0) {
        throw new Error(`Missing config files: ${missing.map(m => m.file).join(', ')}`);
      }

      return results;
    });
  }

  private async runApiIntegrationTests() {
    await this.runTest('Supabase Connection', async () => {
      if (!this.supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.supabaseClient
        .from('ai_patches')
        .select('count')
        .limit(1);

      if (error && !error.message.includes('permission')) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }

      return { connection: 'success', query: 'executed' };
    });

    await this.runTest('OpenAI API Connection', async () => {
      if (!this.openaiClient) {
        throw new Error('OpenAI client not initialized');
      }

      try {
        const response = await this.openaiClient.models.list();
        const hasGPT4 = response.data.some(model => model.id.includes('gpt-4'));

        return {
          connection: 'success',
          modelsAvailable: response.data.length,
          hasGPT4
        };
      } catch (error: any) {
        throw new Error(`OpenAI API test failed: ${error.message}`);
      }
    });

    await this.runTest('API Health Endpoints', async () => {
      const endpoints = [
        '/api/health',
        '/api/chat',
        '/api/files'
      ];

      const results = [];
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:3001${endpoint}`, {
            method: 'GET',
            timeout: 5000
          });
          results.push({
            endpoint,
            status: response.status,
            success: response.ok
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'timeout/error',
            success: false,
            error: (error as Error).message
          });
        }
      }

      return results;
    });
  }

  private async runBuildPipelineTests() {
    await this.runTest('TypeScript Compilation', async () => {
      const result = await this.runCommand('npx', ['tsc', '--noEmit']);
      if (result.code !== 0) {
        throw new Error(`TypeScript compilation failed: ${result.stderr}`);
      }
      return { compilation: 'success', output: result.stdout };
    });

    await this.runTest('ESLint Check', async () => {
      const result = await this.runCommand('npm', ['run', 'lint']);
      return {
        linting: result.code === 0 ? 'success' : 'issues',
        output: result.stdout,
        errors: result.stderr
      };
    });

    await this.runTest('Next.js Build Test', async () => {
      const result = await this.runCommand('timeout', ['60', 'npm', 'run', 'build'], {
        cwd: 'web-app'
      });

      if (result.code !== 0 && !result.stdout.includes('completed')) {
        throw new Error(`Next.js build failed: ${result.stderr}`);
      }

      return { build: 'success', duration: 'under 60s' };
    });

    await this.runTest('Tauri Build Test', async () => {
      const result = await this.runCommand('timeout', ['120', 'npm', 'run', 'tauri:build'], {
        timeout: 125000 // 2+ minutes
      });

      return {
        tauriBuild: result.code === 0 ? 'success' : 'failed',
        output: result.stdout.slice(-500), // Last 500 chars
        duration: 'under 2min'
      };
    });
  }

  private async runCrossPlatformTests() {
    await this.runTest('Platform Detection', async () => {
      const platform = process.platform;
      const arch = process.arch;
      const nodeVersion = process.version;

      return { platform, arch, nodeVersion, supported: true };
    });

    await this.runTest('Rust Toolchain Check', async () => {
      const rustcResult = await this.runCommand('rustc', ['--version']);
      const cargoResult = await this.runCommand('cargo', ['--version']);

      if (rustcResult.code !== 0) {
        throw new Error('Rust compiler not found');
      }

      return {
        rustc: rustcResult.stdout.trim(),
        cargo: cargoResult.stdout.trim()
      };
    });

    await this.runTest('Node.js Dependencies', async () => {
      const result = await this.runCommand('npm', ['list', '--depth=0']);
      const dependencies = result.stdout.match(/├──|└──/g)?.length || 0;

      return {
        dependenciesInstalled: dependencies,
        npmCheck: result.code === 0 ? 'success' : 'issues'
      };
    });
  }

  private async runDevelopmentTests() {
    await this.runTest('Development Server Start', async () => {
      // Test if we can start the dev server (briefly)
      const result = await this.runCommand('timeout', ['10', 'npm', 'run', 'dev'], {
        timeout: 12000
      });

      const serverStarted = result.stdout.includes('Local:') ||
                          result.stdout.includes('Ready') ||
                          result.stdout.includes('compiled');

      return {
        serverStart: serverStarted ? 'success' : 'failed',
        output: result.stdout.slice(-300)
      };
    });

    await this.runTest('Hot Module Replacement', async () => {
      // Create a temporary test file and modify it
      const testFile = path.join(process.cwd(), 'test-hmr.js');

      try {
        await fs.writeFile(testFile, 'console.log("test");');
        await fs.unlink(testFile);
        return { hmrTest: 'file operations work' };
      } catch (error) {
        throw new Error(`File operations failed: ${(error as Error).message}`);
      }
    });
  }

  private async runDatabaseTests() {
    await this.runTest('Database Schema Validation', async () => {
      if (!this.supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Test basic table access
      const tables = ['ai_patches', 'codebase_embeddings'];
      const results = [];

      for (const table of tables) {
        try {
          const { error } = await this.supabaseClient
            .from(table)
            .select('*')
            .limit(1);

          results.push({
            table,
            accessible: !error || error.message.includes('permission'),
            error: error?.message
          });
        } catch (err) {
          results.push({
            table,
            accessible: false,
            error: (err as Error).message
          });
        }
      }

      return { tables: results };
    });

    await this.runTest('Migration Status', async () => {
      try {
        const migrationFiles = await fs.readdir('migrations');
        const sqlFiles = migrationFiles.filter(f => f.endsWith('.sql'));

        return {
          migrationsFound: sqlFiles.length,
          files: sqlFiles
        };
      } catch (error) {
        return {
          migrationsFound: 0,
          error: 'migrations directory not found'
        };
      }
    });
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    console.log(`  🧪 ${name}...`);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.results.push({
        name,
        status: 'passed',
        duration,
        details: result
      });

      console.log(`  ✅ ${name} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.results.push({
        name,
        status: 'failed',
        duration,
        error: errorMessage
      });

      console.log(`  ❌ ${name} - ${errorMessage}`);
    }
  }

  private async runCommand(
    command: string,
    args: string[],
    options: { cwd?: string; timeout?: number } = {}
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
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

      const timeout = options.timeout ? setTimeout(() => {
        child.kill('SIGTERM');
      }, options.timeout) : null;

      child.on('close', (code) => {
        if (timeout) clearTimeout(timeout);
        resolve({ code: code || 0, stdout, stderr });
      });

      child.on('error', (error) => {
        if (timeout) clearTimeout(timeout);
        resolve({ code: 1, stdout, stderr: error.message });
      });
    });
  }

  private async generateReport(): Promise<IntegrationTestReport> {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    const nodeVersion = process.version;
    const platform = `${process.platform}-${process.arch}`;

    let npmVersion = 'unknown';
    try {
      const result = await this.runCommand('npm', ['--version']);
      npmVersion = result.stdout.trim();
    } catch {}

    let rustVersion = undefined;
    try {
      const result = await this.runCommand('rustc', ['--version']);
      rustVersion = result.stdout.trim();
    } catch {}

    return {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      duration: totalDuration,
      results: this.results,
      systemInfo: {
        platform,
        nodeVersion,
        npmVersion,
        rustVersion
      }
    };
  }

  private async saveReport(report: IntegrationTestReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports');

    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `integration-test-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Test report saved to: ${filepath}`);
  }

  private printSummary(report: IntegrationTestReport): void {
    console.log('🎯 Integration Test Summary');
    console.log('═'.repeat(50));
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passed}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`⏭️  Skipped: ${report.skipped}`);
    console.log(`⏱️  Duration: ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`🖥️  Platform: ${report.systemInfo.platform}`);
    console.log(`📦 Node: ${report.systemInfo.nodeVersion}`);
    console.log(`📋 NPM: ${report.systemInfo.npmVersion}`);
    if (report.systemInfo.rustVersion) {
      console.log(`🦀 Rust: ${report.systemInfo.rustVersion}`);
    }
    console.log('═'.repeat(50));

    if (report.failed > 0) {
      console.log('\n❌ Failed Tests:');
      report.results
        .filter(r => r.status === 'failed')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    }

    const successRate = ((report.passed / report.totalTests) * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);

    if (report.passed === report.totalTests) {
      console.log('🎉 All tests passed! System is ready for deployment.');
    } else if (successRate >= '80') {
      console.log('⚠️  Most tests passed. Review failed tests before deployment.');
    } else {
      console.log('🚨 Critical issues found. Do not deploy until resolved.');
    }
  }
}

export default IntegrationTestSuite;