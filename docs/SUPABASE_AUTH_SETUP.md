# Supabase Authentication Setup Guide

**Date:** October 18, 2025  
**Estimated Time:** 10 minutes  
**Status:** ⏱️ REQUIRED FOR AUTH TO WORK

---

## 🎯 Overview

This guide walks through configuring **Google OAuth** with Supabase for both web and native platforms.

**What You'll Set Up:**
1. Google Cloud OAuth credentials
2. Supabase Google provider
3. Redirect URLs for web and native
4. Environment variables

---

## 📋 Prerequisites

- [ ] Active Supabase project
- [ ] Google Cloud Console access (or ability to create account)
- [ ] Project environment variables file (`.env.local`)

---

## 🔧 Step 1: Google Cloud Console (5 min)

### 1.1 Create OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Name: `MotoMind Web`

### 1.2 Configure Redirect URIs

Add these **Authorized redirect URIs:**

```
https://ucbbzzoimghnaoihyqbd.supabase.co/auth/v1/callback
http://localhost:3005/callback
```

**Note:** Replace `ucbbzzoimghnaoihyqbd` with your actual Supabase project ref.

### 1.3 Save Credentials

After creating:
1. Copy the **Client ID** (starts with a long number)
2. Copy the **Client Secret** (random string)
3. Keep these safe - you'll need them in Step 2

**Example:**
```
Client ID: 642890697588-abc123xyz.apps.googleusercontent.com
Client Secret: GOCSPX-randomString123
```

---

## 🔐 Step 2: Supabase Dashboard (3 min)

### 2.1 Navigate to Authentication

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **MotoMind**
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list

### 2.2 Enable Google Provider

1. Toggle **Enable Sign in with Google** to ON
2. Paste your **Client ID** from Step 1.3
3. Paste your **Client Secret** from Step 1.3

### 2.3 Configure Redirect URLs

In the **Redirect URLs** section, add:

```
http://localhost:3005/callback
motomind://auth/callback
```

**Why two URLs?**
- `http://localhost:3005/callback` - Web development
- `motomind://auth/callback` - Native iOS/Android deep link

### 2.4 Save Configuration

Click **Save** at the bottom of the page.

---

## 🌐 Step 3: Environment Variables (2 min)

### 3.1 Locate Your Supabase Credentials

