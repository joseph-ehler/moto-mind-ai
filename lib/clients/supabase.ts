import { createClient } from '@supabase/supabase-js'

/**
 * Client-side Supabase client (anon key)
 * 
 * Safe to use in browser/client components.
 * Uses Next.js public env vars for client-side access.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
