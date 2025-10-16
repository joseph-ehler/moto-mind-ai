# AI Chat - Setup & Verification Checklist

## ✅ Immediate Setup (10 minutes)

### 1. Database Migration
```bash
# Navigate to project
cd /Users/josephehler/Desktop/Desktop/apps/motomind-ai

# Check if migration exists
ls -la database/migrations/add_conversation_threads.sql

# Apply migration (if using Supabase)
cd supabase
supabase db push

# OR apply directly to your database
psql $DATABASE_URL < database/migrations/add_conversation_threads.sql
```

### 2. Verify API Endpoints Exist

Check these files exist:
- [ ] `/pages/api/vehicles/[id]/conversations.ts`
- [ ] `/pages/api/conversations/[threadId]/messages.ts`
- [ ] `/pages/api/conversations/[threadId]/index.ts`

If they don't exist, we need to create them.

### 3. Environment Variables

Check `.env.local` has:
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Test the Modal

```bash
# Start dev server
npm run dev

# Navigate to vehicle details page
# Click the AI Assistant FAB
# Check console for errors
```

---

## 🔍 Verification Tests

### Test 1: Thread Creation
```
1. Open AI modal
2. Should auto-create first thread
3. Check browser console - no errors
4. Check database:
   SELECT * FROM conversation_threads;
```

### Test 2: Send Message
```
1. Type "Hello" and send
2. Should see optimistic message
3. Should get AI response
4. Check database:
   SELECT * FROM conversation_messages ORDER BY created_at DESC LIMIT 5;
```

### Test 3: Thread Switching
```
1. Click thread count dropdown
2. Click "+ New conversation"
3. Should create new thread
4. Send message in new thread
5. Switch back to first thread
6. Should see original messages
```

### Test 4: Delete Thread
```
1. Create 2+ threads
2. Click dropdown → hover thread → menu (⋮)
3. Click Delete
4. Should confirm
5. Thread should be removed
6. Should auto-switch to remaining thread
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Failed to load threads"
**Cause:** Database table doesn't exist  
**Fix:** Run migration script

### Issue 2: "Failed to send message"
**Cause:** OpenAI API key missing or invalid  
**Fix:** Check `.env.local` has valid `OPENAI_API_KEY`

### Issue 3: "Thread undefined"
**Cause:** Auto-creation failed  
**Fix:** Check browser console, verify API endpoint works

### Issue 4: Dividers not full-width
**Cause:** Using wrong component  
**Fix:** Already fixed! Using `BaseModalShell`

### Issue 5: Input not sticky
**Cause:** Incorrect flexbox structure  
**Fix:** Already fixed! Using `flex flex-col` with `flex-1`

---

## 📦 Quick Verification Script

Create `/scripts/verify-ai-chat-setup.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifySetup() {
  console.log('🔍 Verifying AI Chat Setup...\n')
  
  // 1. Check tables exist
  const { data: threads, error: threadsError } = await supabase
    .from('conversation_threads')
    .select('count')
    .limit(0)
  
  if (threadsError) {
    console.error('❌ conversation_threads table missing')
    console.error('   Run: psql $DATABASE_URL < database/migrations/add_conversation_threads.sql')
    return false
  }
  console.log('✅ conversation_threads table exists')
  
  const { data: messages, error: messagesError } = await supabase
    .from('conversation_messages')
    .select('count')
    .limit(0)
  
  if (messagesError) {
    console.error('❌ conversation_messages table missing')
    return false
  }
  console.log('✅ conversation_messages table exists')
  
  // 2. Check OpenAI key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set in .env.local')
    return false
  }
  console.log('✅ OPENAI_API_KEY is set')
  
  // 3. Check API routes exist
  const fs = require('fs')
  const routes = [
    'pages/api/vehicles/[id]/conversations.ts',
    'pages/api/conversations/[threadId]/messages.ts',
    'pages/api/conversations/[threadId]/index.ts'
  ]
  
  for (const route of routes) {
    if (!fs.existsSync(route)) {
      console.error(`❌ Missing API route: ${route}`)
      return false
    }
  }
  console.log('✅ All API routes exist')
  
  console.log('\n🎉 Setup verification complete! Ready to use AI Chat.')
  return true
}

verifySetup().catch(console.error)
```

Run with:
```bash
npx tsx scripts/verify-ai-chat-setup.ts
```

---

## 🚀 Production Readiness Checklist

### Before Launch
- [ ] All tests pass
- [ ] Error handling tested
- [ ] Rate limiting implemented
- [ ] Content moderation enabled
- [ ] Analytics tracking added
- [ ] Mobile UX tested on real devices
- [ ] Load testing (100+ concurrent users)
- [ ] Backup/restore procedure documented

### Monitoring
- [ ] Set up error alerts (Sentry)
- [ ] Track API latency (Datadog/New Relic)
- [ ] Monitor OpenAI token usage
- [ ] Track user engagement metrics
- [ ] Set up cost alerts (OpenAI spending)

### Documentation
- [ ] API documentation complete
- [ ] User guide written
- [ ] Admin guide for managing AI
- [ ] Troubleshooting guide
- [ ] Privacy policy updated

---

## 📞 Support Checklist

### If Users Report Issues

1. **Check logs:**
   ```bash
   # Vercel logs
   vercel logs --follow
   
   # Or local logs
   tail -f .next/trace
   ```

2. **Check database:**
   ```sql
   -- Find user's threads
   SELECT * FROM conversation_threads WHERE user_id = 'xxx';
   
   -- Check recent messages
   SELECT * FROM conversation_messages 
   WHERE thread_id IN (SELECT id FROM conversation_threads WHERE user_id = 'xxx')
   ORDER BY created_at DESC LIMIT 20;
   ```

3. **Check OpenAI usage:**
   - Visit OpenAI dashboard
   - Check rate limits
   - Check if API key is valid

4. **Common fixes:**
   - Clear browser cache
   - Check network tab for failed requests
   - Verify user has proper permissions
   - Check if vehicle exists and user owns it

---

## 🎯 Success Metrics

### Week 1
- [ ] 10+ conversations created
- [ ] <2s average response time
- [ ] <1% error rate
- [ ] 0 critical bugs

### Month 1
- [ ] 100+ active users
- [ ] 500+ messages sent
- [ ] 4+ messages per session (avg)
- [ ] 80%+ user satisfaction

### Quarter 1
- [ ] 50% of active users using AI
- [ ] 10+ conversations per user (avg)
- [ ] Feature requests documented
- [ ] Roadmap for v2 features

---

**Ready to verify your setup? Start with the verification script!** ✅
