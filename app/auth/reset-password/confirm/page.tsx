/**
 * Password Reset Confirmation Page
 * /auth/reset-password/confirm?token=xyz
 * 
 * Where users land after clicking reset link in email
 * Allows them to set a new password
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Section, Stack, Heading } from '@/components/design-system'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui'
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrengthMeter } from '@/components/auth/ui/PasswordStrengthMeter'
import { validatePassword } from '@/lib/auth/services/password-service'

function ResetPasswordConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token provided')
      setIsVerifying(false)
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/password/reset?token=${token}`)
      const data = await response.json()

      if (data.valid) {
        setIsValid(true)
        setEmail(data.email || '')
      } else {
        setTokenError(data.error || 'Invalid or expired reset link')
      }
    } catch (err) {
      setTokenError('Failed to verify reset token')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.valid) {
      setError(validation.errors[0] || 'Password does not meet requirements')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          newPassword: password 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      
      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)

    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Token error state
  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center">
        <Container size="sm" useCase="forms">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
              <CardDescription className="text-base">
                {tokenError}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                This link may have expired or already been used.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/auth/reset-password" className="w-full">
                  <Button className="w-full">
                    Request a new reset link
                  </Button>
                </Link>
                <Link href="/auth/signin" className="w-full">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center">
        <Container size="sm" useCase="forms">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Password Updated!</CardTitle>
              <CardDescription className="text-base">
                Your password has been successfully reset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold">Security Notice:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All other devices have been signed out</li>
                  <li>• You'll be signed in on this device</li>
                  <li>• Redirecting you to sign in...</li>
                </ul>
              </div>
            </CardContent>
          </Card>
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
                <div className="text-5xl mb-2">🔐</div>
                <Heading level="hero" className="text-white text-3xl">
                  Set New Password
                </Heading>
                {email && (
                  <p className="text-purple-100 text-base">
                    Resetting password for <strong>{email}</strong>
                  </p>
                )}
              </div>

              {/* Form Card */}
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* New Password */}
                      <PasswordInput
                        label="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        disabled={isLoading}
                      />

                      {/* Password Strength Meter */}
                      {password && (
                        <PasswordStrengthMeter password={password} />
                      )}

                      {/* Confirm Password */}
                      <PasswordInput
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        disabled={isLoading}
                      />

                      {/* Match Indicator */}
                      {confirmPassword && (
                        <p className={`text-sm ${
                          password === confirmPassword 
                            ? 'text-green-600' 
                            : 'text-destructive'
                        }`}>
                          {password === confirmPassword 
                            ? '✓ Passwords match' 
                            : '✗ Passwords do not match'}
                        </p>
                      )}
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="space-y-3">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading || !password || !confirmPassword}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Updating password...' : 'Update Password'}
                      </Button>

                      <Link href="/auth/signin" className="w-full block">
                        <Button variant="ghost" className="w-full" type="button">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to sign in
                        </Button>
                      </Link>
                    </div>
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

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}
