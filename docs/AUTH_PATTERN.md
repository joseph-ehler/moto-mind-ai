# Authentication Pattern Guide

## ⚠️ CRITICAL: Always Use These Helpers

Your app uses **NextAuth** for authentication, NOT Supabase Auth. These are two separate systems that don't talk to each other.

**NEVER do this:**
```typescript
// ❌ WRONG - This won't work!
const { data: { user } } = await supabase.auth.getUser()
// Supabase auth is empty - we use NextAuth!
```

**ALWAYS do this:**
```typescript
// ✅ CORRECT - Use our unified auth helpers
import { getCurrentUserServer } from '@/lib/auth/current-user'

const user = await getCurrentUserServer()
```

---

## 📚 Quick Reference

### Server-Side (API Routes, Server Components)

```typescript
import { 
  getCurrentUserServer,
  requireUserServer,
  getCurrentUserIdServer,
  requireUserIdServer 
} from '@/lib/auth/current-user'

// Option 1: Get user (may be null)
const user = await getCurrentUserServer()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Option 2: Require user (throws if not authenticated)
const user = await requireUserServer() // Guaranteed to exist

// Option 3: Just get user ID
const userId = await getCurrentUserIdServer() // May be null
const userId = await requireUserIdServer()    // Guaranteed to exist
```

### Client-Side (React Components)

```typescript
import { 
  useCurrentUser,
  useRequireUser,
  useCurrentUserId 
} from '@/hooks/useCurrentUser'

// Option 1: Get user (may be null)
const { user, isLoading, isAuthenticated } = useCurrentUser()

// Option 2: Require user
const { user, isLoading } = useRequireUser() // user guaranteed

// Option 3: Just get user ID
const userId = useCurrentUserId() // May be null
```

---

## 🎯 Use Cases

### API Route Example

**Before (ERROR-PRONE):**
```typescript
export async function POST(request: Request) {
  // ❌ Have to remember the pattern every time
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use userId...
}
```

**After (FOOLPROOF):**
```typescript
import { requireUserServer } from '@/lib/auth/current-user'

export async function POST(request: Request) {
  // ✅ One line, always works
  const user = await requireUserServer()
  
  // user.id guaranteed to exist
  await parkingMemory.saveSpot(user.id, options)
}
```

### Client Component Example

**Before (ERROR-PRONE):**
```typescript
function MyComponent() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id
  
  if (!userId) return null
  
  // Use userId...
}
```

**After (FOOLPROOF):**
```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser'

function MyComponent() {
  const { user, isLoading } = useCurrentUser()
  
  if (isLoading) return <Spinner />
  if (!user) return <SignInPrompt />
  
  // user.id guaranteed to exist
}
```

---

## 🏗️ Refactoring Existing Code

### Pattern 1: Service Classes

**Before:**
```typescript
class ParkingMemory {
  async saveSpot(options) {
    // ❌ Trying to get user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    await supabase.from('parking_spots').insert({
      user_id: user.id,
      ...options
    })
  }
}
```

**After:**
```typescript
class ParkingMemory {
  async saveSpot(userId: string, options) {
    // ✅ Accepts userId as parameter
    // Caller is responsible for getting it from auth helper
    
    await supabase.from('parking_spots').insert({
      user_id: userId,
      ...options
    })
  }
}
```

### Pattern 2: React Hooks

**Before:**
```typescript
function useParkingMemory() {
  const saveSpot = async (options) => {
    // ❌ No user context
    await parkingMemory.saveSpot(options)
  }
}
```

**After:**
```typescript
import { useCurrentUserId } from '@/hooks/useCurrentUser'

function useParkingMemory() {
  const userId = useCurrentUserId()
  
  const saveSpot = async (options) => {
    if (!userId) throw new Error('Not authenticated')
    
    // ✅ Pass userId from auth helper
    await parkingMemory.saveSpot(userId, options)
  }
}
```

---

## 🚀 Why This Works

### 1. Single Source of Truth
- ONE place to get current user
- Works the same everywhere
- No confusion about NextAuth vs Supabase

