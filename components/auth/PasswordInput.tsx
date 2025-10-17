'use client'

/**
 * Password Input with Strength Indicator
 * 
 * shadcn/ui + Tailwind CSS implementation
 */

import { useState, useEffect } from 'react'
import { Input, Label, Progress, Button, cn } from '@/components/ui'
import { Eye, EyeOff } from 'lucide-react'
import {
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  type PasswordValidation
} from '@/lib/auth/services/password-service'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  showStrength?: boolean
  required?: boolean
  autoComplete?: string
  disabled?: boolean
}

export function PasswordInput({
  value,
  onChange,
  label = 'Password',
  placeholder = '••••••••',
  showStrength = false,
  required = false,
  autoComplete = 'current-password',
  disabled = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [validation, setValidation] = useState<PasswordValidation | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Validate password on change (debounced)
  useEffect(() => {
    if (!showStrength || !value) {
      setValidation(null)
      return
    }

    const timer = setTimeout(() => {
      const result = validatePassword(value)
      setValidation(result)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, showStrength])

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="password" className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cn(
            "pr-10",
            validation && !validation.valid && "border-destructive focus-visible:ring-destructive"
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Strength Indicator */}
      {showStrength && validation && value && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Progress 
              value={validation.score} 
              className="h-1 flex-1"
              style={{
                '--progress-background': getPasswordStrengthColor(validation.strength)
              } as React.CSSProperties}
            />
            <span 
              className="text-xs font-semibold"
              style={{ color: getPasswordStrengthColor(validation.strength) }}
            >
              {getPasswordStrengthLabel(validation.strength)}
            </span>
          </div>

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <ul className="space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i} className="text-xs text-destructive">
                  • {error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
