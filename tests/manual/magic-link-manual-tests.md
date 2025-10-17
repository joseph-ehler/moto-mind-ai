# Magic Link Manual Test Guide

**Feature:** Secure Magic Links with 15-minute expiration  
**Date:** October 17, 2025  
**Tester:** _________________

---

## ✅ TEST CHECKLIST

### Test 1: Send Magic Link (Happy Path)
**Goal:** Verify magic link is sent successfully

**Steps:**
1. Go to `http://localhost:3005/auth/signin`
2. Click "Sign in with email" or similar button
3. Enter your email address
4. Click "Send magic link"

**Expected Results:**
- ✅ "Check your email" screen appears
- ✅ Shows your email address
- ✅ Countdown timer displays (~15:00 minutes)
- ✅ "Resend" button is disabled for 60 seconds

**Database Check:**
```sql
SELECT * FROM magic_links 
WHERE email = 'your-email@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

**Expected Data:**
- `token`: 64-character hex string
- `email`: Your email
- `expires_at`: ~15 minutes from now
- `used`: false
- `ip_address`: Your IP

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 2: Countdown Timer
**Goal:** Verify countdown timer updates in real-time

**Steps:**
1. After sending magic link, observe the timer
2. Wait 30 seconds

**Expected Results:**
- ✅ Timer counts down every second
- ✅ Format: "14:30" → "14:29" → "14:28"
- ✅ Color changes (green → orange → red when < 1 min)

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 3: Resend Cooldown
**Goal:** Verify resend button has 60-second cooldown

**Steps:**
1. After sending magic link, check resend button
2. Wait for countdown
3. Try clicking when available

**Expected Results:**
- ✅ Button disabled initially
- ✅ Shows "Resend available in Xs"
- ✅ Countdown from 60 to 0
- ✅ Button becomes enabled after 60 seconds
- ✅ Clicking resends link (new 60s cooldown)

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 4: Rate Limiting (3 per hour)
**Goal:** Verify rate limiting prevents abuse

**Steps:**
1. Send magic link 3 times (wait 60s between each)
2. Try to send 4th link

**Expected Results:**
- ✅ First 3 attempts succeed
- ✅ 4th attempt shows error
- ✅ Error message: "Too many magic link requests. Please try again in X minutes."

**Database Check:**
```sql
SELECT * FROM auth_rate_limits 
WHERE identifier = 'your-email@example.com' 
AND action_type = 'magic_link';
```

**Expected Data:**
- `attempts`: 3
- `window_start`: Time of first attempt
- `locked_until`: ~60 minutes from first attempt

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 5: Verify Valid Token (API Test)
**Goal:** Verify magic link token validation

**Test with curl:**
```bash
# Step 1: Get token from database
TOKEN=$(psql $DATABASE_URL -t -c "SELECT token FROM magic_links WHERE email = 'test@example.com' ORDER BY created_at DESC LIMIT 1;")

# Step 2: Verify token
curl -X POST http://localhost:3005/api/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "email": "test@example.com",
  "message": "Magic link verified successfully"
}
```

**Database Check After:**
```sql
SELECT used, used_at FROM magic_links WHERE token = 'YOUR_TOKEN';
```

**Expected:**
- `used`: true
- `used_at`: Current timestamp

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 6: One-Time Use Enforcement
**Goal:** Verify token can only be used once

**Steps:**
1. Get a valid token
2. Verify it (should succeed)
3. Try to verify same token again

**Test with curl:**
```bash
TOKEN="your-token-here"

# First verification (should succeed)
curl -X POST http://localhost:3005/api/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}"

# Second verification (should fail)
curl -X POST http://localhost:3005/api/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}"
```

**Expected Results:**
- ✅ First request: `{"success": true, "email": "..."}`
- ✅ Second request: `{"success": false, "errorCode": "USED"}`

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 7: Token Expiration (15 minutes)
**Goal:** Verify tokens expire after 15 minutes

**Steps:**
1. Create a magic link
2. Manually update `expires_at` to past time:

```sql
UPDATE magic_links 
SET expires_at = NOW() - INTERVAL '1 minute'
WHERE email = 'test@example.com';
```

3. Try to verify the token

**Test with curl:**
```bash
curl -X POST http://localhost:3005/api/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"expired-token\"}"
```

**Expected Response:**
```json
{
  "success": false,
  "error": "This link has expired. Please request a new one.",
  "errorCode": "EXPIRED"
}
```

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 8: Invalid Token
**Goal:** Verify invalid tokens are rejected

**Test with curl:**
```bash
curl -X POST http://localhost:3005/api/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid-token-12345"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Invalid or expired link",
  "errorCode": "INVALID"
}
```

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 9: Empty State Helper
**Goal:** Verify "didn't receive email" helper appears

**Steps:**
1. Send magic link
2. Wait 30 seconds

**Expected Results:**
- ✅ After 30 seconds, helper box appears
- ✅ Shows "Didn't receive the email?"
- ✅ Lists helpful tips (check spam, wait, verify email)
- ✅ Has "Click here to resend" link (if cooldown expired)

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 10: UI Responsiveness
**Goal:** Verify UI works on mobile

**Steps:**
1. Open in mobile browser or resize to mobile width
2. Send magic link

**Expected Results:**
- ✅ All text is readable
- ✅ Buttons are tappable
- ✅ Countdown timer visible
- ✅ No horizontal scroll
- ✅ Email address doesn't overflow

**Status:** ⬜ Pass  ⬜ Fail

---

## 📊 TEST SUMMARY

**Total Tests:** 10  
**Passed:** ___  
**Failed:** ___  
**Pass Rate:** ___%

**Critical Failures:** (List any critical issues)
- 
- 

**Notes:**
- 
- 

---

## 🔧 TROUBLESHOOTING

### Token not created
**Check:** Is database migration applied?
```sql
SELECT * FROM magic_links LIMIT 1;
```

### Timer not counting down
**Check:** Browser console for JS errors

### Rate limiting not working
**Check:** Rate limiter table
```sql
SELECT * FROM auth_rate_limits;
```

### Email not sent (expected in dev)
**Note:** Email sending is mocked in development
- Check console logs for token
- Or query database directly

---

## ✅ ACCEPTANCE CRITERIA

Feature is ready for production when:

- ✅ All 10 tests pass
- ✅ No console errors
- ✅ Database records correct
- ✅ UI is responsive
- ✅ Rate limiting works
- ✅ One-time use enforced
- ✅ 15-minute expiration works
- ✅ Error messages clear

**Signed off by:** _________________  
**Date:** _________________
