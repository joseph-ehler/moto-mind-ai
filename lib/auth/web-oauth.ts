/**
 * Web OAuth Functions
 * 
 * Pure web OAuth - NO platform detection, NO native logic
 */

import { getSupabaseClient } from './supabase'

export async function startWebOAuth() {
  const supabase = getSupabaseClient()
  
  console.log('[Web OAuth] Starting...')
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('[Web OAuth] Error:', error)
    throw error
  }
  
  // Will redirect to Google
}

export async function handleWebOAuthCallback() {
  const supabase = getSupabaseClient()
  
  console.log('[Web OAuth Callback] Processing...')
  
  // Supabase automatically handles the callback
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('[Web OAuth Callback] Error:', error)
    throw error
  }
  
  if (!session) {
    console.error('[Web OAuth Callback] No session found')
    throw new Error('No session found')
  }
  
  console.log('[Web OAuth Callback] ✅ Success:', session.user.email)
  return session
}
