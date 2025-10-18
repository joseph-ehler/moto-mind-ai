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
      clientId: '642890697588-tpd1g2uduf51qmdkkdrue565sq40vf4s.apps.googleusercontent.com',
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
    
    // Show native Google sign-in UI with scopes
    const result = await GoogleAuth.signIn({
      scopes: ['profile', 'email']
    })
    
    console.log('[Google Native] ✅ Sign-in successful:', {
      email: result.email,
      name: result.name || result.givenName
    })
    
    // Exchange Google ID token for NextAuth session
    const response = await fetch('/api/auth/google-native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: result.authentication.idToken,
        accessToken: result.authentication.accessToken,
        email: result.email,
        name: result.name || result.givenName,
        imageUrl: result.imageUrl,
        googleId: result.id
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to authenticate with backend')
    }
    
    const session = await response.json()
    console.log('[Google Native] ✅ Session created')
    
    // Navigate to track page
    window.location.href = '/track'
    
    return session
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
