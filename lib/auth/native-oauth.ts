/**
 * Native OAuth Functions
 * 
 * Uses browser-based OAuth + deep link callback - NO native SDK needed!
 */

import { getSupabaseClient } from './supabase'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'

export async function startNativeOAuth() {
  console.log('[Native OAuth] Starting...')
  
  const supabase = getSupabaseClient()
  
  // Get OAuth URL from Supabase
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'motomind://auth/callback',
      skipBrowserRedirect: true, // Don't auto-redirect - we'll handle it
    },
  })

  if (error || !data.url) {
    throw new Error(error?.message || 'Failed to get OAuth URL')
  }

  console.log('[Native OAuth] Opening browser:', data.url)
  
  // Open in system browser (will redirect back to app via custom scheme)
  await Browser.open({
    url: data.url,
    presentationStyle: 'popover',
  })
}

export async function setupNativeOAuthListener(
  onSuccess: () => void,
  onError: (error: Error) => void
) {
  console.log('[Native OAuth] Setting up deep link listener...')
  
  const listener = await App.addListener('appUrlOpen', async (event) => {
    console.log('[Native OAuth] Deep link received:', event.url)
    
    // Close the browser
    await Browser.close().catch(() => {
      // Ignore errors if browser already closed
    })
    
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

        console.log('[Native OAuth] Setting session...')
        
        const supabase = getSupabaseClient()
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) throw error
        
        console.log('[Native OAuth] ✅ Success!')
        onSuccess()
      } catch (error) {
        console.error('[Native OAuth] ❌ Error:', error)
        onError(error as Error)
      }
    }
  })

  return listener
}
