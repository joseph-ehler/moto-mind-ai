/**
 * Auth Public API
 * 
 * Clean exports for the entire auth system
 */

// Core functions
export { signIn, handleCallback, setupDeepLinkListener } from './core'

// Supabase client
export { getSupabaseClient } from './supabase'

// Re-export useAuth hook for convenience
export { useAuth } from '@/hooks/useAuth'
