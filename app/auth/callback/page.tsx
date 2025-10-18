/**
 * Auth Callback Page
 * 
 * Handles OAuth redirects (Google, etc.)
 * Saves last login method after successful auth
 */

'use client'

import { useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveLastLoginMethod } from '@/lib/auth/hooks/useLastLogin'
import { saveLastUserEmail } from '@/lib/auth/hooks/useLastUser'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      console.log('[AuthCallback] User authenticated:', session.user.email)
      
      // Save email and last login method
      saveLastUserEmail(session.user.email)
      
      // Determine login method from account provider
      // Google OAuth will have been the method
      saveLastLoginMethod(session.user.email, 'google')
      
      console.log('[AuthCallback] Saved login preferences')
      
      // Check if this is a native app
      const isNative = searchParams.get('native') === 'true'
      
      if (isNative) {
        console.log('[AuthCallback] 🚀 Native app detected - redirecting to custom scheme')
        // Redirect to custom URL scheme to close browser and return to app
        window.location.href = 'motomind://callback?success=true'
      } else {
        // Regular web redirect
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
        router.push(callbackUrl)
      }
    } else if (status === 'unauthenticated') {
      // Auth failed, redirect to sign-in
      router.push('/auth/signin?error=Authentication failed')
    }
  }, [status, session, router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">
          {status === 'loading' && 'Completing sign in...'}
          {status === 'authenticated' && 'Redirecting...'}
          {status === 'unauthenticated' && 'Authentication failed'}
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
