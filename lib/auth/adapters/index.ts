/**
 * Auth Adapter Factory
 * 
 * Returns the correct adapter based on platform
 */

import { Capacitor } from '@capacitor/core'
import { WebAuthAdapter } from './web'
import { NativeAuthAdapter } from './native'

export type AuthAdapter = WebAuthAdapter | NativeAuthAdapter

export function getAuthAdapter(): AuthAdapter {
  const isNative = Capacitor.isNativePlatform()
  
  if (isNative) {
    console.log('[Auth] Using Native adapter')
    return new NativeAuthAdapter()
  } else {
    console.log('[Auth] Using Web adapter')
    return new WebAuthAdapter()
  }
}
