/**
 * Native App OAuth Handler
 * 
 * Handles Google OAuth in native apps using Capacitor Browser plugin
 * Opens in-app browser and handles deep link callback
 */

import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'

export async function signInWithGoogleNative(): Promise<void> {
  // Build Google OAuth URL
  const authUrl = `${window.location.origin}/api/auth/signin/google`
  
  // Open in-app browser (SFSafariViewController on iOS)
  await Browser.open({
    url: authUrl,
    // iOS: uses SFSafariViewController
    // Android: uses Chrome Custom Tabs
    presentationStyle: 'popover'
  })
  
  // Listen for app URL open (deep link callback)
  const listener = await App.addListener('appUrlOpen', async (event) => {
    // Callback will be: motomind://callback?...
    if (event.url.includes('callback')) {
      // Close the browser
      await Browser.close()
      
      // Navigate to dashboard
      window.location.href = '/track'
      
      // Clean up listener
      listener.remove()
    }
  })
}

export function isNativeApp(): boolean {
  return !!(window as any).Capacitor
}