In Supabase Dashboard:
1. Go to **Project Settings** → **API**
2. Find these values:
   - **Project URL** (e.g., `https://ucbbzzoimghnaoihyqbd.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (longer string, also starts with `eyJ...`)

### 3.2 Update `.env.local`

Create or update `.env.local` in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ucbbzzoimghnaoihyqbd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:**
- Replace with YOUR actual values
- Never commit `.env.local` to git
- Service role key gives admin access - keep it secret

### 3.3 Verify `.gitignore`

Ensure `.gitignore` includes:

```
.env.local
.env*.local
```

---

## 📱 Step 4: iOS Configuration (Optional, 2 min)

**Only needed if testing native iOS app**

### 4.1 Configure Deep Link Scheme

File: `ios/App/App/Info.plist`

Add this if not already present:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>motomind</string>
    </array>
  </dict>
</array>
```

This allows `motomind://` deep links to open your app.

### 4.2 Sync Capacitor

```bash
npx cap sync ios
```

---

## ✅ Step 5: Verification (3 min)

### 5.1 Test Web Auth

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3005

# Expected:
# 1. Redirects to /login
# 2. Click "Continue with Google"
# 3. Google OAuth popup appears
# 4. Sign in with Google account
# 5. Redirects to /callback
# 6. Redirects to /track (authenticated)
```

### 5.2 Test Native Auth (Optional)

```bash
# Sync and open iOS
npx cap sync ios
npx cap open ios

# In Xcode:
# 1. Run app (Cmd + R)
# 2. Tap "Continue with Google"
# 3. System browser opens
# 4. Sign in with Google
# 5. Browser closes automatically
# 6. Returns to app at /track (authenticated)
```

### 5.3 Check Browser Console

Look for these logs:

**Web:**
```
[Auth] Using Web adapter
[Web Adapter] Starting OAuth...
[Web Adapter] Processing callback...
[Web Adapter] ✅ Success: user@example.com
```

**Native:**
```
[Auth] Using Native adapter
[Native Adapter] Starting OAuth...
[Native Adapter] Opening browser...
[Native Adapter] Deep link received: motomind://auth/callback#access_token=...
[Native Adapter] Setting session...
[Native Adapter] ✅ Success!
```

---

## 🔍 Troubleshooting

### Issue: "redirect_uri_mismatch"

**Cause:** Google redirect URI doesn't match Supabase callback  
**Fix:** 
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add: `https://[your-project].supabase.co/auth/v1/callback`
4. Save and wait 5 minutes for propagation

### Issue: "Unable to verify ID token"

**Cause:** Client ID/Secret mismatch between Google and Supabase  
**Fix:**
1. Double-check Client ID in Supabase matches Google
2. Double-check Client Secret
3. Re-save in Supabase Dashboard

### Issue: "No session found after callback"

**Cause:** Cookies blocked or redirect URL wrong  
**Fix:**
1. Check browser console for errors
2. Verify `redirectTo` URL in adapter matches your domain
3. Try in incognito mode (rules out extensions)

### Issue: Native app doesn't return after OAuth

**Cause:** Deep link scheme not configured  
**Fix:**
1. Verify `Info.plist` has `motomind` URL scheme
2. Run `npx cap sync ios` again
3. Clean build in Xcode (Cmd + Shift + K)
4. Rebuild (Cmd + R)

---

## 📊 Configuration Checklist

Use this to verify everything is set up:

**Google Cloud Console:**
- [ ] OAuth 2.0 Client ID created (Web application)
- [ ] Supabase callback URL added to redirect URIs
- [ ] localhost callback URL added (for dev)
- [ ] Client ID and Secret copied

**Supabase Dashboard:**
- [ ] Google provider enabled
- [ ] Client ID pasted
- [ ] Client Secret pasted
- [ ] Redirect URLs added (`http://localhost:3005/callback`, `motomind://auth/callback`)
- [ ] Configuration saved

**Environment Variables:**
- [ ] `.env.local` file exists
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `.env.local` in `.gitignore`

**iOS (Optional):**
- [ ] `Info.plist` has `CFBundleURLSchemes`
- [ ] `motomind` scheme added
- [ ] `npx cap sync ios` run

**Testing:**
- [ ] Web auth flow works (OAuth redirect)
- [ ] Native auth flow works (browser + deep link)
- [ ] No console errors
- [ ] User session persists on reload

---

## 🎊 Success Criteria

✅ You're done when:
1. Click "Sign in with Google" on web → redirects → signs in → lands at `/track`
2. Browser console shows success logs
3. User session persists after page reload
4. No errors in console
5. (Optional) Native app opens browser, signs in, returns to app

**Time to completion:** ~10 minutes ⏱️

---

## 🔐 Security Notes

### Do's ✅
- Keep service role key secret (server-only)
- Use anon key for client-side (safe to expose)
- Keep `.env.local` out of git
- Use HTTPS in production redirect URLs
- Regularly rotate OAuth secrets

### Don'ts ❌
- Never commit credentials to git
- Never use service role key in browser code
- Never hardcode OAuth secrets
- Never expose `.env` files publicly
- Never skip HTTPS in production

---

## 📚 Related Documentation

- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) - Overall auth architecture
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) - Official docs
- [Google OAuth Setup](https://support.google.com/cloud/answer/6158849) - Google guide

---

## 🆘 Need Help?

**Check these resources:**
1. Browser console for detailed error messages
2. Supabase Dashboard → Logs → Auth logs
3. Google Cloud Console → OAuth consent screen setup
4. [Supabase Discord](https://discord.supabase.com) - Community support

---

**Once configured, auth will "just work" on both platforms!** 🚀
