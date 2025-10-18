'use client'

/**
 * Native App Login Page
 * 
 * Pure native SDK - NO browser, NO web OAuth
 * Shows native iOS Google Sign In picker modal
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Heading, Text } from '@/components/design-system'
import { Button } from '@/components/ui'
import { Chrome, Loader2 } from 'lucide-react'

export default function NativeLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      console.log('[Native Login] Starting native Google Sign In...')
      
      // Import the native SDK helper
      const { signInWithGoogleNativeSDK } = await import('@/lib/auth/google-native-sdk')
      
      // Sign in with native SDK - shows native iOS picker
      const user = await signInWithGoogleNativeSDK()
      
      if (!user) {
        // User cancelled
        console.log('[Native Login] User cancelled')
        setIsLoading(false)
        return
      }
      
      console.log('[Native Login] ✅ Signed in:', user.email)
      
      // Navigate to track page
      router.push('/track')
    } catch (err: any) {
      console.error('[Native Login] Error:', err)
      setError(err.message || 'Failed to sign in')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Container size="sm" useCase="forms">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Header */}
            <div className="text-center">
              <Heading level="hero">Welcome to MotoMind</Heading>
              <Text className="mt-4 text-gray-600">
                Sign in to track and manage your vehicles
              </Text>
              <Text size="sm" className="mt-2 text-gray-500">
                Native iOS App
              </Text>
            </div>

            {/* Sign In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              size="lg"
              variant="default"
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
                  Continue with Google
                </>
              )}
            </Button>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <Text size="sm" className="text-red-700">
                  {error}
                </Text>
              </div>
            )}

            {/* Info */}
            <Text size="sm" className="text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Stack>
        </Section>
      </Container>
    </div>
  )
}
