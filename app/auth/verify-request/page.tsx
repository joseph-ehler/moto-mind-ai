'use client'

/**
 * Verify Request Page
 * 
 * Uses MotoMind design system for layout + shadcn/ui for components
 */

import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      <Container size="sm" useCase="articles">
        <Section spacing="xl">
          <div className="py-32">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Check your email</CardTitle>
                  <CardDescription className="text-base">
                    A sign-in link has been sent to your email address.
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">
                    Click the link in the email to sign in to your account.
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-muted rounded-lg p-6 space-y-3">
                  <p className="text-sm font-semibold">
                    Didn't receive the email?
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Check your spam folder</li>
                    <li>• Make sure you entered the correct email address</li>
                    <li>• The link expires in 10 minutes</li>
                  </ul>
                </div>

                <div className="text-center">
                  <Link 
                    href="/auth/signin" 
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    ← Back to sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      </Container>
    </div>
  )
}
