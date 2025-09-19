#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = process.cwd();
const CHUNK_SIZE = 2000;
const EMBEDDING_DIM = 1536;

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx',
  '.yml', '.yaml', '.toml', '.rs', '.go', '.py', '.css'
]);

// Simple file discovery
function findFiles(dir) {
  const files = [];

  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip common build/cache directories
          if (!/node_modules|\.next|dist|out|target|build|\.git/.test(entry.name)) {
            walk(fullPath);
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (TEXT_EXTENSIONS.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      console.warn(`Skipping directory ${currentDir}: ${err.message}`);
    }
  }

  walk(dir);
  return files;
}

// Simple text chunking
function chunkText(text, maxChars = CHUNK_SIZE) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length);
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}

// Generate deterministic dummy embeddings
function generateDummyEmbedding(text) {
  const normalized = text.replace(/[\s\u00A0]+/g, ' ').trim();
  const arr = new Array(EMBEDDING_DIM).fill(0);

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
    arr[i % EMBEDDING_DIM] = (arr[i % EMBEDDING_DIM] + (hash % 1000)) / 2;
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(arr.reduce((sum, val) => sum + val * val, 0)) || 1;
  return arr.map(val => val / magnitude);
}

function generateInsertSQL(chunks) {
  const values = chunks.map(chunk => {
    const embeddingStr = JSON.stringify(chunk.embedding);
    return `(
      '${chunk.repo_path.replace(/'/g, "''")}',
      '${chunk.file_path.replace(/'/g, "''")}',
      ${chunk.chunk_index},
      $chunk_content_${chunk.id}$${chunk.content.replace(/\$/g, '$$')}$chunk_content_${chunk.id}$,
      '${embeddingStr}'::vector
    )`;
  }).join(',\n    ');

  return `INSERT INTO public.ai_embeddings (repo_path, file_path, chunk_index, content, embedding)
VALUES
    ${values}
ON CONFLICT (file_path, chunk_index)
DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    created_at = now();`;
}

async function main() {
  console.log('🔍 Discovering files...');
  const files = findFiles(ROOT_DIR);
  console.log(`Found ${files.length} files to index`);

  const allChunks = [];
  let chunkId = 0;

  // Process files in batches
  for (const filePath of files.slice(0, 20)) { // Limit to first 20 files for testing
    try {
      const relativePath = path.relative(ROOT_DIR, filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const chunks = chunkText(content, CHUNK_SIZE);

      console.log(`📄 Processing ${relativePath} (${chunks.length} chunks)`);

      for (let i = 0; i < chunks.length; i++) {
        const embedding = generateDummyEmbedding(chunks[i]);
        allChunks.push({
          id: chunkId++,
          repo_path: ROOT_DIR,
          file_path: relativePath,
          chunk_index: i,
          content: chunks[i],
          embedding: embedding
        });
      }
    } catch (err) {
      console.warn(`⚠️  Skipping ${filePath}: ${err.message}`);
    }
  }

  // Write SQL to file for manual execution
  const sql = generateInsertSQL(allChunks);
  fs.writeFileSync('/Users/emmanuelakangbou/ai-ide/embeddings-insert.sql', sql);

  console.log(`✅ Generated SQL with ${allChunks.length} embeddings`);
  console.log(`📝 SQL written to embeddings-insert.sql`);
  console.log(`🔧 You can now execute this SQL in Supabase or via MCP`);
}

main().catch(console.error);