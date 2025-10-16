import { createBrowserClient } from '@supabase/ssr'

/**
 * Client-side Supabase client
 * Safe to use in browser/client components
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'This must be set in Vercel environment variables for the Production environment.'
    )
  }
  
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'This must be set in Vercel environment variables for the Production environment.'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
