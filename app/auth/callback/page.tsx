'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * OAuth Callback Page (WEB ONLY)
 * 
 * Handles Supabase OAuth redirects from Google/providers on WEB.
 * Native apps use Google Native SDK and don't need this callback page.
 * 
 * Flow:
 * 1. User signs in with Google
 * 2. Google redirects here with tokens in URL hash
 * 3. Supabase processes tokens
 * 4. Redirect to /track
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[Auth Callback] Processing web OAuth callback...')
      
      const { createClient } = await import('@/lib/supabase/browser-client')
      const supabase = createClient()
      
      // Supabase automatically processes the hash fragment (#access_token=...)
      // Just check if we have a session
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
