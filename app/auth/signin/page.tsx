'use client'

/**
 * Sign In Page
 * 
 * Uses MotoMind design system for layout + shadcn/ui for components
 */

import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent } from '@/components/ui'
import { AuthForm } from '@/components/auth/AuthForm'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      <Container size="sm" useCase="forms">
        <Section spacing="xl">
          <div className="py-20">
            <Stack spacing="xl">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="text-5xl mb-2">🏍️</div>
                <Heading level="hero" className="text-white text-3xl">
                  Welcome to MotoMind
                </Heading>
                <p className="text-purple-100 text-base">
                  Your intelligent vehicle companion
                </p>
              </div>

              {/* Auth Card */}
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8">
                  <AuthForm mode="signin" callbackUrl="/dashboard" />
                </CardContent>
              </Card>

              {/* Footer */}
              <p className="text-center text-sm text-purple-100">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-white underline hover:no-underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-white underline hover:no-underline">
                  Privacy Policy
                </Link>
              </p>
            </Stack>
          </div>
        </Section>
      </Container>
    </div>
  )
}
