'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * OAuth Callback Page
 * 
 * Handles OAuth redirects from Google/providers
 * - On web: Processes tokens and navigates to /track
 * - On native: Triggers deep link to reopen app with tokens
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      // Check if we're on native (Capacitor) or web
      const isNative = typeof (window as any).Capacitor !== 'undefined'

      if (isNative) {
        // On native: Trigger deep link to reopen the app
        // The hash fragment contains the tokens
        const hash = window.location.hash
        const deepLink = `motomind://auth/callback${hash}`
        
        console.log('[Auth Callback] Native app detected, triggering deep link:', deepLink)
        
        // Trigger the deep link - this will reopen the app
        window.location.href = deepLink
      } else {
        // On web: Let Supabase handle the session
        const { createClient } = await import('@/lib/supabase/browser-client')
        const supabase = createClient()
        
        // Supabase will automatically parse the hash and set the session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[Auth Callback] Error:', error)
          router.push('/?error=' + encodeURIComponent(error.message))
        } else if (data.session) {
          console.log('[Auth Callback] Session established:', data.session.user.email)
          router.push('/track')
        } else {
          console.error('[Auth Callback] No session found')
          router.push('/?error=no_session')
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
      </div>
    </div>
  )
}
