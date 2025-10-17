# ⚡ Quick Fix Checklist - Get Auth Working NOW

## 🎯 The ONE Thing You MUST Do

**Run this SQL in Supabase (2 minutes):**

1. Open: https://supabase.com/dashboard/project/ucbbzzoimghnaoihyqbd/sql/new

2. Paste the contents of: `supabase/migrations/20251017_08_sessions_bulletproof.sql`

3. Click **RUN**

4. Wait for: `🎉 Migration complete - sessions table is bulletproof!`

---

## ✅ Then Test (30 seconds)

```bash
# 1. Restart dev server
Ctrl+C
npm run dev

# 2. Open incognito window
Cmd+Shift+N (Chrome) or Cmd+Shift+P (Safari)

# 3. Sign in
http://localhost:3005/auth/signin

# 4. Check sessions
http://localhost:3005/settings/sessions
```

---

## 🔍 What Should Happen

### **Terminal (no more errors):**
```
✅ [NextAuth] 🔐 Sign-in event: your@email.com
✅ [SESSION] ✅ Tracked session for user your@email.com
```

### **Browser (sessions page):**
```
Active Sessions (1)

🖥️ Mac • Chrome 141.0
Current device
IP: ::1
Last active: just now
First seen: [timestamp]
```

---

## 🚨 If Still Broken

**Check migration ran:**
```sql
-- Run in Supabase SQL editor
SELECT is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND column_name = 'session_token';

-- Should return: YES
```

If returns `NO` → migration didn't run → re-run it

---

## 📚 Full Documentation

See: `docs/BULLETPROOF_AUTH_GUIDE.md` for complete details

---

## ⏱️ Time Estimate

- Apply migration: 2 minutes
- Test: 30 seconds
- **Total: 3 minutes to fully working**

---

**That's it. Do the migration. Everything works.**
