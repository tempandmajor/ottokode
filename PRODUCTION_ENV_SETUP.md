# Production Environment Variables Setup

## Web Application Environment Variables

### Required for Production Deployment

#### 1. Vercel/Netlify Deployment
```bash
# Core Supabase Configuration
VITE_SUPABASE_URL=https://gbugafddunddrvkvgifl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=AI IDE
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# AI Configuration
NEXT_PUBLIC_DEFAULT_AI_PROVIDER=anthropic
NEXT_PUBLIC_DEFAULT_AI_MODEL=claude-4-sonnet
NEXT_PUBLIC_MAX_AI_REQUESTS_PER_HOUR=100

# Security Configuration
NEXT_PUBLIC_CSP_NONCE_ENABLED=true
NEXT_PUBLIC_SECURE_HEADERS_ENABLED=true
```

#### 2. Self-Hosted Deployment
```bash
# Docker Environment Variables
SUPABASE_URL=https://gbugafddunddrvkvgifl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

## GitHub Actions Secrets

### Repository Secrets Configuration
Go to: `GitHub Repository → Settings → Secrets and Variables → Actions`

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://gbugafddunddrvkvgifl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o
SUPABASE_PROJECT_REF=gbugafddunddrvkvgifl
SUPABASE_ACCESS_TOKEN=[GENERATE_FROM_SUPABASE_DASHBOARD]

# AI API Keys (For Functions)
OPENAI_API_KEY=sk-your_actual_openai_key
ANTHROPIC_API_KEY=sk-ant-your_actual_anthropic_key
GOOGLE_AI_API_KEY=your_actual_google_key

# Tauri Signing (For Release Builds)
TAURI_PRIVATE_KEY=[GENERATE_WITH_TAURI_CLI]
TAURI_KEY_PASSWORD=[YOUR_CHOSEN_PASSWORD]

# Optional: Deployment Keys
VERCEL_TOKEN=[IF_USING_VERCEL]
NETLIFY_AUTH_TOKEN=[IF_USING_NETLIFY]
```

## Environment File Templates

### Development (.env.local)
```bash
# Development Environment Variables
VITE_SUPABASE_URL=https://gbugafddunddrvkvgifl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o

# Development AI Keys (Optional - for local testing)
OPENAI_API_KEY=sk-your_dev_openai_key
ANTHROPIC_API_KEY=sk-ant-your_dev_anthropic_key
GOOGLE_AI_API_KEY=your_dev_google_key

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES=true
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=true
```

### Production (.env.production)
```bash
# Production Environment Variables
VITE_SUPABASE_URL=https://gbugafddunddrvkvgifl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o

# Production Configuration
NODE_ENV=production
NEXT_PUBLIC_ENABLE_EXPERIMENTAL_FEATURES=false
NEXT_PUBLIC_ENABLE_DEBUG_LOGGING=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Tauri Environment Configuration

### Tauri Build Environment
```bash
# Tauri-specific environment variables
TAURI_PLATFORM=all
TAURI_BUNDLE_IDENTIFIER=com.aiide.app
TAURI_APP_NAME=AI IDE
TAURI_APP_VERSION=1.0.0

# Build Configuration
RUST_BACKTRACE=1
CARGO_INCREMENTAL=0
RUSTFLAGS="-C target-cpu=native"

# Platform-specific signing
APPLE_CERTIFICATE_BASE64=[MACOS_SIGNING_CERT]
APPLE_CERTIFICATE_PASSWORD=[CERT_PASSWORD]
WINDOWS_CERTIFICATE_THUMBPRINT=[WINDOWS_SIGNING_THUMBPRINT]
```

## Deployment Platform Configuration

### Vercel
```json
{
  "build": {
    "env": {
      "VITE_SUPABASE_URL": "@vite_supabase_url",
      "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key",
      "NODE_ENV": "production"
    }
  },
  "env": {
    "VITE_SUPABASE_URL": "https://gbugafddunddrvkvgifl.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o"
  }
}
```

### Netlify
```toml
[build.environment]
  VITE_SUPABASE_URL = "https://gbugafddunddrvkvgifl.supabase.co"
  VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWdhZmRkdW5kZHJ2a3ZnaWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMTIyNzgsImV4cCI6MjA0MTc4ODI3OH0.VXxY7Nc6QNJYfX8FU-nJF8nHtjhYX5vPGq8KnVu9X7o"
  NODE_ENV = "production"
```

## Security Considerations

### Environment Variable Security
- Never commit production API keys to git
- Use secrets management for sensitive values
- Rotate API keys regularly
- Monitor API usage and costs
- Use different keys for development/production

### Access Control
- Supabase RLS policies enabled
- Function-level authentication required
- Admin operations require service role
- User session validation on all requests

## Validation Commands

### Test Environment Setup
```bash
# Verify environment variables loaded
npm run build
npm run start

# Test API connectivity
curl -X POST https://gbugafddunddrvkvgifl.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"provider":"local","messages":[{"role":"user","content":"test"}]}'

# Verify web app loads
curl -I https://your-domain.com
```

### Environment Variable Checklist
- [ ] VITE_SUPABASE_URL configured
- [ ] VITE_SUPABASE_ANON_KEY configured
- [ ] NODE_ENV set to production
- [ ] AI API keys available in Supabase secrets
- [ ] GitHub Actions secrets configured
- [ ] Tauri signing keys configured (for releases)
- [ ] Platform-specific deployment variables set
- [ ] Security headers enabled
- [ ] Analytics and monitoring configured