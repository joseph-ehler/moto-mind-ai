/**
 * Authentication Middleware Types
 * 
 * Type-safe authentication and authorization for API routes.
 * Integrates with Supabase JWT and RLS for complete security.
 * 
 * @module lib/middleware/auth/types
 */

import { NextRequest } from 'next/server'

// ============================================================================
// Core Types
// ============================================================================

/**
 * Verified user information from JWT token
 */
export interface AuthUser {
  /** User ID from auth.users */
  id: string
  /** User email */
  email: string
  /** User role (authenticated, service_role, etc.) */
  role: string
  /** Session ID */
  sessionId?: string
  /** Token expiration timestamp */
  exp?: number
  /** Token issued at timestamp */
  iat?: number
}

/**
 * Tenant information for multi-tenancy
 */
export interface TenantContext {
  /** Tenant ID from user_tenants table */
  tenantId: string
  /** Tenant name (optional) */
  tenantName?: string
  /** User's role within this tenant */
  tenantRole?: string
}

/**
 * Complete authenticated request context
 * Passed to protected route handlers
 */
export interface AuthContext {
  /** Verified user information */
  user: AuthUser
  /** Active tenant context */
  tenant: TenantContext
  /** Original NextRequest object */
  request: NextRequest
  /** Supabase JWT token */
  token: string
}

/**
 * Options for auth middleware configuration
 */
export interface AuthOptions {
  /** Require specific roles (e.g., ['admin', 'owner']) */
  requiredRoles?: string[]
  /** Allow service role bypass */
  allowServiceRole?: boolean
  /** Skip tenant isolation check */
  skipTenantCheck?: boolean
  /** Custom error handler */
  onError?: (error: AuthError) => Response
}

// ============================================================================
// Discriminated Union: Auth Errors
// ============================================================================

/**
 * Authentication/Authorization errors with discriminated types
 * Each error has a stable 'type' for pattern matching
 */
export type AuthError =
  | { type: 'MISSING_TOKEN'; message: string }
  | { type: 'INVALID_TOKEN'; message: string; reason: string }
  | { type: 'EXPIRED_TOKEN'; message: string; expiredAt: number }
  | { type: 'MISSING_USER'; message: string; userId: string }
  | { type: 'MISSING_TENANT'; message: string; userId: string }
  | { type: 'FORBIDDEN'; message: string; required: string[]; actual: string[] }
  | { type: 'TENANT_MISMATCH'; message: string; expected: string; actual: string }
  | { type: 'RATE_LIMITED'; message: string; retryAfter: number }
  | { type: 'INTERNAL_ERROR'; message: string; error?: unknown }

/**
 * Result type for auth operations (Railway-oriented programming)
 */
export type AuthResult<T> = 
  | { ok: true; value: T }
  | { ok: false; error: AuthError }

// ============================================================================
// Route Handler Types
// ============================================================================

/**
 * Protected route handler with auth context
 * This is what your API routes will implement
 */
export type ProtectedRouteHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: Record<string, string>
) => Promise<Response>

/**
 * Unprotected route handler (for migration)
 */
export type UnprotectedRouteHandler = (
  request: NextRequest,
  params?: Record<string, string | string[]>
) => Promise<Response>

// ============================================================================
// Helper Type Guards
// ============================================================================

/**
 * Type guard for auth errors
 */
export function isAuthError(value: unknown): value is AuthError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  )
}

/**
 * Type guard for successful auth result
 */
export function isAuthSuccess<T>(
  result: AuthResult<T>
): result is { ok: true; value: T } {
  return result.ok === true
}

/**
 * Type guard for failed auth result
 */
export function isAuthFailure<T>(
  result: AuthResult<T>
): result is { ok: false; error: AuthError } {
  return result.ok === false
}
