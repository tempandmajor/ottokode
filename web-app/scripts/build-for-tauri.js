#!/usr/bin/env node

// Script to build web-app for Tauri with proper export configuration
// This ensures consistent behavior across all platforms

const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Building web-app for Tauri...');

// Set environment variable for this process
process.env.TAURI_BUILD = 'true';

try {
  // Run Next build and export directly to ensure a static bundle for Tauri
  // This does not depend on the package.json "export" script configuration
  execSync('npx next build && npx next export', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      TAURI_BUILD: 'true'
    }
  });

  console.log('✅ Web-app build for Tauri completed successfully!');
} catch (error) {
  console.error('❌ Web-app build failed:', error.message);
  process.exit(1);
}