/**
 * Supabase Service Client
 * For server-side operations that need service role access
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Create Supabase client with service role key
 * USE WITH CAUTION - This bypasses RLS policies
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
