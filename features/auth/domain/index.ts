/**
 * Auth Domain - Centralized Authentication
 * 
 * Single source of truth for authentication using NextAuth with Google OAuth.
 * Provides session management, tenant context, and type-safe auth utilities.
 */

// Core auth configuration
export { authOptions } from './config'

// Auth types
export type {
  UserRole,
  AuthUser,
  Tenant,
  UserTenant
} from './types'

// Client-side auth utilities
export {
  useAuth,
  useRequireAuth,
  useHasRole
} from './client'

// Server-side auth utilities
export {
  getSession,
  requireAuth,
  getCurrentUser,
  requireAuthApi,
  hasPermission
} from './server'

// Tenant context middleware
export {
  createTenantAwareSupabaseClient,
  withTenantIsolation,
  withTenantContext
} from './tenant-context'
