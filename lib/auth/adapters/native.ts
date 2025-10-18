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
      throw new Error(error?.message || 'Failed to get OAuth URL')
    }

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
      
      // motomind://auth/callback#access_token=...&refresh_token=...
      if (event.url.includes('auth/callback')) {
        try {
          const url = new URL(event.url)
          const hashParams = new URLSearchParams(url.hash.substring(1))
          
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (!accessToken || !refreshToken) {
            throw new Error('Missing tokens in callback')
          }

          console.log('[Native Adapter] Setting session...')
          
          const supabase = getSupabaseClient()
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) throw error
          
          console.log('[Native Adapter] ✅ Success!')
          onSuccess()
        } catch (error) {
          console.error('[Native Adapter] ❌ Error:', error)
          onError(error as Error)
        }
      }
    })
  }
}
