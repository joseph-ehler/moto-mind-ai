# Production-Grade Authentication System

Complete, secure authentication system for MotoMind using NextAuth + Supabase.

## Features

✅ **OAuth Authentication** - Google sign-in via NextAuth  
✅ **Multi-Tenant Architecture** - Automatic tenant creation and isolation  
✅ **Session Management** - 30-day sessions with automatic refresh  
✅ **Role-Based Access Control** - Owner, Admin, Member, Viewer roles  
✅ **Security Hardening** - CSRF protection, secure cookies, session validation  
✅ **Type Safety** - Full TypeScript support with proper type declarations  
✅ **Route Protection** - Client and server-side auth guards  
✅ **API Protection** - Automatic tenant isolation middleware  

## Architecture

```
User Signs In (Google OAuth)
    ↓
NextAuth creates session
    ↓
Check if user exists in user_tenants table
    ↓
    ├─ YES → Fetch tenant_id → Attach to session
    └─ NO → Create new tenant → Link user → Attach to session
    ↓
Session contains: { email, tenantId, role }
    ↓
All API/DB queries filtered by tenantId
```

## Usage

### Client Components

```tsx
'use client'

import { useAuth, useRequireAuth, useHasRole } from '@/lib/auth/client'
import { signIn, signOut } from 'next-auth/react'

// Get current user (optional auth)
function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) return <button onClick={() => signIn('google')}>Sign In</button>
  
  return <div>Welcome {user.email}</div>
}

// Require authentication (auto-redirects)
function ProtectedComponent() {
  const { user, isLoading } = useRequireAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  return <div>Protected content for {user.email}</div>
}

// Check roles
function AdminPanel() {
  const isAdmin = useHasRole('admin')
  
  if (!isAdmin) return <div>Access denied</div>
  
  return <div>Admin controls</div>
}

// Sign out
function SignOutButton() {
  return <button onClick={() => signOut()}>Sign Out</button>
}
```

### Server Components

```tsx
import { getSession, requireAuth, getCurrentUser } from '@/lib/auth/server'

// Optional auth
async function MyPage() {
  const session = await getSession()
  
  if (!session) return <SignInPrompt />
  
  return <div>Welcome {session.user.email}</div>
}

// Required auth (auto-redirects)
async function ProtectedPage() {
  const session = await requireAuth() // Redirects if not authenticated
  
  return <div>Protected content</div>
}

// Get user info
async function UserProfile() {
  const user = await getCurrentUser()
  
  if (!user) return <SignInPrompt />
  
  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Tenant: {user.tenantId}</p>
      <p>Role: {user.role}</p>
    </div>
  )
}
```

### API Routes

```tsx
import { NextApiRequest, NextApiResponse } from 'next'
import { requireAuthApi } from '@/lib/auth/server'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

// Manual auth check
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuthApi(req, res)
  if (!user) return // 401 already sent
  
  // User is authenticated
  const { tenantId, email, role } = user
  
  // Your logic here - filtered by tenantId
  const vehicles = await db.vehicles.findMany({ where: { tenantId } })
  
  res.json({ vehicles })
}

// Automatic tenant isolation (recommended)
async function vehiclesHandler(req: NextApiRequest, res: NextApiResponse) {
  // tenantId is automatically added to req by middleware
  const tenantId = (req as any).tenantId
  
  const vehicles = await db.vehicles.findMany({ where: { tenantId } })
  
  res.json({ vehicles })
}

export default withTenantIsolation(vehiclesHandler)
```

## Database Schema

```sql
-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-tenant mapping (supports multiple users per tenant)
CREATE TABLE user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Email from OAuth
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- All other tables must include tenant_id for isolation
ALTER TABLE vehicles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE vehicle_events ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- etc.
```

## Role Hierarchy

```
owner    (4) - Full access, can manage team
admin    (3) - Can manage data, no team management
member   (2) - Can create/edit own data
viewer   (1) - Read-only access
```

Check permissions:

```tsx
import { hasPermission } from '@/lib/auth/server'

if (hasPermission(user.role, 'admin')) {
  // User is admin or owner
}
```

## Environment Variables

```env
# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Best Practices

✅ **Session secrets** - Use strong NEXTAUTH_SECRET (32+ chars)  
✅ **HTTPS only** - Always use HTTPS in production  
✅ **Tenant isolation** - NEVER trust client-provided tenant_id  
✅ **Role validation** - Check roles on server, not client  
✅ **Token refresh** - Sessions auto-refresh every 24 hours  
✅ **Inactive tenants** - Automatically block on token refresh  

## Testing

```bash
# Test auth flow
1. Sign in with Google
2. Check session: console.log(await getServerSession())
3. Verify tenant created in database
4. Test API with tenant isolation
5. Sign out
```

## Migration from Old System

The old system used:
- Mixed Supabase OAuth + NextAuth
- Demo tenant fallback
- No proper session types

This new system:
- Pure NextAuth (no Supabase OAuth)
- No fallbacks (fails fast with 401)
- Proper TypeScript types
- Automatic tenant creation

## Troubleshooting

**"401 Unauthorized"** - User not signed in or session expired  
**"Session exists but no tenantId"** - Sign out and back in to get new session  
**"Tenant not found"** - Database migration may not have run  
**TypeScript errors** - Make sure `lib/auth/types.ts` is imported  

## Files

```
lib/auth/
├── config.ts         # NextAuth configuration
├── server.ts         # Server-side utilities
├── client.ts         # Client-side hooks
├── types.ts          # TypeScript declarations
└── README.md         # This file

lib/middleware/
└── tenant-context.ts # Automatic tenant isolation
```

## Next Steps

- [ ] Add email/password provider
- [ ] Add 2FA support
- [ ] Add session management UI
- [ ] Add team invitation flow
- [ ] Add audit logging
