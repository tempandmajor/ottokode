#!/usr/bin/env node
/**
 * Unified build script for the entire project
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logStep(step, color = COLORS.cyan) {
  log(`\n🔧 ${step}`, `${COLORS.bright}${color}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.green);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.red);
}

function logWarning(message) {
  log(`⚠️ ${message}`, COLORS.yellow);
}

function run(command, options = {}) {
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options,
    });
    return output;
  } catch (error) {
    logError(`Command failed: ${command}`);
    logError(error.message);
    process.exit(1);
  }
}

function checkEnvironment() {
  logStep('Checking environment');

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    logError(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
    process.exit(1);
  }
  logSuccess(`Node.js version: ${nodeVersion}`);

  // Check if npm workspaces are supported
  try {
    run('npm --version', { stdio: 'pipe' });
    logSuccess('npm is available');
  } catch {
    logError('npm is not available');
    process.exit(1);
  }

  // Check workspace structure
  const workspaces = ['shared', 'web-app'];
  for (const workspace of workspaces) {
    if (!existsSync(workspace)) {
      logError(`Workspace ${workspace} not found`);
      process.exit(1);
    }
  }
  logSuccess('All workspaces found');
}

function installDependencies() {
  logStep('Installing dependencies');
  run('npm install');
  logSuccess('Dependencies installed');
}

function buildShared() {
  logStep('Building shared package');
  run('npm run build --workspace=shared');
  logSuccess('Shared package built');
}

function buildWebApp(target = 'web') {
  logStep(`Building web app for ${target}`);

  if (target === 'tauri') {
    run('npm run build:tauri --workspace=web-app');
  } else {
    run('npm run build --workspace=web-app');
  }

  logSuccess(`Web app built for ${target}`);
}

function buildDesktop() {
  logStep('Building desktop app');
  run('npm run tauri:build');
  logSuccess('Desktop app built');
}

function typeCheck() {
  logStep('Type checking');
  try {
    run('npm run type-check');
    logSuccess('Type checking passed');
  } catch {
    logWarning('Type checking failed - continuing anyway');
  }
}

function lint() {
  logStep('Linting');
  try {
    run('npm run lint');
    logSuccess('Linting passed');
  } catch {
    logWarning('Linting failed - continuing anyway');
  }
}

function clean() {
  logStep('Cleaning build artifacts');
  run('npm run clean');
  logSuccess('Build artifacts cleaned');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'build';
  const target = args[1] || 'web';

  log(`${COLORS.bright}${COLORS.magenta}🚀 Ottokode Build Script${COLORS.reset}`);
  log(`Building for: ${target}`);

  switch (command) {
    case 'clean':
      clean();
      break;

    case 'install':
      checkEnvironment();
      installDependencies();
      break;

    case 'shared':
      checkEnvironment();
      buildShared();
      break;

    case 'web':
      checkEnvironment();
      buildShared();
      buildWebApp('web');
      break;

    case 'tauri':
      checkEnvironment();
      buildShared();
      buildWebApp('tauri');
      break;

    case 'desktop':
      checkEnvironment();
      buildShared();
      buildWebApp('tauri');
      buildDesktop();
      break;

    case 'build':
      checkEnvironment();
      installDependencies();
      buildShared();
      typeCheck();
      lint();

      if (target === 'desktop') {
        buildWebApp('tauri');
        buildDesktop();
      } else {
        buildWebApp('web');
      }
      break;

    case 'help':
      log(`
Usage: node scripts/build.js [command] [target]

Commands:
  build      Complete build process (default)
  clean      Clean build artifacts
  install    Install dependencies
  shared     Build shared package only
  web        Build web app only
  tauri      Build web app for Tauri
  desktop    Build complete desktop app
  help       Show this help

Targets:
  web        Web application (default)
  desktop    Desktop application

Examples:
  node scripts/build.js build web      # Build web app
  node scripts/build.js build desktop  # Build desktop app
  node scripts/build.js clean          # Clean artifacts
      `);
      break;

    default:
      logError(`Unknown command: ${command}`);
      logError('Run "node scripts/build.js help" for usage information');
      process.exit(1);
  }

  log(`\n${COLORS.bright}${COLORS.green}🎉 Build completed successfully!${COLORS.reset}`);
}

main();