'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { Container, Stack, Heading, Text, Button, Card } from '@/components/design-system'
import { LogOut } from 'lucide-react'

export default function SignOutPage() {
  useEffect(() => {
    // Auto-signout when page loads
    signOut({ callbackUrl: '/auth/signin' })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Container size="sm" useCase="forms">
        <Card padding="lg">
          <Stack spacing="lg">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-blue-600" />
              </div>
              <Heading level="h2">Signing Out...</Heading>
              <Text className="mt-4 text-gray-600">
                You're being signed out of MotoMind
              </Text>
            </div>

            {/* Manual Sign Out Button (in case auto-signout fails) */}
            <Button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              size="lg"
              variant="secondary"
              className="w-full"
            >
              Click here if not redirected
            </Button>
          </Stack>
        </Card>
      </Container>
    </div>
  )
}
