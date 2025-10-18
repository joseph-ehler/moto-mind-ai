'use client'

/**
 * OAuth Callback Page
 * 
 * Web only - processes OAuth redirect from Google
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { handleCallback } from '@/lib/auth'
import { Capacitor } from '@capacitor/core'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Skip on native - deep link listener handles OAuth callback
    if (Capacitor.isNativePlatform()) {
      console.log('[Callback] Native platform detected, skipping web callback')
      return
    }
    
    const processCallback = async () => {
      try {
        console.log('[Callback] Processing OAuth redirect...')
        const session = await handleCallback()
        
        // Track login method
        if (session?.user) {
          console.log('[Callback] Recording Google login for user:', session.user.id)
          
          // Save email to localStorage for returning user detection
          if (session.user.email) {
            localStorage.setItem('motomind_last_email', session.user.email)
          }
          
          try {
            await fetch('/api/auth/login-preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: session.user.id,
                method: 'google',
                email: session.user.email,
              }),
            })
            console.log('[Callback] Login method recorded')
          } catch (trackError) {
            // Non-critical, don't fail login
            console.error('[Callback] Failed to track login method:', trackError)
          }
        }
        
        // Check if user needs onboarding
        console.log('[Callback] Checking onboarding status...')
        const onboardingResponse = await fetch('/api/onboarding/status')
        
        if (onboardingResponse.ok) {
          const { needsOnboarding, redirectTo } = await onboardingResponse.json()
          console.log('[Callback] Onboarding check result:', { needsOnboarding, redirectTo })
          router.push(redirectTo)
        } else {
          // Log the error for debugging
          const errorText = await onboardingResponse.text()
          console.error('[Callback] Onboarding status check failed:', {
            status: onboardingResponse.status,
            error: errorText
          })
          
          // Fallback to onboarding (safer default for new users)
          console.log('[Callback] Falling back to /onboarding/welcome')
          router.push('/onboarding/welcome')
        }
      } catch (error: any) {
        console.error('[Callback] Error:', error)
        router.push('/signin?error=' + encodeURIComponent(error.message))
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
