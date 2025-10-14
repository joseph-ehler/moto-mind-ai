'use client'

import { signIn } from 'next-auth/react'
import { Container, Stack, Heading, Text, Button, Card } from '@/components/design-system'
import { Chrome } from 'lucide-react'

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/vehicles' })
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
              size="lg"
              variant="primary"
              className="w-full flex items-center justify-center gap-3"
            >
              <Chrome className="w-5 h-5" />
              Sign in with Google
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
