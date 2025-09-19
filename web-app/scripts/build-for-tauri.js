#!/usr/bin/env node

// Script to build web-app for Tauri with proper export configuration
// This ensures consistent behavior across all platforms

const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Building web-app for Tauri...');

// Set environment variable for this process
process.env.TAURI_BUILD = 'true';

try {
  // For Next.js 14 with App Router, we just need to build
  // The static export is handled by next.config.js configuration
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