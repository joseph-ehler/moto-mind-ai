# Native Auth Setup Guide

## ✅ WHAT WE BUILT

**Backend Token Exchange** - The professional way to handle native OAuth.

### **How It Works:**
```
1. Native Google SDK → User signs in → Gets ID token
2. App → Backend (/api/auth/google-native) → Sends ID token
3. Backend → Supabase → Exchanges token (with service role)
4. Backend → App → Returns Supabase session
5. App stores session → USER IS AUTHENTICATED! ✅
```

---

## 🔑 REQUIRED: Add Service Role Key

### **1. Get Your Service Role Key**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Find **service_role** key (under "Project API keys")
5. Copy it (starts with `eyJ...`)

⚠️ **IMPORTANT:** This is a SECRET key - DO NOT commit it to git!

### **2. Add to `.env.local`**

Create or update `.env.local` in your project root:

```bash
# Supabase Service Role Key (BACKEND ONLY - NEVER EXPOSE TO CLIENT!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key-here
```

### **3. Verify `.env.local` is in `.gitignore`**

Check `.gitignore` contains:
```
.env.local
.env*.local
```

✅ This ensures the secret key is NEVER committed to git.

---

## 🧪 TESTING

### **Web (Browser):**
```bash
npm run dev
# Open http://localhost:3005
# Click "Continue with Google"
# Should work as before ✅
```

### **Native (iOS):**
```bash
# In Xcode:
# 1. Clean Build (Cmd + Shift + K)
# 2. Build & Run (Cmd + R)

# Then:
# 1. Tap "Continue with Google"
# 2. Native dialog appears
# 3. Sign in
# 4. Watch console logs...
```

### **Expected Console Output:**
```
[Google Native] 🚀 Starting sign-in...
[Google Native] ✅ Sign-in successful: joseph.ehler@gmail.com
[Google Native] 📤 Exchanging token with backend...
[Native Auth API] 📥 Received auth request
[Native Auth API] 🔄 Exchanging with Supabase...
[Native Auth API] ✅ Session created for: joseph.ehler@gmail.com
[Google Native] ✅ Backend returned session for: joseph.ehler@gmail.com
[Google Native] 💾 Storing session in client...
[Google Native] ✅ Session stored! User is authenticated!
[Auth] ✅ Native auth complete! Navigating to /track
```

---

## ✅ SUCCESS CRITERIA

**Native App:**
- ✅ Native Google dialog appears (NO browser)
- ✅ User signs in
- ✅ Backend exchanges token
- ✅ Session stored
- ✅ Navigates to `/track`
- ✅ User can make API calls (authenticated)

**Web App:**
- ✅ Web OAuth flow works (opens browser)
- ✅ Redirects back
- ✅ Session stored
- ✅ Navigates to `/track`

---

## 🐛 TROUBLESHOOTING

### **Error: "Missing idToken"**
**Cause:** Google SDK didn't return ID token  
**Fix:** Check `serverClientId` matches your Google OAuth web client ID

### **Error: "Passed nonce and nonce in id_token should either both exist or not"**
**Cause:** You're seeing this error on the backend now  
**Fix:** This means the service role exchange is failing. Check your service role key is correct.

### **Error: "SUPABASE_SERVICE_ROLE_KEY is not defined"**
**Cause:** Missing service role key in `.env.local`  
**Fix:** Follow steps above to add it

### **Backend doesn't log anything**
**Cause:** App not hitting the backend endpoint  
**Fix:** Check console logs - is `[Google Native] 📤 Exchanging token with backend...` showing?

---

## 🚀 FILES CREATED

- `app/api/auth/google-native/route.ts` - Backend exchange endpoint
- `lib/auth/google-native-sdk.ts` - Updated to use backend
- `docs/SETUP_NATIVE_AUTH.md` - This guide

---

## 🎯 NEXT STEPS

1. ✅ Add service role key to `.env.local`
2. ✅ Test in browser (should still work)
3. ✅ Test in iOS (should work WITHOUT browser!)
4. ✅ Celebrate! 🎉

---

## 💡 WHY THIS WORKS

**Before:**
```
Native SDK → Supabase → NONCE ERROR ❌
```

**After:**
```
Native SDK → Backend (service role) → Supabase → ✅
```

**Backend has elevated permissions and can properly handle token exchange without nonce issues!**
