# Quick Fix: Sessions Not Showing

## Issue
Sessions page shows "No active sessions" even after signing in.

## Root Causes

### 1. Middleware Edge Runtime Issue (FIXED)
- ✅ Fixed crypto module issue
- Now using Web Crypto API

### 2. Sessions Not Being Created
Possible reasons:
- Middleware not calling trackSession properly
- user_id mismatch in database
- Session creation failing silently

### 3. Sessions API Query Issue
- API might be querying with wrong user_id format
- Sessions table might be empty

## Quick Diagnosis

Run these queries to check:

```bash
# 1. Check if sessions table exists and has data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"

# 2. Check what user_id format is being used
psql $DATABASE_URL -c "SELECT DISTINCT user_id FROM sessions LIMIT 5;"

# 3. Check if any sessions exist for your email
psql $DATABASE_URL -c "SELECT * FROM sessions WHERE user_id = 'joseph.ehler@gmail.com';"

# 4. Check login preferences (what we use for tracking)
psql $DATABASE_URL -c "SELECT * FROM user_login_preferences WHERE user_id = 'joseph.ehler@gmail.com';"
```

## Immediate Fix Options

### Option A: Manual Session Creation
Create a session manually to test the UI:

```sql
INSERT INTO sessions (
  user_id,
  device_id,
  device_type,
  device_name,
  browser,
  os,
  ip_address,
  created_at,
  last_active
) VALUES (
  'joseph.ehler@gmail.com',
  'test-device-1',
  'desktop',
  'Mac',
  'Chrome',
  'macOS',
  '127.0.0.1',
  NOW(),
  NOW()
);
```

### Option B: Force Session Creation on Next Request
The middleware should create it automatically, but we can force it by:
1. Sign out completely
2. Clear browser cache
3. Sign in again
4. Browse a few pages

### Option C: Call Track Session Directly
Add explicit session tracking in NextAuth callback:

```typescript
// In app/api/auth/[...nextauth]/route.ts
async signIn({ user, account }) {
  // ... existing login tracking ...
  
  // Force session creation
  if (user?.email) {
    try {
      await trackSession(
        user.email,
        'Chrome/120.0 (Macintosh; Intel Mac OS X 10_15_7)',
        '127.0.0.1'
      )
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }
  
  return true
}
```

## Expected Behavior

After fix, visiting `/settings/sessions` should show:
```
Active Sessions (1)

🖥️ Mac • Chrome
Current device
San Francisco, United States
Active now • Created 5 minutes ago
```

## Verification Steps

1. Visit `/settings/sessions`
2. Should see at least 1 session (current device)
3. Session should show:
   - Device name (Mac/Windows)
   - Browser (Chrome/Safari/Firefox)
   - Location (if available)
   - Last active time
   - "Current device" badge

## If Still Not Working

Check browser console and terminal for:
- [ ] No middleware errors
- [ ] No database connection errors
- [ ] Session creation logs
- [ ] API response status (should be 200, not 500)

Then check database directly:
```bash
psql $DATABASE_URL -c "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1;"
```

If table is empty → Session creation is failing
If table has data → API query issue
