/**
 * Mobile/Native-First Form Input
 * 
 * Optimized for touch, accessibility, and mobile keyboards.
 * 
 * Features:
 * - Proper input types (email, tel, number, etc.)
 * - Mobile keyboard hints (inputMode, enterKeyHint)
 * - Autocomplete attributes
 * - 44px+ touch targets
 * - Clear validation states
 * - Accessible labels and errors
 * 
 * Usage:
 * ```tsx
 * <FormInput
 *   type="email"
 *   label="Email Address"
 *   description="We'll use this to send you updates"
 *   placeholder="you@example.com"
 *   value={email}
 *   onChange={setEmail}
 *   error={emailError}
 *   required
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputType = 
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'url'
  | 'search'
  | 'password'

export type InputMode =
  | 'none'
  | 'text'
  | 'decimal'
  | 'numeric'
  | 'tel'
  | 'search'
  | 'email'
  | 'url'

export type EnterKeyHint =
  | 'enter'
  | 'done'
  | 'go'
  | 'next'
  | 'previous'
  | 'search'
  | 'send'

export interface FormInputProps {
  // Identity
  id?: string
  name?: string
  
  // Type & Mode
  type?: InputType
  inputMode?: InputMode
  enterKeyHint?: EnterKeyHint
  
  // Value
  value: string
  onChange: (value: string) => void
  
  // Labels & Descriptions
  label: string
  description?: string
  placeholder?: string
  
  // Validation
  required?: boolean
  error?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  
  // Autocomplete
  autoComplete?: string
  
  // State
  disabled?: boolean
  readOnly?: boolean
  
  // Styling
  className?: string
  fullWidth?: boolean
}

export function FormInput({
  id,
  name,
  type = 'text',
  inputMode,
  enterKeyHint = 'done',
  value,
  onChange,
  label,
  description,
  placeholder,
  required = false,
  error,
  pattern,
  minLength,
  maxLength,
  autoComplete,
  disabled = false,
  readOnly = false,
  className,
  fullWidth = true,
}: FormInputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  
  // Auto-detect inputMode from type if not provided
  const finalInputMode = inputMode || getInputModeFromType(type)
  
  return (
    <div className={cn('space-y-2', fullWidth && 'w-full', className)}>
      {/* Label */}
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {/* Description */}
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}
      
      {/* Input */}
      <input
        id={inputId}
        name={name || inputId}
        type={type}
        inputMode={finalInputMode}
        enterKeyHint={enterKeyHint}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={cn(
          descriptionId,
          errorId
        )}
        className={cn(
          // Base styles
          'block w-full rounded-lg border px-4 py-3',
          'text-base font-normal text-gray-900 placeholder:text-gray-400',
          'transition-colors duration-200',
          
          // Touch optimization
          'min-h-[44px] touch-manipulation',
          
          // Focus state
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          
          // Normal state
          !error && 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          
          // Error state
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          
          // Disabled state
          disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          
          // Read-only state
          readOnly && 'bg-gray-50'
        )}
      />
      
      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 flex items-start gap-1"
          role="alert"
        >
          <span className="text-base">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

/**
 * Get appropriate inputMode from type
 */
function getInputModeFromType(type: InputType): InputMode {
  switch (type) {
    case 'email':
      return 'email'
    case 'tel':
      return 'tel'
    case 'number':
      return 'numeric'
    case 'url':
      return 'url'
    case 'search':
      return 'search'
    default:
      return 'text'
  }
}

/**
 * Common autocomplete values for convenience
 */
export const AutoComplete = {
  // Name
  name: 'name',
  givenName: 'given-name',
  familyName: 'family-name',
  
  // Contact
  email: 'email',
  tel: 'tel',
  
  // Address
  streetAddress: 'street-address',
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  city: 'address-level2',
  state: 'address-level1',
  zip: 'postal-code',
  country: 'country',
  
  // Payment
  ccName: 'cc-name',
  ccNumber: 'cc-number',
  ccExp: 'cc-exp',
  ccCsc: 'cc-csc',
  
  // Other
  username: 'username',
  newPassword: 'new-password',
  currentPassword: 'current-password',
  oneTimeCode: 'one-time-code',
} as const
