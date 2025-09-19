-- Phase 3: AI indexing schema (pgvector) and similarity RPC
-- Requires: extension vector

-- Enable required extensions (idempotent)
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Embeddings table to store chunked code/docs
create table if not exists public.ai_embeddings (
  id uuid primary key default gen_random_uuid(),
  repo_path text,
  file_path text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists ai_embeddings_embedding_idx
  on public.ai_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists ai_embeddings_file_idx on public.ai_embeddings (file_path);

-- Indexing status (optional)
create table if not exists public.ai_index_status (
  id bigserial primary key,
  last_run timestamptz default now(),
  last_commit text
);

-- Similarity RPC: returns top-K chunks matching an embedding
create or replace function public.match_ai_embeddings(
  query_embedding vector(1536),
  match_count int default 5,
  filter_path text default null
)
returns table(
  id uuid,
  file_path text,
  chunk_index int,
  content text,
  similarity float
)
language sql stable as $$
  select e.id, e.file_path, e.chunk_index, e.content,
         1 - (e.embedding <=> query_embedding) as similarity
  from public.ai_embeddings e
  where filter_path is null or e.file_path like filter_path
  order by e.embedding <=> query_embedding
  limit match_count
$$;
