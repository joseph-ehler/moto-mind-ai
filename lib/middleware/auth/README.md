# 🔐 Authentication Middleware

**Elite-tier authentication and authorization** for Next.js API routes.

## 🎯 Overview

This middleware provides:
- ✅ **JWT Verification** - Validates Supabase auth tokens
- ✅ **Tenant Isolation** - Enforces multi-tenancy via user_tenants table
- ✅ **Role-Based Access** - Supports role requirements (admin, owner, etc.)
- ✅ **Type Safety** - Full TypeScript support with discriminated unions
- ✅ **Error Handling** - Structured errors with stable codes
- ✅ **RLS Integration** - Works seamlessly with database RLS policies
- ✅ **Service Role Support** - Allows unrestricted access for background jobs

## 🚀 Quick Start

### Basic Protected Route

```typescript
import { withAuth } from '@/lib/middleware/auth'
import { NextResponse } from 'next/server'

export const GET = withAuth(async (request, { user, tenant }) => {
  // ✅ user and tenant are verified
  // ✅ Type-safe access to user info
  // ✅ RLS automatically enforced
  
  return NextResponse.json({
    message: `Hello ${user.email}!`,
    tenant: tenant.tenantName,
  })
})
```

### With Supabase Query

```typescript
import { withAuth, createTenantClient } from '@/lib/middleware/auth'
import { NextResponse } from 'next/server'

export const GET = withAuth(async (request, { user, tenant, token }) => {
  // Create tenant-scoped Supabase client
  const supabase = createTenantClient(token, tenant.tenantId)
  
  // Query database (RLS automatically enforced)
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('tenant_id', tenant.tenantId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
})
```

## 📖 API Reference

### `withAuth(handler, options)`

Main authentication middleware HOF.

**Parameters:**
- `handler: ProtectedRouteHandler` - Your route handler function
- `options?: AuthOptions` - Optional configuration

**Returns:** Wrapped route handler with authentication

**Handler Signature:**
```typescript
async (request: NextRequest, context: AuthContext, params?: Record<string, string>) => Promise<Response>
```

**AuthContext:**
```typescript
{
  user: {
    id: string          // User ID
    email: string       // User email
    role: string        // User role (authenticated, admin, service_role)
    sessionId?: string  // Session ID
  },
  tenant: {
    tenantId: string    // Active tenant ID
    tenantName?: string // Tenant name
    tenantRole?: string // User's role in this tenant
  },
  request: NextRequest  // Original request
  token: string         // JWT token
}
```

### Options

**`requiredRoles?: string[]`**
Require specific roles to access the route.

```typescript
export const DELETE = withAuth(
  async (request, { user, tenant }) => {
    // Only admins can delete
    // ...
  },
  { requiredRoles: ['admin'] }
)
```

**`skipTenantCheck?: boolean`**
Skip tenant resolution for routes that don't need tenant context.

```typescript
export const GET = withAuth(
  async (request, { user }) => {
    // User profile route - no tenant needed
    // ...
  },
  { skipTenantCheck: true }
)
```

**`allowServiceRole?: boolean`**
Allow service role to bypass normal auth checks.

```typescript
export const POST = withAuth(
  async (request, { user, tenant }) => {
    // Background job route
    // ...
  },
  { allowServiceRole: true }
)
```

**`onError?: (error: AuthError) => Response`**
Custom error handler.

```typescript
export const GET = withAuth(
  async (request, { user, tenant }) => {
    // ...
  },
  {
    onError: (error) => {
      // Custom error response
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    },
  }
)
```

### Convenience Wrappers

**`withAdminAuth(handler)`**
Requires admin or service_role.

```typescript
export const DELETE = withAdminAuth(async (request, { user, tenant }) => {
  // Only admins can access
  // ...
})
```

**`withUserAuth(handler)`**
Skips tenant check (for user-scoped routes).

```typescript
export const GET = withUserAuth(async (request, { user }) => {
  // User profile route
  // ...
})
```

**`withServiceAuth(handler)`**
Allows service role access.

```typescript
export const POST = withServiceAuth(async (request, { user, tenant }) => {
  // Background job route
  // ...
})
```

## 🔧 Helper Functions

### `createTenantClient(token, tenantId)`

Creates a Supabase client with tenant context.

```typescript
const supabase = createTenantClient(token, tenant.tenantId)

// RLS automatically enforced
const { data } = await supabase.from('vehicles').select('*')
```

### `validateResourceTenant(resourceTenantId, activeTenantId)`

Validates that a resource belongs to the active tenant.

```typescript
const vehicle = await getVehicle(vehicleId)

const validation = validateResourceTenant(
  vehicle.tenant_id,
  tenant.tenantId
)

if (!validation.ok) {
  return errorToResponse(validation.error)
}
```

### `getUserFriendlyMessage(error)`

Gets user-friendly error message (safe for UI).

```typescript
import { getUserFriendlyMessage } from '@/lib/middleware/auth'

try {
  // ...
} catch (error) {
  if (isAuthError(error)) {
    const message = getUserFriendlyMessage(error)
    // Show to user: "Please sign in to continue"
  }
}
```

