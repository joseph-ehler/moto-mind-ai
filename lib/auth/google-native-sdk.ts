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
    // Initialize with explicit config
    // The plugin doesn't reliably read from capacitor.config.ts
    await GoogleAuth.initialize({
      clientId: '642890697588-ecojj9mtif8j4n1gu7jri95a681ghgca.apps.googleusercontent.com', // iOS client
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    })
    initialized = true
    console.log('[Google Native] ✅ Initialized with explicit iOS client ID')
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
    // iOS client ID from initialize() = native picker
    // serverClientId here = gets ID token for Supabase auth (web client)
    const result = await GoogleAuth.signIn({
      scopes: ['profile', 'email'],
      serverClientId: '642890697588-tpd1g2uduf51qmdkkdrue565sq40vf4s.apps.googleusercontent.com' // Web client for Supabase
    })
    
    console.log('[Google Native] ✅ Sign-in successful:', {
      email: result.email,
      name: result.name || result.givenName,
      hasIdToken: !!result.authentication?.idToken,
      hasNonce: !!(result.authentication as any)?.nonce,
    })
    
    const idToken = result.authentication?.idToken
    const nonce = (result.authentication as any)?.nonce // Get the nonce!
    
    if (!idToken) {
      throw new Error('No ID token from Google')
    }
    
    console.log('[Google Native] 📤 Exchanging with Supabase (with nonce)...')
    
    // Use Supabase directly - pass the nonce!
    const { createClient } = await import('@/lib/supabase/browser-client')
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce: nonce || undefined, // PASS THE NONCE!
    })
    
    if (error) {
      console.error('[Google Native] ❌ Supabase error:', error.message)
      throw error
    }
    
    console.log('[Google Native] ✅ Session created!', data.user?.email)
    
    return {
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name || data.user?.user_metadata?.full_name,
      avatar: data.user?.user_metadata?.avatar_url || data.user?.user_metadata?.picture,
    }
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
