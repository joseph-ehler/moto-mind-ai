/**
 * Singleton Supabase Client
 * 
 * Creates ONE Supabase client instance shared across the app
 * Prevents "Multiple GoTrueClient instances" warning
 */

import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

/**
 * Get or create Supabase client singleton
 * Server-side only (uses service role key)
 */
export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  
  return supabaseInstance
}
