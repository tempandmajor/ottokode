#!/usr/bin/env node

// Script to build web-app for Tauri with proper export configuration
// This ensures consistent behavior across all platforms

const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Building web-app for Tauri...');

// Set environment variable for this process
process.env.TAURI_BUILD = 'true';

try {
  // Produce a static export for Tauri using the modern output: 'export' config
  // The output: 'export' in next.config.js will automatically generate ./out
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      TAURI_BUILD: 'true'
    }
  });

  console.log('✅ Web-app build for Tauri completed successfully!');
  console.log('📁 Static files available in ./out directory');
} catch (error) {
  console.error('❌ Web-app build failed:', error.message);
  process.exit(1);
}