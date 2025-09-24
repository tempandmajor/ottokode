import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

interface EnvVariable {
  name: string;
  required: boolean;
  category: 'database' | 'ai' | 'build' | 'security' | 'runtime';
  description: string;
  validationPattern?: RegExp;
  transformValue?: (value: string) => any;
}

interface ValidationResult {
  variable: string;
  status: 'valid' | 'invalid' | 'missing' | 'warning';
  value?: string | boolean;
  error?: string;
  recommendations?: string[];
}

interface ConfigFile {
  path: string;
  required: boolean;
  description: string;
  validator?: (content: string) => Promise<{ valid: boolean; issues?: string[] }>;
}

interface EnvironmentReport {
  timestamp: Date;
  environment: string;
  platform: string;
  nodeVersion: string;
  variables: ValidationResult[];
  configFiles: { [key: string]: any };
  services: {
    supabase: { connected: boolean; details?: any; error?: string };
    openai: { connected: boolean; details?: any; error?: string };
    local: { running: boolean; details?: any; error?: string };
  };
  security: {
    secretsExposed: boolean;
    tlsEnabled: boolean;
    corsConfigured: boolean;
    issues: string[];
  };
  recommendations: string[];
  score: number;
}

export class EnvironmentValidator {
  private envVariables: EnvVariable[] = [
    // Database
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      required: true,
      category: 'database',
      description: 'Supabase project URL',
      validationPattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      required: true,
      category: 'database',
      description: 'Supabase anonymous key',
      validationPattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      required: false,
      category: 'database',
      description: 'Supabase service role key (for admin operations)',
      validationPattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
    },

    // AI Services
    {
      name: 'OPENAI_API_KEY',
      required: true,
      category: 'ai',
      description: 'OpenAI API key',
      validationPattern: /^sk-[A-Za-z0-9]+$/
    },
    {
      name: 'OPENAI_ORG_ID',
      required: false,
      category: 'ai',
      description: 'OpenAI organization ID',
      validationPattern: /^org-[A-Za-z0-9]+$/
    },

    // Runtime
    {
      name: 'NODE_ENV',
      required: false,
      category: 'runtime',
      description: 'Node.js environment',
      validationPattern: /^(development|production|test)$/
    },
    {
      name: 'PORT',
      required: false,
      category: 'runtime',
      description: 'Application port',
      validationPattern: /^\d{3,5}$/,
      transformValue: (value: string) => parseInt(value)
    },

    // Security
    {
      name: 'NEXTAUTH_SECRET',
      required: false,
      category: 'security',
      description: 'NextAuth.js secret',
      validationPattern: /^.{32,}$/
    },
    {
      name: 'JWT_SECRET',
      required: false,
      category: 'security',
      description: 'JWT signing secret',
      validationPattern: /^.{32,}$/
    },

