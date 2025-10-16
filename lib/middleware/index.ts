/**
 * Middleware Barrel Export
 * 
 * Centralized exports for all middleware functions.
 * 
 * @module lib/middleware
 */

// Authentication middleware
export {
  withAuth,
  withAdminAuth,
  withUserAuth,
  withServiceAuth,
  createTenantClient,
  validateResourceTenant,
  isAuthError,
  isAuthSuccess,
  isAuthFailure,
  AUTH_ERROR_CODES,
  getUserFriendlyMessage,
} from './auth'

export type {
  AuthContext,
  AuthUser,
  TenantContext,
  AuthOptions,
  ProtectedRouteHandler,
  AuthError,
  AuthResult,
} from './auth'
