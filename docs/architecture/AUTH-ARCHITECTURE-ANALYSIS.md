# 🔐 Authentication Architecture Analysis

**Date:** October 15, 2025  
**Status:** HYBRID SYSTEM (Partially Migrated)

---

## 🎯 TL;DR - What You Actually Have

**YOU HAVE TWO AUTH SYSTEMS RUNNING SIMULTANEOUSLY:**

1. **NextAuth** (Google OAuth) - Primary, Active
2. **SupabaseAuthProvider** (Legacy) - Wrapped around app, doing nothing

**Result:** Confusion, complexity, potential conflicts

---

## 📊 Current Architecture

### **Auth Flow:**

```
User clicks "Sign In with Google"
    ↓
NextAuth handles OAuth
    ↓
NextAuth callback queries Supabase (as database)
    ↓
Checks user_tenants table
    ├─ New user: Create tenant + link user
    └─ Existing: Fetch tenant_id
    ↓
Store in NextAuth JWT: { email, tenantId, role }
    ↓
APIs extract tenant_id from NextAuth session
    ↓
Manually filter queries by tenant_id
```

---

## 🔍 System Components

### **1. NextAuth (Primary Auth) ✅**

**Files:**
- `lib/auth/config.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth endpoints
- `lib/auth/server.ts` - Server utilities
- `lib/auth/client.ts` - Client hooks

**What it does:**
- Google OAuth authentication
- JWT session management (30-day sessions)
- Automatic tenant creation on first sign-in
- Stores email, tenantId, role in session
- Token refresh every 24 hours

**Usage:**
```typescript
// Server
const session = await getServerSession(authOptions)
const tenantId = session.user.tenantId

// Client
const { user } = useAuth()
const tenantId = user.tenantId
```

---

### **2. Supabase (Database Only) ⚠️**

**Files:**
- `lib/middleware/tenant-context.ts` - Tenant isolation
- `lib/clients/supabase-browser.ts` - Client
- Database tables with tenant_id column

**What it does:**
- Data storage (vehicles, events, etc.)
- RLS policies (but not enforcing tenancy!)
- Tenant isolation via application middleware

**Critical Issue:**
```sql
-- Current RLS policies
CREATE POLICY "vehicles_tenant_isolation" 
ON vehicles FOR ALL TO authenticated
USING (true)  -- ⚠️ Allows ANY authenticated user
WITH CHECK (true);  -- ⚠️ No validation
```

**Tenancy is enforced in APPLICATION CODE:**
```typescript
// Middleware extracts tenant_id from NextAuth
const tenantId = session.user.tenantId

// Then manually filters
.eq('tenant_id', tenantId)
```

---

### **3. SupabaseAuthProvider (LEGACY) ❌**

**File:** `components/auth/SupabaseAuthProvider.tsx`

**What it tries to do:**
```typescript
// Listens for Supabase Auth sessions
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null)
})
```

**Problem:** You're NOT using Supabase Auth!

**Result:**
- user will always be null
- Context provides nothing useful
- Wraps entire app but does nothing
- **This is dead code from old system**

**Currently in:** `app/layout.tsx`
```tsx
<SupabaseAuthProvider>  {/* ← UNUSED */}
  <ClientProviders>
    {children}
  </ClientProviders>
</SupabaseAuthProvider>
```

---

## 🚨 Problems

### **1. Dual Auth Providers (Confusing)**

Two providers, but only NextAuth works:
- SupabaseAuthProvider: Listens for Supabase auth (doesn't exist)
- NextAuth SessionProvider: Actually manages auth

### **2. RLS Not Enforcing Tenancy (Security Risk)**

RLS allows any authenticated user to access any data:
```sql
USING (true)  -- No tenant check!
```

If application middleware fails or is bypassed, **data leak!**

### **3. Service Role Key Bypasses RLS**

You're using `SUPABASE_SERVICE_ROLE_KEY` which **completely bypasses RLS:**

```typescript
createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,  // ← Bypasses ALL RLS!
)
```

Then manually filtering:
```typescript
.eq('tenant_id', tenantId)  // Hope this doesn't get forgotten!
```

---

## ✅ Recommendations

### **Immediate Actions:**

#### **1. Remove SupabaseAuthProvider (30 min)**

**Why:** Dead code, causing confusion

**How:**
```bash
# Remove from layout
# Edit app/layout.tsx
- import { SupabaseAuthProvider } from '@/components/auth/SupabaseAuthProvider'
- <SupabaseAuthProvider>
-   {children}
- </SupabaseAuthProvider>
+ {children}

