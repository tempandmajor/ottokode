-- Migration: AI Repository Indexing Tables
-- Description: Create tables for AI-powered repository indexing and embeddings

-- Table to store embeddings for AI context retrieval
CREATE TABLE IF NOT EXISTS ai_embeddings (
    id BIGSERIAL PRIMARY KEY,
    file_path TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimensions
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track indexing status and runs
CREATE TABLE IF NOT EXISTS ai_index_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_run TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_commit TEXT,
    workflow_run_id TEXT,
    indexing_mode TEXT DEFAULT 'full',
    success BOOLEAN DEFAULT TRUE,
    total_files INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure only one status record exists
    CONSTRAINT single_status_record CHECK (id = 1)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_file_path ON ai_embeddings(file_path);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_created_at ON ai_embeddings(created_at);

-- Vector similarity search index (if using pgvector extension)
-- Note: This requires the vector extension to be enabled
-- CREATE INDEX IF NOT EXISTS idx_ai_embeddings_cosine ON ai_embeddings
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_ai_embeddings_updated_at
    BEFORE UPDATE ON ai_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_index_status_updated_at
    BEFORE UPDATE ON ai_index_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial status record
INSERT INTO ai_index_status (id, last_run, indexing_mode, success)
VALUES (1, NOW(), 'initial', TRUE)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for ai_embeddings (allow service role access)
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage ai_embeddings" ON ai_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read embeddings (for context retrieval)
CREATE POLICY "Authenticated users can read ai_embeddings" ON ai_embeddings
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for ai_index_status
ALTER TABLE ai_index_status ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage ai_index_status" ON ai_index_status
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read status
CREATE POLICY "Authenticated users can read ai_index_status" ON ai_index_status
    FOR SELECT USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE ai_embeddings IS 'Stores vector embeddings of code chunks for AI context retrieval';
COMMENT ON TABLE ai_index_status IS 'Tracks the status and history of repository indexing runs';
COMMENT ON COLUMN ai_embeddings.embedding IS 'Vector embedding generated from content using text-embedding-ada-002';
COMMENT ON COLUMN ai_embeddings.metadata IS 'Additional metadata like language, file type, etc.';
COMMENT ON COLUMN ai_index_status.workflow_run_id IS 'GitHub Actions workflow run ID for tracking';