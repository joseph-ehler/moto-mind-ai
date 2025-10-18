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
    // Note: serverClientId must match your Supabase Google OAuth web client ID
    const result = await GoogleAuth.signIn({
      scopes: ['profile', 'email'],
      serverClientId: '642890697588-tpd1g2uduf51qmdkkdrue565sq40vf4s.apps.googleusercontent.com'
    })
    
    console.log('[Google Native] ✅ Sign-in successful:', {
      email: result.email,
      name: result.name || result.givenName
    })
    
    // Exchange Google token with Supabase Auth
    const { createClient } = await import('@/lib/supabase/browser-client')
    const supabase = createClient()
    
    console.log('[Google Native] 📤 Exchanging token with Supabase...')
    console.log('[Google Native] Token info:', {
      hasIdToken: !!result.authentication.idToken,
      hasAccessToken: !!result.authentication.accessToken,
    })
    
    // Use signInWithIdToken with ONLY the ID token (no nonce parameter)
    // Supabase will verify the token signature directly with Google
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.authentication.idToken,
    })
    
    if (error) {
      console.error('[Google Native] ❌ Supabase error:', error.message)
      console.error('[Google Native] Error details:', error)
      throw new Error(error.message || 'Failed to authenticate with Supabase')
    }
    
    console.log('[Google Native] ✅ Session created:', data.user?.email)
    
    // Navigate to track page
    window.location.href = '/track'
    
    return data.user
  } catch (error: any) {
    console.error('[Google Native] ❌ Sign-in failed:', error)
    
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