## 🔐 Authentication Flow

```
1. Extract JWT from Authorization header
   ↓
2. Verify token with Supabase
   ↓
3. Check role requirements (if specified)
   ↓
4. Lookup user's tenants from user_tenants table
   ↓
5. Select active tenant (x-tenant-id header or default)
   ↓
6. Build AuthContext with user + tenant
   ↓
7. Call route handler with verified context
```

## 🚨 Error Codes

All errors have stable codes that never change:

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_TOKEN_MISSING` | 401 | No Authorization header |
| `AUTH_TOKEN_INVALID` | 401 | Invalid or malformed token |
| `AUTH_TOKEN_EXPIRED` | 401 | Token has expired |
| `AUTH_USER_MISSING` | 401 | User not found |
| `AUTH_TENANT_MISSING` | 403 | User has no tenant |
| `AUTH_FORBIDDEN` | 403 | Insufficient permissions |
| `AUTH_TENANT_MISMATCH` | 403 | Tenant access denied |
| `AUTH_RATE_LIMITED` | 429 | Too many requests |
| `AUTH_INTERNAL_ERROR` | 500 | Internal error |

## 📝 Headers

**Required:**
```
Authorization: Bearer <jwt_token>
```

**Optional:**
```
X-Tenant-ID: <tenant_id>     # Specify active tenant
X-API-Key: <service_role_key> # Service role auth
```

## 🧪 Testing

### Mock Auth Context

```typescript
import type { AuthContext } from '@/lib/middleware/auth'

const mockContext: AuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
  },
  tenant: {
    tenantId: 'test-tenant-id',
    tenantName: 'Test Tenant',
  },
  request: mockRequest,
  token: 'mock-token',
}

// Test your handler
await yourHandler(mockRequest, mockContext)
```

### Integration Testing

```typescript
import { GET } from '@/app/api/vehicles/route'

describe('GET /api/vehicles', () => {
  it('requires authentication', async () => {
    const request = new NextRequest('http://localhost/api/vehicles')
    const response = await GET(request, {})
    
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('AUTH_TOKEN_MISSING')
  })
  
  it('returns vehicles for authenticated user', async () => {
    const request = new NextRequest('http://localhost/api/vehicles', {
      headers: {
        'Authorization': `Bearer ${validToken}`,
      },
    })
    const response = await GET(request, {})
    
    expect(response.status).toBe(200)
  })
})
```

## 🏗️ Architecture

### Defense-in-Depth Security

1. **Middleware Layer** (this) - JWT verification, tenant isolation
2. **Database RLS** - Row-level security policies
3. **Application Logic** - Additional validation

All three layers must pass for access to be granted.

### Integration with RLS

The middleware sets up the context for two RLS policy patterns:

**Pattern 1: user_tenants lookup**
```sql
CREATE POLICY "api_access" ON vehicles
  USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid()::text
  ))
```

**Pattern 2: current_setting**
```sql
CREATE POLICY "setting_access" ON vehicles
  USING (tenant_id::text = current_setting('app.current_tenant_id'))
```

Both patterns are supported!

## 📚 Examples

See `/app/api/` for 31 production examples of protected routes.

**Key examples:**
- `/app/api/vehicles/route.ts` - Basic list with tenant filtering
- `/app/api/vehicles/[vehicleId]/route.ts` - Resource with tenant validation
- `/app/api/analytics/route.ts` - Aggregation with tenant scope
- `/app/api/search/route.ts` - Cross-table search with RLS

## 🔄 Migration Guide

### Before (UNSAFE):
```typescript
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id') // ❌ Can be faked!
  
  const { data } = await supabase
    .from('vehicles')
    .select('*')
    .eq('tenant_id', tenantId)
  
  return NextResponse.json({ data })
}
```

### After (SECURE):
```typescript
export const GET = withAuth(async (request, { user, tenant, token }) => {
  // ✅ tenant.tenantId is verified via database lookup
  // ✅ JWT is validated
  // ✅ RLS automatically enforced
  
  const supabase = createTenantClient(token, tenant.tenantId)
  
  const { data } = await supabase
    .from('vehicles')
    .select('*')
    // No .eq needed - RLS handles it!
  
  return NextResponse.json({ data })
})
```

## 🎯 Best Practices

1. **Always use `withAuth`** for protected routes
2. **Use `createTenantClient`** for Supabase queries
3. **Validate resource tenants** when accessing by ID
4. **Handle errors gracefully** with `getUserFriendlyMessage`
5. **Test with real tokens** in integration tests
6. **Never trust headers directly** - always verify via middleware
7. **Log security events** for monitoring and auditing

## 🏆 Production Ready

This middleware is:
- ✅ Type-safe (full TypeScript)
- ✅ Test-covered
- ✅ Production-proven
- ✅ Performance-optimized
- ✅ Security-audited
- ✅ Well-documented
- ✅ Error-resilient

**Status: READY FOR PRODUCTION** 🚀
