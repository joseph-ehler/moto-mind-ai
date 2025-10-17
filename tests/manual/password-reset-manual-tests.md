# Password Reset Manual Test Guide

**Feature:** Complete Password Reset Flow with 1-hour expiration  
**Date:** October 17, 2025  
**Tester:** _________________

---

## ✅ TEST CHECKLIST

### Test 1: Request Password Reset (Happy Path)
**Goal:** Verify reset request is sent successfully

**Steps:**
1. Go to `http://localhost:3005/auth/signin`
2. Click "Forgot password?" link
3. Enter your email address
4. Click "Send reset link"

**Expected Results:**
- ✅ "Check your email" screen appears
- ✅ Shows your email address
- ✅ Message: "If an account exists for [email], you'll receive a password reset link"
- ✅ Shows helpful tips (check spam, 1 hour expiration)
- ✅ "Try different email" button available

**Database Check:**
```sql
SELECT * FROM password_reset_tokens 
WHERE email = 'your-email@example.com' 
ORDER BY created_at DESC LIMIT 1;
```

**Expected Data:**
- `token`: 64-character hex string
- `email`: Your email
- `user_id`: Your user UUID
- `expires_at`: ~1 hour from now
- `used`: false
- `ip_address`: Your IP

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 2: Rate Limiting (3 per hour)
**Goal:** Verify rate limiting prevents abuse

**Steps:**
1. Request password reset 3 times (wait a moment between each)
2. Try to request a 4th time

**Expected Results:**
- ✅ First 3 attempts succeed
- ✅ 4th attempt shows error
- ✅ Error: "Too many reset requests. Please try again in X minutes."

**Database Check:**
```sql
SELECT * FROM auth_rate_limits 
WHERE identifier = 'your-email@example.com' 
AND action_type = 'password_reset';
```

**Expected Data:**
- `attempts`: 3
- `window_start`: Time of first attempt
- `locked_until`: ~60 minutes from first attempt

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 3: Verify Reset Token (Valid Token)
**Goal:** Verify token validation page works

**Steps:**
1. Request password reset
2. Get token from database:
```sql
SELECT token FROM password_reset_tokens 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC LIMIT 1;
```
3. Visit: `http://localhost:3005/auth/reset-password/confirm?token=YOUR_TOKEN`

**Expected Results:**
- ✅ Page loads successfully
- ✅ Shows "Set New Password" heading
- ✅ Shows email address
- ✅ Two password input fields visible
- ✅ Password strength meter appears when typing
- ✅ No error messages

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 4: Password Strength Meter
**Goal:** Verify strength meter provides real-time feedback

**Steps:**
1. On reset confirm page, enter passwords:
   - "pass" → Should show "Weak"
   - "password" → Should show "Weak"
   - "Password1" → Should show "Fair" or "Good"
   - "Password1!" → Should show "Strong" or "Very Strong"

**Expected Results:**
- ✅ Progress bar fills as password gets stronger
- ✅ Color changes: red → orange → yellow → green
- ✅ Requirements checklist updates in real-time:
  - ✅ At least 8 characters
  - ✅ One uppercase letter
  - ✅ One lowercase letter
  - ✅ One number
  - ✅ One special character
- ✅ Label changes: Weak → Fair → Good → Strong → Very Strong
- ✅ Helpful tips appear for weak passwords

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 5: Password Confirmation Validation
**Goal:** Verify passwords must match

**Steps:**
1. On reset confirm page:
2. Enter password: "Password123!"
3. Enter confirm: "Password123!"
4. Observe match indicator

**Expected Results:**
- ✅ Shows "✓ Passwords match" in green
- ✅ Submit button enabled

**Then:**
5. Change confirm to: "Different123!"

**Expected Results:**
- ✅ Shows "✗ Passwords do not match" in red
- ✅ Trying to submit shows error

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 6: Complete Password Reset (Happy Path)
**Goal:** Verify full reset flow works end-to-end

**Steps:**
1. Request password reset
2. Get token from database
3. Visit reset confirm page with token
4. Enter new password: "NewPassword123!"
5. Confirm password: "NewPassword123!"
6. Click "Update Password"

**Expected Results:**
- ✅ Success screen appears
- ✅ Shows checkmark animation
- ✅ Message: "Password Updated!"
- ✅ Security notice: "All other devices have been signed out"
- ✅ Auto-redirects to sign in after 3 seconds

