/**
 * Authentication Middleware
 * 
 * Higher-Order Function (HOF) that wraps API routes with authentication
 * and tenant isolation. Provides verified user and tenant context.
 * 
 * Usage:
 * ```typescript
 * import { withAuth } from '@/lib/middleware/auth'
 * 
 * export const GET = withAuth(async (request, { user, tenant }) => {
 *   // ✅ user and tenant are verified
 *   // ✅ RLS automatically enforced
 *   // ✅ Can safely query database
 *   
 *   const supabase = createTenantClient(tenant.token, tenant.tenantId)
 *   // ...
 * })
 * ```
 * 
 * @module lib/middleware/auth
 */

import type { NextRequest } from 'next/server'
import type {
  AuthOptions,
  ProtectedRouteHandler,
  AuthContext,
} from './types'
import { authenticateRequest } from './jwt'
import { resolveTenant } from './tenant'
import { errorToResponse, logAuthError, createForbiddenError } from './errors'
import { isAuthSuccess } from './types'

// ============================================================================
// Main Auth Middleware HOF
// ============================================================================

/**
 * Higher-Order Function that wraps API routes with authentication
 * 
 * This is your main auth middleware. Use it on ALL protected routes.
 * 
 * @param handler - Your route handler function
 * @param options - Optional configuration
 * @returns Wrapped route handler with auth
 * 
 * @example
 * ```typescript
 * // Basic usage
 * export const GET = withAuth(async (request, { user, tenant }) => {
 *   return NextResponse.json({ user, tenant })
 * })
 * 
 * // With role requirements
 * export const DELETE = withAuth(
 *   async (request, { user, tenant }) => {
 *     // Only admins can delete
 *     // ...
 *   },
 *   { requiredRoles: ['admin'] }
 * )
 * 
 * // Skip tenant check (for user profile routes)
 * export const GET = withAuth(
 *   async (request, { user }) => {
 *     // No tenant context needed
 *     // ...
 *   },
 *   { skipTenantCheck: true }
 * )
 * ```
 */
export function withAuth(
  handler: ProtectedRouteHandler,
  options: AuthOptions = {}
): (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response> {
  return async (
    request: NextRequest,
    routeContext?: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    try {
      // STEP 1: Authenticate request (verify JWT)
      const authResult = await authenticateRequest(request)
      
      if (!isAuthSuccess(authResult)) {
        logAuthError(authResult.error, {
          path: request.nextUrl.pathname,
          method: request.method,
        })
        
        if (options.onError) {
          return options.onError(authResult.error)
        }
        
        return errorToResponse(authResult.error)
      }
      
      const { user, token } = authResult.value
      
      // STEP 2: Check role requirements (if specified)
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = options.requiredRoles.includes(user.role)
        
        if (!hasRequiredRole) {
          const error = createForbiddenError(
            options.requiredRoles,
            [user.role]
          )
          
          logAuthError(error, {
            path: request.nextUrl.pathname,
            method: request.method,
            userId: user.id,
          })
          
          return errorToResponse(error)
        }
      }
      
      // STEP 3: Resolve tenant context (unless skipped)
      let tenantContext
      
      if (!options.skipTenantCheck) {
        const requestedTenantId = request.headers.get('x-tenant-id')
        
        const tenantResult = await resolveTenant(user, token, requestedTenantId)
        
        if (!isAuthSuccess(tenantResult)) {
          logAuthError(tenantResult.error, {
            path: request.nextUrl.pathname,
            method: request.method,
            userId: user.id,
          })
          
          if (options.onError) {
            return options.onError(tenantResult.error)
          }
          
          return errorToResponse(tenantResult.error)
        }
        
        tenantContext = tenantResult.value
      } else {
        // No tenant context needed
        tenantContext = {
          tenantId: '',
          tenantName: '',
        }
      }
      
      // STEP 4: Build auth context
      const authContext: AuthContext = {
        user,
        tenant: tenantContext,
        request,
        token,
      }
      
      // STEP 5: Call the actual route handler with auth context
      const params = routeContext?.params ? await routeContext.params : undefined
      
      return await handler(request, authContext, params)
      
    } catch (error) {
      console.error('[AUTH] Unexpected error:', error)
      
      // Return generic error (don't leak internal details)
      return errorToResponse({
        type: 'INTERNAL_ERROR',
        message: 'An authentication error occurred',
        error,
      })
    }
  }
}

// ============================================================================
// Convenience Wrappers
// ============================================================================

/**
 * Auth middleware that requires admin role
 * 
 * @param handler - Route handler
 * @returns Wrapped handler requiring admin role
 */
export function withAdminAuth(handler: ProtectedRouteHandler) {
  return withAuth(handler, {
    requiredRoles: ['admin', 'service_role'],
  })
}

/**
 * Auth middleware that skips tenant check
 * Useful for user profile routes, settings, etc.
 * 
 * @param handler - Route handler
 * @returns Wrapped handler without tenant check
 */
export function withUserAuth(handler: ProtectedRouteHandler) {
  return withAuth(handler, {
    skipTenantCheck: true,
  })
}

/**
 * Auth middleware that allows service role
 * 
 * @param handler - Route handler
 * @returns Wrapped handler allowing service role
 */
export function withServiceAuth(handler: ProtectedRouteHandler) {
  return withAuth(handler, {
    allowServiceRole: true,
  })
}

// ============================================================================
// Re-exports
// ============================================================================

export type {
  AuthContext,
  AuthUser,
  TenantContext,
  AuthOptions,
  ProtectedRouteHandler,
  AuthError,
  AuthResult,
} from './types'

export {
  isAuthError,
  isAuthSuccess,
  isAuthFailure,
} from './types'

export {
  createTenantClient,
  validateResourceTenant,
} from './tenant'

export {
  AUTH_ERROR_CODES,
  getUserFriendlyMessage,
} from './errors'
