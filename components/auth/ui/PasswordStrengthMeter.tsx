/**
 * Password Strength Meter Component
 * 
 * Visual feedback for password strength with requirements
 */

'use client'

import { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { Progress } from '@/components/ui'

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

interface StrengthResult {
  score: number // 0-5
  label: string
  color: string
  percentage: number
  requirements: {
    label: string
    met: boolean
  }[]
}

export function PasswordStrengthMeter({ password, className = '' }: PasswordStrengthMeterProps) {
  const strength = useMemo((): StrengthResult => {
    if (!password) {
      return {
        score: 0,
        label: '',
        color: 'bg-muted',
        percentage: 0,
        requirements: []
      }
    }

    const requirements = [
      {
        label: 'At least 8 characters',
        met: password.length >= 8
      },
      {
        label: 'One uppercase letter',
        met: /[A-Z]/.test(password)
      },
      {
        label: 'One lowercase letter',
        met: /[a-z]/.test(password)
      },
      {
        label: 'One number',
        met: /[0-9]/.test(password)
      },
      {
        label: 'One special character (!@#$%^&*)',
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
    ]

    const metCount = requirements.filter(r => r.met).length
    let score = metCount
    let label = ''
    let color = ''
    let percentage = 0

    if (metCount === 0) {
      label = 'Too weak'
      color = 'bg-destructive'
      percentage = 10
    } else if (metCount === 1) {
      label = 'Weak'
      color = 'bg-destructive'
      percentage = 20
    } else if (metCount === 2) {
      label = 'Fair'
      color = 'bg-orange-500'
      percentage = 40
    } else if (metCount === 3) {
      label = 'Good'
      color = 'bg-yellow-500'
      percentage = 60
    } else if (metCount === 4) {
      label = 'Strong'
      color = 'bg-green-500'
      percentage = 80
    } else {
      label = 'Very Strong'
      color = 'bg-green-600'
      percentage = 100
    }

    return {
      score,
      label,
      color,
      percentage,
      requirements
    }
  }, [password])

  if (!password) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength:</span>
          <span className={`font-medium ${
            strength.score >= 4 ? 'text-green-600' : 
            strength.score >= 3 ? 'text-yellow-600' : 
            'text-destructive'
          }`}>
            {strength.label}
          </span>
        </div>
        <Progress value={strength.percentage} className="h-2" />
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-muted-foreground">Password must contain:</p>
        <ul className="space-y-1">
          {strength.requirements.map((req, index) => (
            <li
              key={index}
              className={`flex items-center gap-2 text-sm ${
                req.met ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              {req.met ? (
                <Check className="h-4 w-4 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Helpful Tips */}
      {strength.score < 4 && (
        <div className="text-xs text-muted-foreground pt-1">
          💡 Tip: Mix uppercase, lowercase, numbers, and symbols for a stronger password
        </div>
      )}

      {strength.score === 5 && (
        <div className="text-xs text-green-600 pt-1">
          ✓ Excellent! Your password is very strong
        </div>
      )}
    </div>
  )
}
