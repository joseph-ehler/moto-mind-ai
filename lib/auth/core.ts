/**
 * Core Auth Logic
 * 
 * Platform-agnostic auth functions using adapters
 */

import { getAuthAdapter } from './adapters'
import { Capacitor } from '@capacitor/core'

/**
 * Sign in with Google OAuth
 * Automatically uses correct adapter for platform
 */
export async function signIn() {
  const adapter = getAuthAdapter()
  return adapter.signIn()
}

/**
 * Handle OAuth callback (Web only)
 */
export async function handleCallback() {
  if (Capacitor.isNativePlatform()) {
    throw new Error('handleCallback should not be called on native platform')
  }
  
  const adapter = getAuthAdapter()
  if ('handleCallback' in adapter) {
    return adapter.handleCallback()
  }
  
  throw new Error('Adapter does not support handleCallback')
}

/**
 * Setup deep link listener (Native only)
 */
export function setupDeepLinkListener(
  onSuccess: () => void,
  onError: (error: Error) => void
) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('setupDeepLinkListener should only be called on native platform')
  }
  
  const adapter = getAuthAdapter()
  if ('setupDeepLinkListener' in adapter) {
    return adapter.setupDeepLinkListener(onSuccess, onError)
  }
  
  throw new Error('Adapter does not support setupDeepLinkListener')
}
