# 🚀 AUTH DAY 1 - QUICK START GUIDE

**Date:** Oct 17, 2025  
**Status:** Ready to implement  
**Goal:** Elite auth UX + bulletproof security in 8 hours

---

## ⏰ MORNING SESSION (4 hours)

### **Step 1: Apply Database Migration** (5 minutes)

```bash
# Check database health
npm run db:health

# Apply Day 1 migration
npm run db:migrate

# Verify
npm run db:introspect
```

**Expected Output:**
```
✅ user_login_preferences table created
✅ auth_rate_limits table created
✅ magic_links table created
✅ password_reset_tokens table created
✅ email_verification_tokens table created
✅ sessions table enhanced
✅ user_tenants enhanced
```

---

### **Step 2: Last Login Method Tracking** (2 hours)

#### **2.1 Create Service** (45 min)

**File:** `lib/auth/services/login-preferences.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type LoginMethod = 'google' | 'email' | 'credentials'

export async function trackLogin(
  userId: string, 
  method: LoginMethod
): Promise<void> {
  await supabase
    .from('user_login_preferences')
    .upsert({
      user_id: userId,
      last_login_method: method,
      last_login_at: new Date().toISOString(),
      login_count: supabase.raw('COALESCE(login_count, 0) + 1')
    })
}

export async function getLastLoginMethod(
  userId: string
): Promise<LoginMethod | null> {
  const { data } = await supabase
    .from('user_login_preferences')
    .select('last_login_method')
    .eq('user_id', userId)
    .single()
  
  return data?.last_login_method || null
}
```

#### **2.2 Create Hook** (15 min)

**File:** `lib/auth/hooks/useLastLogin.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getLastLoginMethod, LoginMethod } from '../services/login-preferences'

export function useLastLogin() {
  const { data: session } = useSession()
  const [lastMethod, setLastMethod] = useState<LoginMethod | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      getLastLoginMethod(session.user.email)
        .then(setLastMethod)
        .finally(() => setLoading(false))
    }
  }, [session?.user?.email])

  return { lastMethod, loading }
}
```

#### **2.3 Update NextAuth Config** (30 min)

**File:** `lib/auth/config.ts`

```typescript
import { trackLogin } from './services/login-preferences'

// In the signIn callback, add:
async signIn({ user, account }) {
  // ... existing code ...
  
  // Track login method
  if (user.email && account?.provider) {
    const method = account.provider === 'google' ? 'google' : 
                   account.provider === 'email' ? 'email' : 
                   'credentials'
    await trackLogin(user.email, method)
  }
  
  return true
}
```

#### **2.4 Update Auth Form UI** (30 min)

**File:** `components/auth/AuthForm.tsx`

```tsx
import { useLastLogin } from '@/lib/auth/hooks/useLastLogin'

export function AuthForm() {
  const { lastMethod, loading } = useLastLogin()
  
  return (
    <Stack spacing="md">
      {lastMethod && !loading && (
        <div className="text-sm text-muted-foreground">
          Welcome back! You last signed in with{' '}
          <span className="font-semibold">{lastMethod}</span>
        </div>
      )}
      
      {/* Highlight last used method */}
      <Button
        variant={lastMethod === 'google' ? 'default' : 'outline'}
        onClick={() => signIn('google')}
      >
        {lastMethod === 'google' && '✓ '}
        Continue with Google
      </Button>
      
      {/* ... other methods ... */}
    </Stack>
  )
}
```

---

### **Step 3: Rate Limiting** (1 hour)

#### **3.1 Create Rate Limiter Service** (45 min)

