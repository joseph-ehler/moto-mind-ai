'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// OTP/PIN INPUT - MotoMind patterns
// ============================================================================

export interface OTPInputProps {
  /** OTP Input ID */
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
  /** Current OTP value */
  value?: string
  /** Change handler (receives complete OTP string) */
  onChange?: (value: string) => void
  /** Number of digits (default: 6) */
  length?: number
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Mask input (show dots instead of numbers) */
  mask?: boolean
  /** Additional className */
  className?: string
}

/**
 * Enhanced OTPInput - One-Time Password / PIN input with auto-focus
 * 
 * @example
 * <OTPInput
 *   label="Verification Code"
 *   value={otp}
 *   onChange={setOtp}
 *   length={6}
 * />
 */
export function OTPInput({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value = '',
  onChange,
  length = 6,
  disabled,
  required,
  mask = false,
  className,
}: OTPInputProps) {
  const [digits, setDigits] = React.useState<string[]>(
    Array.from({ length }, (_, i) => value[i] || '')
  )
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const otpId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Sync with external value changes
  React.useEffect(() => {
    setDigits(Array.from({ length }, (_, i) => value[i] || ''))
  }, [value, length])

  const handleChange = React.useCallback((index: number, digitValue: string) => {
    // Only allow single digit
    const singleDigit = digitValue.slice(-1)
    
    if (!/^\d*$/.test(singleDigit)) return // Only digits

    const newDigits = [...digits]
    newDigits[index] = singleDigit
    setDigits(newDigits)
    onChange?.(newDigits.join(''))

    // Auto-focus next input
    if (singleDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [digits, length, onChange])

  const handleKeyDown = React.useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [digits, length])

  const handlePaste = React.useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const newDigits = Array.from({ length }, (_, i) => pastedData[i] || '')
    setDigits(newDigits)
    onChange?.(newDigits.join(''))

    // Focus last filled input or first empty
    const lastFilledIndex = newDigits.findIndex(d => !d)
    const focusIndex = lastFilledIndex === -1 ? length - 1 : lastFilledIndex
    inputRefs.current[focusIndex]?.focus()
  }, [length, onChange])

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
    default: 'border-input',
    error: 'border-red-500',
    success: 'border-green-500',
    warning: 'border-amber-500'
  }

  return (
    <Stack spacing="sm" className={className}>
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label htmlFor={`${otpId}-0`}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* OTP Digit Inputs */}
      <Flex gap={isMobile ? 'sm' : 'xs'} justify="center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            id={index === 0 ? `${otpId}-0` : undefined}
            ref={(el) => { inputRefs.current[index] = el }}
            type={mask ? 'password' : 'text'}
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digits[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'text-center font-semibold',
              'border-2 rounded-lg',
              'transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Mobile: larger boxes and text
              isMobile ? 'w-14 h-16 text-3xl' : 'w-12 h-14 text-2xl',
              borderClasses[validationState],
              digits[index] && 'border-primary'
            )}
            style={isMobile ? { fontSize: '28px' } : undefined}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={!!error}
            aria-describedby={
              validationMessage ? `${otpId}-message` : 
              helperText ? `${otpId}-helper` : 
              undefined
            }
          />
        ))}
      </Flex>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px] text-center">
          {validationMessage && (
            <p id={`${otpId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${otpId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
