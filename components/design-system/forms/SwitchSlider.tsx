'use client'

import * as React from 'react'
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// ENHANCED SWITCH - shadcn/ui + MotoMind patterns
// ============================================================================

export interface SwitchProps {
  /** Switch ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below switch */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Checked state */
  checked?: boolean
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
 * Enhanced Switch - shadcn/ui Switch with MotoMind patterns
 * 
 * Features:
 * - Built on battle-tested shadcn/ui
 * - Validation states (error, success, warning)
 * - Helper text and description
 * - Required indicator
 * - Toggle functionality (iOS-style)
 * 
 * @example
 * <Switch
 *   label="Enable notifications"
 *   description="Receive email alerts"
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 * />
 */
export function Switch({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  checked,
  onCheckedChange,
  disabled,
  required,
  className,
}: SwitchProps) {
  const switchId = id || React.useId()
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
      <Flex align="start" justify="between" gap="md">
        <div className="flex-1 space-y-1">
          {label && (
            <Label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium leading-none',
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

        <ShadcnSwitch
          id={switchId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={isMobile ? 'scale-125' : ''}  // 25% larger on mobile
          aria-invalid={!!error}
          aria-describedby={
            validationMessage ? `${switchId}-message` : 
            helperText ? `${switchId}-helper` : 
            undefined
          }
        />
      </Flex>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${switchId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${switchId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ENHANCED SLIDER - shadcn/ui + MotoMind patterns
// ============================================================================

export interface SliderProps {
  /** Slider ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below slider */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Current value(s) */
  value?: number[]
  /** Change handler */
  onValueChange?: (value: number[]) => void
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step increment */
  step?: number
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Show current value(s) */
  showValue?: boolean
  /** Value formatter function */
  formatValue?: (value: number) => string
  /** Show min/max labels */
  showMinMax?: boolean
  /** Additional className */
  className?: string
}

/**
 * Enhanced Slider - shadcn/ui Slider with MotoMind patterns
 * 
 * Features:
 * - Built on battle-tested shadcn/ui
 * - Validation states (error, success, warning)
 * - Helper text and description
 * - Value display with formatting
 * - Min/max labels
 * - Single or range sliders
 * 
 * @example
 * <Slider
 *   label="Volume"
 *   value={[volume]}
 *   onValueChange={(v) => setVolume(v[0])}
 *   min={0}
 *   max={100}
 *   showValue
 *   formatValue={(v) => `${v}%`}
 * />
 */
export function Slider({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  required,
  showValue = false,
  formatValue = (v) => v.toString(),
  showMinMax = false,
  className,
}: SliderProps) {
  const sliderId = id || React.useId()
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
        <Flex align="start" justify="between">
          <div className="flex-1">
            {label && (
              <Label
                htmlFor={sliderId}
                className={cn(
                  'text-sm font-medium',
                  disabled && 'cursor-not-allowed opacity-70'
                )}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>

          {/* Current Value Display */}
          {showValue && (
            <div className="text-sm font-medium">
              {value.length === 1 ? (
                formatValue(value[0])
              ) : (
                `${formatValue(value[0])} - ${formatValue(value[1])}`
              )}
            </div>
          )}
        </Flex>
      )}

      {/* Slider */}
      <div className={cn(
        'relative',
        isMobile ? 'pt-3 pb-3' : 'pt-2 pb-2'  // More space on mobile
      )}>
        <ShadcnSlider
          id={sliderId}
          value={value}
          onValueChange={onValueChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            error && 'accent-red-500',
            isMobile && '[&_[role=slider]]:h-5 [&_[role=slider]]:w-5'  // Larger thumb on mobile
          )}
          aria-invalid={!!error}
          aria-describedby={
            validationMessage ? `${sliderId}-message` : 
            helperText ? `${sliderId}-helper` : 
            undefined
          }
        />

        {/* Min/Max Labels */}
        {showMinMax && (
          <Flex justify="between" className="mt-1">
            <span className="text-xs text-muted-foreground">{formatValue(min)}</span>
            <span className="text-xs text-muted-foreground">{formatValue(max)}</span>
          </Flex>
        )}
      </div>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${sliderId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${sliderId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
