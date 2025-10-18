/**
 * Web Auth Adapter
 * 
 * Handles OAuth via browser redirect
 */

import { getSupabaseClient } from '../supabase'

export class WebAuthAdapter {
  async signIn() {
    const supabase = getSupabaseClient()
    
    console.log('[Web Adapter] Starting OAuth...')
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })

    if (error) {
      console.error('[Web Adapter] Error:', error)
      throw error
    }
    
    // Will redirect to Google OAuth
  }

  async handleCallback() {
    const supabase = getSupabaseClient()
    
    console.log('[Web Adapter] Processing callback...')
    
    // Supabase automatically processes the callback
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[Web Adapter] Callback error:', error)
      throw error
    }
    
    if (!session) {
      throw new Error('No session found after callback')
    }
    
    console.log('[Web Adapter] ✅ Success:', session.user.email)
    return session
  }
}
