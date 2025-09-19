import { createClient } from '@supabase/supabase-js'

// Lightweight client for serverless/browser use. For write ops, use a server key.
// This module is for read-only retrieval via the RPC `match_ai_embeddings`.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[retriever] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : undefined

export type RetrievedChunk = {
  id: string
  file_path: string
  chunk_index: number
  content: string
  similarity: number
}

export async function retrieveSimilarChunks(queryEmbedding: number[], topK = 5, filterPath?: string): Promise<RetrievedChunk[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .rpc('match_ai_embeddings', {
      query_embedding: queryEmbedding,
      match_count: topK,
      filter_path: filterPath ?? null,
    })

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[retriever] match_ai_embeddings error:', error)
    return []
  }
  return (data ?? []) as RetrievedChunk[]
}
