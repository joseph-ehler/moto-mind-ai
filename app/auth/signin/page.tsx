'use client'

import { useState } from 'react'
import { createClient } from '@/lib/clients/supabase-browser'
import { Container, Stack, Heading, Text, Button, Card } from '@/components/design-system'
import { Chrome, AlertCircle } from 'lucide-react'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(err.message || 'Failed to sign in')
      setLoading(false)
    }
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <Text className="text-red-800 font-medium">Sign-in failed</Text>
                  <Text size="sm" className="text-red-600 mt-1">{error}</Text>
                </div>
              </div>
            )}

            {/* Sign In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              size="lg"
              variant="primary"
              className="w-full flex items-center justify-center gap-3"
            >
              <Chrome className="w-5 h-5" />
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>

            {/* Info */}
            <Text size="sm" className="text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Stack>
        </Card>
      </Container>
    </div>
  )
}
