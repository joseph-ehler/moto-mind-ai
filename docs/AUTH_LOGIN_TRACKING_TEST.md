# 🧪 Testing Last Login Method Tracking

**Quick test guide for Google OAuth login tracking**

---

## ✅ What Was Fixed

### **Issue:**
- User signed in with Google
- "Welcome back!" message didn't show
- Login method wasn't being tracked

### **Root Cause:**
1. **Google OAuth flow** doesn't require typing email first
2. **No tracking** in OAuth callback handler
3. **No localStorage** to remember returning users

### **Solution:**
1. ✅ Track login method in OAuth callback
2. ✅ Save email to localStorage after OAuth
3. ✅ Check localStorage on page load
4. ✅ Show "Welcome back!" for returning users

---

## 🧪 Testing Steps

### **Test 1: First-Time Google Sign-In**

1. **Clear everything:**
   ```javascript
   // In browser console:
   localStorage.clear()
   ```

2. **Sign out** (if signed in)

3. **Visit:** http://localhost:3005/signin

4. **Click:** "Continue with Google"

5. **Complete** Google OAuth

6. **Expected:**
   - ✅ Redirected to `/track`
   - ✅ Console shows: "Recording Google login for user: [id]"
   - ✅ Console shows: "Login method recorded"

7. **Check localStorage:**
   ```javascript
   localStorage.getItem('motomind_last_email')
   // Should show your email
   ```

---

### **Test 2: Return Visit (Google User)**

1. **Sign out** or open new incognito window

2. **Visit:** http://localhost:3005/signin

3. **Expected:**
   - ✅ Email field pre-filled with your email
   - ✅ "Welcome back!" heading shows
   - ✅ Blue banner: "We remember you! You last signed in with **Google**"

4. **Click:** "Continue with Google" again

5. **Expected:**
   - ✅ Signs in successfully
   - ✅ login_count incremented in database

---

### **Test 3: Database Verification**

**In Supabase SQL Editor:**

```sql
-- Check if your login was recorded
SELECT * FROM user_login_preferences
WHERE user_id = 'YOUR_USER_ID';

-- Should show:
-- user_id | last_login_method | login_count | last_login_at
-- --------|-------------------|-------------|---------------
-- [id]    | google           | 1           | [timestamp]
```

**After second login:**
```sql
-- Check if count incremented
SELECT login_count FROM user_login_preferences
WHERE user_id = 'YOUR_USER_ID';

-- Should show: 2
```

---

### **Test 4: Email/SMS Users**

**Email users should also work:**

1. Visit `/signin`
2. Click **Email** tab
3. Type your email
4. After 500ms → "Welcome back!" banner if returning user
5. Send magic link → Sign in
6. Check database → `last_login_method = 'email'`

**SMS users:**

1. Visit `/signin`
2. Click **SMS** tab  
3. Enter phone
4. Send code → Sign in
5. Check database → `last_login_method = 'sms'`

---

## 🐛 Troubleshooting

### **Issue: "Welcome back!" not showing**

**Check 1: localStorage**
```javascript
localStorage.getItem('motomind_last_email')
// Should return your email
```

**Check 2: Database**
```sql
SELECT * FROM get_login_preferences_by_email('your@email.com');
-- Should return a row
```

**Check 3: Migration**
```sql
-- Verify function exists
SELECT proname FROM pg_proc 
WHERE proname = 'get_login_preferences_by_email';
-- Should return 1 row
```

---

### **Issue: Database query fails**

**Check users table:**
```sql
SELECT * FROM users WHERE email = 'your@email.com';
```

**If no users table or no row:**
This might be the issue! The login tracking needs:
1. `users` table with email column
2. Your user record in that table

**Quick fix:**
```sql
-- Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'users'
);
```

---

### **Issue: Tracking API fails**

**Check browser console for:**
```
[Callback] Recording Google login for user: [id]
[Callback] Login method recorded ✓
```

**If you see errors:**
1. Check network tab for `/api/auth/login-preferences` request
2. Look for 400/500 errors
3. Check response for error message

---

## 📊 What Gets Stored

### **localStorage:**
```javascript
{
  "motomind_last_email": "user@example.com"
}
```

### **Database (user_login_preferences):**
```sql
user_id: "104135733357510565203"  -- Google user ID
last_login_method: "google"
last_login_at: "2025-10-18 13:45:00"
login_count: 1
preferred_method: NULL
```

---

## ✅ Success Criteria

**Everything works when:**

1. ✅ **First login** → Method recorded in database
2. ✅ **Return visit** → "Welcome back!" banner shows
3. ✅ **Database** → `login_count` increments
4. ✅ **localStorage** → Email saved
5. ✅ **All methods work** → Google, Email, SMS

---

## 🔄 Flow Diagram

### **First Visit:**
```
User visits /signin
  ↓
localStorage empty
  ↓
Shows: "Welcome to MotoMind"
  ↓
User clicks "Continue with Google"
  ↓
OAuth → Callback
  ↓
Save email to localStorage
  ↓
Record method in database
  ↓
Redirect to /track
```

### **Return Visit:**
```
User visits /signin
  ↓
Check localStorage for email
  ↓
Found: user@example.com
  ↓
API: Get login preferences by email
  ↓
Found: { lastMethod: 'google' }
  ↓
Show: "Welcome back!" banner
  ↓
Auto-display last method used
```

---

## 🎯 Quick Verification

**Run this in browser console after signing in:**

```javascript
// Check localStorage
console.log('Email:', localStorage.getItem('motomind_last_email'))

// Check API
fetch('/api/auth/login-preferences?email=' + localStorage.getItem('motomind_last_email'))
  .then(r => r.json())
  .then(d => console.log('Preferences:', d))

// Expected output:
// {
//   found: true,
//   lastMethod: "google",
//   loginCount: 1,
//   lastLoginAt: "2025-10-18..."
// }
```

---

## 📝 Summary

**What happens now:**

1. **Sign in** → Method tracked automatically
2. **Return** → Email pre-filled from localStorage
3. **API checks** → Shows last method used
4. **Banner shows** → "Welcome back! You last signed in with Google"
5. **Works for all** → Google, Email, SMS

**Try it now!** 🚀
