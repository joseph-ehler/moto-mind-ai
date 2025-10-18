/**
 * Native App OAuth Handler
 * 
 * Handles Google OAuth in native apps using Capacitor Browser plugin
 * Opens in-app browser and handles deep link callback
 */

import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'

export async function signInWithGoogleNative(): Promise<void> {
  // Build Google OAuth URL with native flag so NextAuth knows to redirect to custom scheme
  const authUrl = `${window.location.origin}/api/auth/signin/google?callbackUrl=${encodeURIComponent('/track?native=true')}`
  
  // Open in-app browser (SFSafariViewController on iOS)
  await Browser.open({
    url: authUrl,
    // iOS: uses SFSafariViewController
    // Android: uses Chrome Custom Tabs
    presentationStyle: 'popover'
  })
  
  // Listen for app URL open (deep link callback)
  const listener = await App.addListener('appUrlOpen', async (event) => {
    console.log('[Native OAuth] Deep link received:', event.url)
    
    // Callback will be: motomind://callback?success=true
    if (event.url.includes('callback') || event.url.includes('success')) {
      console.log('[Native OAuth] ✅ Auth successful - closing browser')
      
      // Close the browser
      await Browser.close()
      
      // Wait a moment for browser to close
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Navigate to track page
      window.location.href = '/track'
      
      // Clean up listener
      listener.remove()
    }
  })
}

export function isNativeApp(): boolean {
  return !!(window as any).Capacitor
}
