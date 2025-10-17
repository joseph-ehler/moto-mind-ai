import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client (service role key)
 * 
 * ⚠️ WARNING: Only import this in server-side code!
 * - API routes (pages/api/*)
 * - Server components
 * - Server actions
 * 
 * DO NOT import in client components - it will expose your service role key!
 */

if (typeof window !== 'undefined') {
  throw new Error(
    'supabaseAdmin should only be imported in server-side code. ' +
    'Use the regular supabase client for client-side operations.'
  )
}

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase admin environment variables. ' +
    'Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env.local file.'
  )
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