**Database Check After:**
```sql
-- Token should be marked as used
SELECT used, used_at FROM password_reset_tokens 
WHERE token = 'YOUR_TOKEN';

-- Password should be updated
SELECT password_hash FROM user_tenants 
WHERE email = 'test@example.com';

-- Sessions should be invalidated (except current)
SELECT * FROM sessions 
WHERE user_id = 'YOUR_USER_ID';
```

**Expected:**
- `used`: true
- `used_at`: Current timestamp
- `password_hash`: New hash (different from before)
- Most sessions deleted

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 7: Token Expiration (1 hour)
**Goal:** Verify tokens expire after 1 hour

**Steps:**
1. Create a reset token
2. Manually update expiration to past:
```sql
UPDATE password_reset_tokens 
SET expires_at = NOW() - INTERVAL '1 minute'
WHERE email = 'test@example.com';
```
3. Try to visit reset confirm page

**Expected Results:**
- ✅ "Invalid Reset Link" error page
- ✅ Message: "Invalid or expired reset link"
- ✅ Explanation: "This link may have expired or already been used"
- ✅ "Request a new reset link" button
- ✅ "Back to sign in" button

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 8: One-Time Use Enforcement
**Goal:** Verify token can only be used once

**Steps:**
1. Request password reset
2. Get token from database
3. Visit reset confirm page
4. Complete password reset successfully
5. Try to use same token again

**Expected Results:**
- ✅ First use: Success
- ✅ Second use: "Invalid Reset Link" error page
- ✅ Database shows `used: true`

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 9: Invalid Token
**Goal:** Verify invalid tokens are rejected

**Steps:**
1. Visit: `http://localhost:3005/auth/reset-password/confirm?token=invalid-token-123`

**Expected Results:**
- ✅ "Invalid Reset Link" error page
- ✅ Clear error message
- ✅ Actionable buttons

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 10: Weak Password Rejection
**Goal:** Verify weak passwords are rejected

**Steps:**
1. On reset confirm page
2. Try passwords that don't meet requirements:
   - "pass" (too short)
   - "password" (no uppercase/number/symbol)
   - "Password" (no number/symbol)
   - "Password1" (no symbol)
3. Try to submit each

**Expected Results:**
- ✅ Password strength meter shows "Weak" or "Fair"
- ✅ Requirements checklist shows unmet items
- ✅ Submitting shows error message
- ✅ Clear feedback on what's missing

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 11: Session Invalidation
**Goal:** Verify all sessions are killed except current

**Steps:**
1. Sign in on Device A (or browser A)
2. Open incognito/different browser (Device B)
3. Sign in with same account on Device B
4. Check sessions table:
```sql
SELECT * FROM sessions WHERE user_id = 'YOUR_USER_ID';
```
5. On Device B, request password reset
6. Complete password reset on Device B
7. Check sessions table again

**Expected Results:**
- ✅ Before reset: 2 sessions exist
- ✅ After reset: Only Device B session exists
- ✅ Device A is signed out
- ✅ Device B stays signed in

**Status:** ⬜ Pass  ⬜ Fail

---

### Test 12: UI Responsiveness
**Goal:** Verify UI works on mobile

**Steps:**
1. Open on mobile or resize to mobile width
2. Go through reset flow

**Expected Results:**
- ✅ All text readable
- ✅ Buttons tappable
- ✅ Password strength meter visible
- ✅ No horizontal scroll
- ✅ Forms fill viewport appropriately

**Status:** ⬜ Pass  ⬜ Fail

---

## 📊 TEST SUMMARY

**Total Tests:** 12  
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
**Check:** Database migration applied?
```sql
SELECT * FROM password_reset_tokens LIMIT 1;
```

### Password strength meter not showing
**Check:** Browser console for errors

### Sessions not invalidated
**Check:** Sessions table exists:
```sql
SELECT * FROM sessions;
```

### Rate limiting not working
**Check:** Rate limiter table:
```sql
SELECT * FROM auth_rate_limits WHERE action_type = 'password_reset';
```

---

## ✅ ACCEPTANCE CRITERIA

Feature is ready for production when:

- ✅ All 12 tests pass
- ✅ No console errors
- ✅ Database records correct
- ✅ UI is responsive
- ✅ Rate limiting works
- ✅ One-time use enforced
- ✅ 1-hour expiration works
- ✅ Password strength validated
- ✅ Sessions invalidated
- ✅ Error messages clear

**Signed off by:** _________________  
**Date:** _________________
