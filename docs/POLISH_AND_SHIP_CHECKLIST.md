# Polish & Ship Checklist

**Date:** October 17, 2025  
**Status:** Final QA Before Production

---

## ✅ PHASE 1: UI POLISH (COMPLETE)

### **UserMenu Integration**
- [x] UserMenu component created
- [x] Added to TopNav header
- [x] Avatar with initials fallback
- [x] Dropdown with all settings links
- [x] Sign out functionality
- [x] Loading states

### **Navigation Enhancement**
- [x] Sticky header (stays on scroll)
- [x] Dashboard, Vehicles, Maintenance links
- [x] Hover effects
- [x] Responsive design

### **Settings Pages**
- [x] Profile settings page
- [x] Security settings page
- [x] Sessions page with real data
- [x] Notifications settings page
- [x] Tab navigation layout

---

## 🧪 PHASE 2: COMPLETE USER FLOW TESTING

### **Test 1: Sign In & Navigation**

**Steps:**
1. Go to `http://localhost:3005`
2. Click "Sign In" (or go to `/auth/signin`)
3. Sign in with Google
4. Should land on `/dashboard`
5. Check header has UserMenu (avatar)
6. Click on UserMenu

**Expected:**
- ✅ Avatar shows user initials
- ✅ Dropdown shows: Profile, Settings, Active Sessions, Sign out
- ✅ All links work

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 2: Settings Navigation**

**Steps:**
1. From dashboard, click UserMenu → Settings
2. Should go to `/settings/security`
3. Click through all tabs:
   - Profile
   - Security
   - Active Sessions
   - Notifications

**Expected:**
- ✅ All tabs clickable
- ✅ URL changes correctly
- ✅ Active tab highlighted
- ✅ Content loads

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 3: Active Sessions Page**

**Steps:**
1. Go to `/settings/sessions`
2. Page should load sessions from database

**Expected:**
- ✅ Shows current device
- ✅ Shows "Current device" badge
- ✅ Displays device info (browser, OS)
- ✅ Shows location (if available)
- ✅ Shows last active time
- ✅ "Sign out" button on other devices
- ✅ "Sign out all other devices" button

**Test Result:** ⬜ Pass ⬜ Fail

**Database Check:**
```bash
psql $DATABASE_URL -c "
SELECT 
  device_name,
  browser,
  os,
  location_city,
  last_active_at
FROM sessions
ORDER BY last_active_at DESC;
"
```

---

### **Test 4: Login Tracking Verification**

**Steps:**
1. Sign out
2. Sign in again
3. Check database

**Database Check:**
```bash
psql $DATABASE_URL -c "
SELECT 
  user_id,
  last_login_method,
  last_login_at,
  login_count
FROM user_login_preferences
ORDER BY last_login_at DESC;
"
```

**Expected:**
- ✅ Login count incremented
- ✅ Timestamp updated
- ✅ Method recorded (google/credentials)

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 5: Password Reset Flow**

**Steps:**
1. Sign out
2. Go to `/auth/reset-password`
3. Enter email
4. Click "Send reset link"
5. Check database for token
6. Visit `/auth/reset-password/confirm?token=YOUR_TOKEN`
7. Set new password

**Database Check:**
```bash
psql $DATABASE_URL -c "
SELECT email, token, expires_at, used
FROM password_reset_tokens
ORDER BY created_at DESC
LIMIT 3;
"
```

**Expected:**
- ✅ Email sent confirmation page
- ✅ Token created in database
- ✅ Reset page loads
- ✅ Password strength meter works
- ✅ Can set new password
- ✅ Token marked as used

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 6: Rate Limiting**

**Steps:**
1. Sign out
2. Try signing in with wrong password 6 times

**Expected:**
- ✅ First 5 attempts show "Invalid email or password"
- ✅ 6th attempt shows "Too many login attempts. Try again in X minutes"
- ✅ Clear error message with retry time

**Database Check:**
```bash
psql $DATABASE_URL -c "
SELECT 
  identifier,
  attempt_type,
  attempts,
  locked_until
FROM auth_rate_limits
WHERE attempt_type = 'login'
ORDER BY last_attempt_at DESC;
"
```

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 7: Session Tracking**

**Steps:**
1. Sign in
2. Browse around the app (dashboard, settings)
3. Wait 10 seconds
4. Check database

**Database Check:**
```bash
psql $DATABASE_URL -c "
SELECT 
  device_name,
  browser,
  os,
  ip_address,
  location_city,
  last_active_at,
  created_at
FROM sessions
ORDER BY last_active_at DESC
LIMIT 3;
"
```

**Expected:**
- ✅ Session created on sign in
- ✅ last_active_at updates as you browse
- ✅ Device info captured
- ✅ Location tracked (if available)

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 8: Sign Out All Devices**

**Steps:**
1. Sign in on browser A
2. Open incognito (browser B)
3. Sign in on browser B
4. Check sessions: should see 2 sessions
5. On browser B, go to `/settings/sessions`
6. Click "Sign out all other devices"

