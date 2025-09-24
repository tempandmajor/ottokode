import IntegrationTestSuite from './IntegrationTestSuite';
import ApiIntegrationTester from './ApiIntegrationTester';
import BuildPipelineValidator from './BuildPipelineValidator';
import CrossPlatformCompatibility from './CrossPlatformCompatibility';
import EnvironmentValidator from './EnvironmentValidator';

import { promises as fs } from 'fs';
import path from 'path';

interface Phase4Report {
  timestamp: Date;
  phase: 'Phase 4: Integration Testing';
  environment: string;
  platform: string;
  duration: number;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
    coverage: number;
  };
  results: {
    integration: any;
    api: any;
    build: any;
    compatibility: any;
    environment: any;
  };
  recommendations: string[];
  readinessScore: number;
  deploymentReady: boolean;
}

interface TestOptions {
  quick?: boolean;
  skipBuild?: boolean;
  skipApi?: boolean;
  skipCompatibility?: boolean;
  skipEnvironment?: boolean;
  verbose?: boolean;
}

export class Phase4TestRunner {
  private startTime: number = 0;
  private options: TestOptions;

  constructor(options: TestOptions = {}) {
    this.options = {
      quick: false,
      skipBuild: false,
      skipApi: false,
      skipCompatibility: false,
      skipEnvironment: false,
      verbose: false,
      ...options
    };
  }

  async runPhase4(): Promise<Phase4Report> {
    console.log('🚀 Starting Phase 4: Integration Testing Suite');
    console.log('═'.repeat(60));
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🖥️  Platform: ${process.platform}-${process.arch}`);
    console.log(`📦 Node: ${process.version}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    if (this.options.quick) {
      console.log('⚡ Running in QUICK mode - some tests will be skipped');
    }

    console.log('\n');

    this.startTime = Date.now();

    const report: Phase4Report = {
      timestamp: new Date(),
      phase: 'Phase 4: Integration Testing',
      environment: process.env.NODE_ENV || 'development',
      platform: `${process.platform}-${process.arch}`,
      duration: 0,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        coverage: 0
      },
      results: {
        integration: null,
        api: null,
        build: null,
        compatibility: null,
        environment: null
      },
      recommendations: [],
      readinessScore: 0,
      deploymentReady: false
    };

    // Run test suites
    try {
      // 1. Environment Validation (always run first)
      if (!this.options.skipEnvironment) {
        console.log('🔍 STEP 1: Environment Validation');
        console.log('─'.repeat(40));
        const envValidator = new EnvironmentValidator();
        report.results.environment = await envValidator.validateEnvironment();
        console.log('');
      }

      // 2. Cross-Platform Compatibility
      if (!this.options.skipCompatibility) {
        console.log('🖥️  STEP 2: Cross-Platform Compatibility');
        console.log('─'.repeat(40));
        const compatibilityTester = new CrossPlatformCompatibility();
        report.results.compatibility = await compatibilityTester.runCompatibilityCheck();
        console.log('');
      }

      // 3. API Integration Tests
      if (!this.options.skipApi) {
        console.log('🔌 STEP 3: API Integration Tests');
        console.log('─'.repeat(40));
        const apiTester = new ApiIntegrationTester();
        await apiTester.runAllApiTests();
        report.results.api = await apiTester.generateApiReport();
        console.log('');
      }

      // 4. Build Pipeline Validation
      if (!this.options.skipBuild && !this.options.quick) {
        console.log('🏗️  STEP 4: Build Pipeline Validation');
        console.log('─'.repeat(40));
        const buildValidator = new BuildPipelineValidator();

        if (this.options.quick) {
          const quickResults = await buildValidator.validateQuickBuild();
          report.results.build = {
            type: 'quick',
            results: quickResults,
            timestamp: new Date()
          };
        } else {
          report.results.build = await buildValidator.validateFullPipeline();
        }
        console.log('');
      }

      // 5. Integration Test Suite (comprehensive)
      console.log('🧪 STEP 5: Integration Test Suite');
      console.log('─'.repeat(40));
      const integrationSuite = new IntegrationTestSuite();
      report.results.integration = await integrationSuite.runAllTests();
      console.log('');

      // Calculate final metrics
      report.duration = Date.now() - this.startTime;
      this.calculateSummary(report);
      this.generateRecommendations(report);
      report.readinessScore = this.calculateReadinessScore(report);
      report.deploymentReady = this.assessDeploymentReadiness(report);

      // Save and display final report
      await this.savePhase4Report(report);
      this.displayFinalReport(report);

    } catch (error) {
      console.error('❌ Phase 4 testing failed:', error);
      throw error;
    }

