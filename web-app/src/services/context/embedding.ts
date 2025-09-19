// Simple, pluggable embedding utility for indexing and retrieval.
// Prefers OpenAI via OPENAI_API_KEY if present; otherwise falls back to a local dummy embedding.

export type EmbeddingModel = 'openai:text-embedding-3-small' | 'openai:text-embedding-3-large' | 'local:dummy-1536'

export interface EmbedOptions {
  model?: EmbeddingModel
}

const DEFAULT_DIM = 1536

function normalizeSpaces(s: string) {
  return s.replace(/[\s\u00A0]+/g, ' ').trim()
}

export async function embedText(text: string, opts: EmbedOptions = {}): Promise<number[]> {
  const normalized = normalizeSpaces(text)
  const model = opts.model ?? (process.env.OPENAI_API_KEY ? 'openai:text-embedding-3-small' : 'local:dummy-1536')

  if (model.startsWith('openai:')) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')
    const openaiModel = model.endsWith('large') ? 'text-embedding-3-large' : 'text-embedding-3-small'

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: normalized,
        model: openaiModel
      })
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`OpenAI embeddings HTTP ${res.status}: ${msg}`)
    }
    const data = await res.json()
    const vec: number[] = data?.data?.[0]?.embedding
    if (!Array.isArray(vec)) throw new Error('Invalid OpenAI embeddings response')
    return vec
  }

  // Fallback: deterministic pseudo-embedding with the correct dimension
  // Note: purely for local/dev usage, not semantically meaningful
  const arr = new Array(DEFAULT_DIM).fill(0)
  let h = 0
  for (let i = 0; i < normalized.length; i++) {
    h = (h * 31 + normalized.charCodeAt(i)) >>> 0
    arr[i % DEFAULT_DIM] = (arr[i % DEFAULT_DIM] + (h % 1000)) / 2
  }
  // scale
  const max = Math.max(...arr.map(v => Math.abs(v)), 1)
  return arr.map(v => v / max)
}
