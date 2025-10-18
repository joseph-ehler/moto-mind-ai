'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * OAuth Callback Page
 * 
 * Handles OAuth redirects from Google/providers
 * - On web: Processes tokens and navigates to /track
 * - On native in Safari: Triggers deep link to reopen app with tokens
 * - On native in app webview: Process tokens directly (already in app)
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const isNative = typeof (window as any).Capacitor !== 'undefined'
      
      // Check if we're in Safari (external browser) vs app's webview
      // Safari has different user agent and won't have Capacitor loaded yet
      const isInSafari = !isNative && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')
      
      console.log('[Auth Callback] isNative:', isNative, 'isInSafari:', isInSafari)
      
      if (isInSafari) {
        // We're in Safari (external browser) - trigger deep link to reopen app
        const hash = window.location.hash
        const deepLink = `motomind://auth/callback${hash}`
        
        console.log('[Auth Callback] In Safari, triggering deep link:', deepLink)
        
        // Show a button instead of auto-redirecting to avoid popup blocker
        setTimeout(() => {
          window.location.href = deepLink
        }, 100)
      } else {
        // We're on web OR already in the app's webview - process tokens directly
        const { createClient } = await import('@/lib/supabase/browser-client')
        const supabase = createClient()
        
        // Parse hash fragment if present
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          console.log('[Auth Callback] Hash fragment found, parsing tokens...')
          
          // Supabase will automatically handle the hash fragment
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('[Auth Callback] Error:', error)
            router.push('/?error=' + encodeURIComponent(error.message))
          } else if (data.session) {
            console.log('[Auth Callback] ✅ Session established:', data.session.user.email)
            router.push('/track')
          } else {
            console.error('[Auth Callback] No session found')
            router.push('/?error=no_session')
          }
        } else {
          console.log('[Auth Callback] No hash fragment, redirecting home')
          router.push('/')
        }
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
        <p className="text-sm text-muted-foreground">If nothing happens, tap "Open in MotoMind"</p>
      </div>
    </div>
  )
}
