'use client'

import * as React from 'react'
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox'
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// ENHANCED CHECKBOX - shadcn/ui + MotoMind patterns
// ============================================================================

export interface CheckboxProps {
  /** Checkbox ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below checkbox */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Checked state */
  checked?: boolean
  /** Indeterminate state (for "select all" scenarios) */
  indeterminate?: boolean
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Additional className */
  className?: string
}

/**
 * Enhanced Checkbox - shadcn/ui Checkbox with MotoMind patterns
 * 
 * Features:
 * - Built on battle-tested shadcn/ui
 * - Validation states (error, success, warning)
 * - Helper text and description
 * - Indeterminate state
 * - Required indicator
 * 
 * @example
 * <Checkbox
 *   label="I agree to terms"
 *   description="Read our terms and conditions"
 *   checked={agreed}
 *   onCheckedChange={setAgreed}
 *   required
 * />
 */
export function Checkbox({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  checked,
  indeterminate,
  onCheckedChange,
  disabled,
  required,
  className,
}: CheckboxProps) {
  const checkboxId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Determine validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Flex align="start" gap={isMobile ? 'md' : 'sm'}>
        <ShadcnCheckbox
          id={checkboxId}
          checked={indeterminate ? 'indeterminate' : checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={cn(
            isMobile && 'h-6 w-6',  // Larger on mobile (24px vs 16px)
            error && 'border-red-500',
            success && 'border-green-500',
            warning && 'border-amber-500'
          )}
          aria-invalid={!!error}
          aria-describedby={
            validationMessage ? `${checkboxId}-message` : 
            helperText ? `${checkboxId}-helper` : 
            undefined
          }
        />
        
        <div className="grid gap-1.5 leading-none">
          {label && (
            <Label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                disabled && 'cursor-not-allowed opacity-70'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </Flex>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="ml-6 min-h-[20px]">
          {validationMessage && (
            <p id={`${checkboxId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${checkboxId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ENHANCED RADIO GROUP - shadcn/ui + MotoMind patterns
// ============================================================================

export interface RadioOption {
  /** Option value */
  value: string
  /** Option label */
  label: string
  /** Optional description */
  description?: string
  /** Disabled state */
  disabled?: boolean
}

export interface RadioGroupProps {
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below radio group */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Radio options */
  options: RadioOption[]
  /** Selected value */
  value?: string
  /** Change handler */
  onValueChange?: (value: string) => void
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Layout direction */
  orientation?: 'vertical' | 'horizontal'
  /** Additional className */
  className?: string
}

/**
 * Enhanced RadioGroup - shadcn/ui RadioGroup with MotoMind patterns
 * 
 * Features:
 * - Built on battle-tested shadcn/ui
 * - Validation states (error, success, warning)
 * - Helper text and description
 * - Horizontal & vertical layouts
 * - Required indicator
 * 
 * @example
 * <RadioGroup
 *   label="Notification preference"
 *   options={[
 *     { value: 'all', label: 'All notifications' },
 *     { value: 'important', label: 'Important only' },
 *     { value: 'none', label: 'None' }
 *   ]}
 *   value={preference}
 *   onValueChange={setPreference}
 * />
 */
export function RadioGroup({
  label,
  description,
  helperText,
  error,
  success,
  warning,
  options,
  value,
  onValueChange,
  disabled,
  required,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const groupId = React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Determine validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  return (
    <Stack spacing="sm" className={className}>
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label className="text-sm font-medium">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Radio Group */}
      <ShadcnRadioGroup
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className={cn(
          orientation === 'horizontal' && 'flex flex-wrap gap-4',
          orientation === 'vertical' && 'flex flex-col space-y-3'
        )}
        aria-invalid={!!error}
        aria-describedby={
          validationMessage ? `${groupId}-message` : 
          helperText ? `${groupId}-helper` : 
          undefined
        }
      >
        {options.map((option) => (
          <div key={option.value} className={cn(
            'flex items-start',
            isMobile ? 'space-x-4' : 'space-x-3'
          )}>
            <RadioGroupItem
              value={option.value}
              id={`${groupId}-${option.value}`}
              disabled={disabled || option.disabled}
              className={cn(
                'mt-0.5',
                isMobile && 'h-6 w-6',  // Larger on mobile (24px vs 16px)
                error && 'border-red-500',
                success && 'border-green-500',
                warning && 'border-amber-500'
              )}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`${groupId}-${option.value}`}
                className={cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  (disabled || option.disabled) && 'cursor-not-allowed opacity-70'
                )}
              >
                {option.label}
              </Label>
              {option.description && (
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </ShadcnRadioGroup>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${groupId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${groupId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
