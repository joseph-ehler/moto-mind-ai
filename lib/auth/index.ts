/**
 * Auth Public API
 * 
 * Clean exports for the entire auth system
 */

// Core functions (Google OAuth)
export { signIn, handleCallback, setupDeepLinkListener } from './core'

// Magic Link functions (Email) - SERVER-ONLY
// Import from './adapters/email-magic' in API routes/server actions only
// DO NOT export here to avoid client-side bundling of Resend

// Client-safe email utilities:
export { suggestEmailCorrection, isValidEmail } from './utils/email-utils'

// Note: Phone magic link functions are SERVER-ONLY (use Twilio)
// Import from './adapters/phone-magic' in API routes/server actions only
// DO NOT export here to avoid client-side bundling of Twilio

// Supabase client
export { getSupabaseClient } from './supabase'

// Re-export useAuth hook for convenience
export { useAuth } from '@/hooks/useAuth'
