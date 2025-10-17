/**
 * Rate Limit Message Component
 * 
 * Shows clear lockout messages with countdown timers
 * Helps users understand when they can try again
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui'

interface RateLimitMessageProps {
  retryAfterMinutes: number
  type?: 'login' | 'reset' | 'verify' | 'magic_link'
  className?: string
}

const ACTION_NAMES = {
  login: 'sign in',
  reset: 'reset your password',
  verify: 'verify your email',
  magic_link: 'send a magic link'
}

export function RateLimitMessage({ 
  retryAfterMinutes, 
  type = 'login',
  className 
}: RateLimitMessageProps) {
  const [timeLeft, setTimeLeft] = useState(retryAfterMinutes)

  useEffect(() => {
    setTimeLeft(retryAfterMinutes)

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          // Optionally trigger a refresh or callback here
          return 0
        }
        return prev - 1
      })
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [retryAfterMinutes])

  const formatTime = (minutes: number): string => {
    if (minutes < 1) {
      return 'less than a minute'
    }
    
    if (minutes === 1) {
      return '1 minute'
    }
    
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours === 1) {
      return remainingMinutes > 0 
        ? `1 hour, ${remainingMinutes} min`
        : '1 hour'
    }
    
    return remainingMinutes > 0
      ? `${hours} hours, ${remainingMinutes} min`
      : `${hours} hours`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Too many attempts</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            You've tried to {ACTION_NAMES[type]} too many times.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span>Try again in {formatTime(timeLeft)}</span>
          </div>
          <p className="text-sm">
            Need help?{' '}
            <a 
              href="/support" 
              className="underline hover:text-foreground"
            >
              Contact support
            </a>
          </p>
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}
