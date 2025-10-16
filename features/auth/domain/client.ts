/**
 * Client-Side Authentication Hooks (Legacy Export)
 * 
 * NOTE: Hooks have been moved to ../hooks/
 * This file re-exports them for backward compatibility.
 * 
 * New code should import from '@/features/auth/hooks' instead.
 */

'use client'

// Re-export from hooks layer
export { useAuth, useRequireAuth, useHasRole } from '../hooks'
