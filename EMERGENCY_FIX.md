# 🚨 EMERGENCY FIXES - DO THIS NOW

**Date:** October 17, 2025 10:17 AM

---

## ISSUE 1: Database Schema Missing Columns ❌

**Error:** `column "device_id" of relation "sessions" does not exist`

**Fix:** Run this migration immediately:

```bash
source .env.local && psql "$DATABASE_URL" -f supabase/migrations/20251017_04_fix_sessions_schema.sql
```

**What it does:** Adds missing columns to sessions table:
- `device_id` (unique identifier)
- `device_name` (Mac, iPhone, etc.)
- `browser_version`
- `os_version`
- `location_flag`
- `last_active`

---

## ISSUE 2: Google Sign-In Not Working ❌

**Symptom:** Nothing happens when clicking "Sign in with Google"

**Possible Causes:**
1. JavaScript error in console
2. NextAuth configuration issue
3. Browser cache

**Immediate Fix Steps:**

### Step 1: Check Browser Console
Open DevTools (F12 or Cmd+Option+I) and look for errors

### Step 2: Clear Browser Cache
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Or clear all cache
3. Try in Incognito/Private window

### Step 3: Restart Dev Server
```bash
# Kill the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Check Environment Variables
```bash
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
```

All should have values. If empty, restart terminal and server.

---

## QUICK TEST AFTER FIXES

### 1. Test Database Fix
```bash
# This should work now (no errors):
source .env.local && psql "$DATABASE_URL" -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;
"
```

### 2. Test Google Sign-In
1. Go to http://localhost:3005/auth/signin
2. Open browser console (F12)
3. Click "Sign in with Google"
4. Should redirect to Google OAuth
5. After Google auth, should redirect back to /dashboard

**If still not working:**
- Check console for errors
- Check terminal for NextAuth logs
- Try incognito window
- Check .env.local file has correct values

---

## WHAT TO CHECK IN CONSOLE

### Good Signs ✅:
```
[NextAuth] Config check: {
  hasClientId: true,
  hasClientSecret: true,
  hasSecret: true,
  nextAuthUrl: 'http://localhost:3005'
}
```

### Bad Signs ❌:
- `hasClientId: false` → Google OAuth not configured
- Any JavaScript errors
- `Failed to fetch` errors
- CORS errors

---

## IF GOOGLE SIGN-IN STILL BROKEN

### Option A: Use Credentials Instead
The app also supports email/password:
1. On sign-in page, enter email
2. Enter password
3. Click "Sign in"

### Option B: Check NextAuth Config
```bash
# View the config:
cat app/api/auth/[...nextauth]/route.ts | grep -A 5 "GoogleProvider"
```

Should see:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
}),
```

### Option C: Nuclear Option - Restart Everything
```bash
# 1. Kill server
# 2. Clear Next.js cache
rm -rf .next

# 3. Reinstall dependencies
npm install

# 4. Restart
npm run dev
```

---

## ROLLBACK IF NEEDED

If things get worse, you can rollback:

```bash
# See recent commits:
git log --oneline -5

# Rollback to before today's changes:
git reset --hard HEAD~5

# Restart server:
npm run dev
```

---

## SUCCESS CRITERIA

After fixes, you should be able to:
- [x] Click "Sign in with Google" → Redirects to Google
- [x] After Google auth → Redirects to /dashboard
- [x] No database errors in terminal
- [x] Sessions page loads (even if empty)
- [x] Profile page loads with your data
- [x] No console errors

---

## NEXT STEPS AFTER FIXES

1. Test Google sign-in (main priority)
2. Test sessions page
3. Test profile page
4. Commit fixes
5. Continue with integration work

---

## GET HELP

If still broken after these fixes:
1. Share error from browser console
2. Share error from terminal
3. Share screenshot of sign-in page
4. Check .env.local has all required vars
