# 🧪 Magic Links Testing Guide

**Created:** October 18, 2025  
**Purpose:** Step-by-step guide to test email and phone magic link authentication

---

## 📋 Prerequisites Checklist

Before testing, ensure you have:

- [x] **Resend Account** - Already set up ✅
  - API Key: `[REDACTED - in .env.local]`
  - From Email: `auth@motomind.ai`
  - Domain: motomind.ai (verified)

- [x] **Twilio Account** - Just created ✅
  - Account SID: `[REDACTED - in .env.local]`
  - Auth Token: `[REDACTED - in .env.local]`
  - Phone Number: **NEEDS SETUP** ⚠️

- [ ] **Database Migration** - Pending
  - Tables: `auth_magic_links`, `auth_magic_link_rate_limits`
  - Functions: `check_magic_link_rate_limit()`, `cleanup_expired_magic_links()`

- [x] **Environment Variables** - Added ✅
  - All keys in `.env.local`

---

## 🔧 Setup Steps

### Step 1: Get Twilio Phone Number (5 min)

Your Twilio account needs a phone number to send SMS:

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers** → **Manage** → **Buy a number**
3. Select your country (US recommended for testing)
4. Choose a number with SMS capability
5. Purchase (~$1/month)
6. Copy the number (format: `+12025551234`)
7. Add to `.env.local`:
   ```bash
   TWILIO_PHONE_NUMBER=+12025551234
   ```

**Free Trial Note:** If using trial account, you must **verify** the recipient phone number in Twilio console before sending SMS.

### Step 2: Run Database Migration

**Option A: Via npm script (recommended)**
```bash
npm run db:migrate
```

**Option B: Manual via Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: MotoMind
3. Go to **SQL Editor**
4. Copy contents of `supabase/migrations/20251018_auth_magic_links.sql`
5. Paste and run

**Verify migration:**
```sql
-- Check tables exist
SELECT * FROM auth_magic_links LIMIT 1;
SELECT * FROM auth_magic_link_rate_limits LIMIT 1;

-- Check functions exist
SELECT check_magic_link_rate_limit('test@example.com', 'email', 3, 60);
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

This ensures environment variables are loaded.

---

## 🧪 Test 1: Email Magic Link

### Test via API Endpoint

**Using curl:**
```bash
curl -X POST http://localhost:3005/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

**Using browser console:**
```javascript
fetch('http://localhost:3005/api/auth/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your@email.com' })
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
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

### Check Email

1. Open your inbox
2. Look for email from `MotoMind <auth@motomind.ai>`
3. Subject: "Sign in to MotoMind 🏍️"
4. Email should have:
   - Branded header with 🏍️ logo
   - Blue "Sign In Now" button
   - Security note
   - Expiration warning (15 minutes)

### Test the Link

1. Click "Sign In Now" button in email
2. Should navigate to: `http://localhost:3005/auth/verify?token=...`
3. Token should be validated
4. Should create Supabase session
5. Should redirect to `/track`

### Verify in Database

```sql
-- Check magic link was created
SELECT * FROM auth_magic_links 
WHERE identifier = 'your@email.com' 
ORDER BY created_at DESC 
LIMIT 1;

-- Check rate limit was recorded
SELECT * FROM auth_magic_link_rate_limits 
WHERE identifier = 'your@email.com';
```

---

## 🧪 Test 2: Phone Magic Link (SMS)

### Prerequisites

⚠️ **IMPORTANT:** 
- If using Twilio trial, verify your phone number first
- Go to: Twilio Console → Phone Numbers → Verified Caller IDs
- Add your phone number

### Test via API Endpoint

**Using curl:**
```bash
curl -X POST http://localhost:3005/api/auth/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"+12025551234"}'
```

**Using browser console:**
```javascript
fetch('http://localhost:3005/api/auth/test-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+12025551234' })
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Check your phone for the verification code",
  "formattedPhone": "(202) 555-1234",
  "rateLimitInfo": {
    "remaining": 2,
    "resetsAt": "2025-10-18T17:00:00.000Z"
  },
  "note": "Check your phone for the 6-digit code!",
  "reminder": "You need a verified Twilio phone number to send SMS"
}
```

### Check SMS

1. Check your phone for SMS
2. From: Your Twilio number
3. Message format:
   ```
   Your MotoMind verification code is: 123456

   This code expires in 15 minutes.

   Never share this code with anyone.
   ```

### Test Code Verification

**Using curl:**
```bash
curl -X POST http://localhost:3005/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+12025551234",
    "code": "123456"
  }'
```

*(Note: This endpoint needs to be created - coming in Phase 3)*

---

## 🧪 Test 3: Rate Limiting

### Test Email Rate Limit

Send 4 emails in a row:

