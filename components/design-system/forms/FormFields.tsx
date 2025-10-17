'use client'

import * as React from 'react'
import { Input as ShadcnInput } from '@/components/ui/input'
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Stack } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// ENHANCED INPUT - shadcn/ui + MotoMind patterns
// ============================================================================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label text */
  label?: string
  /** Helper text shown below input */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Icon to show at the start of input */
  startIcon?: React.ReactNode
  /** Icon to show at the end of input */
  endIcon?: React.ReactNode
  /** Show loading spinner */
  loading?: boolean
  /** Optional description above input */
  description?: string
  /** Show character counter (requires maxLength) */
  showCounter?: boolean
  /** 
   * Input type - Only basic text-based types
   * 
   * ⚠️ DO NOT USE type="password", "number", or "tel"
   * Instead use specialized components:
   * - Passwords → <PasswordInput />
   * - Numbers → <NumberInput />
   * - Phone → <PhoneInput />
   */
  type?: 
    | 'text'
    | 'email'
    | 'url'
    | 'search'
    | 'date'
    | 'time'
    | 'datetime-local'
}

/**
 * Enhanced Input - For text, email, url, and search fields
 * 
 * ⚠️ **DO NOT USE FOR:**
 * - Passwords → Use `<PasswordInput />` instead
 * - Numbers → Use `<NumberInput />` instead  
 * - Phone → Use `<PhoneInput />` instead
 * 
 * Features:
 * - Built on battle-tested shadcn/ui
 * - Validation states (error, success, warning)
 * - Icons (leading & trailing)
 * - Loading state
 * - Character counter
 * - Helper text
 * 
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   error="Invalid email"
 *   helperText="We'll never share your email"
 * />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  success,
  warning,
  startIcon,
  endIcon,
  loading,
  description,
  showCounter,
  className,
  required,
  maxLength,
  value,
  onChange,
  id,
  ...props
}, ref) => {
  const [charCount, setCharCount] = React.useState(0)
  const inputId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Track character count
  React.useEffect(() => {
    if (showCounter && maxLength) {
      const count = typeof value === 'string' ? value.length : 0
      setCharCount(count)
    }
  }, [value, showCounter, maxLength])

  // Handle change with character counting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showCounter && maxLength) {
      setCharCount(e.target.value.length)
    }
    onChange?.(e)
  }

  // Determine validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const stateClasses = {
    default: '',
    error: 'border-red-500 focus-visible:ring-red-500',
    success: 'border-green-500 focus-visible:ring-green-500',
    warning: 'border-amber-500 focus-visible:ring-amber-500'
  }

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  return (
    <Stack spacing="sm">
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label htmlFor={inputId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Start Icon */}
        {startIcon && (
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground',
            isMobile ? 'left-4 [&>svg]:w-5 [&>svg]:h-5' : 'left-3 [&>svg]:w-4 [&>svg]:h-4'
          )}>
            {startIcon}
          </div>
        )}

        {/* Input Field */}
        <ShadcnInput
          ref={ref}
          id={inputId}
          className={cn(
            stateClasses[validationState],
            startIcon && (isMobile ? 'pl-11' : 'pl-10'),
            (endIcon || loading) && (isMobile ? 'pr-11' : 'pr-10'),
            // Mobile: larger height and padding
            isMobile && 'h-12 px-4 text-base',
            className
          )}
          style={isMobile ? { fontSize: '16px' } : undefined}  // Prevent iOS zoom
          required={required}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={
            validationMessage ? `${inputId}-message` : 
            helperText ? `${inputId}-helper` : 
            undefined
          }
          {...props}
        />

        {/* End Icon or Loading */}
        {(endIcon || loading) && (
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 text-muted-foreground',
            isMobile ? 'right-4' : 'right-3'
          )}>
            {loading ? (
              <svg 
                className={cn(
                  'animate-spin',
                  isMobile ? 'h-5 w-5' : 'h-4 w-4'
                )} 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <div className={isMobile ? '[&>svg]:w-5 [&>svg]:h-5' : '[&>svg]:w-4 [&>svg]:h-4'}>
                {endIcon}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text, Validation Message, or Character Counter */}
      <div className="flex items-center justify-between min-h-[20px]">
        {/* Message */}
        {validationMessage && (
          <p id={`${inputId}-message`} className={cn('text-xs', messageClasses[validationState])}>
            {validationMessage}
          </p>
        )}
        {!validationMessage && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
        
        {/* Character Counter */}
        {showCounter && maxLength && (
          <span className={cn(
            'text-xs ml-auto',
            charCount >= maxLength ? 'text-red-600' : 'text-muted-foreground'
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </Stack>
  )
})

Input.displayName = 'Input'

// ============================================================================
// ENHANCED TEXTAREA - shadcn/ui + MotoMind patterns
// ============================================================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string
  /** Helper text shown below textarea */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Optional description above textarea */
  description?: string
  /** Show character counter (requires maxLength) */
  showCounter?: boolean
  /** Auto-resize to fit content */
  autoResize?: boolean
  /** Minimum rows when auto-resize is enabled */
  minRows?: number
  /** Maximum rows when auto-resize is enabled */
  maxRows?: number
}

/**
 * Enhanced Textarea - shadcn/ui Textarea with MotoMind patterns
 * 
 * Features:
 * - Built on battle-tested shadcn/ui
 * - Auto-resize functionality
 * - Validation states
 * - Character counter
 * 
 * @example
 * <Textarea
 *   label="Description"
 *   autoResize
 *   maxLength={500}
 *   showCounter
 * />
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  helperText,
  error,
  success,
  warning,
  description,
  showCounter,
  autoResize = false,
  minRows = 3,
  maxRows = 10,
  className,
  required,
  maxLength,
  value,
  onChange,
  rows = 4,
  id,
  ...props
}, ref) => {
  const [charCount, setCharCount] = React.useState(0)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const inputId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Combine refs
  React.useImperativeHandle(ref, () => textareaRef.current!)

  // Track character count
  React.useEffect(() => {
    if (showCounter && maxLength) {
      const count = typeof value === 'string' ? value.length : 0
      setCharCount(count)
    }
  }, [value, showCounter, maxLength])

  // Auto-resize functionality
  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea || !autoResize) return

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto'
    
    // Calculate new height
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
    const minHeight = lineHeight * minRows
    const maxHeight = lineHeight * maxRows
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
    
    textarea.style.height = `${newHeight}px`
  }, [autoResize, minRows, maxRows])

  // Adjust height on value change
  React.useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (showCounter && maxLength) {
      setCharCount(e.target.value.length)
    }
    adjustHeight()
    onChange?.(e)
  }

  // Determine validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const stateClasses = {
    default: '',
    error: 'border-red-500 focus-visible:ring-red-500',
    success: 'border-green-500 focus-visible:ring-green-500',
    warning: 'border-amber-500 focus-visible:ring-amber-500'
  }

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  return (
    <Stack spacing="sm">
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label htmlFor={inputId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Textarea Field */}
      <ShadcnTextarea
        ref={textareaRef}
        id={inputId}
        className={cn(
          stateClasses[validationState],
          autoResize && 'resize-none',
          // Mobile: larger padding and text
          isMobile && 'px-4 py-3 text-base',
          className
        )}
        style={isMobile ? { fontSize: '16px' } : undefined}  // Prevent iOS zoom
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        rows={autoResize ? minRows : rows}
        aria-invalid={!!error}
        aria-describedby={
          validationMessage ? `${inputId}-message` : 
          helperText ? `${inputId}-helper` : 
          undefined
        }
        {...props}
      />

      {/* Helper Text, Validation Message, or Character Counter */}
      <div className="flex items-center justify-between min-h-[20px]">
        {/* Message */}
        {validationMessage && (
          <p id={`${inputId}-message`} className={cn('text-xs', messageClasses[validationState])}>
            {validationMessage}
          </p>
        )}
        {!validationMessage && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
        
        {/* Character Counter */}
        {showCounter && maxLength && (
          <span className={cn(
            'text-xs ml-auto',
            charCount >= maxLength ? 'text-red-600' : 'text-muted-foreground'
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </Stack>
  )
})

Textarea.displayName = 'Textarea'