    return report;
  }

  async runHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    console.log('🏥 Running System Health Check...\n');

    const issues: string[] = [];
    let healthy = true;

    try {
      // Quick environment check
      const envValidator = new EnvironmentValidator();
      const envReport = await envValidator.validateEnvironment();

      if (envReport.score < 75) {
        healthy = false;
        issues.push('Environment configuration issues detected');
      }

      // Quick API health check
      const apiTester = new ApiIntegrationTester();
      const healthStatus = await apiTester.checkApiHealth();

      const unhealthyServices = healthStatus.filter(s => s.status !== 'healthy');
      if (unhealthyServices.length > 0) {
        healthy = false;
        issues.push(`Services down: ${unhealthyServices.map(s => s.service).join(', ')}`);
      }

      // Build health check
      const buildValidator = new BuildPipelineValidator();
      const buildHealth = await buildValidator.checkBuildHealth();

      if (!buildHealth.healthy) {
        healthy = false;
        issues.push(...buildHealth.issues);
      }

      console.log(`🏥 Health Status: ${healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
      if (issues.length > 0) {
        console.log('📋 Issues Found:');
        issues.forEach(issue => console.log(`  • ${issue}`));
      }

    } catch (error) {
      healthy = false;
      issues.push(`Health check failed: ${(error as Error).message}`);
    }

    return { healthy, issues };
  }

  private calculateSummary(report: Phase4Report): void {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // Integration tests
    if (report.results.integration) {
      totalTests += report.results.integration.totalTests;
      passed += report.results.integration.passed;
      failed += report.results.integration.failed;
    }

    // API tests
    if (report.results.api) {
      totalTests += report.results.api.summary.total;
      passed += report.results.api.summary.successful;
      failed += report.results.api.summary.failed;
    }

    // Build tests
    if (report.results.build) {
      totalTests += report.results.build.totalStages || 0;
      passed += report.results.build.successful || 0;
      failed += report.results.build.failed || 0;
    }

    // Environment tests
    if (report.results.environment) {
      const validVars = report.results.environment.variables.filter((v: any) => v.status === 'valid').length;
      const invalidVars = report.results.environment.variables.filter((v: any) => v.status === 'invalid').length;
      const missingVars = report.results.environment.variables.filter((v: any) => v.status === 'missing').length;

      totalTests += validVars + invalidVars + missingVars;
      passed += validVars;
      failed += invalidVars;
      warnings += missingVars;
    }

    // Compatibility tests
    if (report.results.compatibility) {
      const compatTests = report.results.compatibility.tests || [];
      totalTests += compatTests.length;
      passed += compatTests.filter((t: any) => t.status === 'pass').length;
      failed += compatTests.filter((t: any) => t.status === 'fail').length;
      warnings += compatTests.filter((t: any) => t.status === 'warning').length;
    }

    report.summary = {
      totalTests,
      passed,
      failed,
      warnings,
      coverage: totalTests > 0 ? Math.round(((passed + warnings) / totalTests) * 100) : 0
    };
  }

  private generateRecommendations(report: Phase4Report): void {
    const recommendations: string[] = [];

    // Environment recommendations
    if (report.results.environment?.recommendations?.length) {
      recommendations.push(...report.results.environment.recommendations);
    }

    // Compatibility recommendations
    if (report.results.compatibility?.recommendations?.length) {
      recommendations.push(...report.results.compatibility.recommendations);
    }

    // Build recommendations
    if (report.results.build?.failed > 0) {
      recommendations.push('Fix build pipeline failures before deployment');
    }

    // API recommendations
    if (report.results.api?.summary.failed > 0) {
      recommendations.push('Resolve API integration failures');
    }

    // General recommendations based on scores
    if (report.summary.coverage < 80) {
      recommendations.push('Improve test coverage - less than 80% tests passing');
    }

    if (report.results.environment?.security?.secretsExposed) {
      recommendations.push('URGENT: Remove exposed secrets from codebase');
    }

    // Deployment readiness recommendations
    if (!report.deploymentReady) {
      recommendations.push('System not ready for deployment - resolve critical issues first');
    }

    report.recommendations = [...new Set(recommendations)]; // Remove duplicates
  }

  private calculateReadinessScore(report: Phase4Report): number {
    let score = 0;
    let maxScore = 0;

    // Environment score (25%)
    if (report.results.environment) {
      score += (report.results.environment.score / 100) * 25;
    }
    maxScore += 25;

    // API integration score (20%)
    if (report.results.api) {
      const apiSuccessRate = report.results.api.summary.successful /
                            (report.results.api.summary.total || 1);
      score += apiSuccessRate * 20;
    }
    maxScore += 20;

    // Build pipeline score (25%)
    if (report.results.build) {
      const buildSuccessRate = (report.results.build.successful || 0) /
                              (report.results.build.totalStages || 1);
      score += buildSuccessRate * 25;
    }
    maxScore += 25;

    // Compatibility score (15%)
    if (report.results.compatibility) {
      // Use the compatibility score from the report
      const compatScore = this.getCompatibilityScore(report.results.compatibility);
      score += (compatScore / 100) * 15;
    }
    maxScore += 15;

    // Integration tests score (15%)
    if (report.results.integration) {
      const integrationSuccessRate = report.results.integration.passed /
                                   (report.results.integration.totalTests || 1);
      score += integrationSuccessRate * 15;
    }
    maxScore += 15;

    return Math.round((score / maxScore) * 100);
  }

  private getCompatibilityScore(compatReport: any): number {
    // Simple compatibility scoring logic
    let score = 0;
    let total = 0;

    // Runtime features
    if (compatReport.runtime) {
      Object.values(compatReport.runtime).forEach((feature: any) => {
        score += feature.supported ? 1 : 0;
        total += 1;
      });
    }

    // System features
    if (compatReport.systemFeatures) {
      Object.values(compatReport.systemFeatures).forEach((feature: any) => {
        score += feature.supported ? 1 : 0;
        total += 1;
      });
    }

    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  private assessDeploymentReadiness(report: Phase4Report): boolean {
    const criticalChecks = [
      // Environment must be well configured
      report.results.environment?.score >= 75,

      // No exposed secrets
      !report.results.environment?.security?.secretsExposed,

      // Core services must be connected
      report.results.api?.summary.failed === 0 ||
      (report.results.api?.summary.successful / report.results.api?.summary.total) >= 0.8,

      // Build should work (if tested)
      !report.results.build ||
      report.results.build.successful >= report.results.build.failed,

      // Overall test success rate
      report.summary.coverage >= 70
    ];

    return criticalChecks.every(check => check === true);
  }

  private async savePhase4Report(report: Phase4Report): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports');

    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch {}

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `phase4-integration-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 Phase 4 report saved to: ${filepath}`);
  }

  private displayFinalReport(report: Phase4Report): void {
    console.log('🎯 Phase 4: Integration Testing - Final Report');
    console.log('═'.repeat(60));
    console.log(`📅 Completed: ${report.timestamp.toISOString()}`);
    console.log(`⏱️  Duration: ${(report.duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`🖥️  Platform: ${report.platform}`);
    console.log(`🌍 Environment: ${report.environment}`);
    console.log('');

    // Test Summary
    console.log('📊 Test Summary:');
    console.log(`  📝 Total Tests: ${report.summary.totalTests}`);
    console.log(`  ✅ Passed: ${report.summary.passed}`);
    console.log(`  ❌ Failed: ${report.summary.failed}`);
    console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`  📈 Coverage: ${report.summary.coverage}%`);
    console.log('');

    // Readiness Assessment
    console.log('🎯 Readiness Assessment:');
    console.log(`  📊 Readiness Score: ${report.readinessScore}%`);
    console.log(`  🚀 Deployment Ready: ${report.deploymentReady ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Component Scores
    console.log('🔧 Component Status:');
    if (report.results.environment) {
      console.log(`  🔍 Environment: ${report.results.environment.score}% ${report.results.environment.score >= 75 ? '✅' : '❌'}`);
    }
    if (report.results.compatibility) {
      const compatScore = this.getCompatibilityScore(report.results.compatibility);
      console.log(`  🖥️  Compatibility: ${compatScore}% ${compatScore >= 75 ? '✅' : '❌'}`);
    }
    if (report.results.api) {
      const apiRate = Math.round((report.results.api.summary.successful / report.results.api.summary.total) * 100);
      console.log(`  🔌 API Integration: ${apiRate}% ${apiRate >= 80 ? '✅' : '❌'}`);
    }
    if (report.results.build) {
      const buildRate = Math.round((report.results.build.successful / report.results.build.totalStages) * 100);
      console.log(`  🏗️  Build Pipeline: ${buildRate}% ${buildRate >= 80 ? '✅' : '❌'}`);
    }
    if (report.results.integration) {
      const intRate = Math.round((report.results.integration.passed / report.results.integration.totalTests) * 100);
      console.log(`  🧪 Integration Tests: ${intRate}% ${intRate >= 80 ? '✅' : '❌'}`);
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.slice(0, 10).forEach(rec => console.log(`  • ${rec}`));
      if (report.recommendations.length > 10) {
        console.log(`  ... and ${report.recommendations.length - 10} more recommendations (see full report)`);
      }
    }

    // Final Assessment
    console.log('\n' + '═'.repeat(60));
    if (report.deploymentReady && report.readinessScore >= 90) {
      console.log('🎉 EXCELLENT: System is fully ready for production deployment!');
    } else if (report.deploymentReady && report.readinessScore >= 80) {
      console.log('✅ GOOD: System is ready for deployment with minor recommendations');
    } else if (report.readinessScore >= 70) {
      console.log('⚠️  CAUTION: System needs attention before deployment');
    } else {
      console.log('🚨 CRITICAL: System has serious issues - do NOT deploy');
    }

    console.log('');
    console.log('🔄 To re-run specific tests:');
    console.log('  npm run test:integration');
    console.log('  npm run test:api');
    console.log('  npm run test:build');
    console.log('  npm run test:compatibility');
    console.log('  npm run test:environment');
    console.log('');
  }
}

export default Phase4TestRunner;