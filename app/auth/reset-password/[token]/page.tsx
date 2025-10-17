'use client'

/**
 * Password Reset Form Page
 * 
 * Allows users to set a new password using reset token
 * Uses: MotoMind layout + shadcn/ui + PasswordInput component
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, Button } from '@/components/ui'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { validatePassword } from '@/lib/auth/services/password-service'
import Link from 'next/link'

export default function ResetPasswordTokenPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  // Validate token on mount
  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/reset-password/verify?token=${token}`)
      const data = await response.json()

      if (response.ok && data.valid) {
        setIsValidToken(true)
        setEmail(data.email)
      } else {
        setIsValidToken(false)
        setError(data.error || 'Invalid or expired reset link')
      }
    } catch (err) {
      setIsValidToken(false)
      setError('Failed to validate reset link')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate password
    const validation = validatePassword(password)
    if (!validation.valid) {
      setError(validation.errors[0])
      setIsLoading(false)
      return
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)

    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center">
        <Card className="border-0 shadow-2xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating reset link...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
        <Container size="sm" useCase="forms">
          <Section spacing="xl">
            <div className="py-32">
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Invalid Reset Link</h2>
                    <p className="text-muted-foreground">
                      {error || 'This password reset link is invalid or has expired.'}
                    </p>
                  </div>

                  <Link href="/auth/reset-password" className="block">
                    <Button className="w-full">
                      Request a new reset link
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </Section>
        </Container>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
        <Container size="sm" useCase="forms">
          <Section spacing="xl">
            <div className="py-32">
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Password Reset!</h2>
                    <p className="text-muted-foreground">
                      Your password has been successfully reset.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Redirecting to sign in...
                    </p>
                  </div>

                  <Link href="/auth/signin">
                    <Button className="w-full">
                      Continue to sign in
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </Section>
        </Container>
      </div>
    )
  }

  // Reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
      <Container size="sm" useCase="forms">
        <Section spacing="xl">
          <div className="py-20">
            <Stack spacing="xl">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="text-5xl mb-2">🔒</div>
                <Heading level="hero" className="text-white text-3xl">
                  Set new password
                </Heading>
                <p className="text-purple-100 text-base">
                  Enter a strong password for {email}
                </p>
              </div>

              {/* Form Card */}
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      label="New Password"
                      placeholder="Enter new password"
                      required
                      showStrength
                      autoComplete="new-password"
                      disabled={isLoading}
                    />

                    <PasswordInput
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      label="Confirm Password"
                      placeholder="Re-enter new password"
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                    />

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || !password || !confirmPassword}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? 'Resetting password...' : 'Reset password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </Stack>
          </div>
        </Section>
      </Container>
    </div>
  )
}
