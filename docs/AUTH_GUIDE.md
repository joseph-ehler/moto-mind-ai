# 🔐 Authentication Guide

## 🔗 **Auth URLs**

### **Sign In**
```
https://moto-mind-ai.vercel.app/auth/signin
```

### **Sign Out**
```
https://moto-mind-ai.vercel.app/auth/signout
```

### **Sign Out via API**
```javascript
// From any client component:
import { signOut } from 'next-auth/react'

signOut({ callbackUrl: '/auth/signin' })
```

---

## 🛠️ **Setup Requirements**

### **1. Environment Variables (Vercel)**

These must be set in Vercel Dashboard:

```bash
# Google OAuth (REQUIRED for signin)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# NextAuth
NEXTAUTH_URL=https://moto-mind-ai.vercel.app
NEXTAUTH_SECRET=your-secret-min-32-chars

# Supabase (already set)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...
```

### **2. Google OAuth Setup**

#### **Get Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**

#### **Configure OAuth Client:**

**Authorized JavaScript origins:**
```
https://moto-mind-ai.vercel.app
```

**Authorized redirect URIs:**
```
https://moto-mind-ai.vercel.app/api/auth/callback/google
```

#### **Get Keys:**
- Copy **Client ID** → Set as `GOOGLE_CLIENT_ID` in Vercel
- Copy **Client secret** → Set as `GOOGLE_CLIENT_SECRET` in Vercel

---

## 🔍 **Troubleshooting "Nothing Happens on Click"**

### **Issue: Sign in button doesn't work**

**Possible Causes:**

#### **1. Missing Google OAuth Credentials**

**Check in Vercel:**
```
Settings → Environment Variables
```

**Required:**
- ✅ `GOOGLE_CLIENT_ID` exists and is correct
- ✅ `GOOGLE_CLIENT_SECRET` exists and is correct
- ✅ Both are set for **Production** environment

**Test:**
```bash
# Check if env vars are set (after deployment)
curl https://moto-mind-ai.vercel.app/api/auth/providers

# Should return:
{
  "google": {
    "id": "google",
    "name": "Google",
    ...
  }
}
```

#### **2. Incorrect Redirect URI in Google Console**

**Check in Google Cloud Console:**

1. Go to your OAuth client
2. **Authorized redirect URIs** must include:
   ```
   https://moto-mind-ai.vercel.app/api/auth/callback/google
   ```
3. Save changes
4. Wait 5 minutes for propagation

#### **3. Browser Console Errors**

**Check browser console:**
1. Open DevTools (F12)
2. Click **Console** tab
3. Look for errors when clicking sign in

**Common Errors:**

```javascript
// Error: OAuth configuration error
// Fix: Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

// Error: redirect_uri_mismatch
// Fix: Add correct redirect URI in Google Console

// Error: access_denied
// Fix: Check OAuth consent screen is published
```

#### **4. NEXTAUTH_URL Mismatch**

**In Vercel:**
```bash
# Should match your production URL
NEXTAUTH_URL=https://moto-mind-ai.vercel.app

# NOT localhost!
```

---

## ✅ **Quick Fix Checklist**

If signin doesn't work:

- [ ] Verify `GOOGLE_CLIENT_ID` is set in Vercel
- [ ] Verify `GOOGLE_CLIENT_SECRET` is set in Vercel
- [ ] Check redirect URI in Google Console matches exactly
- [ ] Verify `NEXTAUTH_URL` is set to production URL
- [ ] Wait 5 minutes after changing Google Console settings
- [ ] Clear browser cache and try again
- [ ] Check browser console for errors
- [ ] Try incognito mode

---

## 🧪 **Testing Auth**

### **Test 1: Check Providers**
```bash
curl https://moto-mind-ai.vercel.app/api/auth/providers
```

**Expected:**
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "https://moto-mind-ai.vercel.app/api/auth/signin/google",
    "callbackUrl": "https://moto-mind-ai.vercel.app/api/auth/callback/google"
  }
}
```

### **Test 2: Check Session**
```bash
curl https://moto-mind-ai.vercel.app/api/auth/session
```

**Before signin:**
```json
{}
```

**After signin:**
```json
{
  "user": {
    "email": "your@email.com",
    "tenantId": "...",
    "role": "owner"
  },
  "expires": "..."
}
```

### **Test 3: Check CSRF Token**
```bash
curl https://moto-mind-ai.vercel.app/api/auth/csrf
```

**Expected:**
```json
{
  "csrfToken": "some-long-token"
}
```

---

## 🎯 **How Auth Works**

### **Sign In Flow:**

1. User clicks "Sign in with Google"
2. NextAuth redirects to Google OAuth
3. User authorizes app
4. Google redirects back to `/api/auth/callback/google`
5. NextAuth creates session
6. **Auto-creates tenant** in database (if new user)
7. Links user to tenant in `user_tenants` table
8. Redirects to `/vehicles`

### **Session Management:**

- **Storage:** JWT (stored in HTTP-only cookie)
- **Duration:** 30 days
- **Refresh:** Every 24 hours
- **Tenant:** Included in session as `user.tenantId`

### **Sign Out:**

1. User visits `/auth/signout`
2. NextAuth clears session cookie
3. Redirects to `/auth/signin`

---

## 🔐 **Security Features**

✅ **HTTP-only cookies** (can't be accessed by JavaScript)  
✅ **CSRF protection** (built into NextAuth)  
✅ **Auto tenant creation** (new users get isolated tenant)  
✅ **Tenant validation** (checks tenant is active on refresh)  
✅ **Role-based access** (owner/admin roles)  

---

## 📚 **Code Examples**

### **Check if User is Signed In (Client)**

```tsx
'use client'

import { useSession } from 'next-auth/react'

export function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (status === 'unauthenticated') {
    return <div>Please sign in</div>
  }
  
  return <div>Hello {session?.user?.email}!</div>
}
```

### **Require Auth (Server)**

```tsx
// app/protected/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/features/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return <div>Protected content for {session.user.email}</div>
}
```

### **Sign Out Button**

```tsx
'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/design-system'

export function SignOutButton() {
  return (
    <Button onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
      Sign Out
    </Button>
  )
}
```

---

## 🚀 **Next Steps**

1. **Verify Google OAuth credentials** in Vercel
2. **Test signin** at `/auth/signin`
3. **Test signout** at `/auth/signout`
4. **Check browser console** for any errors
5. **Review this guide** if issues persist

---

**Need Help?** Check the troubleshooting section above or the browser console for specific error messages.
