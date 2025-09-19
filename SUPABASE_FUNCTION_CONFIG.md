# Supabase Function Environment Configuration

## Dashboard Configuration Steps

### 1. Access Function Configuration
Go to: `https://supabase.com/dashboard/project/gbugafddunddrvkvgifl/functions`

### 2. Configure index-repo Function Environment Variables

Navigate to **index-repo** function → **Configuration** tab:

```bash
# Environment Variables for index-repo function
SUPABASE_URL=https://gbugafddunddrvkvgifl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_FROM_SETTINGS]
OPENAI_API_KEY=[FROM_SECRETS]
ANTHROPIC_API_KEY=[FROM_SECRETS]
GOOGLE_AI_API_KEY=[FROM_SECRETS]
NODE_ENV=production
FUNCTION_NAME=index-repo
MAX_FILE_SIZE=1048576
MAX_FILES_PER_REQUEST=100
ALLOWED_EXTENSIONS=.js,.ts,.tsx,.jsx,.py,.rs,.go,.java,.cpp,.c,.h,.hpp,.css,.html,.md,.json,.yml,.yaml,.toml,.conf
```

### 3. Configure propose-diff Function Environment Variables

Navigate to **propose-diff** function → **Configuration** tab:

```bash
# Environment Variables for propose-diff function
SUPABASE_URL=https://gbugafddunddrvkvgifl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_FROM_SETTINGS]
OPENAI_API_KEY=[FROM_SECRETS]
ANTHROPIC_API_KEY=[FROM_SECRETS]
GOOGLE_AI_API_KEY=[FROM_SECRETS]
NODE_ENV=production
FUNCTION_NAME=propose-diff
MAX_CONTENT_SIZE=100000
DEFAULT_PROVIDER=anthropic
DEFAULT_MODEL=claude-4-sonnet
DIFF_CONTEXT_LINES=3
ENABLE_AUDIT_LOGGING=true
```

### 4. ai-chat Function (Already Configured)

The ai-chat function should already have:

```bash
OPENAI_API_KEY=[FROM_SECRETS]
ANTHROPIC_API_KEY=[FROM_SECRETS]
GOOGLE_AI_API_KEY=[FROM_SECRETS]
NODE_ENV=production
FUNCTION_NAME=ai-chat
```

## Security Configuration

### Edge Function Secrets (Already Set)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`

### Service Role Key Location
Get the Service Role Key from:
`Dashboard → Settings → API → Project API keys → service_role`

⚠️ **Important**: Service role key has admin privileges - only use in server-side functions

## Function-Specific Notes

### index-repo Function
- Handles repository indexing for AI context
- Requires file system access permissions
- Uses embedding models for semantic search
- Rate limited to prevent abuse

### propose-diff Function
- Generates code patches using AI
- Validates input code before processing
- Creates unified diff format output
- Logs all operations for audit trail

### ai-chat Function
- Multi-provider AI chat interface
- Usage limits per user/session
- Supports streaming responses
- Fallback provider logic

## Deployment Verification

After configuration, test each function:

```bash
# Test index-repo
curl -X POST https://gbugafddunddrvkvgifl.supabase.co/functions/v1/index-repo \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"repository_path": "/test", "files": []}'

# Test propose-diff
curl -X POST https://gbugafddunddrvkvgifl.supabase.co/functions/v1/propose-diff \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"file_path": "test.js", "original_content": "console.log('hello');", "user_instruction": "add error handling"}'

# Test ai-chat
curl -X POST https://gbugafddunddrvkvgifl.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Environment Variable Reference

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `SUPABASE_URL` | Database connection | index-repo, propose-diff |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access | index-repo, propose-diff |
| `OPENAI_API_KEY` | OpenAI API access | All functions |
| `ANTHROPIC_API_KEY` | Anthropic API access | All functions |
| `GOOGLE_AI_API_KEY` | Google AI access | All functions |
| `NODE_ENV` | Environment mode | All functions |
| `FUNCTION_NAME` | Function identification | All functions |
| `MAX_FILE_SIZE` | File size limit | index-repo |
| `MAX_CONTENT_SIZE` | Content size limit | propose-diff |
| `DEFAULT_PROVIDER` | Fallback AI provider | propose-diff |
| `ENABLE_AUDIT_LOGGING` | Audit trail toggle | propose-diff |