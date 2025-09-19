# AI Repository Indexing Setup Guide

This guide explains how to set up automated AI repository indexing using GitHub Actions and Supabase Edge Functions.

## Overview

The AI indexing system automatically processes your codebase to create vector embeddings that power context-aware AI suggestions in the IDE. The system includes:

- **Edge Function**: Processes files and generates embeddings
- **GitHub Action**: Automatically triggers indexing on code changes
- **Admin Interface**: Manual indexing and status monitoring
- **Context Retrieval**: Powers AI suggestions with relevant code context

## Prerequisites

1. **Supabase Project**: Active Supabase project with Edge Functions enabled
2. **OpenAI API Key**: For generating embeddings (optional - falls back to dummy embeddings)
3. **GitHub Repository**: With Actions enabled

## Setup Instructions

### 1. Deploy the Edge Function

The Edge Function is already created at `supabase/functions/index-repo/index.ts`. Deploy it:

```bash
# Using Supabase CLI
supabase functions deploy index-repo

# Or manually via Supabase Dashboard:
# 1. Go to Edge Functions
# 2. Create new function named "index-repo"
# 3. Copy contents from supabase/functions/index-repo/index.ts
```

### 2. Apply Database Migration

Apply the AI indexing migration to create required tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL from:
# supabase/migrations/06_ai_indexing.sql
```

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key  # Optional
```

**To add secrets:**
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret

### 4. Enable the Vector Extension (Recommended)

For better performance with large codebases, enable the pgvector extension:

```sql
-- Run this in your Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS vector;
```

Then uncomment the vector index in the migration file:

```sql
CREATE INDEX idx_ai_embeddings_cosine ON ai_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## How It Works

### Automatic Indexing

The GitHub Action triggers automatically on:

- **Push to main**: Indexes only changed files (incremental)
- **Pull Requests**: Indexes changed files for context
- **Weekly Schedule**: Full repository re-indexing (Sundays 2 AM UTC)
- **Manual Trigger**: On-demand indexing with configurable options

### File Processing

The system processes these file types:
- TypeScript/JavaScript: `.ts`, `.tsx`, `.js`, `.jsx`
- Documentation: `.md`

Files are:
1. **Chunked**: Split into manageable pieces (~1000 characters)
2. **Embedded**: Converted to vector embeddings using OpenAI
3. **Stored**: Saved in Supabase with metadata

### Context Retrieval

During code completion:
1. Current code context is embedded
2. Similar chunks are retrieved using vector search
3. Relevant patterns are included in AI prompts
4. More accurate suggestions are generated

## Configuration

### Environment Variables

- `NEXT_PUBLIC_CONTEXT_AWARE=1`: Enable context-aware suggestions
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Service role key for database access
- `OPENAI_API_KEY`: Optional for better embeddings

### Workflow Configuration

Edit `.github/workflows/ai-indexing.yml` to customize:

```yaml
on:
  push:
    paths:
      - 'src/**'        # Add/remove paths to monitor
      - 'web-app/src/**'
  schedule:
    - cron: '0 2 * * 0'  # Change schedule frequency
```

### Skip Indexing

Add `[skip-indexing]` to commit messages to skip automatic indexing:

```bash
git commit -m "Update README [skip-indexing]"
```

## Manual Indexing

### Via Admin Interface

1. Navigate to `/admin/indexing`
2. Log in with admin credentials
3. Upload files or trigger repository indexing
4. Monitor progress and status

### Via GitHub Actions

1. Go to Actions tab in your repository
2. Select "AI Repository Indexing" workflow
3. Click "Run workflow"
4. Choose mode (incremental/full) and optional filter path

### Via CLI

```bash
# Full repository indexing
SUPABASE_URL="..." SUPABASE_SERVICE_KEY="..." node scripts/index-repo.js --root .

# Filter specific path
SUPABASE_URL="..." SUPABASE_SERVICE_KEY="..." node scripts/index-repo.js --root . --filter-path "web-app"
```

## Monitoring

### Status Dashboard

The admin interface shows:
- Total embeddings count
- Last indexing run timestamp
- Indexing status and errors

### GitHub Actions

Monitor indexing runs in the Actions tab:
- View logs for each step
- Check success/failure status
- See processing summaries

### Database Queries

```sql
-- Check indexing status
SELECT * FROM ai_index_status;

-- Count embeddings by file
SELECT file_path, COUNT(*) as chunks
FROM ai_embeddings
GROUP BY file_path
ORDER BY chunks DESC;

-- Recent indexing runs
SELECT created_at, indexing_mode, success, total_chunks
FROM ai_index_status
ORDER BY created_at DESC;
```

## Troubleshooting

### Common Issues

1. **Edge Function Not Found**
   - Ensure function is deployed with correct name "index-repo"
   - Check Supabase function logs

2. **Permission Denied**
   - Verify service role key has correct permissions
   - Check RLS policies on ai_embeddings table

3. **GitHub Action Fails**
   - Verify all required secrets are set
   - Check if Supabase URL and keys are correct

4. **No Context Suggestions**
   - Ensure `NEXT_PUBLIC_CONTEXT_AWARE=1` is set
   - Verify embeddings exist in database
   - Check Monaco editor integration

### Debug Commands

```bash
# Test Edge Function directly
curl -X POST "https://your-project.supabase.co/functions/v1/index-repo" \
  -H "Authorization: Bearer your_service_key" \
  -H "Content-Type: application/json" \
  -d '{"mode": "test"}'

# Check database connection
npx supabase status

# View function logs
npx supabase functions logs index-repo
```

## Performance Considerations

- **Batch Size**: Large repositories are processed in batches of 10 files
- **Rate Limiting**: 1-second delay between batches to avoid timeouts
- **File Size Limits**: Files larger than 100KB are skipped
- **Incremental Updates**: Only changed files are re-indexed on commits

## Security

- **RLS Policies**: Protect embeddings data with row-level security
- **Service Role**: Uses service key for write operations
- **CSP Hardening**: Inline styles removed for security compliance
- **API Keys**: Securely stored in GitHub secrets

## Cost Optimization

- **Dummy Embeddings**: Falls back when OpenAI API key not provided
- **Incremental Indexing**: Reduces processing on routine commits
- **Filtered Paths**: Index only relevant directories
- **Skip Option**: Bypass indexing for non-code changes

For questions or issues, check the GitHub Actions logs or Supabase function logs for detailed error information.