# Rate Limiting Manual Test Guide

**Purpose:** Verify rate limiting works correctly in the actual application

---

## **Test 1: Login Rate Limiting (5 attempts per 15 minutes)**

### **Steps:**
1. Go to: `http://localhost:3005/auth/signin`
2. Enter email: `test@example.com`
3. Enter wrong password
4. Click "Sign In"
5. Repeat steps 3-4 **5 more times** (total 6 attempts)

### **Expected Results:**
- ✅ Attempts 1-5: Should show "Invalid email or password"
- ✅ Attempt 6: Should show rate limit message:
  ```
  ⚠ Too many attempts
  You've tried to sign in too many times.
  🕒 Try again in 15 minutes
  Need help? Contact support
  ```
- ✅ Sign In button should be **disabled**
- ✅ Timer should count down (updates every minute)

### **Cleanup:**
Wait 15 minutes OR manually delete from database:
```sql
DELETE FROM auth_rate_limits WHERE identifier = 'test@example.com';
```

---

## **Test 2: Rate Limit Clears on Success**

### **Steps:**
1. Attempt wrong password 3 times
2. Enter **correct** password
3. Sign in successfully
4. Sign out
5. Try wrong password again

### **Expected Results:**
- ✅ After successful sign-in, rate limit count should reset
- ✅ Can attempt wrong password again without immediate lockout

---

## **Test 3: Different Action Types (Independent Tracking)**

### **Steps:**
1. Attempt login 3 times (wrong password)
2. Click "Forgot Password"
3. Request password reset 3 times
4. Return to sign-in page
5. Try login again

### **Expected Results:**
- ✅ Login attempts: 3/5 used
- ✅ Password reset attempts: 3/3 used (separate tracking)
- ✅ Both tracked independently

---

## **Test 4: Window Expiration**

### **Steps:**
1. Get locked out (6 failed attempts)
2. Wait 15 minutes
3. Try to sign in again

### **Expected Results:**
- ✅ After 15 minutes, lockout expires
- ✅ Can attempt sign-in again
- ✅ Counter resets to 0

---

## **Test 5: Error Messages Are Clear**

### **Expected Messages:**

**After 5 attempts:**
```
⚠ Too many attempts
You've tried to sign in too many times.
🕒 Try again in 14 minutes
Need help? Contact support
```

**Timer updates:**
- Shows minutes remaining
- Updates every minute
- Formats nicely (e.g., "1 hour and 30 minutes")

---

## **Test 6: Database Verification**

### **Check database after failed attempts:**
```sql
SELECT * FROM auth_rate_limits 
WHERE identifier = 'test@example.com';
```

**Expected columns:**
- `identifier`: Email address
- `attempt_type`: 'login'
- `attempts`: Number of failed attempts (1-5)
- `window_start`: Timestamp of first attempt
- `locked_until`: Lockout expiration time (after 5 attempts)
- `last_attempt_at`: Most recent attempt

---

## **Test 7: Multiple Users**

### **Steps:**
1. User A: Fail 5 times → Gets locked out
2. User B: Try to sign in
3. User B should NOT be locked out

### **Expected Results:**
- ✅ Rate limits are per-user (per email)
- ✅ One user's lockout doesn't affect others

---

## **Test 8: Client-Side Behavior**

### **Check browser console:**
```javascript
// After lockout, check console for:
[AuthForm Debug] rateLimited: { active: true, retryAfterMinutes: 15, type: 'login' }
```

### **Check UI:**
- ✅ Rate limit message shows
- ✅ Button is disabled
- ✅ Timer displays correctly
- ✅ No other errors shown

---

## **Quick Verification Checklist**

- [ ] Can fail 5 times before lockout
- [ ] 6th attempt triggers lockout
- [ ] Clear error message with time remaining
- [ ] Button disabled during lockout
- [ ] Timer counts down
- [ ] Successful login clears rate limit
- [ ] Different action types tracked separately
- [ ] Window expires after configured time
- [ ] Per-user tracking (not global)
- [ ] Database records attempts correctly

---

## **Performance Check**

### **Expected:**
- ✅ Rate limit check adds < 50ms to auth flow
- ✅ No noticeable delay for users
- ✅ Database queries are fast (indexed)

### **Monitor:**
```
Check server logs for:
[RATE_LIMIT] Check failed: (should be rare)
[RATE_LIMIT] Unexpected error: (should never happen)
```

---

## **Success Criteria**

✅ All 8 tests pass  
✅ No console errors  
✅ Database records correct  
✅ UX is clear and helpful  
✅ Performance is good  

**Status:** Rate limiting is production-ready! 🎉
