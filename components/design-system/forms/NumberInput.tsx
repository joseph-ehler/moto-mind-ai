'use client'

import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// NUMBER INPUT - MotoMind patterns
// ============================================================================

export interface NumberInputProps {
  /** Number Input ID */
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
  value?: number
  /** Change handler */
  onChange?: (value: number) => void
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment/decrement */
  step?: number
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Show stepper buttons */
  showSteppers?: boolean
  /** Format value display (e.g., currency, percentage) */
  formatValue?: (value: number) => string
  /** Parse input value */
  parseValue?: (value: string) => number
  /** Additional className */
  className?: string
}

/**
 * Enhanced NumberInput - Number input with stepper buttons and constraints
 * 
 * @example
 * <NumberInput
 *   label="Mileage"
 *   value={mileage}
 *   onChange={setMileage}
 *   min={0}
 *   step={1000}
 *   showSteppers
 * />
 */
export function NumberInput({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value = 0,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  disabled,
  required,
  showSteppers = true,
  formatValue,
  parseValue,
  className,
}: NumberInputProps) {
  const numberId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  const formatDisplay = React.useCallback((num: number): string => {
    if (formatValue) return formatValue(num)
    return String(num)
  }, [formatValue])

  const parseInput = React.useCallback((input: string): number => {
    if (parseValue) return parseValue(input)
    const parsed = parseFloat(input.replace(/[^\d.-]/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }, [parseValue])

  const clampValue = React.useCallback((num: number): number => {
    let clamped = num
    if (min !== undefined) clamped = Math.max(min, clamped)
    if (max !== undefined) clamped = Math.min(max, clamped)
    return clamped
  }, [min, max])

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInput(e.target.value)
    const clamped = clampValue(parsed)
    onChange?.(clamped)
  }, [parseInput, clampValue, onChange])

  const handleIncrement = React.useCallback(() => {
    const newValue = clampValue(value + step)
    onChange?.(newValue)
  }, [value, step, clampValue, onChange])

  const handleDecrement = React.useCallback(() => {
    const newValue = clampValue(value - step)
    onChange?.(newValue)
  }, [value, step, clampValue, onChange])

  const canIncrement = max === undefined || value < max
  const canDecrement = min === undefined || value > min

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
            <Label htmlFor={numberId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Number Input with Steppers */}
      {showSteppers ? (
        <Flex gap="sm" align="stretch">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={disabled || !canDecrement}
            className={isMobile ? 'h-12 w-12 min-w-[48px] min-h-[48px]' : 'h-10 w-10'}
            aria-label="Decrease value"
          >
            <Minus className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
          
          <Input
            id={numberId}
            type="text"
            inputMode="numeric"
            value={formatDisplay(value)}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              'text-center flex-1',
              isMobile && 'h-12 text-base',
              borderClasses[validationState]
            )}
            style={isMobile ? { fontSize: '16px' } : undefined}
            aria-invalid={!!error}
            aria-describedby={
              validationMessage ? `${numberId}-message` : 
              helperText ? `${numberId}-helper` : 
              undefined
            }
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={disabled || !canIncrement}
            className={isMobile ? 'h-12 w-12 min-w-[48px] min-h-[48px]' : 'h-10 w-10'}
            aria-label="Increase value"
          >
            <Plus className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
        </Flex>
      ) : (
        <Input
          id={numberId}
          type="text"
          inputMode="numeric"
          value={formatDisplay(value)}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            isMobile && 'h-12 text-base',
            borderClasses[validationState]
          )}
          style={isMobile ? { fontSize: '16px' } : undefined}
          aria-invalid={!!error}
          aria-describedby={
            validationMessage ? `${numberId}-message` : 
            helperText ? `${numberId}-helper` : 
            undefined
          }
        />
      )}

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${numberId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${numberId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
