/**
 * Countdown Timer Component
 * 
 * Shows time remaining with live updates
 * Used for magic link expiration, rate limit lockouts, etc.
 */

'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  expiresAt: Date | string
  onExpire?: () => void
  className?: string
  showIcon?: boolean
  format?: 'full' | 'short' | 'minimal'
}

export function CountdownTimer({
  expiresAt,
  onExpire,
  className = '',
  showIcon = true,
  format = 'full'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
      const now = new Date()
      const diff = expires.getTime() - now.getTime()
      return Math.max(0, Math.floor(diff / 1000))
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining <= 0 && onExpire) {
        onExpire()
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, onExpire])

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0:00'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (format === 'minimal') {
      if (hours > 0) return `${hours}h ${minutes}m`
      if (minutes > 0) return `${minutes}m ${secs}s`
      return `${secs}s`
    }

    if (format === 'short') {
      if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      return `${minutes}:${String(secs).padStart(2, '0')}`
    }

    // full format
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`
    }
    return `${secs} second${secs !== 1 ? 's' : ''}`
  }

  const getColorClass = () => {
    if (timeLeft <= 60) return 'text-destructive' // Last minute - red
    if (timeLeft <= 300) return 'text-orange-500' // Last 5 minutes - orange
    return 'text-muted-foreground' // Normal - gray
  }

  if (timeLeft <= 0) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        {showIcon && <Clock className="h-4 w-4 text-destructive" />}
        <span className="text-destructive font-medium">Expired</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${getColorClass()} ${className}`}>
      {showIcon && <Clock className="h-4 w-4" />}
      <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
    </div>
  )
}
