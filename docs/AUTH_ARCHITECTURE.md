# Authentication Architecture

**Date:** October 18, 2025  
**Status:** ✅ CLEAN - Separate Web & Native Flows

---

## 🎯 Architecture Overview

We use **SEPARATE AUTH FLOWS** for web and native platforms. Each flow is independent, focused, and optimized for its platform.

### Web Flow
- **Entry Point:** `app/page.tsx`
- **Method:** Supabase OAuth redirect
- **Process:** User clicks → Redirects to Google → Signs in → Redirects back to `/auth/callback` → Authenticated

### Native Flow
- **Entry Point:** `app/native/login/page.tsx`
- **Method:** Google Native SDK (iOS picker modal)
- **Process:** User taps → Native iOS picker → Selects account → Gets tokens → Authenticated

---

## 📁 File Structure

```
app/
├── page.tsx                          # ✅ WEB login (OAuth redirect)
├── native/
│   └── login/
│       └── page.tsx                  # ✅ NATIVE login (SDK)
├── layout.tsx                        # Includes NativeRouteDetector
└── auth/
    └── callback/
        └── page.tsx                  # Handles web OAuth callback

components/auth/
└── NativeRouteDetector.tsx           # Routes native users to /native/login

lib/auth/
├── facade.ts                         # ✅ WEB OAuth only (no conditionals)
├── google-native-sdk.ts              # ✅ NATIVE SDK only
└── [deleted] native-oauth.ts         # ❌ Removed - obsolete

hooks/
└── useAuth.ts                        # ✅ Clean - no callback handling
```

---

## 🔄 How Routing Works

### On Native App:
1. App loads at `/` (web login page)
2. `NativeRouteDetector` runs → detects `Capacitor.isNativePlatform()`
3. Redirects to `/native/login`
4. Native login page loads → Pure SDK flow

### On Web:
1. Page loads at `/` (web login page)
2. `NativeRouteDetector` runs → NOT native
3. Stays on `/` → Pure web OAuth flow

---

## ✅ What We Cleaned Up

### Issue #1: `lib/auth/facade.ts`
**Problem:** Had native detection + conditional logic trying to do both flows  
**Fix:** Removed ALL native logic. Now pure web OAuth only.  
**Result:** Simple, focused, web-only facade.

```typescript
// BEFORE (WRONG):
async signInWithOAuth() {
  if (isNative) {
    // Use native SDK...
  }
  // Web OAuth...
}

// AFTER (CORRECT):
async signInWithOAuth() {
  // Simple web OAuth redirect only
  return supabase.auth.signInWithOAuth(...)
}
```

---

### Issue #2: `lib/auth/native-oauth.ts`
**Problem:** Old unused file from previous architecture  
**Fix:** DELETED  
**Result:** No obsolete code cluttering the codebase.

---

### Issue #3: `hooks/useAuth.ts`
**Problem:** Had `appUrlOpen` listener for deep link callbacks  
**Fix:** REMOVED - not needed with separate flows  
**Result:** Clean hook with no platform-specific logic.

```typescript
// BEFORE (WRONG):
useEffect(() => {
  // ... setup
  handleOAuthCallback() // ❌ Deep link listener
})

// AFTER (CORRECT):
useEffect(() => {
  // ... setup
  // No callback handling needed!
})
```

---

### Issue #4: `ios/App/App/Info.plist`
**Problem:** `GIDClientID` was set to WEB client ID  
**Fix:** Changed to iOS client ID  
**Result:** Native iOS picker works (not web browser picker).

```xml
<!-- BEFORE (WRONG): -->
<key>GIDClientID</key>
<string>...tpd1g2uduf51qmdkkdrue565sq40vf4s...</string> <!-- WEB client! -->

<!-- AFTER (CORRECT): -->
<key>GIDClientID</key>
<string>...ecojj9mtif8j4n1gu7jri95a681ghgca...</string> <!-- iOS client! -->
```

---

## 🚀 Benefits of This Architecture

### 1. **No More Conditionals**
Each page has ONE clear purpose. No `if (isNative)` anywhere in shared code.

### 2. **Easier to Debug**
Issues are isolated to one flow. Native problems don't affect web, and vice versa.

### 3. **Better UX**
Each platform gets its optimal auth experience:
- Web: Familiar OAuth redirect
- Native: Native iOS picker modal

### 4. **Cleaner Code**
No platform detection logic mixed into business logic. Clear separation of concerns.

### 5. **Maintainable**
Changes to web OAuth don't touch native code. Changes to native SDK don't touch web code.

---

## 📝 Usage Guide

### For Web Development:
```typescript
// In any web page:
import { useAuth } from '@/hooks/useAuth'

const { signInWithGoogle } = useAuth()

// This will use web OAuth redirect (facade.ts)
await signInWithGoogle('/dashboard')
```

### For Native Development:
```typescript
// In app/native/login/page.tsx:
import { signInWithGoogleNativeSDK } from '@/lib/auth/google-native-sdk'

// This will use native SDK (iOS picker)
const user = await signInWithGoogleNativeSDK()
```

---

## 🔐 Client ID Configuration

### Web OAuth Client
- **ID:** `642890697588-tpd1g2uduf51qmdkkdrue565sq40vf4s`
- **Used for:** Web OAuth redirects, Supabase ID token verification
- **Where:** `lib/auth/facade.ts` (web flow)

### iOS OAuth Client  
- **ID:** `642890697588-ecojj9mtif8j4n1gu7jri95a681ghgca`
- **Used for:** Native iOS picker modal
- **Where:** `lib/auth/google-native-sdk.ts`, `ios/App/App/Info.plist`

### Why Two Client IDs?
- **iOS client** → Shows native picker UI
- **Web client** → Validates tokens with Supabase

The native SDK uses the iOS client for the UI, but also requests a token for the web client so Supabase can verify it.

---

## 🧪 Testing

### Test Web Flow:
```bash
npm run dev
# Open http://localhost:3005
# Click "Continue with Google"
# Should redirect to Google and back
```

### Test Native Flow:
```bash
# In Xcode:
Cmd + Shift + K  (Clean Build)
Cmd + R          (Build & Run)
# Tap "Continue with Google"
# Should show native iOS picker modal
```

---

## 🎓 Key Learnings

### What Didn't Work:
❌ One page trying to do both web and native  
❌ Platform detection in shared business logic  
❌ `Info.plist` with wrong client IDs  
❌ Deep link callbacks for native OAuth

### What Does Work:
✅ Separate pages for separate platforms  
✅ Platform detection ONLY for routing  
✅ Correct client IDs in `Info.plist`  
✅ Native SDK returns tokens directly (no callbacks)

---

## 📚 Related Docs

- `docs/DATABASE_MIGRATION_RULES.md` - Database auth patterns
- `docs/AUTH_PATTERN.md` - Server/client auth helpers
- `docs/AUTH_TESTING_GUIDE.md` - Auth test suite

---

**The architecture is now clean, focused, and maintainable. Each flow does ONE thing well.** 🎯
