/**
 * Check Email State Component
 * 
 * Beautiful "check your email" message with:
 * - Animated mail icon
 * - Countdown timer
 * - Resend button with cooldown
 * - Empty state helper
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, MailX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { CountdownTimer } from './CountdownTimer'

interface CheckEmailStateProps {
  email: string
  expiresAt?: Date | string
  onResend?: () => Promise<void>
  resendCooldown?: number // seconds before resend is available
  className?: string
}

export function CheckEmailState({
  email,
  expiresAt,
  onResend,
  resendCooldown = 60,
  className = ''
}: CheckEmailStateProps) {
  const [isResending, setIsResending] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(resendCooldown)
  const [showEmptyState, setShowEmptyState] = useState(false)

  useEffect(() => {
    // Start cooldown timer
    setCooldownLeft(resendCooldown)
    setCanResend(false)

    const timer = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Show empty state helper after 30 seconds
    const emptyStateTimer = setTimeout(() => {
      setShowEmptyState(true)
    }, 30000)

    return () => {
      clearInterval(timer)
      clearTimeout(emptyStateTimer)
    }
  }, [resendCooldown])

  const handleResend = async () => {
    if (!onResend || !canResend || isResending) return

    setIsResending(true)
    try {
      await onResend()
      // Reset cooldown
      setCooldownLeft(resendCooldown)
      setCanResend(false)
      setShowEmptyState(false)
    } catch (error) {
      console.error('Failed to resend:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Animated Mail Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Mail className="h-8 w-8 text-primary" />
      </motion.div>

      {/* Message */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Check your email</h3>
        <p className="text-muted-foreground">
          We sent a magic link to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {/* Expiration Timer */}
      {expiresAt && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Link expires in:</span>
          <CountdownTimer
            expiresAt={expiresAt}
            format="short"
            showIcon={false}
            onExpire={() => {
              setShowEmptyState(true)
              setCanResend(true)
            }}
          />
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-muted-foreground text-center space-y-1">
        <p>Click the link in the email to sign in.</p>
        <p>The link can only be used once.</p>
      </div>

      {/* Resend Button */}
      {onResend && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className="min-w-[160px]"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : !canResend ? (
              `Resend available in ${cooldownLeft}s`
            ) : (
              'Resend magic link'
            )}
          </Button>
        </div>
      )}

      {/* Empty State Helper */}
      {showEmptyState && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-lg border border-border bg-muted/50 space-y-3"
        >
          <div className="flex items-start gap-3">
            <MailX className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium">Didn't receive the email?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure {email} is correct</li>
                <li>• Wait a few minutes for delivery</li>
              </ul>
              {canResend && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending}
                  className="p-0 h-auto"
                >
                  {isResending ? 'Sending...' : 'Click here to resend'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