**File:** `lib/auth/services/rate-limiter.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AttemptType = 'login' | 'reset' | 'verify' | 'magic_link'

interface RateLimit {
  maxAttempts: number
  windowMinutes: number
}

const RATE_LIMITS: Record<AttemptType, RateLimit> = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  reset: { maxAttempts: 3, windowMinutes: 60 },
  verify: { maxAttempts: 1, windowMinutes: 5 },
  magic_link: { maxAttempts: 3, windowMinutes: 60 }
}

export async function checkRateLimit(
  identifier: string,
  type: AttemptType
): Promise<{ allowed: boolean; retryAfterMinutes?: number }> {
  const limit = RATE_LIMITS[type]
  
  // Get current record
  const { data: record } = await supabase
    .from('auth_rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('attempt_type', type)
    .single()
  
  // Check if locked
  if (record?.locked_until && new Date(record.locked_until) > new Date()) {
    const retryAfter = Math.ceil(
      (new Date(record.locked_until).getTime() - Date.now()) / 60000
    )
    return { allowed: false, retryAfterMinutes: retryAfter }
  }
  
  // Check if window expired
  const windowStart = new Date(record?.window_start || 0)
  const windowEnd = new Date(windowStart.getTime() + limit.windowMinutes * 60000)
  const now = new Date()
  
  if (now > windowEnd) {
    // Reset window
    await supabase
      .from('auth_rate_limits')
      .upsert({
        identifier,
        attempt_type: type,
        attempts: 1,
        window_start: now.toISOString(),
        locked_until: null
      })
    return { allowed: true }
  }
  
  // Increment attempts
  const newAttempts = (record?.attempts || 0) + 1
  
  if (newAttempts >= limit.maxAttempts) {
    // Lock
    const lockedUntil = new Date(now.getTime() + limit.windowMinutes * 60000)
    await supabase
      .from('auth_rate_limits')
      .upsert({
        identifier,
        attempt_type: type,
        attempts: newAttempts,
        window_start: record?.window_start || now.toISOString(),
        locked_until: lockedUntil.toISOString(),
        last_attempt_at: now.toISOString()
      })
    return { allowed: false, retryAfterMinutes: limit.windowMinutes }
  }
  
  // Update attempts
  await supabase
    .from('auth_rate_limits')
    .upsert({
      identifier,
      attempt_type: type,
      attempts: newAttempts,
      window_start: record?.window_start || now.toISOString(),
      last_attempt_at: now.toISOString()
    })
  
  return { allowed: true }
}
```

#### **3.2 Add to Auth Config** (15 min)

Update `lib/auth/config.ts`:

```typescript
import { checkRateLimit } from './services/rate-limiter'

// In authorize function:
async authorize(credentials) {
  // Check rate limit
  const rateLimit = await checkRateLimit(
    credentials.email,
    'login'
  )
  
  if (!rateLimit.allowed) {
    throw new Error(
      `Too many attempts. Try again in ${rateLimit.retryAfterMinutes} minutes`
    )
  }
  
  // ... rest of auth logic ...
}
```

---

### **Step 4: Magic Link Security** (1 hour)

#### **4.1 Create Magic Link Service** (45 min)

**File:** `lib/auth/services/magic-link.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createMagicLink(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  
  await supabase
    .from('magic_links')
    .insert({
      email,
      token,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString()
    })
  
  return token
}

export async function verifyMagicLink(
  token: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  const { data: link } = await supabase
    .from('magic_links')
    .select('*')
    .eq('token', token)
    .single()
  
  if (!link) {
    return { valid: false, error: 'Invalid link' }
  }
  
  if (link.used_at) {
    return { valid: false, error: 'Link already used' }
  }
  
  if (new Date(link.expires_at) < new Date()) {
    return { valid: false, error: 'Link expired' }
  }
  
  // Mark as used
  await supabase
    .from('magic_links')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
  
  return { valid: true, email: link.email }
}
```

#### **4.2 Update Verify Request Page** (15 min)

**File:** `app/auth/verify-request/page.tsx`

Add countdown timer showing link expiration.

---

## ☕ AFTERNOON SESSION (4 hours)

### **Step 5: Password Reset Flow** (1.5 hours)

Create:
- `lib/auth/services/password-reset.ts`
- `app/api/auth/reset-password/route.ts`
- Update `app/auth/reset-password/page.tsx`

---

### **Step 6: Email Verification** (1.5 hours)

Create:
- `lib/auth/services/email-verification.ts`
- `app/api/auth/verify-email/route.ts`
- `components/auth/VerifyEmailBanner.tsx`
- Update `app/auth/verify-email/page.tsx`

---

### **Step 7: Session Security** (1 hour)

Create:
- `lib/auth/services/device-detection.ts`
- `lib/auth/services/session-security.ts`
- Update `lib/auth/config.ts` to populate session fields

---

## ✅ END OF DAY CHECKLIST

- [ ] Migration applied successfully
- [ ] Last login method tracking working
- [ ] Rate limiting protecting auth endpoints
- [ ] Magic links expire in 15 minutes
- [ ] Magic links are one-time use
- [ ] Password reset flow complete
- [ ] Email verification flow complete
- [ ] Sessions track device/location
- [ ] All services tested manually
- [ ] Commit & push changes

---

## 🧪 TESTING COMMANDS

```bash
# Start dev server
npm run dev

# Test in browser
http://localhost:3005/auth/signin

# Check database
npm run db:introspect

# Run auth tests
npm test tests/unit/auth tests/integration/auth
```

---

## 📝 NOTES

- Use shadcn/ui for all new UI components
- Follow MotoMind design system for layouts
- Add console logs for debugging
- Test in incognito to avoid cache issues
- Take breaks every 2 hours!

---

**You've got this! 🚀 Build something amazing today!**