### 2. Type Safety
```typescript
interface CurrentUser {
  id: string        // Always present
  email: string     // Always present
  name?: string     // Optional
  image?: string    // Optional
}
```

### 3. Consistent API
```typescript
// Server
const user = await getCurrentUserServer()

// Client  
const { user } = useCurrentUser()

// Same shape, different context
```

### 4. Future-Proof
- Works with native apps (Capacitor)
- Easy to switch auth providers later
- All code uses same pattern

---

## ⚡ Performance Notes

### Server-Side Caching
NextAuth sessions are cached automatically. Calling `getCurrentUserServer()` multiple times in the same request is cheap.

### Client-Side
`useCurrentUser()` uses NextAuth's `useSession()` which handles caching and revalidation automatically.

---

## 🔒 Security Notes

### Server-Side
- Always validate user on the server
- Don't trust client-provided user IDs
- Use `requireUserServer()` for protected routes

### Database
- Row Level Security (RLS) policies use `user_id`
- Always filter queries by user ID
- Never expose other users' data

---

## 📋 Checklist for New Features

When building a new feature that needs user context:

**Server-Side (API Routes):**
- [ ] Import `getCurrentUserServer` or `requireUserServer`
- [ ] Get user at the start of the route
- [ ] Use `user.id` in all database queries
- [ ] Never use `supabase.auth.getUser()`

**Client-Side (Components):**
- [ ] Import `useCurrentUser` hook
- [ ] Handle loading state
- [ ] Handle not-authenticated state
- [ ] Use `user.id` when calling APIs

**Service Classes:**
- [ ] Accept `userId` as first parameter
- [ ] Don't try to get user inside the class
- [ ] Document that caller must provide user ID

---

## 🐛 Common Mistakes

### Mistake 1: Using Supabase Auth
```typescript
// ❌ WRONG
const { data: { user } } = await supabase.auth.getUser()
```
**Why wrong:** Supabase auth is not configured. We use NextAuth.

### Mistake 2: Manually Extracting User
```typescript
// ❌ ERROR-PRONE
const session = await getServerSession(authOptions)
const userId = (session?.user as any)?.id
```
**Why wrong:** Boilerplate you have to remember. Use the helper!

### Mistake 3: Not Passing User ID
```typescript
// ❌ WRONG
await parkingMemory.saveSpot(options)
```
**Why wrong:** Method needs user ID. Pass it explicitly.

```typescript
// ✅ CORRECT
const user = await requireUserServer()
await parkingMemory.saveSpot(user.id, options)
```

---

## 🎯 Migration Guide

### Step 1: Replace Direct Session Access

**Find:**
```typescript
const session = await getServerSession(authOptions)
const userId = (session?.user as any)?.id
```

**Replace with:**
```typescript
const user = await getCurrentUserServer()
const userId = user?.id
```

### Step 2: Replace Supabase Auth
**Find:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

**Replace with:**
```typescript
const user = await getCurrentUserServer()
```

### Step 3: Update Service Methods
**Find:**
```typescript
async saveSpot(options) {
  const { data: { user } } = await supabase.auth.getUser()
  // use user.id...
}
```

**Replace with:**
```typescript
async saveSpot(userId: string, options) {
  // use userId parameter...
}
```

### Step 4: Update React Hooks
**Find:**
```typescript
const { data: session } = useSession()
const userId = (session?.user as any)?.id
```

**Replace with:**
```typescript
const { user } = useCurrentUser()
const userId = user?.id
```

---

## 📝 Summary

**Golden Rules:**
1. ✅ ALWAYS use `getCurrentUserServer()` on server
2. ✅ ALWAYS use `useCurrentUser()` on client
3. ❌ NEVER use `supabase.auth.getUser()`
4. ✅ Service classes accept `userId` parameter
5. ✅ Validate user on server, not just client

**Benefits:**
- No more "User not authenticated" errors
- Consistent pattern across codebase
- Easy to remember
- Future-proof
- Type-safe

**Next Steps:**
- Use these helpers in all new code
- Gradually refactor existing code
- Create a memory/reminder for this pattern