    // Build
    {
      name: 'TAURI_PRIVATE_KEY',
      required: false,
      category: 'build',
      description: 'Tauri code signing private key'
    },
    {
      name: 'TAURI_KEY_PASSWORD',
      required: false,
      category: 'build',
      description: 'Tauri private key password'
    }
  ];

  private configFiles: ConfigFile[] = [
    {
      path: '.env',
      required: false,
      description: 'Environment variables file',
      validator: this.validateEnvFile.bind(this)
    },
    {
      path: '.env.local',
      required: false,
      description: 'Local environment overrides'
    },
    {
      path: '.env.production',
      required: false,
      description: 'Production environment variables'
    },
    {
      path: 'next.config.js',
      required: true,
      description: 'Next.js configuration',
      validator: this.validateNextConfig.bind(this)
    },
    {
      path: 'src-tauri/tauri.conf.json',
      required: true,
      description: 'Tauri configuration',
      validator: this.validateTauriConfig.bind(this)
    },
    {
      path: 'tsconfig.json',
      required: true,
      description: 'TypeScript configuration',
      validator: this.validateTsConfig.bind(this)
    },
    {
      path: 'package.json',
      required: true,
      description: 'Node.js package configuration',
      validator: this.validatePackageJson.bind(this)
    }
  ];

  async validateEnvironment(): Promise<EnvironmentReport> {
    console.log('🔍 Starting Environment Validation...\n');

    const report: EnvironmentReport = {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      platform: `${process.platform}-${process.arch}`,
      nodeVersion: process.version,
      variables: [],
      configFiles: {},
      services: {
        supabase: { connected: false },
        openai: { connected: false },
        local: { running: false }
      },
      security: {
        secretsExposed: false,
        tlsEnabled: false,
        corsConfigured: false,
        issues: []
      },
      recommendations: [],
      score: 0
    };

    // Validate environment variables
    report.variables = await this.validateEnvironmentVariables();

    // Validate configuration files
    report.configFiles = await this.validateConfigurationFiles();

    // Test service connections
    report.services = await this.testServiceConnections();

    // Security assessment
    report.security = await this.performSecurityAssessment();

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    // Calculate environment score
    report.score = this.calculateEnvironmentScore(report);

    this.printEnvironmentReport(report);
    await this.saveEnvironmentReport(report);

    return report;
  }

  private async validateEnvironmentVariables(): Promise<ValidationResult[]> {
    console.log('📋 Validating Environment Variables...');

    const results: ValidationResult[] = [];

    for (const envVar of this.envVariables) {
      const value = process.env[envVar.name];
      const result: ValidationResult = {
        variable: envVar.name,
        status: 'missing',
        recommendations: []
      };

      if (!value) {
        if (envVar.required) {
          result.status = 'missing';
          result.error = `Required environment variable ${envVar.name} is not set`;
          result.recommendations!.push(`Set ${envVar.name}: ${envVar.description}`);
        } else {
          result.status = 'missing';
          result.recommendations!.push(`Optional: ${envVar.description}`);
        }
      } else {
        // Validate the value
        if (envVar.validationPattern && !envVar.validationPattern.test(value)) {
          result.status = 'invalid';
          result.error = `Invalid format for ${envVar.name}`;
          result.value = value.substring(0, 10) + '...'; // Show partial value
          result.recommendations!.push(`Check the format of ${envVar.name}`);
        } else {
          result.status = 'valid';
          result.value = envVar.name.toLowerCase().includes('secret') ||
                         envVar.name.toLowerCase().includes('key') ||
                         envVar.name.toLowerCase().includes('password')
            ? '***HIDDEN***'
            : (envVar.transformValue ? envVar.transformValue(value) : value);
        }
      }

      results.push(result);

      const status = result.status === 'valid' ? '✅' :
                    result.status === 'invalid' ? '❌' :
                    result.status === 'missing' && envVar.required ? '❌' : '⚠️';
      console.log(`  ${status} ${envVar.name}: ${result.status}`);
    }

    return results;
  }

  private async validateConfigurationFiles(): Promise<{ [key: string]: any }> {
    console.log('\n📁 Validating Configuration Files...');

    const results: { [key: string]: any } = {};

    for (const configFile of this.configFiles) {
      console.log(`  🔍 Checking ${configFile.path}...`);

      try {
        const exists = await this.fileExists(configFile.path);

        if (!exists) {
          if (configFile.required) {
            results[configFile.path] = {
              exists: false,
              required: true,
              error: `Required configuration file ${configFile.path} not found`
            };
            console.log(`    ❌ Missing (required)`);
          } else {
            results[configFile.path] = {
              exists: false,
              required: false,
              status: 'optional'
            };
            console.log(`    ⚠️  Missing (optional)`);
          }
          continue;
        }

        const content = await fs.readFile(configFile.path, 'utf-8');
        const validation = configFile.validator
          ? await configFile.validator(content)
          : { valid: true };

        results[configFile.path] = {
          exists: true,
          valid: validation.valid,
          issues: validation.issues || [],
          size: content.length,
          lines: content.split('\n').length
        };

        console.log(`    ${validation.valid ? '✅' : '❌'} ${validation.valid ? 'Valid' : 'Issues found'}`);
        if (validation.issues?.length) {
          validation.issues.forEach(issue => console.log(`      • ${issue}`));
        }

      } catch (error) {
        results[configFile.path] = {
          exists: false,
          error: (error as Error).message
        };
        console.log(`    ❌ Error: ${(error as Error).message}`);
      }
    }

    return results;
  }

  private async testServiceConnections(): Promise<EnvironmentReport['services']> {
    console.log('\n🔌 Testing Service Connections...');

    const services = {
      supabase: { connected: false },
      openai: { connected: false },
      local: { running: false }
    } as EnvironmentReport['services'];

    // Test Supabase
    console.log('  🗄️  Testing Supabase connection...');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const client = createClient(supabaseUrl, supabaseKey);
        const { error } = await client.from('ai_patches').select('count').limit(1);

        services.supabase = {
          connected: !error || error.message.includes('permission'),
          details: {
            url: supabaseUrl,
            hasPermissions: !error,
            error: error?.message
          },
          error: error && !error.message.includes('permission') ? error.message : undefined
        };

        console.log(`    ${services.supabase.connected ? '✅' : '❌'} Supabase`);
      } else {
        services.supabase = {
          connected: false,
          error: 'Missing Supabase credentials'
        };
        console.log('    ❌ Supabase - Missing credentials');
      }
    } catch (error) {
      services.supabase = {
        connected: false,
        error: (error as Error).message
      };
      console.log(`    ❌ Supabase - ${(error as Error).message}`);
    }

    // Test OpenAI
    console.log('  🤖 Testing OpenAI connection...');
    try {
      const openaiKey = process.env.OPENAI_API_KEY;

      if (openaiKey) {
        const client = new OpenAI({ apiKey: openaiKey });
        const response = await client.models.list();

        services.openai = {
          connected: true,
          details: {
            modelsCount: response.data.length,
            hasGPT4: response.data.some(m => m.id.includes('gpt-4')),
            hasGPT35: response.data.some(m => m.id.includes('gpt-3.5'))
          }
        };

        console.log('    ✅ OpenAI');
      } else {
        services.openai = {
          connected: false,
          error: 'Missing OpenAI API key'
        };
        console.log('    ❌ OpenAI - Missing API key');
      }
    } catch (error) {
      services.openai = {
        connected: false,
        error: (error as Error).message
      };
      console.log(`    ❌ OpenAI - ${(error as Error).message}`);
    }

    // Test local services
    console.log('  🏠 Testing local services...');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000)
      });

      services.local = {
        running: response.ok,
        details: {
          status: response.status,
          url: baseUrl,
          responseTime: Date.now()
        }
      };

      console.log(`    ${services.local.running ? '✅' : '❌'} Local API`);
    } catch (error) {
      services.local = {
        running: false,
        error: (error as Error).message
      };
      console.log(`    ❌ Local API - ${(error as Error).message}`);
    }

    return services;
  }

  private async performSecurityAssessment(): Promise<EnvironmentReport['security']> {
    console.log('\n🔒 Performing Security Assessment...');

    const security: EnvironmentReport['security'] = {
      secretsExposed: false,
      tlsEnabled: false,
      corsConfigured: false,
      issues: []
    };

    // Check for exposed secrets in code
    const secretPatterns = [
      /sk-[A-Za-z0-9]{48}/, // OpenAI keys
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT tokens
      /\b[A-Za-z0-9]{32,}\b/, // Generic secrets
    ];

    try {
      const srcFiles = await this.findSourceFiles();
      for (const file of srcFiles) {
        const content = await fs.readFile(file, 'utf-8');
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            security.secretsExposed = true;
            security.issues.push(`Potential secret exposed in ${file}`);
          }
        }
      }
    } catch (error) {
      security.issues.push('Could not scan for exposed secrets');
    }

    // Check TLS configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    security.tlsEnabled = !!(supabaseUrl?.startsWith('https://'));

    if (!security.tlsEnabled) {
      security.issues.push('TLS not enabled for database connections');
    }

    // Check CORS configuration
    try {
      const nextConfigExists = await this.fileExists('next.config.js');
      if (nextConfigExists) {
        const nextConfig = await fs.readFile('next.config.js', 'utf-8');
        security.corsConfigured = nextConfig.includes('cors') || nextConfig.includes('headers');
      }
    } catch {}

    console.log(`  ${!security.secretsExposed ? '✅' : '❌'} No exposed secrets`);
    console.log(`  ${security.tlsEnabled ? '✅' : '❌'} TLS enabled`);
    console.log(`  ${security.corsConfigured ? '✅' : '⚠️'} CORS configured`);

    return security;
  }

  private generateRecommendations(report: EnvironmentReport): string[] {
    const recommendations: string[] = [];

    // Missing required variables
    const missingRequired = report.variables.filter(v =>
      v.status === 'missing' &&
      this.envVariables.find(e => e.name === v.variable)?.required
    );

    if (missingRequired.length > 0) {
      recommendations.push('Set required environment variables: ' +
        missingRequired.map(v => v.variable).join(', '));
    }

    // Invalid variables
    const invalidVars = report.variables.filter(v => v.status === 'invalid');
    if (invalidVars.length > 0) {
      recommendations.push('Fix invalid environment variable formats');
    }

    // Service connections
    if (!report.services.supabase.connected) {
      recommendations.push('Fix Supabase connection - check credentials and network');
    }

    if (!report.services.openai.connected) {
      recommendations.push('Fix OpenAI connection - verify API key');
    }

    // Security issues
    if (report.security.secretsExposed) {
      recommendations.push('URGENT: Remove exposed secrets from source code');
    }

    if (!report.security.tlsEnabled) {
      recommendations.push('Enable TLS/HTTPS for all external connections');
    }

    // Configuration files
    Object.entries(report.configFiles).forEach(([file, config]: [string, any]) => {
      if (!config.exists && config.required) {
        recommendations.push(`Create required configuration file: ${file}`);
      }
      if (config.exists && !config.valid) {
        recommendations.push(`Fix issues in ${file}`);
      }
    });

    // Environment-specific recommendations
    if (report.environment === 'production') {
      recommendations.push('Verify all production environment variables are set');
      recommendations.push('Ensure logging and monitoring are configured');
    }

    return recommendations;
  }

  private calculateEnvironmentScore(report: EnvironmentReport): number {
    let score = 0;
    let maxScore = 0;

    // Environment variables (30 points)
    const validVars = report.variables.filter(v => v.status === 'valid').length;
    const requiredVars = this.envVariables.filter(v => v.required).length;
    score += Math.min(30, (validVars / this.envVariables.length) * 30);
    maxScore += 30;

    // Service connections (25 points)
    if (report.services.supabase.connected) score += 10;
    if (report.services.openai.connected) score += 10;
    if (report.services.local.running) score += 5;
    maxScore += 25;

    // Configuration files (25 points)
    const validConfigs = Object.values(report.configFiles)
      .filter((config: any) => config.exists && config.valid !== false).length;
    score += (validConfigs / this.configFiles.length) * 25;
    maxScore += 25;

    // Security (20 points)
    if (!report.security.secretsExposed) score += 10;
    if (report.security.tlsEnabled) score += 5;
    if (report.security.corsConfigured) score += 3;
    if (report.security.issues.length === 0) score += 2;
    maxScore += 20;

    return Math.round((score / maxScore) * 100);
  }

  private async validateEnvFile(content: string): Promise<{ valid: boolean; issues?: string[] }> {
    const issues: string[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line && !line.startsWith('#') && !line.includes('=')) {
        issues.push(`Line ${i + 1}: Invalid format, should be KEY=VALUE`);
      }

      if (line.includes(' = ') || line.match(/^\w+\s+=/)) {
        issues.push(`Line ${i + 1}: No spaces around = allowed`);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  private async validateNextConfig(content: string): Promise<{ valid: boolean; issues?: string[] }> {
    const issues: string[] = [];

    if (!content.includes('module.exports')) {
      issues.push('Should export configuration with module.exports');
    }

    return { valid: issues.length === 0, issues };
  }

  private async validateTauriConfig(content: string): Promise<{ valid: boolean; issues?: string[] }> {
    const issues: string[] = [];

    try {
      const config = JSON.parse(content);

      if (!config.package) {
        issues.push('Missing package configuration');
      }

      if (!config.tauri) {
        issues.push('Missing tauri configuration');
      }

    } catch (error) {
      issues.push('Invalid JSON format');
    }

    return { valid: issues.length === 0, issues };
  }

  private async validateTsConfig(content: string): Promise<{ valid: boolean; issues?: string[] }> {
    const issues: string[] = [];

    try {
      const config = JSON.parse(content);

      if (!config.compilerOptions) {
        issues.push('Missing compilerOptions');
      }

    } catch (error) {
      issues.push('Invalid JSON format');
    }

    return { valid: issues.length === 0, issues };
  }

  private async validatePackageJson(content: string): Promise<{ valid: boolean; issues?: string[] }> {
    const issues: string[] = [];

    try {
      const pkg = JSON.parse(content);

      if (!pkg.name) issues.push('Missing name field');
      if (!pkg.version) issues.push('Missing version field');
      if (!pkg.scripts) issues.push('Missing scripts field');
      if (!pkg.dependencies && !pkg.devDependencies) {
        issues.push('No dependencies defined');
      }

    } catch (error) {
      issues.push('Invalid JSON format');
    }

    return { valid: issues.length === 0, issues };
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];

    const searchDirs = ['src', 'web-app/src', 'pages', 'components'];

    for (const dir of searchDirs) {
      try {
        const dirExists = await this.fileExists(dir);
        if (dirExists) {
          const dirFiles = await this.getFilesRecursive(dir, /\.(js|ts|jsx|tsx)$/);
          files.push(...dirFiles);
        }
      } catch {}
    }

    return files;
  }

  private async getFilesRecursive(dir: string, pattern: RegExp): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          const subFiles = await this.getFilesRecursive(fullPath, pattern);
          files.push(...subFiles);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {}

    return files;
  }

  private printEnvironmentReport(report: EnvironmentReport): void {
    console.log('\n🔍 Environment Validation Report');
    console.log('═'.repeat(60));
    console.log(`🌍 Environment: ${report.environment}`);
    console.log(`🖥️  Platform: ${report.platform}`);
    console.log(`📦 Node.js: ${report.nodeVersion}`);
    console.log(`📊 Environment Score: ${report.score}%`);
    console.log('');

    // Environment variables summary
    const validVars = report.variables.filter(v => v.status === 'valid').length;
    const invalidVars = report.variables.filter(v => v.status === 'invalid').length;
    const missingVars = report.variables.filter(v => v.status === 'missing').length;

    console.log('📋 Environment Variables:');
    console.log(`  ✅ Valid: ${validVars}`);
    console.log(`  ❌ Invalid: ${invalidVars}`);
    console.log(`  ⚠️  Missing: ${missingVars}`);

    // Service connections
    console.log('\n🔌 Service Connections:');
    console.log(`  Supabase: ${report.services.supabase.connected ? '✅' : '❌'}`);
    console.log(`  OpenAI: ${report.services.openai.connected ? '✅' : '❌'}`);
    console.log(`  Local API: ${report.services.local.running ? '✅' : '❌'}`);

    // Security status
    console.log('\n🔒 Security Status:');
    console.log(`  Secrets Safe: ${!report.security.secretsExposed ? '✅' : '❌'}`);
    console.log(`  TLS Enabled: ${report.security.tlsEnabled ? '✅' : '❌'}`);
    console.log(`  CORS Configured: ${report.security.corsConfigured ? '✅' : '⚠️'}`);

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    // Overall status
    console.log('\n🎯 Overall Status:');
    if (report.score >= 90) {
      console.log('🎉 Environment is excellently configured!');
    } else if (report.score >= 75) {
      console.log('✅ Environment is well configured with minor issues');
    } else if (report.score >= 50) {
      console.log('⚠️  Environment needs attention - several issues found');
    } else {
      console.log('🚨 Environment has critical issues - immediate attention required');
    }
  }

  private async saveEnvironmentReport(report: EnvironmentReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports');

    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `environment-${report.environment}-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    // Remove sensitive values before saving
    const reportCopy = JSON.parse(JSON.stringify(report));
    reportCopy.variables.forEach((v: any) => {
      if (typeof v.value === 'string' && v.value !== '***HIDDEN***') {
        if (v.variable.toLowerCase().includes('key') ||
            v.variable.toLowerCase().includes('secret') ||
            v.variable.toLowerCase().includes('password')) {
          v.value = '***HIDDEN***';
        }
      }
    });

    await fs.writeFile(filepath, JSON.stringify(reportCopy, null, 2));
    console.log(`📄 Environment report saved to: ${filepath}`);
  }
}

export default EnvironmentValidator;