**Expected:**
- ✅ Browser A gets signed out
- ✅ Browser B stays signed in
- ✅ Sessions page shows only 1 session

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 9: Mobile Responsiveness**

**Steps:**
1. Resize browser to mobile width (< 640px)
2. Navigate through:
   - Sign in page
   - Dashboard
   - Settings pages
   - Sessions page

**Expected:**
- ✅ All text readable
- ✅ Buttons tappable
- ✅ No horizontal scroll
- ✅ Menu collapses properly
- ✅ Forms work

**Test Result:** ⬜ Pass ⬜ Fail

---

### **Test 10: Error States**

**Steps:**
1. Try invalid email format
2. Try weak password
3. Try accessing `/settings/sessions` while signed out
4. Try invalid reset token

**Expected:**
- ✅ Clear error messages
- ✅ Validation feedback
- ✅ Redirect to signin when needed
- ✅ No crashes

**Test Result:** ⬜ Pass ⬜ Fail

---

## 🔒 PHASE 3: SECURITY AUDIT

### **Token Security**

**Check:**
```bash
# Magic links
psql $DATABASE_URL -c "SELECT token, expires_at, used FROM magic_links LIMIT 1;"

# Password reset
psql $DATABASE_URL -c "SELECT token, expires_at, used FROM password_reset_tokens LIMIT 1;"

# Email verification
psql $DATABASE_URL -c "SELECT token, expires_at FROM email_verification_tokens LIMIT 1;"
```

**Verify:**
- [ ] Tokens are random and secure (64 chars)
- [ ] Expiration times set correctly
- [ ] One-time use enforced (used flag)

---

### **Rate Limiting**

**Verify:**
```bash
psql $DATABASE_URL -c "SELECT * FROM auth_rate_limits;"
```

- [ ] Login attempts limited (5 per 15 min)
- [ ] Password reset limited (3 per hour)
- [ ] Magic links limited (3 per hour)
- [ ] Email verification limited (1 per 5 min)

---

### **Password Security**

**Check:**
```bash
psql $DATABASE_URL -c "SELECT password_hash FROM user_tenants LIMIT 1;"
```

- [ ] Passwords are hashed (bcrypt)
- [ ] Hashes are different for same password
- [ ] Original passwords not stored

---

### **Session Security**

**Verify:**
```bash
psql $DATABASE_URL -c "SELECT device_id, ip_address, last_active_at FROM sessions;"
```

- [ ] Device IDs are unique
- [ ] IP addresses recorded
- [ ] Last active timestamps update
- [ ] Old sessions cleaned up (>30 days)

---

## 📦 PHASE 4: PRE-DEPLOYMENT CHECKLIST

### **Environment Variables**

Verify all required env vars are set:
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

---

### **Database Migrations**

**Check:**
```bash
psql $DATABASE_URL -c "
SELECT tablename 
FROM pg_tables 
WHERE tablename IN (
  'user_login_preferences',
  'auth_rate_limits',
  'magic_links',
  'password_reset_tokens',
  'email_verification_tokens',
  'sessions'
)
ORDER BY tablename;
"
```

**Expected:** All 6 tables exist

- [ ] All Day 1 migrations applied
- [ ] Tables created correctly
- [ ] Indexes in place
- [ ] RLS policies active

---

### **Code Quality**

- [ ] No console.errors in production code
- [ ] All TypeScript errors resolved
- [ ] No hardcoded secrets
- [ ] Environment-specific configs
- [ ] Proper error handling

---

### **Performance**

- [ ] Images optimized
- [ ] No unnecessary re-renders
- [ ] Database queries optimized
- [ ] Proper loading states
- [ ] Fast page loads (< 2s)

---

### **Documentation**

- [ ] README updated
- [ ] API docs current
- [ ] Environment setup guide
- [ ] Deployment guide
- [ ] User guide

---

## 🚀 PHASE 5: DEPLOYMENT

### **Staging Deployment**

**Steps:**
1. Create staging branch
2. Deploy to staging environment
3. Run all tests on staging
4. Verify environment variables
5. Check database connections

**Checklist:**
- [ ] Staging URL accessible
- [ ] Google OAuth works
- [ ] Database connected
- [ ] All pages load
- [ ] No errors in logs

---

### **Production Deployment**

**Prerequisites:**
- [ ] All staging tests passed
- [ ] Code reviewed
- [ ] Environment variables set
- [ ] Database backed up
- [ ] Rollback plan ready

**Steps:**
1. Tag release version
2. Deploy to production
3. Monitor logs
4. Test critical flows
5. Announce to team

---

## 📊 TEST SUMMARY

**Total Tests:** 10 user flows + Security audit  
**Passed:** ___  
**Failed:** ___  
**Pass Rate:** ___%

---

## ✅ FINAL SIGN-OFF

**Tested By:** _________________  
**Date:** _________________  
**Status:** ⬜ Ready for Production ⬜ Needs Work

**Notes:**
- 
- 
- 

---

**Next Steps After Production:**
1. Monitor error rates
2. Track login success rates
3. Review session data
4. Plan Day 2 features (2FA, alerts)
5. Add email sender integration
