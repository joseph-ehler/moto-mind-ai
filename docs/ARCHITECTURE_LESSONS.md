# Architecture Lessons: How to Avoid Mass Refactors

**Problem:** We just had to update 28+ files to switch from NextAuth to Supabase Auth.  
**Solution:** Better abstraction patterns to isolate dependencies.

---

## **THE PROBLEM: TIGHT COUPLING**

### **What We Did Wrong:**
```tsx
// ❌ BAD: Direct dependency on NextAuth in 28 files
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()
  // ...
}
```

**Why This Sucks:**
- Every file imports NextAuth directly
- Changing auth providers = updating every file
- No central control over auth behavior
- Hard to test (mocking 28 files!)

---

## **THE SOLUTION: ABSTRACTION LAYERS**

### **Pattern 1: Auth Facade (Recommended)**

**Create ONE central auth interface:**

```typescript
// lib/auth/facade.ts
// THIS IS THE ONLY FILE THAT KNOWS ABOUT SUPABASE

import { createClient } from '@/lib/supabase/browser-client'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export const auth = {
  // Get current user
  async getUser(): Promise<User | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    
    return {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name,
      avatar: session.user.user_metadata?.avatar_url
    }
  },
  
  // Sign in with Google
  async signInWithGoogle() {
    const supabase = createClient()
    return supabase.auth.signInWithOAuth({ provider: 'google' })
  },
  
  // Sign out
  async signOut() {
    const supabase = createClient()
    return supabase.auth.signOut()
  },
  
  // Listen for auth changes
  onAuthChange(callback: (user: User | null) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange((_, session) => {
      callback(session?.user ? {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name,
        avatar: session.user.user_metadata?.avatar_url
      } : null)
    })
  }
}
```

**Then everywhere else:**

```tsx
// ✅ GOOD: Uses facade, not Supabase directly
import { auth } from '@/lib/auth/facade'

function MyComponent() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    auth.getUser().then(setUser)
    const { data: { subscription } } = auth.onAuthChange(setUser)
    return () => subscription.unsubscribe()
  }, [])
  
  // ...
}
```

**Benefits:**
- ✅ Change auth provider? Update ONE file (`facade.ts`)
- ✅ Easy to test (mock the facade)
- ✅ Consistent API across codebase
- ✅ Type safety

---

### **Pattern 2: Custom Hook (Also Good)**

```typescript
// hooks/useAuth.ts
import { auth, User } from '@/lib/auth/facade'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    auth.getUser()
      .then(setUser)
      .finally(() => setIsLoading(false))
      
    const { data: { subscription } } = auth.onAuthChange(setUser)
    return () => subscription.unsubscribe()
  }, [])
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut: auth.signOut
  }
}
```

**Usage:**
```tsx
// ✅ Even simpler!
function MyComponent() {
  const { user, isLoading, signOut } = useAuth()
  // ...
}
```

---

### **Pattern 3: Dependency Injection (Advanced)**

```typescript
// lib/auth/types.ts
export interface AuthProvider {
  getUser(): Promise<User | null>
  signIn(provider: string): Promise<void>
  signOut(): Promise<void>
  onAuthChange(callback: (user: User | null) => void): () => void
}

// lib/auth/providers/supabase.ts
export class SupabaseAuthProvider implements AuthProvider {
  async getUser() { /* ... */ }
  async signIn(provider) { /* ... */ }
  async signOut() { /* ... */ }
  onAuthChange(callback) { /* ... */ }
}

// app/providers.tsx
export function AppProviders({ children }) {
  return (
    <AuthContext.Provider value={new SupabaseAuthProvider()}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Benefits:**
- ✅ Swap providers at runtime
- ✅ Test with mock provider
- ✅ Multiple auth systems simultaneously

---

## **OTHER ABSTRACTION PATTERNS**

### **Database Abstraction:**

```typescript
// lib/db/facade.ts
export const db = {
  async query(table: string, options) {
    // Could be Supabase, Prisma, raw SQL, etc.
    const supabase = getSupabaseClient()
    return supabase.from(table).select(options.select)
  },
  
  async insert(table: string, data) {
    const supabase = getSupabaseClient()
    return supabase.from(table).insert(data)
  }
}
```

### **API Client Abstraction:**

```typescript
// lib/api/client.ts
export const api = {
  async get(path: string) {
    const res = await fetch(`/api${path}`)
    return res.json()
  },
  
  async post(path: string, data: any) {
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return res.json()
  }
}
```

---

## **WHEN TO ABSTRACT**

### **DO abstract:**
- ✅ External dependencies (auth, DB, APIs)
- ✅ Anything that might change providers
- ✅ Complex logic used in many places
- ✅ Things you want to test/mock

### **DON'T abstract:**
- ❌ React itself (it's stable)
- ❌ UI components (shadcn/ui is fine)
- ❌ Utilities that won't change (lodash, date-fns)
- ❌ Over-abstracting too early

---

## **RULE OF THUMB**

**"If changing this dependency requires touching more than 3 files, it needs abstraction."**

---

## **HOW TO REFACTOR TO THIS PATTERN**

1. **Create the facade** (`lib/auth/facade.ts`)
2. **Create the hook** (`hooks/useAuth.ts`)
3. **Update ONE component** to use the new pattern
4. **Test it**
5. **Gradually migrate** other components
6. **Delete old patterns**

This way, you migrate incrementally, not all at once!

---

## **NEXT STEPS FOR YOUR APP**

1. ✅ Create `lib/auth/facade.ts` with Supabase wrapper
2. ✅ Create `hooks/useAuth.ts` custom hook
3. ✅ Update components to use `useAuth()` instead of direct Supabase
4. ✅ Consider same pattern for database access
5. ✅ Document in `README.md`

**Want me to implement this now?** We can create the facade and migrate your components to use it! 🚀
