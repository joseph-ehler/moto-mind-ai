# 🚀 Quick Start: Test Magic Links NOW

**Time to test:** 5 minutes  
**What you'll test:** Email magic links working

---

## Step 1: Run Magic Links Migration (2 min)

Since there are migration queue issues, let's run it directly:

### Option A: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of:
   ```
   supabase/migrations/20251018_auth_magic_links.sql
   ```
6. Click **Run** (or Cmd+Enter)
7. Should see "Success. No rows returned"

✅ **Done!** Tables and functions are now created.

---

## Step 2: Get Twilio Phone Number (SKIP FOR NOW)

**For email testing, you don't need this yet!**

When you're ready for SMS testing:
1. Go to [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/search)
2. Buy a number with SMS (~$1/month)
3. Add to `.env.local`: `TWILIO_PHONE_NUMBER=+12025551234`

---

## Step 3: Test Email Magic Link (2 min)

### Option A: Using Browser DevTools (Easiest)

1. Make sure dev server is running:
   ```bash
   npm run dev
   ```

2. Open browser to: `http://localhost:3005`

3. Open DevTools Console (F12 or Cmd+Option+I)

4. Run this code:
   ```javascript
   fetch('http://localhost:3005/api/auth/test-email', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'YOUR_EMAIL@gmail.com' })  // Use YOUR email
   })
   .then(r => r.json())
   .then(data => {
     console.log('✅ Result:', data)
     if (data.success) {
       alert('🎉 Email sent! Check your inbox!')
     } else {
       alert('❌ Error: ' + data.error)
     }
   })
   ```

5. Check your inbox!

### Option B: Using curl (Terminal)

```bash
curl -X POST http://localhost:3005/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL@gmail.com"}'
```

---

## ✅ Success Looks Like

**API Response:**
```json
{
  "success": true,
  "message": "Check your email for the sign-in link",
  "rateLimitInfo": {
    "remaining": 2,
    "resetsAt": "2025-10-18T17:00:00.000Z"
  },
  "note": "Check your email for the magic link!"
}
```

**Email You'll Receive:**
```
From: MotoMind <auth@motomind.ai>
Subject: Sign in to MotoMind 🏍️

[Blue button: Sign In Now]

This link expires in 15 minutes.

🔒 Security tip: Never share this link with anyone.
```

**Click the link:**
- Opens: `http://localhost:3005/auth/verify?token=...`
- Should authenticate and create session
- (Note: Full flow complete in Phase 3 with UI)

---

## 🐛 Troubleshooting

### "Email not sent"

**Check Resend Dashboard:**
- Go to: https://resend.com/emails
- See if email appears in logs
- Check for errors

**Common fixes:**
- Domain not verified → Already verified ✅
- API key wrong → Check `.env.local` line 66
- Resend down → Check https://status.resend.com

### "Migration already exists error"

Just skip to Step 3 - tables probably already created from previous run.

Verify with SQL:
```sql
SELECT COUNT(*) FROM auth_magic_links;
-- If this works, you're good!
```

### "Fetch failed" in console

- Dev server not running → Run `npm run dev`
- Port wrong → Check `http://localhost:3005` is correct
- CORS issue → Shouldn't happen on localhost

---

## 🎯 What's Working Now

After this test, you have:
- ✅ Email magic link generation
- ✅ Resend integration
- ✅ Token storage in database
- ✅ Rate limiting
- ✅ Email delivery

**Not yet complete:**
- ⏳ Token verification flow (Phase 3 - UI)
- ⏳ Phone/SMS magic links (need Twilio number)
- ⏳ Beautiful auth UI (Phase 3-6)

---

## 📊 Quick Stats Check

**Check database:**
```sql
-- How many magic links sent?
SELECT COUNT(*) FROM auth_magic_links;

-- Recent magic links:
SELECT 
  identifier, 
  method, 
  created_at,
  used,
  expires_at
FROM auth_magic_links 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🎊 Ready for Phase 3?

Once you've tested email successfully:

1. ✅ Backend works!
2. ✅ Email delivery confirmed!
3. ✅ Database storing tokens!

**Next up:**
- Build beautiful UI for auth flow
- Add phone verification
- Polish everything
- Ship to production! 🚀

---

**Test email now!** Use your own email address to verify it's working.

The magic link won't fully authenticate yet (need Phase 3 UI), but you'll see it in your inbox! ✉️
