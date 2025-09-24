#!/usr/bin/env node

/**
 * Phase 4 Integration Testing CLI
 *
 * Usage:
 *   node scripts/run-integration-tests.js [options]
 *
 * Options:
 *   --quick              Run quick tests only
 *   --health             Run health check only
 *   --skip-build         Skip build pipeline tests
 *   --skip-api           Skip API integration tests
 *   --skip-compatibility Skip compatibility tests
 *   --skip-environment   Skip environment validation
 *   --verbose            Enable verbose output
 *   --help               Show help
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  quick: args.includes('--quick'),
  health: args.includes('--health'),
  skipBuild: args.includes('--skip-build'),
  skipApi: args.includes('--skip-api'),
  skipCompatibility: args.includes('--skip-compatibility'),
  skipEnvironment: args.includes('--skip-environment'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help')
};

function showHelp() {
  console.log(`
🚀 Phase 4: Integration Testing Suite

Usage: npm run test:integration [options]

Options:
  --quick              Run quick tests only (faster, fewer tests)
  --health             Run system health check only
  --skip-build         Skip build pipeline validation
  --skip-api           Skip API integration tests
  --skip-compatibility Skip cross-platform compatibility tests
  --skip-environment   Skip environment validation
  --verbose            Enable verbose output
  --help               Show this help message

Examples:
  npm run test:integration                    # Run all tests
  npm run test:integration -- --quick         # Quick test run
  npm run test:integration -- --health        # Health check only
  npm run test:integration -- --skip-build    # Skip build tests

Test Categories:
  🔍 Environment Validation    - Check env vars, config files, security
  🖥️  Cross-Platform Compat    - Test platform-specific features
  🔌 API Integration          - Test external service connections
  🏗️  Build Pipeline          - Validate build process and tools
  🧪 Integration Tests        - Comprehensive system tests

Reports are saved to: ./test-reports/
  `);
}

if (options.help) {
  showHelp();
  process.exit(0);
}

// Create the test runner script
const testScript = `
const Phase4TestRunner = require('./dist/services/testing/Phase4TestRunner').default;

async function main() {
  try {
    const runner = new Phase4TestRunner({
      quick: ${options.quick},
      skipBuild: ${options.skipBuild},
      skipApi: ${options.skipApi},
      skipCompatibility: ${options.skipCompatibility},
      skipEnvironment: ${options.skipEnvironment},
      verbose: ${options.verbose}
    });

    if (${options.health}) {
      console.log('🏥 Running Health Check...');
      const healthResult = await runner.runHealthCheck();

      if (!healthResult.healthy) {
        console.error('❌ Health check failed');
        process.exit(1);
      }

      console.log('✅ System is healthy');
      process.exit(0);
    } else {
      console.log('🚀 Starting Phase 4 Integration Tests...');
      const report = await runner.runPhase4();

      if (!report.deploymentReady) {
        console.error('❌ System not ready for deployment');
        process.exit(1);
      }

      console.log('✅ All tests completed successfully');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    if (${options.verbose}) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
`;

// First, ensure TypeScript is compiled
console.log('📦 Compiling TypeScript...');
const tscProcess = spawn('npx', ['tsc'], {
  stdio: 'inherit',
  shell: true
});

tscProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
  }

  console.log('✅ TypeScript compiled successfully');
  console.log('');

  // Run the test script
  const testProcess = spawn('node', ['-e', testScript], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'test' }
  });

  testProcess.on('close', (code) => {
    process.exit(code);
  });

  testProcess.on('error', (error) => {
    console.error('❌ Failed to run tests:', error.message);
    process.exit(1);
  });
});

tscProcess.on('error', (error) => {
  console.error('❌ Failed to compile TypeScript:', error.message);
  process.exit(1);
});