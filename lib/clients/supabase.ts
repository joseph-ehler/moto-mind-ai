import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

// Client-side Supabase client (anon key)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

// Server-side Supabase client (service role key)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL, 
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
