/**
 * App Router Authentication Middleware
 * 
 * Provides withAuth wrapper for API routes in Next.js 13+ App Router
 * Handles:
 * - JWT verification via NextAuth
 * - Tenant extraction from session
 * - Tenant-scoped Supabase client
 * - Structured error responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface AuthContext {
  user: {
    id: string
    email: string
    tenantId: string
    role: string
  }
  tenant: {
    tenantId: string
  }
  token: {
    email: string
    tenantId: string
    role: string
  }
}

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>

// ============================================================================
// Tenant-Scoped Supabase Client
// ============================================================================

/**
 * Create Supabase client with automatic tenant isolation via RLS
 * 
 * RLS policies will automatically filter queries by tenant_id
 * based on the authenticated user's tenant membership
 */
export function createTenantClient(token: AuthContext['token'], tenantId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          // Pass user context for RLS
          'x-user-email': token.email,
          'x-tenant-id': tenantId,
        }
      }
    }
  )

  return supabase
}

// ============================================================================
// Auth Middleware
// ============================================================================

/**
 * Wrap API route handlers with authentication
 * 
 * Usage:
 * ```ts
 * export const GET = withAuth(async (request, { user, tenant, token }) => {
 *   const supabase = createTenantClient(token, tenant.tenantId)
 *   // RLS automatically filters by tenant_id
 *   const { data } = await supabase.from('vehicles').select('*')
 *   return NextResponse.json({ ok: true, data })
 * })
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    { params }: { params?: Record<string, string> } = {}
  ): Promise<NextResponse> => {
    try {
      // Get NextAuth session
      const session = await getServerSession(authOptions)

      // Check authentication
      if (!session?.user?.email || !session.user.tenantId) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Please sign in.'
            }
          },
          { status: 401 }
        )
      }

      // Build auth context
      const authContext: AuthContext = {
        user: {
          id: session.user.email,
          email: session.user.email,
          tenantId: session.user.tenantId,
          role: session.user.role || 'member'
        },
        tenant: {
          tenantId: session.user.tenantId
        },
        token: {
          email: session.user.email,
          tenantId: session.user.tenantId,
          role: session.user.role || 'member'
        }
      }

      // Call handler with auth context
      return await handler(request, authContext, params)

    } catch (error) {
      console.error('[AUTH_MIDDLEWARE] Error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication error. Please try again.'
          }
        },
        { status: 500 }
      )
    }
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if user has required role
 */
export function hasPermission(
  userRole: string,
  requiredRole: 'owner' | 'admin' | 'member' | 'viewer'
): boolean {
  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
  }

  return (
    roleHierarchy[userRole as keyof typeof roleHierarchy] >=
    roleHierarchy[requiredRole]
  )
}

/**
 * Create standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message
      }
    },
    { status }
  )
}

/**
 * Create standardized success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      ok: true,
      data
    },
    { status }
  )
}
