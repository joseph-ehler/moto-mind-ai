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
    // Request ONLY serverAuthCode - avoids ID token nonce issues
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
    
    // For now, create a session directly with the user info we have
    // This is a temporary solution - we'll need a proper backend endpoint
    // to exchange serverAuthCode for Supabase session
    
    // Just return the user data - we'll handle creating proper session later
    return {
      id: result.id,
      email: result.email,
      name: result.name || result.givenName,
      avatar: result.imageUrl
    }
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
