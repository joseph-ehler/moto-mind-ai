# Auth Architecture Discovery

**Date:** October 17, 2025  
**Issue:** User signing in multiple times but Supabase shows Oct 13 as last login

---

## 🎯 ROOT CAUSE FOUND

**You're using NextAuth (with Google OAuth), NOT Supabase Auth!**

---

## 📊 YOUR CURRENT AUTH SETUP

### **Authentication: NextAuth**
- **Provider:** Google OAuth
- **Location:** `app/api/auth/[...nextauth]/route.ts`
- **Session Management:** NextAuth (JWT tokens)
- **User Storage:** NextAuth's default (not in database)

### **Database: Supabase**
- **Purpose:** Data storage only
- **Client Type:** Service role (no auth)
- **Location:** `lib/supabase/client.ts`
- **Auth Disabled:** `autoRefreshToken: false, persistSession: false`

---

## 🔍 WHAT'S HAPPENING

### When you sign in through your app:
```
User clicks "Sign in with Google"
    ↓
NextAuth handles OAuth flow
    ↓
Google authenticates user
    ↓
NextAuth creates session (JWT)
    ↓
User is signed in
    ↓
Supabase Auth = NOT INVOLVED ❌
```

### The Oct 13 login in Supabase:
```
That timestamp in auth.users is from:
- Testing Supabase Auth directly
- Old migration/setup
- Manual testing in Supabase dashboard

But your app NEVER uses Supabase Auth!
```

---

## 📁 YOUR AUTH CONFIGURATION

```typescript
// app/api/auth/[...nextauth]/route.ts
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ❌ NO Supabase integration
  // ❌ NO database adapter
  // ❌ NO session tracking
  // ❌ NO login tracking
})
```

```typescript
// lib/supabase/client.ts
export function getSupabaseClient() {
  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,    // ← Auth disabled
        persistSession: false        // ← No sessions
      }
    }
  )
}
```

---

## 🎯 THE SOLUTION

You have TWO options:

### **Option 1: Stay with NextAuth (Recommended)**

Keep using NextAuth but integrate our Day 1 tracking features.

#### Add to NextAuth callbacks:

```typescript
// app/api/auth/[...nextauth]/route.ts
import { trackLogin } from '@/lib/auth/services/login-preferences'
import { trackSession } from '@/lib/auth/services/session-tracker'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      console.log('[NextAuth] SignIn:', user?.email, account?.provider)
      
      // ✅ Track login in our custom table
      if (user?.email) {
        await trackLogin(user.email, 'google')
      }
      
      return true
    },
    
    async session({ session, token }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    
    async jwt({ token, user, account }) {
      // Store user info in JWT
      if (user) {
        token.email = user.email
        token.name = user.name
      }
      return token
    }
  },
  
  events: {
    async signIn({ user, account }) {
      // ✅ Track session with device info
      // Note: Request object not available in events
      // We'll need to track this elsewhere
      console.log('[NextAuth] User signed in:', user?.email)
    }
  }
})
```

#### Track sessions in middleware:

```typescript
// middleware.ts or in your protected routes
import { trackSession } from '@/lib/auth/services/session-tracker'
import { getServerSession } from 'next-auth'

export async function middleware(request: NextRequest) {
  const session = await getServerSession()
  
  if (session?.user?.email) {
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    await trackSession(
      session.user.email,
      userAgent,
      ip
    )
  }
  
  return NextResponse.next()
}
```

---

### **Option 2: Switch to Supabase Auth (Major Change)**

Migrate from NextAuth to Supabase Auth completely.

**Pros:**
- Native integration with Supabase
- Built-in user management
- RLS policies work automatically
- Automatic login tracking

**Cons:**
- Requires rewriting auth flow
- Migration effort
- May break existing sessions
- Need to update all auth code

**Not recommended** unless you have specific reasons to use Supabase Auth.

---

## 🔧 IMMEDIATE FIX (5 Minutes)

### Add login tracking to your existing NextAuth:

```typescript
// app/api/auth/[...nextauth]/route.ts
import { trackLogin } from '@/lib/auth/services/login-preferences'

const handler = NextAuth({
  // ... existing config
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] SignIn callback:', { 
        user: user?.email, 
        account: account?.provider 
      })
      
      // ✅ ADD THIS
      if (user?.email) {
        try {
          await trackLogin(user.email, 'google')
          console.log('[NextAuth] Login tracked:', user.email)
        } catch (error) {
          console.error('[NextAuth] Failed to track login:', error)
          // Don't fail the login if tracking fails
        }
      }
      
      return true
    },
    
    // Keep existing redirect callback
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect:', { url, baseUrl })
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },
})
```

Now when you sign in:
- ✅ NextAuth handles authentication
- ✅ Our `trackLogin()` records it in `user_login_preferences`
- ✅ You'll see login method, timestamp, count

---

## 📊 WHAT EACH TABLE TRACKS

### `auth.users` (Supabase Auth - NOT USED)
- **Updates when:** Using Supabase Auth
- **Your usage:** Never (you use NextAuth)
- **Why Oct 13?:** Old test/setup, never updated since

### `user_login_preferences` (Our Day 1 Feature)
- **Updates when:** You call `trackLogin()`
- **Your usage:** After integration (above)
- **Tracks:** Login method, count, preferred method

### `sessions` (Our Day 1 Feature)
- **Updates when:** You call `trackSession()`
- **Your usage:** In middleware (recommended)
- **Tracks:** Device, location, IP, last active

---

## ✅ VERIFICATION

After adding the tracking code:

### 1. Sign out and sign in again

### 2. Check our custom table:
```sql
SELECT * FROM user_login_preferences 
ORDER BY last_login_at DESC;
```

You should see:
```
user_id | last_login_method | last_login_at        | login_count
--------|-------------------|----------------------|-------------
your@   | google            | 2025-10-17 09:30:00  | 1
email   |                   |                      |
```

### 3. Supabase Auth table will still show Oct 13:
```sql
SELECT email, last_sign_in_at FROM auth.users;
```

Result:
```
email                  | last_sign_in_at
-----------------------|-------------------
joseph.ehler@gmail.com | 2025-10-13 22:07:59  ← Won't update (not used)
```

**This is expected and correct!** You're not using Supabase Auth.

---

## 🎯 BOTTOM LINE

**Your Setup:**
- ✅ NextAuth for authentication (working)
- ✅ Google OAuth (working)
- ✅ Sign in/out works (working)
- ❌ No login tracking (not integrated yet)

**The Fix:**
- Add `trackLogin()` to NextAuth `signIn` callback
- Add `trackSession()` to middleware
- Use `user_login_preferences` table (not `auth.users`)

**The Confusion:**
- You thought you were using Supabase Auth
- But you're actually using NextAuth
- Supabase is just for database storage
- `auth.users.last_sign_in_at` is irrelevant to your app

---

## 📝 NEXT STEPS

1. ✅ Add tracking to NextAuth (5 min - code above)
2. ✅ Sign in/out to test
3. ✅ Verify data in `user_login_preferences`
4. ✅ Ignore `auth.users` (not used by your app)

Need help integrating? I can update the NextAuth config file right now! 🚀
