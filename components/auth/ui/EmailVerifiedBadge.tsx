/**
 * Email Verified Badge Component
 * 
 * Shows verified status with checkmark
 */

'use client'

import { CheckCircle2, Mail } from 'lucide-react'
import { Badge } from '@/components/ui'

interface EmailVerifiedBadgeProps {
  verified: boolean
  className?: string
  showIcon?: boolean
}

export function EmailVerifiedBadge({ 
  verified, 
  className = '',
  showIcon = true
}: EmailVerifiedBadgeProps) {
  if (verified) {
    return (
      <Badge 
        variant="outline" 
        className={`bg-green-50 border-green-200 text-green-700 ${className}`}
      >
        {showIcon && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
        Verified
      </Badge>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className={`bg-orange-50 border-orange-200 text-orange-700 ${className}`}
    >
      {showIcon && <Mail className="mr-1.5 h-3.5 w-3.5" />}
      Unverified
    </Badge>
  )
}
