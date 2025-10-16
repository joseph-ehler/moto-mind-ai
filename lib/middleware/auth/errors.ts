/**
 * Authentication Error Catalog
 * 
 * Centralized error definitions with stable codes, HTTP statuses,
 * and user-friendly messages. Follows discriminated union pattern.
 * 
 * @module lib/middleware/auth/errors
 */

import { NextResponse } from 'next/server'
import type { AuthError } from './types'

// ============================================================================
// Error Code Catalog
// ============================================================================

/**
 * Stable error codes that NEVER change
 * Format: AUTH_[CATEGORY]_[SPECIFIC]
 */
export const AUTH_ERROR_CODES = {
  // Token errors
  MISSING_TOKEN: 'AUTH_TOKEN_MISSING',
  INVALID_TOKEN: 'AUTH_TOKEN_INVALID',
  EXPIRED_TOKEN: 'AUTH_TOKEN_EXPIRED',
  
  // User errors
  MISSING_USER: 'AUTH_USER_MISSING',
  MISSING_TENANT: 'AUTH_TENANT_MISSING',
  
  // Authorization errors
  FORBIDDEN: 'AUTH_FORBIDDEN',
  TENANT_MISMATCH: 'AUTH_TENANT_MISMATCH',
  
  // Rate limiting
  RATE_LIMITED: 'AUTH_RATE_LIMITED',
  
  // Internal
  INTERNAL_ERROR: 'AUTH_INTERNAL_ERROR',
} as const

/**
 * HTTP status codes for each error type
 */
const ERROR_STATUS_MAP: Record<AuthError['type'], number> = {
  MISSING_TOKEN: 401,
  INVALID_TOKEN: 401,
  EXPIRED_TOKEN: 401,
  MISSING_USER: 401,
  MISSING_TENANT: 403,
  FORBIDDEN: 403,
  TENANT_MISMATCH: 403,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
}

// ============================================================================
// Error Response Factory
// ============================================================================

/**
 * Convert AuthError to NextResponse with proper status code
 * 
 * @param error - Discriminated auth error
 * @returns NextResponse with error details
 */
export function errorToResponse(error: AuthError): NextResponse {
  const status = ERROR_STATUS_MAP[error.type]
  const code = AUTH_ERROR_CODES[error.type]
  
  // Structured error response
  const body = {
    ok: false,
    error: {
      code,
      type: error.type,
      message: error.message,
      // Include type-specific fields
      ...('reason' in error && { reason: error.reason }),
      ...('expiredAt' in error && { expiredAt: error.expiredAt }),
      ...('userId' in error && { userId: error.userId }),
      ...('required' in error && { required: error.required }),
      ...('actual' in error && { actual: error.actual }),
      ...('expected' in error && { expected: error.expected }),
      ...('retryAfter' in error && { retryAfter: error.retryAfter }),
    },
    timestamp: new Date().toISOString(),
  }
  
  // Add Retry-After header for rate limiting
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (error.type === 'RATE_LIMITED') {
    headers['Retry-After'] = error.retryAfter.toString()
  }
  
  return NextResponse.json(body, { status, headers })
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create MISSING_TOKEN error
 */
export function createMissingTokenError(): AuthError {
  return {
    type: 'MISSING_TOKEN',
    message: 'Authentication required. No token provided.',
  }
}

/**
 * Create INVALID_TOKEN error
 */
export function createInvalidTokenError(reason: string): AuthError {
  return {
    type: 'INVALID_TOKEN',
    message: 'Invalid authentication token.',
    reason,
  }
}

/**
 * Create EXPIRED_TOKEN error
 */
export function createExpiredTokenError(expiredAt: number): AuthError {
  return {
    type: 'EXPIRED_TOKEN',
    message: 'Authentication token has expired.',
    expiredAt,
  }
}

/**
 * Create MISSING_USER error
 */
export function createMissingUserError(userId: string): AuthError {
  return {
    type: 'MISSING_USER',
    message: 'User not found or deactivated.',
    userId,
  }
}

/**
 * Create MISSING_TENANT error
 */
export function createMissingTenantError(userId: string): AuthError {
  return {
    type: 'MISSING_TENANT',
    message: 'User is not associated with any tenant.',
    userId,
  }
}

/**
 * Create FORBIDDEN error
 */
export function createForbiddenError(
  required: string[],
  actual: string[]
): AuthError {
  return {
    type: 'FORBIDDEN',
    message: 'Insufficient permissions for this operation.',
    required,
    actual,
  }
}

/**
 * Create TENANT_MISMATCH error
 */
export function createTenantMismatchError(
  expected: string,
  actual: string
): AuthError {
  return {
    type: 'TENANT_MISMATCH',
    message: 'Tenant context mismatch. Access denied.',
    expected,
    actual,
  }
}

/**
 * Create RATE_LIMITED error
 */
export function createRateLimitedError(retryAfter: number): AuthError {
  return {
    type: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
    retryAfter,
  }
}

/**
 * Create INTERNAL_ERROR error
 */
export function createInternalError(error?: unknown): AuthError {
  return {
    type: 'INTERNAL_ERROR',
    message: 'An internal authentication error occurred.',
    error,
  }
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log auth error with context (for monitoring/debugging)
 * 
 * @param error - Auth error to log
 * @param context - Additional context
 */
export function logAuthError(
  error: AuthError,
  context?: Record<string, unknown>
): void {
  const logLevel = error.type === 'INTERNAL_ERROR' ? 'error' : 'warn'
  
  console[logLevel]('[AUTH ERROR]', {
    type: error.type,
    message: error.message,
    code: AUTH_ERROR_CODES[error.type],
    ...context,
    timestamp: new Date().toISOString(),
  })
  
  // In production, send to monitoring service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service
    // Sentry.captureException(error, { contexts: { auth: context } })
  }
}

// ============================================================================
// User-Friendly Error Messages
// ============================================================================

/**
 * Get user-friendly error message (for UI)
 * Never exposes internal details to end users
 */
export function getUserFriendlyMessage(error: AuthError): string {
  const messages: Record<AuthError['type'], string> = {
    MISSING_TOKEN: 'Please sign in to continue.',
    INVALID_TOKEN: 'Your session is invalid. Please sign in again.',
    EXPIRED_TOKEN: 'Your session has expired. Please sign in again.',
    MISSING_USER: 'Your account could not be found. Please contact support.',
    MISSING_TENANT: 'Your account is not set up yet. Please contact support.',
    FORBIDDEN: 'You don\'t have permission to perform this action.',
    TENANT_MISMATCH: 'Access denied. Invalid tenant context.',
    RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
    INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  }
  
  return messages[error.type]
}
