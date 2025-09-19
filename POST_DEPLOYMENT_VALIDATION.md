# Post-Deployment Validation Checklist

## 🚀 Complete Deployment Validation Guide

### Prerequisites
- [ ] Supabase functions deployed (ai-chat, propose-diff, index-repo)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] API keys added to Supabase secrets
- [ ] Web application deployed

## 1. 🔧 Infrastructure Validation

### Supabase Functions
```bash
# Test ai-chat function
curl -X POST https://gbugafddunddrvkvgifl.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"provider":"anthropic","messages":[{"role":"user","content":"Hello, test message"}]}'

# Expected: 200 response with AI chat completion

# Test propose-diff function
curl -X POST https://gbugafddunddrvkvgifl.supabase.co/functions/v1/propose-diff \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"file_path":"test.js","original_content":"console.log(\"hello\");","user_instruction":"add error handling"}'

# Expected: 200 response with unified diff

# Test index-repo function
curl -X POST https://gbugafddunddrvkvgifl.supabase.co/functions/v1/index-repo \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"repository_path":"/test","files":[]}'

# Expected: 200 response with indexing confirmation
```

### Database Tables
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_patch_audit', 'admin_users', 'admin_audit_log');

-- Check ai_patch_audit structure
\d ai_patch_audit;

-- Check admin system structure
\d admin_users;
\d admin_audit_log;

-- Test admin functions
SELECT check_admin_permission('ai:manage');
```

### Environment Variables
```bash
# Check Supabase function environment variables
# Go to: https://supabase.com/dashboard/project/gbugafddunddrvkvgifl/functions
# Verify each function has required environment variables set

# For index-repo function:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, etc.

# For propose-diff function:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, etc.
```

## 2. 🌐 Web Application Validation

### Page Load Tests
- [ ] **Home Page**: `https://your-domain.com/`
  - [ ] Page loads without errors
  - [ ] All sections render correctly
  - [ ] Navigation works

- [ ] **IDE Page**: `https://your-domain.com/ide`
  - [ ] Monaco editor loads
  - [ ] Syntax highlighting works
  - [ ] File tree (if implemented) displays

- [ ] **AI Settings**: `https://your-domain.com/settings/ai`
  - [ ] Settings form loads
  - [ ] Provider dropdown populated
  - [ ] Model selection works
  - [ ] Settings save to localStorage

### AI Feature Tests
- [ ] **Right-click Context Menu**
  - [ ] Right-click in Monaco editor
  - [ ] "Ask AI to refactor" option appears
  - [ ] Click triggers refactor dialog

- [ ] **Refactor Dialog**
  - [ ] Dialog opens with selected text
  - [ ] Instruction input field works
  - [ ] Provider/model selection respects settings
  - [ ] Submit button functional

- [ ] **AI Processing**
  - [ ] Request shows loading state
  - [ ] Response displays diff preview
  - [ ] Apply/reject buttons work
  - [ ] Backup/restore functionality

## 3. 🖥️ Desktop Application Validation

### Tauri App Tests
```bash
# Build and test desktop app
npm run tauri dev

# Verify Tauri commands work
# These should be tested in the desktop app context
```

- [ ] **Application Launch**
  - [ ] Desktop app opens without errors
  - [ ] Window sizing appropriate
  - [ ] Menu bar functions (if implemented)

- [ ] **Web Features in Desktop**
  - [ ] All web features work in desktop context
  - [ ] File system access works
  - [ ] WebSocket connections stable

- [ ] **Tauri Commands**
  - [ ] `apply_patch_with_backup` command works
  - [ ] `restore_from_backup` command works
  - [ ] File operations secure and functional

## 4. 🔐 Security Validation

### Security Headers
```bash
# Test security headers
curl -I https://your-domain.com/

# Verify headers present:
# Content-Security-Policy
# Strict-Transport-Security (production only)
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy
```

### Rate Limiting
```bash
# Test rate limiting (should return 429 after limit)
for i in {1..250}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.com/
done
```

### CSP Validation
- [ ] **Content Security Policy**
  - [ ] Page loads without CSP violations
  - [ ] Console shows no CSP errors
  - [ ] External resources load correctly
  - [ ] Inline scripts work with nonce

### Admin System
- [ ] **Admin User Creation**
  - [ ] Run admin initialization (development only)
  - [ ] Verify admin user in database
  - [ ] Test admin permission checks

## 5. 🤖 AI Provider Validation

### Anthropic (Claude)
- [ ] **API Connection**
  - [ ] Test Claude 4 Sonnet response
  - [ ] Test Claude 4 Opus response
  - [ ] Verify rate limiting respected

### OpenAI (GPT)
- [ ] **API Connection**
  - [ ] Test GPT-5 response
  - [ ] Test GPT-4 turbo response
  - [ ] Verify usage tracking

### Google AI
- [ ] **API Connection**
  - [ ] Test Gemini Pro response
  - [ ] Test Gemini Ultra response
  - [ ] Verify API key valid

