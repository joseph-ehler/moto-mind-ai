'use client'

import { signIn } from 'next-auth/react'
import { Container, Stack, Heading, Text, Button, Card } from '@/components/design-system'
import { Chrome, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const router = useRouter()

  // Show content after a short delay (don't wait for session)
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Try to check session but don't block on it
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const session = await response.json()
        if (session?.user) {
          console.log('[Auth] Already signed in, redirecting...')
          router.push('/vehicles')
        }
      } catch (error) {
        console.error('[Auth] Session check failed:', error)
      }
    }
    checkSession()
  }, [router])

  const handleGoogleSignIn = async () => {
    try {
      console.log('[Auth] Signin button clicked')
      setIsLoading(true)
      
      // Set timeout in case signIn hangs
      const timeout = setTimeout(() => {
        console.warn('[Auth] SignIn timeout - redirecting manually')
        window.location.href = '/api/auth/signin/google?callbackUrl=/vehicles'
      }, 3000) // 3 second timeout
      
      const result = await signIn('google', { 
        callbackUrl: '/vehicles',
        redirect: true 
      })
      
      clearTimeout(timeout)
      console.log('[Auth] SignIn result:', result)
    } catch (error) {
      console.error('[Auth] SignIn error:', error)
      setIsLoading(false)
    }
  }

  // Direct link as fallback
  const directSignInUrl = '/api/auth/signin/google?callbackUrl=/vehicles'

  if (!showContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Container size="sm" useCase="forms">
        <Card padding="lg">
          <Stack spacing="lg">
            {/* Header */}
            <div className="text-center">
              <Heading level="hero">Welcome to MotoMind</Heading>
              <Text className="mt-4 text-gray-600">
                Sign in with Google to manage your vehicles
              </Text>
            </div>

            {/* Sign In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              size="lg"
              variant="primary"
              className="w-full flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Chrome className="w-5 h-5" />
                  Sign in with Google
                </>
              )}
            </Button>

            {/* Fallback Direct Link */}
            <div className="text-center">
              <Text size="sm" className="text-gray-500">
                Button not working?{' '}
                <a 
                  href={directSignInUrl}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Click here to sign in
                </a>
              </Text>
            </div>

            {/* Info */}
            <Text size="sm" className="text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-xs font-mono">
                <div>Check console for [Auth] logs</div>
                <div>Button should work, or use fallback link</div>
              </div>
            )}
          </Stack>
        </Card>
      </Container>
    </div>
  )
}
