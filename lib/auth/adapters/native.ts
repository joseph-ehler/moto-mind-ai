/**
 * Native Auth Adapter
 * 
 * Handles OAuth via system browser + deep link callback
 */

import { getSupabaseClient } from '../supabase'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'

export class NativeAuthAdapter {
  async signIn() {
    const supabase = getSupabaseClient()
    
    console.log('[Native Adapter] Starting OAuth...')
    
    // Get OAuth URL from Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'motomind://auth/callback',
        skipBrowserRedirect: true,
      },
    })

    if (error || !data.url) {
      console.error('[Native Adapter] OAuth error:', error)
      throw new Error(error?.message || 'Failed to get OAuth URL')
    }

    console.log('[Native Adapter] OAuth URL generated:', data.url)
    console.log('[Native Adapter] Opening browser...')
    
    // Open in system browser
    await Browser.open({
      url: data.url,
      presentationStyle: 'popover',
    })
  }

  setupDeepLinkListener(
    onSuccess: () => void,
    onError: (error: Error) => void
  ) {
    console.log('[Native Adapter] Setting up deep link listener...')
    
    return App.addListener('appUrlOpen', async (event) => {
      console.log('[Native Adapter] Deep link received:', event.url)
      
      // Close the browser
      await Browser.close().catch(() => {})
      
      if (event.url.includes('auth/callback')) {
        try {
          const url = new URL(event.url)
          const supabase = getSupabaseClient()
          
          // Check for authorization code (PKCE flow)
          const code = url.searchParams.get('code')
          
          if (code) {
            console.log('[Native Adapter] Exchanging code for session...')
            
            // Exchange code for session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) {
              console.error('[Native Adapter] Code exchange failed:', error)
              throw error
            }
            
            if (!data.session) {
              throw new Error('No session returned from code exchange')
            }
            
            console.log('[Native Adapter] ✅ Success!')
            onSuccess()
            return
          }
          
          // Fallback: Check for tokens in hash (implicit flow - deprecated but kept for compatibility)
          const hashParams = new URLSearchParams(url.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            console.log('[Native Adapter] Setting session from tokens...')
            
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) throw error
            
            console.log('[Native Adapter] ✅ Success!')
            onSuccess()
            return
          }
          
          // No code or tokens found
          throw new Error('No authorization code or tokens found in callback URL')
        } catch (error) {
          console.error('[Native Adapter] ❌ Error:', error)
          onError(error as Error)
        }
      }
    })
  }
}
