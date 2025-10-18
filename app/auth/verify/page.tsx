/**
 * Magic Link Verification Page
 * 
 * Handles email magic link verification and session creation
 * URL: /auth/verify?token=...
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Stack, Heading, Text } from '@/components/design-system'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

export default function VerifyMagicLinkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setError('No verification token provided')
        return
      }

      try {
        console.log('[Verify] Verifying magic link token...')
        
        // Call server-side API to verify token
        const response = await fetch('/api/auth/verify-magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        
        const result = await response.json()
        
        if (result.success && result.redirectUrl) {
          console.log('[Verify] Success! Completing sign-in...')
          
          // Redirect to Supabase action link to establish session
          window.location.href = result.redirectUrl
        } else if (result.success) {
          setStatus('success')
          setTimeout(() => {
            router.push('/track')
          }, 1500)
        } else {
          console.error('[Verify] Verification failed:', result.error)
          setStatus('error')
          setError(result.error || 'Verification failed')
        }
      } catch (err: any) {
        console.error('[Verify] Exception:', err)
        setStatus('error')
        setError(err.message || 'Something went wrong')
      }
    }

    verifyToken()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Container size="md">
        <Stack spacing="lg" className="text-center max-w-md mx-auto">
          {status === 'verifying' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 mx-auto">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <Heading level="title">Verifying your link...</Heading>
              <Text className="text-gray-600">
                Please wait while we sign you in.
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4 mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <Heading level="title">Success!</Heading>
              <Text className="text-gray-600">
                You're signed in. Redirecting to your dashboard...
              </Text>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4 mx-auto">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <Heading level="title">Verification Failed</Heading>
              <Text className="text-gray-600 mb-4">{error}</Text>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push('/signin')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try signing in again
                </button>
                <button
                  onClick={() => router.push('/signin')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </>
          )}
        </Stack>
      </Container>
    </div>
  )
}
