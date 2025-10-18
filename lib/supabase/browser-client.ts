/**
 * Supabase Browser Client
 * 
 * For client-side usage (auth, realtime, etc.)
 * Uses anon key (safe for browser)
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
