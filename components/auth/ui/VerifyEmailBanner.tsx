/**
 * Verify Email Banner Component
 * 
 * Shows banner for unverified users with resend option
 */

'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Mail, X, Loader2, CheckCircle2 } from 'lucide-react'

interface VerifyEmailBannerProps {
  email: string
  userId: string
  onDismiss?: () => void
  className?: string
}

export function VerifyEmailBanner({ 
  email, 
  userId,
  onDismiss,
  className = '' 
}: VerifyEmailBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [canResend, setCanResend] = useState(true)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (cooldownLeft > 0) {
      const timer = setTimeout(() => {
        setCooldownLeft(cooldownLeft - 1)
        if (cooldownLeft - 1 <= 0) {
          setCanResend(true)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownLeft])

  const handleResend = async () => {
    if (!canResend || isResending) return

    setIsResending(true)
    setError('')
    setIsSuccess(false)

    try {
      const response = await fetch('/api/auth/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send verification email')
        setIsResending(false)
        return
      }

      setIsSuccess(true)
      setCanResend(false)
      setCooldownLeft(300) // 5 minutes cooldown

      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)

    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (isDismissed) {
    return null
  }

  return (
    <Alert className={`relative ${className}`}>
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      )}

      <Mail className="h-4 w-4" />
      <AlertTitle>Verify your email</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Please verify your email address <strong>{email}</strong> to access all features.
        </p>

        {isSuccess && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Verification email sent! Check your inbox.</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleResend}
            disabled={!canResend || isResending}
            variant="secondary"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : !canResend && cooldownLeft > 0 ? (
              `Resend in ${Math.floor(cooldownLeft / 60)}:${String(cooldownLeft % 60).padStart(2, '0')}`
            ) : (
              'Resend verification email'
            )}
          </Button>

          <span className="text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  )
}
