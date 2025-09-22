#!/usr/bin/env node

/**
 * Script to replace console.log statements with centralized logging
 * Run this script to automatically update console statements in production code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Directories to process
const targetDirs = [
  'src/services',
  'src/components',
  'src/lib',
  'web-app/src/services',
  'web-app/src/components',
  'web-app/src/lib'
];

// File extensions to process
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

// Console methods to replace
const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'];

function replaceConsoleInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content;

  // Check if file already imports logger
  const hasLoggerImport = content.includes("from '@ottokode/shared'") &&
                         content.includes('logger');

  // Add logger import if not present and console statements exist
  const hasConsole = consoleMethods.some(method =>
    content.includes(`console.${method}`)
  );

  if (hasConsole && !hasLoggerImport) {
    // Add import at the top after other imports
    const lines = content.split('\n');
    let importIndex = -1;

    // Find last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        importIndex = i;
      }
    }

    if (importIndex >= 0) {
      lines.splice(importIndex + 1, 0, "import { logger } from '@ottokode/shared';");
      newContent = lines.join('\n');
      modified = true;
    }
  }

  // Replace console statements
  consoleMethods.forEach(method => {
    const regex = new RegExp(`console\\.${method}\\(([^;]+)\\);?`, 'g');
    const replacement = `logger.${method === 'log' ? 'info' : method}($1);`;

    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated: ${filePath}`);
    return true;
  }

  return false;
}

function processDirectory(dirPath) {
  const fullPath = path.resolve(projectRoot, dirPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return 0;
  }

  let filesProcessed = 0;
  const files = fs.readdirSync(fullPath, { withFileTypes: true });

  files.forEach(file => {
    const filePath = path.join(fullPath, file.name);

    if (file.isDirectory()) {
      // Recursively process subdirectories
      const subDirRelative = path.join(dirPath, file.name);
      filesProcessed += processDirectory(subDirRelative);
    } else if (file.isFile() && extensions.some(ext => file.name.endsWith(ext))) {
      if (replaceConsoleInFile(filePath)) {
        filesProcessed++;
      }
    }
  });

  return filesProcessed;
}

function main() {
  console.log('🔧 Replacing console statements with centralized logging...\n');

  let totalFilesProcessed = 0;

  targetDirs.forEach(dir => {
    console.log(`Processing directory: ${dir}`);
    const count = processDirectory(dir);
    totalFilesProcessed += count;
    console.log(`  - Updated ${count} files\n`);
  });

  console.log(`✅ Complete! Updated ${totalFilesProcessed} files total.`);

  if (totalFilesProcessed > 0) {
    console.log('\n📝 Next steps:');
    console.log('1. Review the changes with git diff');
    console.log('2. Test the application to ensure logging works correctly');
    console.log('3. Run npm run build to verify no compilation errors');
  }
}

main();