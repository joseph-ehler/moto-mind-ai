'use client'

/**
 * Login Page
 * 
 * Platform-agnostic login using adapters
 * Works for BOTH web and native automatically
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, setupDeepLinkListener } from '@/lib/auth'
import { usePlatform } from '@/hooks/usePlatform'
import { Button } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const { isNative } = usePlatform()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Native: Setup deep link listener
    if (isNative) {
      const listener = setupDeepLinkListener(
        () => {
          console.log('[Login] Auth success, navigating to /track')
          router.push('/track')
        },
        (error) => {
          console.error('[Login] Auth error:', error)
          setError(error.message)
          setIsLoading(false)
        }
      )

      return () => {
        listener.remove()
      }
    }
  }, [isNative, router])

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signIn()
      // Web: Will redirect to Google
      // Native: Browser opens, then deep link callback handles rest
    } catch (error: any) {
      console.error('[Login] Error:', error)
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="max-w-md w-full px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">MotoMind</h1>
          <p className="text-muted-foreground">
            {isNative ? 'Native App' : 'Web App'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Sign In Button */}
        <Button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        {/* Native Loading Info */}
        {isNative && isLoading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 text-center">
              Browser will open → Sign in → Auto-return to app
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  )
}
