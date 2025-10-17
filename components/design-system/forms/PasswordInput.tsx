'use client'

import * as React from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// PASSWORD INPUT - MotoMind patterns
// ============================================================================

export interface PasswordInputProps {
  /** Password Input ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below input */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Current value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Show strength meter */
  showStrength?: boolean
  /** Additional className */
  className?: string
}

/**
 * Enhanced PasswordInput - Password field with show/hide toggle and optional strength meter
 * 
 * @example
 * <PasswordInput
 *   label="Password"
 *   value={password}
 *   onChange={setPassword}
 *   showStrength
 *   required
 * />
 */
export function PasswordInput({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value = '',
  onChange,
  placeholder = "Enter password",
  disabled,
  required,
  showStrength = false,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const passwordId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }, [onChange])

  const toggleShowPassword = React.useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Calculate password strength
  const getPasswordStrength = React.useCallback((password: string): {
    score: number
    label: string
    color: string
  } => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' }
    
    let score = 0
    
    // Length
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    
    // Character types
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    const maxScore = 6
    const percentage = (score / maxScore) * 100
    
    let label = ''
    let color = 'bg-gray-200'
    
    if (percentage <= 33) {
      label = 'Weak'
      color = 'bg-red-500'
    } else if (percentage <= 66) {
      label = 'Fair'
      color = 'bg-amber-500'
    } else {
      label = 'Strong'
      color = 'bg-green-500'
    }
    
    return { score: percentage, label, color }
  }, [])

  const strength = React.useMemo(() => getPasswordStrength(value), [value, getPasswordStrength])

  // Validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  const borderClasses = {
    default: '',
    error: 'border-red-500 focus-visible:ring-red-500',
    success: 'border-green-500 focus-visible:ring-green-500',
    warning: 'border-amber-500 focus-visible:ring-amber-500'
  }

  return (
    <Stack spacing="sm" className={className}>
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label htmlFor={passwordId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Password Input with Toggle */}
      <div className="relative">
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2 text-muted-foreground',
          isMobile ? 'left-4' : 'left-3'
        )}>
          <Lock className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
        </div>
        <Input
          id={passwordId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            isMobile ? 'pl-11 pr-12 h-12 text-base' : 'pl-9 pr-10',
            borderClasses[validationState]
          )}
          style={isMobile ? { fontSize: '16px' } : undefined}
          aria-invalid={!!error}
          aria-describedby={
            validationMessage ? `${passwordId}-message` : 
            helperText ? `${passwordId}-helper` : 
            undefined
          }
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          disabled={disabled}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50',
            isMobile ? 'right-3 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center' : 'right-3'
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          ) : (
            <Eye className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          )}
        </button>
      </div>

      {/* Password Strength Meter */}
      {showStrength && value && (
        <Stack spacing="xs">
          <Flex gap="sm" align="center">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all duration-300', strength.color)}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
              {strength.label}
            </span>
          </Flex>
        </Stack>
      )}

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${passwordId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${passwordId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
