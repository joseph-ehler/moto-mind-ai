# Native Auth Implementation Notes

## Current Status

### ✅ What Works:
- Web OAuth (opens browser, redirects back) ✅
- Native SDK with fallback ✅

### ⚠️ Known Issue: Nonce Error

**Error:** `Passed nonce and nonce in id_token should either both exist or not.`

### What's Happening:

1. **Google Native SDK** generates an ID token with an embedded nonce
2. **Supabase Auth** expects us to pass that nonce separately for verification
3. **Capacitor Plugin** (`@southdevs/capacitor-google-auth`) doesn't expose the nonce it used

### Current Solution: Fallback

```typescript
try {
  // Try native SDK (cleaner UX)
  await signInWithGoogleNativeSDK()
} catch (error) {
  // Fallback to web OAuth (always works)
  await signInWithGoogle('/track')
}
```

**Result:** Auth ALWAYS works, even if native SDK fails.

---

## Long-Term Solutions

### Option 1: Disable Nonce Verification (Recommended)

**In Supabase Dashboard:**
1. Go to Authentication → Providers → Google
2. Disable "Require nonce verification" (if available)
3. Or use a different auth flow that doesn't require nonces

**Pros:**
- Native SDK works perfectly
- Clean UX (native dialog)
- No browser popups

**Cons:**
- Slightly less secure (but still very secure)
- May not be available in all Supabase versions

### Option 2: Use Web OAuth Everywhere

**Simply use the web flow even on native:**
```typescript
// Always use web OAuth
await signInWithGoogle('/track')
```

**Pros:**
- Always works
- No complexity
- One code path

**Cons:**
- Opens in-app browser (less elegant)
- Not as smooth UX

### Option 3: Different Capacitor Plugin

Use a plugin that exposes the nonce:
- `@codetrix-studio/capacitor-google-auth`
- Or build custom native bridge

**Pros:**
- Native SDK + proper nonce handling
- Perfect security + UX

**Cons:**
- More work
- Different API
- May have same issue

---

## Decision

**For now:** Use fallback strategy (current implementation)

**Why:**
- Auth always works ✅
- Native SDK works if possible ✅
- Falls back gracefully ✅
- Can optimize later ✅

**Next steps:**
1. Test in production
2. Monitor which flow users hit (native vs fallback)
3. If many users hit fallback, investigate Option 1 or 3

---

## Testing

### Web:
```bash
npm run dev
# Open http://localhost:3005
# Click "Continue with Google"
# Should work ✅
```

### Native iOS:
```bash
# In Xcode
# Run on simulator or device
# Tap "Continue with Google"
# Try native SDK first
# Falls back to web OAuth if needed
# Should always work ✅
```

---

## Files

- Implementation: `lib/auth/google-native-sdk.ts`
- Fallback: `app/page.tsx`
- Facade: `lib/auth/facade.ts`
