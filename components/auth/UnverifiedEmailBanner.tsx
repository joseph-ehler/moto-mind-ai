'use client'

/**
 * Unverified Email Banner
 * 
 * Optional banner to show users who haven't verified their email
 * Can be placed at top of dashboard or other protected pages
 */

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Alert, AlertDescription, Button } from '@/components/ui'
import { Mail, X } from 'lucide-react'

export function UnverifiedEmailBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Don't show if dismissed or no session
  if (dismissed || !session?.user?.email) {
    return null
  }

  // TODO: Check if email is verified from session or API
  // For now, this is a placeholder that you can integrate
  const isEmailVerified = false // Replace with actual check

  // Don't show if already verified
  if (isEmailVerified) {
    return null
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const response = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      })

      if (response.ok) {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <Mail className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            Please verify your email address
          </p>
          <p className="text-sm text-amber-700">
            Check your inbox for a verification link, or{' '}
            {resendSuccess ? (
              <span className="font-semibold text-green-600">Email sent!</span>
            ) : (
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="underline hover:no-underline disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'resend verification email'}
              </button>
            )}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className="ml-4 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