```bash
# Request 1 - should work
curl -X POST http://localhost:3005/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Request 2 - should work
curl -X POST http://localhost:3005/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Request 3 - should work
curl -X POST http://localhost:3005/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Request 4 - should FAIL with rate limit
curl -X POST http://localhost:3005/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected 4th Response:**
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "rateLimitInfo": {
    "remaining": 0,
    "resetsAt": "2025-10-18T17:00:00.000Z"
  }
}
```

### Verify Rate Limit in Database

```sql
SELECT * FROM auth_magic_link_rate_limits 
WHERE identifier = 'test@example.com';

-- Should show:
-- attempt_count: 3
-- window_start: recent timestamp
```

---

## 🧪 Test 4: Token Expiration

### Create Expired Token

```sql
-- Manually insert expired token
INSERT INTO auth_magic_links (
  token_hash,
  identifier,
  method,
  expires_at,
  created_at
) VALUES (
  'test_expired_hash',
  'expired@test.com',
  'email',
  NOW() - INTERVAL '1 hour',  -- Already expired
  NOW() - INTERVAL '1 hour'
);
```

### Test Verification

Try to verify the expired token - should fail:

```bash
curl http://localhost:3005/auth/verify?token=fake_expired_token
```

**Expected:** Error message about expiration

---

## 🧪 Test 5: Security Tests

### Test 1: Reusing Token

1. Send email magic link
2. Click link (uses token)
3. Try clicking link again
4. Should fail with "already used" error

### Test 2: Invalid Token

```bash
curl http://localhost:3005/auth/verify?token=invalid_fake_token_12345
```

**Expected:** Error about invalid token

### Test 3: Token in Database

```sql
-- Tokens should be hashed, not plain text
SELECT token_hash FROM auth_magic_links LIMIT 1;
-- Should see: SHA-256 hash (64 hex characters)
-- Should NOT see: Plain token
```

---

## 📊 Success Criteria

### ✅ Email Magic Link Works If:
- [x] Email sent successfully
- [x] Email received in inbox
- [x] Email has correct branding
- [x] Link works and logs in
- [x] Token marked as used in DB
- [x] Rate limiting works
- [x] Expiration enforced

### ✅ Phone Magic Link Works If:
- [x] SMS sent successfully
- [x] SMS received on phone
- [x] Code format correct (6 digits)
- [x] Code verification works
- [x] Creates valid session
- [x] Rate limiting works
- [x] Expiration enforced

---

## 🐛 Troubleshooting

### Email Not Received

**Check Resend Dashboard:**
1. Go to [Resend Dashboard](https://resend.com/emails)
2. Check if email was sent
3. Look for delivery errors

**Common Issues:**
- Domain not verified → Check DNS records
- API key invalid → Regenerate key
- Rate limit hit → Check Resend quota

**Debug in Code:**
```typescript
// Check logs
console.log('[Resend] Email sent:', result)
```

### SMS Not Received

**Check Twilio Console:**
1. Go to [Twilio Console](https://console.twilio.com/monitor/logs/sms)
2. Check SMS logs
3. Look for delivery status

**Common Issues:**
- Phone not verified (trial account) → Verify in console
- Invalid phone format → Must be E.164 (+12025551234)
- Twilio balance $0 → Add credit
- Phone number not purchased → Buy number

**Debug in Code:**
```typescript
// Check logs
console.log('[Twilio] SMS sent:', result)
```

### Database Migration Failed

**Manual Fix:**
1. Go to Supabase SQL Editor
2. Copy migration SQL
3. Run section by section
4. Check for specific errors

**Common Issues:**
- Function already exists → Drop and recreate
- Permission denied → Use service role key
- Table already exists → Check if migration already ran

---

## 📝 Testing Checklist

**Before You Start:**
- [ ] Twilio phone number purchased
- [ ] Twilio phone number added to `.env.local`
- [ ] Database migration run
- [ ] Dev server restarted
- [ ] Test email address ready
- [ ] Test phone number ready (verified if trial)

**Email Tests:**
- [ ] Send email works
- [ ] Email received
- [ ] Click link works
- [ ] Creates session
- [ ] Rate limiting works
- [ ] Token marked as used
- [ ] Expired tokens rejected

**Phone Tests:**
- [ ] Send SMS works
- [ ] SMS received
- [ ] Code format correct
- [ ] Verify code works
- [ ] Creates session
- [ ] Rate limiting works
- [ ] Expired codes rejected

**Security Tests:**
- [ ] Tokens hashed in DB
- [ ] Can't reuse tokens
- [ ] Invalid tokens rejected
- [ ] Expiration enforced
- [ ] Rate limits enforced

---

## 🎯 Next Steps After Testing

Once backend is verified:

1. **Phase 3:** Build Premium UI Components
2. **Phase 4:** Implement Auth Flow State Machine
3. **Phase 5:** Polish Email Templates (React Email)
4. **Phase 6:** Add Micro-interactions
5. **Phase 7:** Comprehensive Testing

---

**Ready to test?** Start with Email (easiest), then Phone! 🚀
