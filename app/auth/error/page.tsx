'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container, Stack, Heading, Text, Button } from '@/components/design-system'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') || 'Unknown'

  const errorMessages: Record<string, string> = {
    AccessDenied: 'Access was denied. This may be due to a database error. Please try again.',
    Configuration: 'There is a problem with the server configuration.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  }

  const message = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Container size="sm" useCase="general_content">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Stack spacing="xl">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <Heading level="title" className="mb-2">
                Authentication Error
              </Heading>
              <Text className="text-gray-600">
                {message}
              </Text>
              {error && (
                <Text className="text-sm text-gray-400 mt-2">
                  Error code: {error}
                </Text>
              )}
            </div>

            <Stack spacing="sm">
              <Button
                onClick={() => window.location.href = '/auth/signin'}
                className="w-full"
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go Home
              </Button>
            </Stack>
          </Stack>
        </div>
      </Container>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
