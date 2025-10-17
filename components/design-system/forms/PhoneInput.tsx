'use client'

import * as React from 'react'
import { Phone } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Combobox, ComboboxOption } from '../forms/Combobox'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// PHONE INPUT - MotoMind patterns
// ============================================================================

const COUNTRY_CODES: ComboboxOption[] = [
  { value: '+1', label: 'US +1', description: 'United States' },
  { value: '+1', label: 'CA +1', description: 'Canada' },
  { value: '+44', label: 'UK +44', description: 'United Kingdom' },
  { value: '+61', label: 'AU +61', description: 'Australia' },
  { value: '+49', label: 'DE +49', description: 'Germany' },
  { value: '+33', label: 'FR +33', description: 'France' },
  { value: '+81', label: 'JP +81', description: 'Japan' },
  { value: '+86', label: 'CN +86', description: 'China' },
]

export interface PhoneInputProps {
  /** Phone Input ID */
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
  /** Current phone number */
  value?: string
  /** Change handler (receives full phone number with country code) */
  onChange?: (value: string) => void
  /** Default country code */
  defaultCountryCode?: string
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Auto-format phone number */
  autoFormat?: boolean
  /** Additional className */
  className?: string
}

/**
 * Enhanced PhoneInput - Phone number input with country code selector
 * 
 * @example
 * <PhoneInput
 *   label="Phone Number"
 *   value={phone}
 *   onChange={setPhone}
 *   defaultCountryCode="+1"
 *   autoFormat
 * />
 */
export function PhoneInput({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value = '',
  onChange,
  defaultCountryCode = '+1',
  placeholder = "(555) 123-4567",
  disabled,
  required,
  autoFormat = true,
  className,
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState(defaultCountryCode)
  const [localNumber, setLocalNumber] = React.useState('')
  const phoneId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const match = value.match(/^(\+\d+)\s?(.*)$/)
      if (match) {
        setCountryCode(match[1])
        setLocalNumber(match[2])
      } else {
        setLocalNumber(value)
      }
    }
  }, [])

  const formatPhoneNumber = React.useCallback((input: string): string => {
    if (!autoFormat) return input
    
    // Remove all non-digits
    const digits = input.replace(/\D/g, '')
    
    // Format for US/CA numbers
    if (countryCode === '+1') {
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    
    // Default: just return the digits
    return digits
  }, [autoFormat, countryCode])

  const handlePhoneChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setLocalNumber(formatted)
    onChange?.(`${countryCode} ${formatted}`)
  }, [countryCode, formatPhoneNumber, onChange])

  const handleCountryCodeChange = React.useCallback((code: string | string[]) => {
    const newCode = Array.isArray(code) ? code[0] : code
    setCountryCode(newCode)
    onChange?.(`${newCode} ${localNumber}`)
  }, [localNumber, onChange])

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
            <Label htmlFor={phoneId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Phone Input with Country Code */}
      <Flex gap="sm">
        <div className="w-32">
          <Combobox
            options={COUNTRY_CODES}
            value={countryCode}
            onChange={handleCountryCodeChange}
            placeholder="+1"
            disabled={disabled}
          />
        </div>
        
        <div className="flex-1 relative">
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground',
            isMobile ? 'left-4' : 'left-3'
          )}>
            <Phone className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          </div>
          <Input
            id={phoneId}
            type="tel"
            value={localNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              isMobile ? 'pl-11 h-12 text-base' : 'pl-9',
              borderClasses[validationState]
            )}
            style={isMobile ? { fontSize: '16px' } : undefined}
            aria-invalid={!!error}
            aria-describedby={
              validationMessage ? `${phoneId}-message` : 
              helperText ? `${phoneId}-helper` : 
              undefined
            }
          />
        </div>
      </Flex>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${phoneId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${phoneId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
