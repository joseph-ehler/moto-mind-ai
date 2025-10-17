# Authentication Helper Usage Audit

**Date:** October 17, 2025  
**Status:** Comprehensive audit of auth usage across codebase

---

## ✅ **USING NEW HELPERS (Refactored)**

### Server-Side (Using `getCurrentUserServer` / `requireUserServer`)
- ✅ `lib/auth/current-user.ts` - The helper itself
- ✅ `app/api/tracking/batch/route.ts` - **REFACTORED** to use `requireUserServer()`

### Client-Side (Using `useCurrentUser`)
- ✅ `hooks/useCurrentUser.ts` - The helper itself
- ✅ `hooks/useParkingMemory.ts` - **REFACTORED** to use `useCurrentUser()`

---

## ⚠️ **USING OLD PATTERN (Needs Review)**

### Server-Side Files Using `getServerSession` Directly

#### 1. **`lib/auth/server.ts`**
```typescript
// ⚠️ OLD PATTERN
export async function getSession() {
  return await getServerSession(authOptions)
}
```
**Status:** Legacy helper - deprecate in favor of `getCurrentUserServer()`  
**Action:** Add deprecation warning, point to new helper  
**Priority:** Low (no active usage found)

---

#### 2. **`lib/middleware/tenant-context.ts`**
```typescript
// ⚠️ OLD PATTERN
const session = await getServerSession(req, res, authOptions)
```
**Status:** Tenant-specific middleware  
**Action:** Keep as-is (uses tenant context, different from user ID)  
**Priority:** N/A (tenant system separate from user auth)

---

#### 3. **`lib/middleware/auth.ts`**
```typescript
// ⚠️ OLD PATTERN
const session = await getServerSession(authOptions)
```
**Status:** Generic auth middleware  
**Action:** Consider refactoring to use `getCurrentUserServer()`  
**Priority:** Low (middleware layer, acceptable)

---

### Client-Side Files Using `useSession` Directly

#### 4. **`lib/auth/client.ts`**
```typescript
// ⚠️ OLD PATTERN
export function useAuth() {
  const { data: session, status } = useSession()
  // Uses tenantId...
}
```
**Status:** Legacy hook - uses tenant system  
**Action:** Document that `useCurrentUser` is preferred for simple user ID needs  
**Priority:** Medium - add deprecation note

---

#### 5. **`components/nav/TopNav.tsx`**
```typescript
// ⚠️ OLD PATTERN
const { data: session } = useSession()
```
**Status:** Uses session for display name/avatar  
**Action:** Refactor to use `useCurrentUser()`  
**Priority:** **HIGH** - Simple refactor

**Proposed Fix:**
```typescript
// NEW PATTERN
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function TopNav() {
  const { user, isLoading } = useCurrentUser()
  
  if (isLoading) return <Skeleton />
  
  return (
    <nav>
      {user && <UserMenu user={user} />}
    </nav>
  )
}
```

---

#### 6. **`components/layout/Navigation.tsx`**
```typescript
// ⚠️ OLD PATTERN
const { data: session } = useSession()
const user = session?.user
```
**Status:** Uses session for navigation display  
**Action:** Refactor to use `useCurrentUser()`  
**Priority:** **HIGH** - Simple refactor

---

#### 7. **`components/layout/UserMenu.tsx`**
```typescript
// ⚠️ OLD PATTERN
const { data: session } = useSession()
```
**Status:** Uses session for user menu  
**Action:** Refactor to use `useCurrentUser()`  
**Priority:** **HIGH** - Simple refactor

---

#### 8. **`components/auth/SessionTracker.tsx`**
```typescript
// ⚠️ OLD PATTERN
const { data: session, status } = useSession()
```
**Status:** Tracks session events for analytics  
**Action:** Keep as-is (needs full session object for tracking)  
**Priority:** N/A (legitimate use of raw session)

---

#### 9. **`components/auth/UnverifiedEmailBanner.tsx`**
```typescript
// ⚠️ OLD PATTERN
const { data: session } = useSession()
```
**Status:** Checks email verification status  
**Action:** Refactor to use `useCurrentUser()` (user object has email)  
**Priority:** Medium

---

#### 10. **`components/capture/GuidedCaptureFlow.tsx`**
```typescript
// ⚠️ OLD PATTERN
const { data: session, status } = useSession()
```
**Status:** Uses session for auth checks  
**Action:** Refactor to use `useCurrentUser()`  
**Priority:** Medium

---

## 📊 **SUMMARY**

### Refactor Priority

**HIGH Priority (Simple Wins):**
1. `components/nav/TopNav.tsx` ← Used in all pages
2. `components/layout/Navigation.tsx` ← Main navigation
3. `components/layout/UserMenu.tsx` ← User menu dropdown

**Medium Priority:**
4. `components/auth/UnverifiedEmailBanner.tsx`
5. `components/capture/GuidedCaptureFlow.tsx`
6. `lib/auth/client.ts` (add deprecation notice)

**Low/Skip:**
- `lib/auth/server.ts` (legacy, unused)
- `lib/middleware/tenant-context.ts` (tenant-specific)
- `lib/middleware/auth.ts` (middleware layer)
- `components/auth/SessionTracker.tsx` (needs full session)

---

## 🎯 **REFACTOR PLAN**

### Phase 1: Navigation Components (30 min)
```bash
# Refactor the 3 HIGH priority components
- TopNav.tsx
- Navigation.tsx
- UserMenu.tsx
```

### Phase 2: Feature Components (20 min)
```bash
# Refactor medium priority
- UnverifiedEmailBanner.tsx
- GuidedCaptureFlow.tsx
```

### Phase 3: Documentation (10 min)
```bash
# Add deprecation warnings
- lib/auth/client.ts (add @deprecated JSDoc)
- Update AUTH_PATTERN.md with migration guide
```

---

## 🔒 **RULES GOING FORWARD**

### For New Code:

**Server-Side:**
```typescript
// ✅ ALWAYS DO THIS
import { requireUserServer } from '@/lib/auth/current-user'

export async function POST(request: Request) {
  const user = await requireUserServer()
  // use user.id
}
```

**Client-Side:**
```typescript
// ✅ ALWAYS DO THIS
import { useCurrentUser } from '@/hooks/useCurrentUser'

function MyComponent() {
  const { user, isLoading } = useCurrentUser()
  // use user?.id
}
```

### Exceptions:

**Only use raw `useSession` / `getServerSession` if:**
1. You need **tenant context** (not just user ID)
2. You need **full session object** for analytics/tracking
3. You're in **middleware layer** (where helpers don't work)

Otherwise, **always use the helpers**.

---

## 📝 **VERIFICATION CHECKLIST**

After refactoring, verify:

- [ ] All new API routes use `requireUserServer()` or `getCurrentUserServer()`
- [ ] All new components use `useCurrentUser()`
- [ ] No manual `(session?.user as any)?.id` extractions
- [ ] No direct `supabase.auth.getUser()` calls
- [ ] Test that user IDs work everywhere
- [ ] No UUID type errors in database

---

## 📚 **REFERENCES**

- **Helper Implementations:** `lib/auth/current-user.ts`, `hooks/useCurrentUser.ts`
- **Pattern Guide:** `docs/AUTH_PATTERN.md`
- **This Audit:** `docs/AUTH_AUDIT.md`

---

**Last Updated:** October 17, 2025  
**Next Review:** When adding new auth-dependent features