# Delete file
rm components/auth/SupabaseAuthProvider.tsx
```

#### **2. Fix RLS Policies (2 hours)**

**Why:** Critical security issue

**How:**
```sql
-- Set tenant context in middleware
ALTER DATABASE your_db SET app.current_tenant_id = '';

-- Then in middleware:
await supabase.rpc('set_config', {
  parameter: 'app.current_tenant_id',
  value: tenantId
})

-- RLS policies check context:
CREATE POLICY "vehicles_tenant_isolation" 
ON vehicles FOR SELECT TO authenticated
USING (
  tenant_id = current_setting('app.current_tenant_id', true)::uuid
);
```

#### **3. Use Anon Key Instead of Service Role (1 hour)**

**Why:** Service role bypasses security

**Current:**
```typescript
createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // Bypasses RLS
)
```

**Better:**
```typescript
createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY  // Respects RLS
)
```

Then RLS enforces tenancy automatically!

---

### **Long-term (Optional):**

#### **Option A: Fully Commit to NextAuth (Recommended)**

**Pros:**
- OAuth providers (Google, GitHub, etc.)
- Well-documented
- Active community
- You're already using it

**Cons:**
- External dependency
- Need to manage sessions manually

#### **Option B: Switch to Supabase Auth**

**Pros:**
- Integrated with Supabase
- RLS works natively
- Built-in user management

**Cons:**
- Would need to migrate from NextAuth
- Different OAuth setup
- More work

**Recommendation:** Stay with NextAuth, just clean up the hybrid mess.

---

## 🎯 Migration Impact

**For auth migration (what you're doing now):**

### **Current State:**
- NextAuth: Production-ready, working
- SupabaseAuthProvider: Legacy, unused
- Middleware: Working but fragile

### **What to Migrate:**

**DO migrate:**
- ✅ `lib/auth/` (NextAuth config) → `features/auth/domain/`
- ✅ `lib/middleware/tenant-context.ts` → `features/auth/domain/`
- ✅ Types, utilities

**DON'T migrate:**
- ❌ `SupabaseAuthProvider.tsx` → DELETE instead

**Fix during migration:**
- ⚠️ RLS policies (enforce at database level)
- ⚠️ Use anon key instead of service role
- ⚠️ Add tests for tenant isolation

---

## 📋 Migration Checklist

### **Phase 1: Cleanup (Today, 1 hour)**
- [ ] Remove `SupabaseAuthProvider` from layout
- [ ] Delete `components/auth/SupabaseAuthProvider.tsx`
- [ ] Update any imports
- [ ] Test auth still works

### **Phase 2: Fix RLS (Tomorrow, 2 hours)**
- [ ] Add `current_setting` RLS policies
- [ ] Update middleware to set context
- [ ] Switch to anon key
- [ ] Test tenant isolation

### **Phase 3: Migrate to Features (Later, 3 hours)**
- [ ] Move `lib/auth/` → `features/auth/domain/`
- [ ] Move middleware → `features/auth/domain/`
- [ ] Create tests
- [ ] Update imports

---

## 💡 Why It Got Complex

**Timeline (my guess):**

1. **Started with:** Supabase Auth (simple)
2. **Needed:** Google OAuth
3. **Added:** NextAuth for OAuth
4. **Result:** Both systems running
5. **Migrated:** To NextAuth fully (mostly)
6. **Forgot:** To remove SupabaseAuthProvider
7. **Now:** Hybrid mess

**This is NORMAL!** Auth evolves as requirements change.

---

## 🎯 Immediate Next Step

**I recommend:**

1. **Skip auth migration for now** (it's complex)
2. **Migrate simpler features** (chat, insights, etc.)
3. **Come back to auth** when you have momentum
4. **Or:** Clean up first (remove SupabaseAuthProvider), THEN migrate

**What would you prefer?**

---

## 📚 Documentation

Your auth is actually well-documented in:
- `lib/auth/README.md` (comprehensive)
- `lib/middleware/tenant-context.ts` (inline comments)
- `supabase/migrations/archive/20251014_fix_rls_policies.sql` (explains issues)

The problem isn't lack of docs—it's that you have TWO systems and one is dead code.
