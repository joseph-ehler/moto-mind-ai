/**
 * Centralized Server-Side Supabase Client Factory
 * 
 * Safe initialization with validation and error handling.
 * Use this instead of creating clients directly in modules.
 * 
 * @module lib/supabase-server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null
let initializationError: Error | null = null

/**
 * Get or create a server-side Supabase client
 * Safe to call multiple times - returns cached instance
 * 
 * @returns Supabase client with service role
 * @throws Error if environment variables are missing
 */
export function getSupabaseServer(): SupabaseClient {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient
  }

  // If initialization previously failed, throw the same error
  if (initializationError) {
    throw initializationError
  }

  try {
    // Get environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Validate
    if (!url) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable. ' +
        'Set this in Vercel environment variables.'
      )
    }

    if (!key) {
      throw new Error(
        'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
        'Set this in Vercel environment variables.'
      )
    }

    // Create client
    cachedClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('[Supabase Server] Client initialized successfully')
    return cachedClient

  } catch (error) {
    initializationError = error as Error
    console.error('[Supabase Server] Initialization failed:', error)
    throw error
  }
}

/**
 * Check if Supabase server client can be initialized
 * Returns true if environment variables are available
 */
export function canInitializeSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(url && key)
}

/**
 * Reset cached client (useful for testing)
 */
export function resetSupabaseClient(): void {
  cachedClient = null
  initializationError = null
}
