'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// RATING - MotoMind patterns
// ============================================================================

export interface RatingProps {
  /** Rating ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below rating */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Current rating value (0-max) */
  value?: number
  /** Change handler */
  onChange?: (rating: number) => void
  /** Maximum rating (default: 5) */
  max?: number
  /** Allow half-star ratings */
  allowHalf?: boolean
  /** Read-only mode */
  readOnly?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Size of stars */
  size?: 'sm' | 'md' | 'lg'
  /** Show rating number */
  showValue?: boolean
  /** Additional className */
  className?: string
}

/**
 * Enhanced Rating - Star rating with MotoMind patterns
 * 
 * @example
 * <Rating
 *   label="Vehicle Condition"
 *   value={rating}
 *   onChange={setRating}
 *   max={5}
 *   showValue
 * />
 */
export function Rating({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value = 0,
  onChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  disabled = false,
  required,
  size = 'md',
  showValue = false,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)
  const ratingId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  const sizeClasses = {
    sm: isMobile ? 'h-5 w-5' : 'h-4 w-4',
    md: isMobile ? 'h-7 w-7' : 'h-5 w-5',
    lg: isMobile ? 'h-9 w-9' : 'h-6 w-6'
  }

  const handleClick = React.useCallback((index: number, isHalf: boolean) => {
    if (readOnly || disabled) return
    const newValue = isHalf ? index + 0.5 : index + 1
    onChange?.(newValue)
  }, [readOnly, disabled, onChange])

  const handleMouseMove = React.useCallback((index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (readOnly || disabled || !allowHalf) return
    const rect = e.currentTarget.getBoundingClientRect()
    const isHalf = e.clientX - rect.left < rect.width / 2
    setHoverValue(isHalf ? index + 0.5 : index + 1)
  }, [readOnly, disabled, allowHalf])

  const handleMouseLeave = React.useCallback(() => {
    setHoverValue(null)
  }, [])

  const getStarFill = React.useCallback((index: number) => {
    const currentValue = hoverValue !== null ? hoverValue : value
    if (currentValue >= index + 1) return 'full'
    if (currentValue > index && currentValue < index + 1) return 'half'
    return 'empty'
  }, [hoverValue, value])

  // Validation state
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
            <Label htmlFor={ratingId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Rating Stars */}
      <Flex gap="xs" align="center">
        <div 
          id={ratingId}
          className="flex gap-1"
          role="radiogroup"
          aria-label={label || 'Rating'}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={
            validationMessage ? `${ratingId}-message` : 
            helperText ? `${ratingId}-helper` : 
            undefined
          }
        >
          {Array.from({ length: max }).map((_, index) => {
            const fill = getStarFill(index)
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  if (allowHalf) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const isHalf = e.clientX - rect.left < rect.width / 2
                    handleClick(index, isHalf)
                  } else {
                    handleClick(index, false)
                  }
                }}
                onMouseMove={(e) => handleMouseMove(index, e)}
                onMouseLeave={handleMouseLeave}
                disabled={disabled || readOnly}
                className={cn(
                  'transition-all',
                  !readOnly && !disabled && 'hover:scale-110 cursor-pointer',
                  (disabled || readOnly) && 'cursor-default',
                  disabled && 'opacity-50'
                )}
                role="radio"
                aria-checked={value > index}
                aria-label={`${index + 1} star${index > 0 ? 's' : ''}`}
              >
                {fill === 'full' && (
                  <Star className={cn(sizeClasses[size], 'fill-amber-400 text-amber-400')} />
                )}
                {fill === 'half' && (
                  <div className="relative">
                    <Star className={cn(sizeClasses[size], 'text-gray-300')} />
                    <div className="absolute inset-0 overflow-hidden w-1/2">
                      <Star className={cn(sizeClasses[size], 'fill-amber-400 text-amber-400')} />
                    </div>
                  </div>
                )}
                {fill === 'empty' && (
                  <Star className={cn(sizeClasses[size], 'text-gray-300')} />
                )}
              </button>
            )
          })}
        </div>

        {/* Show Value */}
        {showValue && (
          <span className="text-sm font-medium text-muted-foreground ml-1">
            {value.toFixed(allowHalf ? 1 : 0)} / {max}
          </span>
        )}
      </Flex>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${ratingId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${ratingId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
