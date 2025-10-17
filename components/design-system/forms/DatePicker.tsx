'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Stack } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// ENHANCED DATE PICKER - shadcn/ui Calendar + MotoMind patterns
// ============================================================================

export interface DatePickerProps {
  /** Date Picker ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below date picker */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Selected date */
  value?: Date
  /** Change handler */
  onChange?: (date: Date | undefined) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date
  /** Date format (default: "PPP") */
  dateFormat?: string
  /** Additional className */
  className?: string
}

/**
 * Enhanced DatePicker - shadcn/ui Calendar with MotoMind patterns
 * 
 * Features:
 * - Built on battle-tested shadcn/ui Calendar
 * - Validation states (error, success, warning)
 * - Helper text and description
 * - Min/max date constraints
 * - Custom date formatting
 * - Required indicator
 * 
 * @example
 * <DatePicker
 *   label="Maintenance Date"
 *   value={date}
 *   onChange={setDate}
 *   minDate={new Date()}
 *   placeholder="Select a date"
 * />
 */
export function DatePicker({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  required,
  minDate,
  maxDate,
  dateFormat = "PPP",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const datePickerId = id || React.useId()
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

  const buttonClasses = {
    default: '',
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
            <Label htmlFor={datePickerId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Date Picker Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={datePickerId}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              isMobile ? 'h-12 px-4 text-base' : 'h-10 px-3',
              !value && 'text-muted-foreground',
              buttonClasses[validationState]
            )}
            style={isMobile ? { fontSize: '16px' } : undefined}
            aria-invalid={!!error}
            aria-describedby={
              validationMessage ? `${datePickerId}-message` : 
              helperText ? `${datePickerId}-helper` : 
              undefined
            }
          >
            <CalendarIcon className={cn(
              'mr-2 flex-shrink-0',
              isMobile ? 'h-5 w-5' : 'h-4 w-4'
            )} />
            {value ? (
              <span className="truncate">{format(value, dateFormat)}</span>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            disabled={(date) => {
              if (disabled) return true
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${datePickerId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${datePickerId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}

// ============================================================================
// ENHANCED DATE RANGE PICKER - shadcn/ui Calendar + MotoMind patterns
// ============================================================================

export interface DateRangePickerProps {
  /** Date Range Picker ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below date picker */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Selected date range */
  value?: { from?: Date; to?: Date }
  /** Change handler */
  onChange?: (range: { from?: Date; to?: Date } | undefined) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date
  /** Date format (default: "PPP") */
  dateFormat?: string
  /** Additional className */
  className?: string
}

/**
 * Enhanced DateRangePicker - Select a date range
 * 
 * @example
 * <DateRangePicker
 *   label="Service Period"
 *   value={dateRange}
 *   onChange={setDateRange}
 *   placeholder="Select date range"
 * />
 */
export function DateRangePicker({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled,
  required,
  minDate,
  maxDate,
  dateFormat = "PPP",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const datePickerId = id || React.useId()
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

  const buttonClasses = {
    default: '',
    error: 'border-red-500',
    success: 'border-green-500',
    warning: 'border-amber-500'
  }

  const formatDateRange = React.useMemo(() => {
    if (!value?.from) return placeholder
    if (!value.to) return format(value.from, dateFormat)
    return `${format(value.from, dateFormat)} - ${format(value.to, dateFormat)}`
  }, [value, placeholder, dateFormat])

  return (
    <Stack spacing="sm" className={className}>
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label htmlFor={datePickerId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Date Range Picker Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={datePickerId}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              isMobile ? 'h-12 px-4 text-base' : 'h-10 px-3',
              !value?.from && 'text-muted-foreground',
              buttonClasses[validationState]
            )}
            style={isMobile ? { fontSize: '16px' } : undefined}
            aria-invalid={!!error}
            aria-describedby={
              validationMessage ? `${datePickerId}-message` : 
              helperText ? `${datePickerId}-helper` : 
              undefined
            }
          >
            <CalendarIcon className={cn(
              'mr-2 flex-shrink-0',
              isMobile ? 'h-5 w-5' : 'h-4 w-4'
            )} />
            <span className="truncate">{formatDateRange}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          side="bottom"
          sideOffset={4}
        >
          {value?.from && value?.to && (
            <div className="p-3 border-b border-border bg-green-50">
              <p className="text-xs font-medium text-green-700">
                {Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days selected
              </p>
            </div>
          )}
          <Calendar
            mode="range"
            selected={value}
            onSelect={(range) => {
              onChange?.(range)
              // Close when both dates are selected
              if (range?.from && range?.to) {
                setTimeout(() => setOpen(false), 300)
              }
            }}
            disabled={(date) => {
              if (disabled) return true
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            numberOfMonths={isMobile ? 1 : 2}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${datePickerId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${datePickerId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
