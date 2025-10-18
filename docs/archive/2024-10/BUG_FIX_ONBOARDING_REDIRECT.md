# 🐛 BUG FIX: Onboarding Redirect Issue

**Date:** October 18, 2025  
**Status:** ✅ **FIXED**

---

## 🔍 **PROBLEM**

**Symptom:**
- Existing user signs in
- Has not completed onboarding
- Gets redirected to `/dashboard` instead of `/onboarding/welcome`

**Expected:**
- Should redirect to `/onboarding/welcome` for new users
- Should redirect to `/dashboard` for users who completed onboarding

---

## 🎯 **ROOT CAUSE**

**The Issue:**
```typescript
// lib/auth/server.ts (BROKEN)
export async function requireUserServer() {
  // Was looking for wrong cookie names
  const accessToken = cookieStore.get('sb-access-token')?.value  // ❌ WRONG
  const refreshToken = cookieStore.get('sb-refresh-token')?.value // ❌ WRONG
  
  // Was not using Supabase SSR properly
  const supabase = createClient(...)  // ❌ Not SSR-compatible
}
```

**The Problem:**
1. Server auth helper was looking for manually-named cookies
2. Not using Supabase SSR cookie management
3. Auth check was failing silently
4. Callback was falling back to `/dashboard`

---

## ✅ **THE FIX**

### **1. Fixed Server Auth Helper**

```typescript
// lib/auth/server.ts (FIXED)
import { createServerClient } from '@supabase/ssr'

async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie setting can fail in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Cookie removal can fail in middleware
          }
        },
      },
    }
  )
}

export async function requireUserServer() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return { user: { id: user.id, email: user.email } }
}
```

**Why This Works:**
- ✅ Uses proper Supabase SSR cookie handling
- ✅ Automatically reads correct cookie names
- ✅ Handles cookies that Supabase Auth sets
- ✅ Compatible with server components

---

### **2. Improved Callback Error Handling**

```typescript
// app/(auth)/callback/page.tsx (IMPROVED)
const onboardingResponse = await fetch('/api/onboarding/status')

if (onboardingResponse.ok) {
  const { needsOnboarding, redirectTo } = await onboardingResponse.json()
  console.log('[Callback] Onboarding check result:', { needsOnboarding, redirectTo })
  router.push(redirectTo)
} else {
  // Log the error for debugging
  const errorText = await onboardingResponse.text()
  console.error('[Callback] Onboarding status check failed:', {
    status: onboardingResponse.status,
    error: errorText
  })
  
  // Fallback to onboarding (safer default for new users)
  console.log('[Callback] Falling back to /onboarding/welcome')
  router.push('/onboarding/welcome')
}
```

**Changes:**
- ✅ Added detailed error logging
- ✅ Changed fallback from `/dashboard` → `/onboarding/welcome`
- ✅ Shows exactly what went wrong

---

### **3. Added Debug Logging**

```typescript
// app/api/onboarding/status/route.ts (IMPROVED)
export async function GET(request: Request) {
  try {
    console.log('[Onboarding/Status] Checking authentication...')
    
    const { user } = await requireUserServer()
    console.log('[Onboarding/Status] User authenticated:', user.id)

    console.log('[Onboarding/Status] Checking onboarding for user:', user.id)
    const status = await checkOnboardingStatus(user.id)
    console.log('[Onboarding/Status] Result:', status)

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('[Onboarding/Status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Benefits:**
- ✅ See exactly where auth fails
- ✅ Track onboarding check flow
- ✅ Debug faster

---

## 🧪 **HOW TO TEST**

### **Test Case 1: New User**
```bash
# 1. Start dev server
npm run dev

# 2. Sign out (if signed in)

# 3. Sign in with Google

# 4. Expected behavior:
→ Redirected to /onboarding/welcome
→ Complete onboarding flow
→ End at /dashboard

# 5. Check browser console:
[Callback] Checking onboarding status...
[Onboarding/Status] Checking authentication...
[Onboarding/Status] User authenticated: <user-id>
[Onboarding/Status] Checking onboarding for user: <user-id>
[Onboarding/Status] Result: { needsOnboarding: true, redirectTo: '/onboarding/welcome' }
[Callback] Onboarding check result: { needsOnboarding: true, redirectTo: '/onboarding/welcome' }
```

### **Test Case 2: Existing User (Onboarded)**
```bash
# 1. Sign in with account that completed onboarding

# 2. Expected behavior:
→ Redirected to /dashboard

# 3. Check browser console:
[Callback] Checking onboarding status...
[Onboarding/Status] Result: { needsOnboarding: false, redirectTo: '/dashboard' }
[Callback] Onboarding check result: { needsOnboarding: false, redirectTo: '/dashboard' }
```

### **Test Case 3: Existing User (Not Onboarded)**
```bash
# 1. Sign in with account that exists but never onboarded

# 2. Expected behavior:
→ Redirected to /onboarding/welcome

# 3. Check browser console:
[Onboarding/Status] Result: { needsOnboarding: true, redirectTo: '/onboarding/welcome' }
```

---

## 📊 **VERIFICATION CHECKLIST**

After fix, verify:

- [ ] New users go to `/onboarding/welcome`
- [ ] Onboarded users go to `/dashboard`
- [ ] Console shows detailed logs
- [ ] No "Unauthorized" errors
- [ ] Database queries work
- [ ] Onboarding tracking updates

---

## 🎯 **FILES CHANGED**

1. **`lib/auth/server.ts`**
   - Fixed Supabase SSR cookie handling
   - Proper auth check

2. **`app/(auth)/callback/page.tsx`**
   - Better error handling
   - Safer fallback (onboarding instead of dashboard)
   - Detailed logging

3. **`app/api/onboarding/status/route.ts`**
   - Added debug logging
   - Better error messages

---

## 💡 **KEY LEARNINGS**

### **Supabase SSR Cookie Management**

**Wrong Way:**
```typescript
// ❌ Manually reading cookies
const token = cookieStore.get('sb-access-token')?.value
```

**Right Way:**
```typescript
// ✅ Use Supabase SSR
const supabase = createServerClient(url, key, {
  cookies: {
    get(name) { return cookieStore.get(name)?.value },
    set(name, value, options) { ... },
    remove(name, options) { ... }
  }
})
```

**Why:**
- Supabase manages cookie names internally
- Names can change between versions
- SSR client handles refresh automatically
- Cookies are properly scoped

### **Safe Fallbacks**

**Wrong:**
```typescript
// ❌ Fallback to dashboard (assumes returning user)
if (!onboardingResponse.ok) {
  router.push('/dashboard')
}
```

**Right:**
```typescript
// ✅ Fallback to onboarding (safe for new users)
if (!onboardingResponse.ok) {
  router.push('/onboarding/welcome')
}
```

**Why:**
- New users stuck at dashboard = bad UX
- Returning users see onboarding = minor annoyance
- Better to onboard twice than never

---

## 🚀 **NEXT STEPS**

**Immediate:**
1. Test the fix locally
2. Verify all 3 test cases
3. Check browser console logs
4. Deploy to staging

**Future Improvements:**
1. Add retry logic (if auth check temporarily fails)
2. Cache onboarding status client-side
3. Pre-fetch onboarding status during OAuth
4. Add loading state during redirect

---

## ✅ **STATUS**

**Fixed:** October 18, 2025  
**Tested:** Pending user verification  
**Deployed:** Pending  

**This fix ensures:**
- ✅ Proper auth check with Supabase SSR
- ✅ Correct onboarding redirect logic
- ✅ Detailed error logging
- ✅ Safe fallback behavior

**Ready to test!** 🚀