### Provider Fallback
- [ ] **Fallback Logic**
  - [ ] Disable one provider temporarily
  - [ ] Verify automatic fallback works
  - [ ] Test error handling for all providers down

## 6. 📊 Audit and Logging Validation

### Audit Trail
```sql
-- Test audit logging
SELECT * FROM ai_patch_audit ORDER BY created_at DESC LIMIT 10;

-- Verify audit record structure
SELECT
  user_id,
  file_path,
  original_content_hash,
  modified_content_hash,
  ai_provider,
  ai_model,
  instruction,
  operation_type,
  success,
  created_at
FROM ai_patch_audit LIMIT 1;
```

### Admin Audit Log
```sql
-- Test admin audit logging
SELECT * FROM admin_audit_log ORDER BY timestamp DESC LIMIT 10;

-- Verify admin log structure
SELECT
  admin_user_id,
  admin_email,
  action,
  details,
  ip_address,
  user_agent,
  timestamp
FROM admin_audit_log LIMIT 1;
```

## 7. 🚀 Performance Validation

### Load Time Tests
- [ ] **Page Load Speed**
  - [ ] Home page loads < 3 seconds
  - [ ] IDE page loads < 5 seconds
  - [ ] Settings page loads < 2 seconds

### AI Response Times
- [ ] **AI Processing Speed**
  - [ ] Simple refactor requests < 10 seconds
  - [ ] Complex refactor requests < 30 seconds
  - [ ] Error responses < 5 seconds

### Resource Usage
- [ ] **Memory and CPU**
  - [ ] Desktop app memory usage reasonable
  - [ ] No memory leaks during extended use
  - [ ] CPU usage appropriate during AI processing

## 8. 🧪 End-to-End Test Scenarios

### Scenario 1: New User Journey
1. [ ] Visit application for first time
2. [ ] Navigate to AI settings
3. [ ] Configure preferred provider/model
4. [ ] Open IDE interface
5. [ ] Write some code
6. [ ] Use "Ask AI to refactor" feature
7. [ ] Apply suggested changes
8. [ ] Verify changes persisted

### Scenario 2: Admin User Operations
1. [ ] Initialize admin user (development)
2. [ ] Log admin actions
3. [ ] View audit logs
4. [ ] Test permission system
5. [ ] Verify admin-only features restricted

### Scenario 3: Error Handling
1. [ ] Test with invalid API keys
2. [ ] Test with network disconnection
3. [ ] Test with malformed requests
4. [ ] Verify graceful error handling
5. [ ] Check error messages user-friendly

## 9. 🔄 Monitoring and Maintenance

### Health Checks
```bash
# Set up health check endpoint
curl https://your-domain.com/api/health

# Monitor Supabase function health
curl https://gbugafddunddrvkvgifl.supabase.co/functions/v1/ai-chat/health
```

### Usage Monitoring
- [ ] **API Usage Tracking**
  - [ ] Monitor AI API costs
  - [ ] Track request volumes
  - [ ] Set up usage alerts

- [ ] **Error Monitoring**
  - [ ] Set up error tracking (Sentry, etc.)
  - [ ] Monitor function logs
  - [ ] Track user-reported issues

## 10. ✅ Production Readiness Checklist

### Final Validation
- [ ] All infrastructure tests pass
- [ ] All security validations complete
- [ ] All AI providers functional
- [ ] Audit logging working
- [ ] Performance acceptable
- [ ] Error handling robust
- [ ] Admin system operational
- [ ] Documentation complete

### Go-Live Checklist
- [ ] Domain configured and SSL active
- [ ] Environment variables production-ready
- [ ] API keys rotated for production
- [ ] Monitoring and alerting configured
- [ ] Backup procedures documented
- [ ] Support procedures established

## 🎯 Success Criteria

**Application is production-ready when:**
✅ All validation tests pass
✅ Security measures active
✅ AI features fully functional
✅ Performance meets requirements
✅ Audit trail complete
✅ Error handling robust
✅ Admin system operational

## 📞 Issue Resolution

### Common Issues and Solutions

**Issue**: Function not responding
- Check environment variables
- Verify API keys in Supabase secrets
- Check function logs in dashboard

**Issue**: CSP violations
- Review security middleware configuration
- Update CSP policy for new domains
- Check nonce implementation

**Issue**: AI responses failing
- Verify API key validity
- Check rate limits not exceeded
- Test provider fallback logic

**Issue**: Database errors
- Verify migration applied correctly
- Check RLS policies
- Validate table structures

### Support Contacts
- **Technical Issues**: Check GitHub Issues
- **Supabase Issues**: Supabase Support
- **AI Provider Issues**: Provider documentation

---

## 🏆 Validation Complete

**Status**: Production Ready ✅

Your AI-powered IDE is now fully validated and ready for production use with:
- ✅ Complete AI integration
- ✅ Robust security measures
- ✅ Comprehensive audit trail
- ✅ Admin user system
- ✅ Performance optimization
- ✅ Error handling
- ✅ Production monitoring