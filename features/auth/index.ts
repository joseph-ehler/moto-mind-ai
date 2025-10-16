/**
 * Auth Feature - Public API
 * 
 * Centralized authentication using NextAuth with Google OAuth.
 * Handles session management, tenant isolation, and authorization.
 * 
 * Architecture:
 * - domain/ - Core auth logic, config, types, server/client utilities
 * - hooks/ - React hooks for client-side auth (useAuth, useRequireAuth, useHasRole)
 * - data/ - API calls for user/tenant management (placeholder)
 * - ui/ - Auth-related UI components (placeholder)
 */

// Domain exports (config, types, server utilities, tenant context)
export * from './domain'

// Hooks (client-side)
export { useAuth, useRequireAuth, useHasRole } from './hooks'

// Data layer (future)
// export { getUserProfile, updateUserProfile, getTenants } from './data'

// UI components (future)
// export { UserProfile, TenantSwitcher } from './ui'
