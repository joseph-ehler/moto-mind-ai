'use client'

/**
 * Password Reset Request Page
 * 
 * Allows users to request a password reset email
 * Uses: MotoMind layout + shadcn/ui components
 */

import { useState } from 'react'
import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Button } from '@/components/ui'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email')
        setIsLoading(false)
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
        <Container size="sm" useCase="forms">
          <Section spacing="xl">
            <div className="py-32">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">Check your email</CardTitle>
                    <CardDescription className="text-base">
                      If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="bg-muted rounded-lg p-6 space-y-3">
                    <p className="text-sm font-semibold">Didn't receive the email?</p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Check your spam folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• The link expires in 1 hour</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSubmitted(false)
                        setEmail('')
                      }}
                      className="w-full"
                    >
                      Try a different email
                    </Button>
                    
                    <Link href="/auth/signin" className="w-full">
                      <Button variant="ghost" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                      </Button>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      <Container size="sm" useCase="forms">
        <Section spacing="xl">
          <div className="py-20">
            <Stack spacing="xl">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="text-5xl mb-2">🔑</div>
                <Heading level="hero" className="text-white text-3xl">
                  Reset your password
                </Heading>
                <p className="text-purple-100 text-base">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              {/* Form Card */}
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="space-y-3">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading || !email}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Sending reset link...' : 'Send reset link'}
                      </Button>

                      <Link href="/auth/signin" className="w-full block">
                        <Button variant="ghost" className="w-full">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to sign in
                        </Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Footer */}
              <p className="text-center text-sm text-purple-100">
                Remember your password?{' '}
                <Link href="/auth/signin" className="text-white underline hover:no-underline">
                  Sign in
                </Link>
              </p>
            </Stack>
          </div>
        </Section>
      </Container>
    </div>
  )
}
