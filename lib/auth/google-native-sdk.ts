/**
 * Google Sign-In Native SDK
 * 
 * Uses @southdevs/capacitor-google-auth for native Google authentication
 * NO browser - shows native iOS Google sign-in dialog
 */

import { GoogleAuth } from '@southdevs/capacitor-google-auth'
import { Capacitor } from '@capacitor/core'

// Initialize Google Auth when app loads (iOS only)
let initialized = false

export async function initializeGoogleAuth() {
  if (initialized || !Capacitor.isNativePlatform()) {
    return
  }
  
  try {
    await GoogleAuth.initialize({
      clientId: '642890697588-ecojj9mtif8j4n1gu7jri95a681ghgca.apps.googleusercontent.com', // iOS client ID
      scopes: ['profile', 'email'],
      grantOfflineAccess: true
    })
    initialized = true
    console.log('[Google Native] ✅ Initialized')
  } catch (error) {
    console.error('[Google Native] ❌ Initialization failed:', error)
  }
}

export async function signInWithGoogleNativeSDK() {
  try {
    console.log('[Google Native] 🚀 Starting sign-in...')
    
    // Ensure initialized
    await initializeGoogleAuth()
    
    // Show native Google sign-in UI
    const result = await GoogleAuth.signIn({
      scopes: ['profile', 'email'],
      serverClientId: '642890697588-tpd1g2uduf51qmdkkdrue565sq40vf4s.apps.googleusercontent.com'
    })
    
    console.log('[Google Native] ✅ Sign-in successful:', {
      email: result.email,
      name: result.name || result.givenName,
      hasServerAuthCode: !!result.serverAuthCode,
      hasIdToken: !!result.authentication?.idToken,
      hasAccessToken: !!result.authentication?.accessToken
    })
    
    const idToken = result.authentication?.idToken
    const serverAuthCode = result.serverAuthCode
    
    if (!idToken) {
      throw new Error('No ID token received from Google')
    }
    
    console.log('[Google Native] 📤 Exchanging token with backend...')
    
    // Exchange with our backend endpoint
    // Backend has service role and can handle token exchange properly
    const response = await fetch('/api/auth/google-native', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        serverAuthCode,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('[Google Native] ❌ Backend error:', error)
      throw new Error(error.error || 'Backend exchange failed')
    }
    
    const { session, user } = await response.json()
    console.log('[Google Native] ✅ Backend returned session for:', user.email)
    
    // Store session in Supabase client
    const { createClient } = await import('@/lib/supabase/browser-client')
    const supabase = createClient()
    
    console.log('[Google Native] 💾 Storing session in client...')
    
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    
    if (setSessionError) {
      console.error('[Google Native] ❌ Failed to set session:', setSessionError)
      throw setSessionError
    }
    
    console.log('[Google Native] ✅ Session stored! User is authenticated!')
    
    return user
  } catch (error: any) {
    console.error('[Google Native] ❌ Sign-in failed:', error.message)
    
    if (error.message === 'popup_closed_by_user' || error.message === '12501') {
      // User cancelled - not an error
      console.log('[Google Native] User cancelled sign-in')
      return null
    }
    
    throw error
  }
}

export async function signOutGoogleNativeSDK() {
  try {
    await GoogleAuth.signOut()
    console.log('[Google Native] ✅ Signed out')
  } catch (error) {
    console.error('[Google Native] ❌ Sign-out failed:', error)
  }
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}
