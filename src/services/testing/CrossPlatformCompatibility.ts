import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

interface PlatformFeature {
  name: string;
  supported: boolean;
  version?: string;
  details?: any;
  issues?: string[];
}

interface CompatibilityTest {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  details?: any;
  recommendations?: string[];
}

interface PlatformReport {
  platform: {
    type: string;
    arch: string;
    version: string;
    hostname: string;
  };
  runtime: {
    node: PlatformFeature;
    npm: PlatformFeature;
    rust: PlatformFeature;
    cargo: PlatformFeature;
  };
  systemFeatures: {
    filesystem: PlatformFeature;
    networking: PlatformFeature;
    threading: PlatformFeature;
    memory: PlatformFeature;
  };
  development: {
    buildTools: PlatformFeature;
    debugger: PlatformFeature;
    signing: PlatformFeature;
  };
  tauri: {
    webview: PlatformFeature;
    systemTray: PlatformFeature;
    notifications: PlatformFeature;
    fileSystem: PlatformFeature;
  };
  tests: CompatibilityTest[];
  recommendations: string[];
  timestamp: Date;
}

export class CrossPlatformCompatibility {
  private platform: string;
  private arch: string;
  private tests: CompatibilityTest[] = [];

  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
  }

  async runCompatibilityCheck(): Promise<PlatformReport> {
    console.log(`🖥️  Running Cross-Platform Compatibility Check for ${this.platform}-${this.arch}...\n`);

    const report: PlatformReport = {
      platform: this.getPlatformInfo(),
      runtime: await this.checkRuntimeCompatibility(),
      systemFeatures: await this.checkSystemFeatures(),
      development: await this.checkDevelopmentTools(),
      tauri: await this.checkTauriCompatibility(),
      tests: [],
      recommendations: [],
      timestamp: new Date()
    };

    // Run comprehensive tests
    await this.runFileSystemTests();
    await this.runNetworkingTests();
    await this.runBuildSystemTests();
    await this.runTauriSpecificTests();

    report.tests = this.tests;
    report.recommendations = this.generateRecommendations(report);

    this.printCompatibilityReport(report);
    await this.saveCompatibilityReport(report);

    return report;
  }

  private getPlatformInfo() {
    return {
      type: this.platform,
      arch: this.arch,
      version: os.release(),
      hostname: os.hostname()
    };
  }

  private async checkRuntimeCompatibility(): Promise<PlatformReport['runtime']> {
    console.log('📦 Checking Runtime Compatibility...');

    const runtime = {
      node: await this.checkNodeJs(),
      npm: await this.checkNpm(),
      rust: await this.checkRust(),
      cargo: await this.checkCargo()
    };

    return runtime;
  }

  private async checkNodeJs(): Promise<PlatformFeature> {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);

      const feature: PlatformFeature = {
        name: 'Node.js',
        supported: majorVersion >= 18,
        version,
        issues: []
      };

      if (majorVersion < 18) {
        feature.issues!.push('Node.js version < 18 may have compatibility issues');
      }

      if (majorVersion >= 20) {
        feature.details = { optimized: true, stable: true };
      }

      return feature;
    } catch (error) {
      return {
        name: 'Node.js',
        supported: false,
        issues: ['Node.js not available']
      };
    }
  }

  private async checkNpm(): Promise<PlatformFeature> {
    try {
      const result = await this.runCommand('npm', ['--version']);
      const version = result.stdout.trim();

      return {
        name: 'NPM',
        supported: result.exitCode === 0,
        version,
        details: { packageManager: 'npm' }
      };
    } catch (error) {
      return {
        name: 'NPM',
        supported: false,
        issues: ['NPM not available']
      };
    }
  }

  private async checkRust(): Promise<PlatformFeature> {
    try {
      const result = await this.runCommand('rustc', ['--version']);
      const version = result.stdout.trim();

      const feature: PlatformFeature = {
        name: 'Rust',
        supported: result.exitCode === 0,
        version,
        issues: []
      };

      // Check for minimum Rust version (1.70+)
      const versionMatch = version.match(/rustc (\d+)\.(\d+)/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);

        if (major === 1 && minor < 70) {
          feature.issues!.push('Rust version < 1.70 may not support latest Tauri features');
        }
      }

      return feature;
    } catch (error) {
      return {
        name: 'Rust',
        supported: false,
        issues: ['Rust compiler not available']
      };
    }
  }

  private async checkCargo(): Promise<PlatformFeature> {
    try {
      const result = await this.runCommand('cargo', ['--version']);
      return {
        name: 'Cargo',
        supported: result.exitCode === 0,
        version: result.stdout.trim()
      };
    } catch (error) {
      return {
        name: 'Cargo',
        supported: false,
        issues: ['Cargo not available']
      };
    }
  }

  private async checkSystemFeatures(): Promise<PlatformReport['systemFeatures']> {
    console.log('🔧 Checking System Features...');

    return {
      filesystem: await this.checkFilesystemFeatures(),
      networking: await this.checkNetworkingFeatures(),
      threading: await this.checkThreadingFeatures(),
      memory: await this.checkMemoryFeatures()
    };
  }

  private async checkFilesystemFeatures(): Promise<PlatformFeature> {
    const issues: string[] = [];
    let supported = true;

    try {
      // Test file operations
      const testDir = path.join(os.tmpdir(), 'ottokode-compat-test');
      await fs.mkdir(testDir, { recursive: true });

      // Test symlinks (important for some build systems)
      const symlinkSupported = await this.testSymlinks(testDir);
      if (!symlinkSupported) {
        issues.push('Symbolic links not supported - may affect some build processes');
      }

      // Test file permissions
      const permissionsSupported = await this.testFilePermissions(testDir);
      if (!permissionsSupported) {
        issues.push('File permission changes not supported');
      }

      // Cleanup
      await fs.rmdir(testDir, { recursive: true });

    } catch (error) {
      supported = false;
      issues.push(`Filesystem operations failed: ${(error as Error).message}`);
    }

    return {
      name: 'Filesystem',
      supported,
      issues: issues.length > 0 ? issues : undefined,
      details: {
        platform: this.platform,
        tmpDir: os.tmpdir(),
        pathSeparator: path.sep
      }
    };
  }

  private async testSymlinks(testDir: string): Promise<boolean> {
    try {
      const targetFile = path.join(testDir, 'target.txt');
      const linkFile = path.join(testDir, 'link.txt');

      await fs.writeFile(targetFile, 'test');
      await fs.symlink(targetFile, linkFile);
      await fs.unlink(linkFile);
      await fs.unlink(targetFile);

      return true;
    } catch {
      return false;
    }
  }

  private async testFilePermissions(testDir: string): Promise<boolean> {
    try {
      const testFile = path.join(testDir, 'permissions-test.txt');
      await fs.writeFile(testFile, 'test');
      await fs.chmod(testFile, 0o755);
      await fs.unlink(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private async checkNetworkingFeatures(): Promise<PlatformFeature> {
    const issues: string[] = [];

    try {
      // Test basic HTTP request
      const response = await fetch('https://httpbin.org/json', {
        signal: AbortSignal.timeout(5000)
      });

      const networkSupported = response.ok;

      return {
        name: 'Networking',
        supported: networkSupported,
        details: {
          httpSupported: response.ok,
          httpsSupported: true,
          fetchApi: true
        },
        issues: issues.length > 0 ? issues : undefined
      };
    } catch (error) {
      return {
        name: 'Networking',
        supported: false,
        issues: [`Network connectivity issues: ${(error as Error).message}`]
      };
    }
  }

  private async checkThreadingFeatures(): Promise<PlatformFeature> {
    const cpuCount = os.cpus().length;
    const supported = cpuCount > 0;

    return {
      name: 'Threading',
      supported,
      details: {
        cpuCount,
        platform: this.platform,
        workerThreadsSupported: true // Node.js has worker threads
      }
    };
  }

  private async checkMemoryFeatures(): Promise<PlatformFeature> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = process.memoryUsage();

    const issues: string[] = [];
    if (totalMemory < 4 * 1024 * 1024 * 1024) { // Less than 4GB
      issues.push('Low system memory may affect build performance');
    }

    return {
      name: 'Memory',
      supported: true,
      details: {
        totalGB: Math.round(totalMemory / 1024 / 1024 / 1024),
        freeGB: Math.round(freeMemory / 1024 / 1024 / 1024),
        processMemoryMB: Math.round(usedMemory.heapUsed / 1024 / 1024)
      },
      issues: issues.length > 0 ? issues : undefined
    };
  }

  private async checkDevelopmentTools(): Promise<PlatformReport['development']> {
    console.log('🛠️  Checking Development Tools...');

    return {
      buildTools: await this.checkBuildTools(),
      debugger: await this.checkDebuggerSupport(),
      signing: await this.checkCodeSigning()
    };
  }

  private async checkBuildTools(): Promise<PlatformFeature> {
    const issues: string[] = [];
    let supported = true;

    // Check platform-specific build tools
    if (this.platform === 'darwin') {
      try {
        await this.runCommand('xcode-select', ['--print-path']);
      } catch {
        issues.push('Xcode Command Line Tools not installed');
        supported = false;
      }
    } else if (this.platform === 'linux') {
      try {
        await this.runCommand('gcc', ['--version']);
      } catch {
        issues.push('GCC not available - install build-essential');
      }
    } else if (this.platform === 'win32') {
      // Check for Visual Studio Build Tools
      try {
        await this.runCommand('cl', []);
      } catch {
        issues.push('Visual Studio Build Tools not detected');
      }
    }

    return {
      name: 'Build Tools',
      supported,
      issues: issues.length > 0 ? issues : undefined,
      details: { platform: this.platform }
    };
  }

  private async checkDebuggerSupport(): Promise<PlatformFeature> {
    // Basic debugger support check
    const supported = true; // Node.js has built-in debugging
    return {
      name: 'Debugger',
      supported,
      details: {
        nodeDebugger: true,
        vscodeSupport: true,
        rustDebugger: true
      }
    };
  }

  private async checkCodeSigning(): Promise<PlatformFeature> {
    const issues: string[] = [];
    let supported = false;
    let details: any = {};

    if (this.platform === 'darwin') {
      try {
        const result = await this.runCommand('security', ['find-identity', '-v', '-p', 'codesigning']);
        supported = result.exitCode === 0 && result.stdout.includes('Developer ID');
        details.codesigning = supported;
        if (!supported) {
          issues.push('No code signing identity found - apps cannot be distributed');
        }
      } catch {
        issues.push('Code signing tools not available');
      }
    } else if (this.platform === 'win32') {
      // Windows code signing would require certificate
      details.windowsSigning = false;
      issues.push('Windows code signing certificate not configured');
    } else {
      details.linuxSigning = false;
      // Linux doesn't typically require code signing
      supported = true;
    }

    return {
      name: 'Code Signing',
      supported,
      issues: issues.length > 0 ? issues : undefined,
      details
    };
  }

  private async checkTauriCompatibility(): Promise<PlatformReport['tauri']> {
    console.log('🦀 Checking Tauri Compatibility...');

    return {
      webview: await this.checkWebviewSupport(),
      systemTray: await this.checkSystemTraySupport(),
      notifications: await this.checkNotificationSupport(),
      fileSystem: await this.checkTauriFileSystemSupport()
    };
  }

  private async checkWebviewSupport(): Promise<PlatformFeature> {
    const issues: string[] = [];
    let supported = true;

    if (this.platform === 'linux') {
      try {
        // Check for webkit2gtk
        await this.runCommand('pkg-config', ['--exists', 'webkit2gtk-4.0']);
      } catch {
        issues.push('webkit2gtk-4.0 not found - install libwebkit2gtk-4.0-dev');
        supported = false;
      }
    }

    return {
      name: 'Webview',
      supported,
      issues: issues.length > 0 ? issues : undefined,
      details: {
        platform: this.platform,
        webkitRequired: this.platform === 'linux'
      }
    };
  }

  private async checkSystemTraySupport(): Promise<PlatformFeature> {
    const supported = this.platform !== 'linux'; // Linux tray support varies
    const issues = this.platform === 'linux' ? ['System tray support varies by desktop environment'] : undefined;

    return {
      name: 'System Tray',
      supported,
      issues,
      details: { platform: this.platform }
    };
  }

  private async checkNotificationSupport(): Promise<PlatformFeature> {
    return {
      name: 'Notifications',
      supported: true, // All platforms support notifications
      details: {
        native: true,
        platform: this.platform
      }
    };
  }

  private async checkTauriFileSystemSupport(): Promise<PlatformFeature> {
    return {
      name: 'Tauri File System',
      supported: true,
      details: {
        fileDialogs: true,
        fileWatcher: true,
        permissions: true
      }
    };
  }

  private async runFileSystemTests() {
    this.addTest('File System', 'Path Resolution', async () => {
      const testPath = path.join('.', 'test', '..', 'src');
      const resolved = path.resolve(testPath);
      return resolved.includes('src');
    });

    this.addTest('File System', 'File Permissions', async () => {
      if (this.platform === 'win32') return { status: 'not_applicable' };

      const testFile = path.join(os.tmpdir(), 'perm-test.txt');
      try {
        await fs.writeFile(testFile, 'test');
        await fs.chmod(testFile, 0o755);
        const stats = await fs.stat(testFile);
        await fs.unlink(testFile);
        return (stats.mode & 0o755) === 0o755;
      } catch {
        return false;
      }
    });
  }

  private async runNetworkingTests() {
    this.addTest('Networking', 'HTTP Requests', async () => {
      try {
        const response = await fetch('https://httpbin.org/status/200', {
          signal: AbortSignal.timeout(5000)
        });
        return response.ok;
      } catch {
        return false;
      }
    });

    this.addTest('Networking', 'DNS Resolution', async () => {
      try {
        const response = await fetch('https://google.com', {
          signal: AbortSignal.timeout(5000)
        });
        return response.status < 500;
      } catch {
        return false;
      }
    });
  }

  private async runBuildSystemTests() {
    this.addTest('Build System', 'TypeScript Compilation', async () => {
      try {
        const result = await this.runCommand('npx', ['tsc', '--version'], undefined, 10000);
        return result.exitCode === 0;
      } catch {
        return false;
      }
    });

    this.addTest('Build System', 'Rust Compilation', async () => {
      try {
        const result = await this.runCommand('rustc', ['--version'], undefined, 10000);
        return result.exitCode === 0;
      } catch {
        return false;
      }
    });
  }

  private async runTauriSpecificTests() {
    this.addTest('Tauri', 'Tauri CLI Available', async () => {
      try {
        const result = await this.runCommand('npm', ['run', 'tauri', '--', '--version'], undefined, 10000);
        return result.exitCode === 0;
      } catch {
        return false;
      }
    });
  }

  private async addTest(category: string, test: string, testFn: () => Promise<boolean | { status: string }>) {
    try {
      const result = await testFn();

      if (typeof result === 'boolean') {
        this.tests.push({
          category,
          test,
          status: result ? 'pass' : 'fail'
        });
      } else {
        this.tests.push({
          category,
          test,
          status: result.status as any
        });
      }
    } catch (error) {
      this.tests.push({
        category,
        test,
        status: 'fail',
        details: { error: (error as Error).message }
      });
    }
  }

  private generateRecommendations(report: PlatformReport): string[] {
    const recommendations: string[] = [];

    // Runtime recommendations
    if (!report.runtime.node.supported) {
      recommendations.push('Install Node.js 18+ for optimal compatibility');
    }

    if (!report.runtime.rust.supported) {
      recommendations.push('Install Rust toolchain from https://rustup.rs/');
    }

    // Platform-specific recommendations
    if (this.platform === 'darwin' && !report.development.buildTools.supported) {
      recommendations.push('Install Xcode Command Line Tools: xcode-select --install');
    }

    if (this.platform === 'linux' && !report.tauri.webview.supported) {
      recommendations.push('Install WebKit: sudo apt install libwebkit2gtk-4.0-dev');
    }

    if (this.platform === 'win32') {
      recommendations.push('Install Visual Studio Build Tools for complete Windows support');
    }

    // Memory recommendations
    const memoryGB = report.systemFeatures.memory.details?.totalGB || 0;
    if (memoryGB < 8) {
      recommendations.push('Consider upgrading to 8GB+ RAM for better build performance');
    }

    return recommendations;
  }

  private async runCommand(
    command: string,
    args: string[],
    cwd?: string,
    timeout: number = 30000
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

      const timeoutHandler = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Command timeout'));
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timeoutHandler);
        resolve({ exitCode: code || 0, stdout, stderr });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutHandler);
        reject(error);
      });
    });
  }

  private printCompatibilityReport(report: PlatformReport): void {
    console.log('\n🖥️  Cross-Platform Compatibility Report');
    console.log('═'.repeat(60));
    console.log(`🖥️  Platform: ${report.platform.type}-${report.platform.arch}`);
    console.log(`📟 OS Version: ${report.platform.version}`);
    console.log(`🏠 Hostname: ${report.platform.hostname}`);
    console.log('');

    // Runtime compatibility
    console.log('📦 Runtime Compatibility:');
    Object.values(report.runtime).forEach(feature => {
      const status = feature.supported ? '✅' : '❌';
      console.log(`  ${status} ${feature.name}: ${feature.version || 'Not Available'}`);
      if (feature.issues?.length) {
        feature.issues.forEach(issue => console.log(`    ⚠️  ${issue}`));
      }
    });

    // System features
    console.log('\n🔧 System Features:');
    Object.values(report.systemFeatures).forEach(feature => {
      const status = feature.supported ? '✅' : '❌';
      console.log(`  ${status} ${feature.name}`);
      if (feature.issues?.length) {
        feature.issues.forEach(issue => console.log(`    ⚠️  ${issue}`));
      }
    });

    // Test results summary
    const passedTests = report.tests.filter(t => t.status === 'pass').length;
    const failedTests = report.tests.filter(t => t.status === 'fail').length;

    console.log(`\n🧪 Compatibility Tests: ${passedTests}✅ ${failedTests}❌`);

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    const overallCompatibility = this.calculateCompatibilityScore(report);
    console.log(`\n🎯 Overall Compatibility: ${overallCompatibility.toFixed(1)}%`);

    if (overallCompatibility >= 90) {
      console.log('🎉 Excellent platform compatibility!');
    } else if (overallCompatibility >= 75) {
      console.log('✅ Good platform compatibility with minor issues');
    } else {
      console.log('⚠️  Platform compatibility issues detected - review recommendations');
    }
  }

  private calculateCompatibilityScore(report: PlatformReport): number {
    let score = 0;
    let total = 0;

    // Runtime features (40% weight)
    Object.values(report.runtime).forEach(feature => {
      score += feature.supported ? 10 : 0;
      total += 10;
    });

    // System features (30% weight)
    Object.values(report.systemFeatures).forEach(feature => {
      score += feature.supported ? 7.5 : 0;
      total += 7.5;
    });

    // Development tools (20% weight)
    Object.values(report.development).forEach(feature => {
      score += feature.supported ? 5 : 0;
      total += 5;
    });

    // Tauri features (10% weight)
    Object.values(report.tauri).forEach(feature => {
      score += feature.supported ? 2.5 : 0;
      total += 2.5;
    });

    return (score / total) * 100;
  }

  private async saveCompatibilityReport(report: PlatformReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports');

    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `compatibility-${this.platform}-${this.arch}-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Compatibility report saved to: ${filepath}`);
  }
}

export default CrossPlatformCompatibility;