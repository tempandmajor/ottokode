#!/usr/bin/env node

/*
  Repo Indexer (Phase 3)
  - Scans source files
  - Chunks content
  - Computes embeddings (OpenAI if OPENAI_API_KEY set, otherwise local dummy)
  - Upserts into Supabase table public.ai_embeddings

  Environment:
  - SUPABASE_URL (required)
  - SUPABASE_SERVICE_KEY (required for write)
  - OPENAI_API_KEY (optional; if absent uses local dummy embeddings)

  Usage:
    node scripts/index-repo.js [--root <path>] [--filter <glob-substr>]
*/

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_DIM = 1536
const ROOT_ARG = process.argv.indexOf('--root')
const FILTER_ARG = process.argv.indexOf('--filter')
const ROOT_DIR = ROOT_ARG > -1 ? process.argv[ROOT_ARG + 1] : process.cwd()
const FILTER_SUBSTR = FILTER_ARG > -1 ? process.argv[FILTER_ARG + 1] : ''

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx', '.yml', '.yaml', '.toml', '.rs', '.go', '.py', '.java', '.kt', '.rb', '.php', '.swift', '.cs', '.css', '.scss', '.html'
])

function listFiles(dir) {
  const out = []
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name)
      if (entry.isDirectory()) {
        // skip node_modules and build dirs
        if (/node_modules|\.next|dist|out|target|build/.test(p)) continue
        walk(p)
      } else {
        const ext = path.extname(entry.name).toLowerCase()
        if (TEXT_EXTENSIONS.has(ext) && (!FILTER_SUBSTR || p.includes(FILTER_SUBSTR))) {
          out.push(p)
        }
      }
    }
  }
  walk(dir)
  return out
}

function chunkText(text, maxChars = 2000) {
  const chunks = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length)
    chunks.push(text.slice(i, end))
    i = end
  }
  return chunks
}

function normalizeSpaces(s) {
  return s.replace(/[\s\u00A0]+/g, ' ').trim()
}

async function embedText(text) {
  const normalized = normalizeSpaces(text)
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: normalized, model: 'text-embedding-3-small' })
    })
    if (!res.ok) throw new Error(`OpenAI embeddings HTTP ${res.status}`)
    const data = await res.json()
    const vec = data?.data?.[0]?.embedding
    if (!Array.isArray(vec)) throw new Error('Invalid embeddings response')
    return vec
  }
  // dummy
  const arr = new Array(DEFAULT_DIM).fill(0)
  let h = 0
  for (let i = 0; i < normalized.length; i++) {
    h = (h * 31 + normalized.charCodeAt(i)) >>> 0
    arr[i % DEFAULT_DIM] = (arr[i % DEFAULT_DIM] + (h % 1000)) / 2
  }
  const max = Math.max(...arr.map(v => Math.abs(v)), 1)
  return arr.map(v => v / max)
}

async function upsertEmbeddings(rows) {
  const { error } = await supabase.from('ai_embeddings').upsert(rows, { onConflict: 'file_path,chunk_index' })
  if (error) throw error
}

async function main() {
  const repoPath = ROOT_DIR
  const files = listFiles(repoPath)
  console.log(`Indexing ${files.length} files...`)

  let total = 0
  for (const f of files) {
    const rel = path.relative(repoPath, f)
    const content = fs.readFileSync(f, 'utf8')
    const chunks = chunkText(content, 2000)
    const rows = []
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i])
      rows.push({ repo_path: repoPath, file_path: rel, chunk_index: i, content: chunks[i], embedding })
    }
    await upsertEmbeddings(rows)
    total += rows.length
    console.log(`Indexed ${rel} (${rows.length} chunks)`)
  }

  await supabase.from('ai_index_status').insert({ last_commit: process.env.GIT_COMMIT || null }).catch(() => {})
  console.log(`Done. Inserted/updated ${total} chunks.`)
}

main().catch(err => {
  console.error('Indexer failed:', err)
  process.exit(1)
})
