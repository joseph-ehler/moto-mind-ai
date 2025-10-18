/**
 * Supabase Client Setup
 * 
 * Clean Supabase client creation - no platform logic
 */

import { createBrowserClient } from '@supabase/ssr'

export function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
