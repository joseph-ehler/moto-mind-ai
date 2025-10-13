'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// TIME PICKER - MotoMind patterns
// ============================================================================

export interface TimePickerProps {
  /** Time Picker ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below time picker */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Current time value in HH:MM format (24h) */
  value?: string
  /** Change handler */
  onChange?: (time: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Use 12-hour format (default: false = 24h) */
  use12Hour?: boolean
  /** Minute step interval (default: 15) */
  minuteStep?: number
  /** Additional className */
  className?: string
}

/**
 * Enhanced TimePicker - Time selection with MotoMind patterns
 * 
 * @example
 * <TimePicker
 *   label="Service Time"
 *   value={time}
 *   onChange={setTime}
 *   use12Hour
 *   minuteStep={30}
 * />
 */
export function TimePicker({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value,
  onChange,
  placeholder = "Select time",
  disabled,
  required,
  use12Hour = false,
  minuteStep = 15,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const timePickerId = id || React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Parse current time
  const parseTime = React.useCallback((timeStr: string | undefined) => {
    if (!timeStr) return { hour: 9, minute: 0, period: 'AM' }
    const [hourStr, minuteStr] = timeStr.split(':')
    let hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)
    
    if (use12Hour) {
      const period = hour >= 12 ? 'PM' : 'AM'
      hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return { hour, minute, period }
    }
    
    return { hour, minute, period: 'AM' }
  }, [use12Hour])

  const { hour: currentHour, minute: currentMinute, period: currentPeriod } = React.useMemo(
    () => parseTime(value),
    [value, parseTime]
  )

  // Generate options
  const hours = use12Hour ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep)

  const handleTimeChange = React.useCallback((hour: number, minute: number, period?: string) => {
    let finalHour = hour
    if (use12Hour && period) {
      if (period === 'PM' && hour !== 12) finalHour = hour + 12
      if (period === 'AM' && hour === 12) finalHour = 0
    }
    const timeStr = `${String(finalHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    onChange?.(timeStr)
    setOpen(false)
  }, [use12Hour, onChange])

  const formatDisplayTime = React.useCallback((timeStr: string | undefined) => {
    if (!timeStr) return placeholder
    const { hour, minute, period } = parseTime(timeStr)
    const hourStr = String(hour).padStart(2, '0')
    const minStr = String(minute).padStart(2, '0')
    return use12Hour ? `${hourStr}:${minStr} ${period}` : `${hourStr}:${minStr}`
  }, [use12Hour, placeholder, parseTime])

  // Validation state
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
            <Label htmlFor={timePickerId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Time Picker Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={timePickerId}
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
              validationMessage ? `${timePickerId}-message` : 
              helperText ? `${timePickerId}-helper` : 
              undefined
            }
          >
            <Clock className={cn(
              'mr-2 flex-shrink-0',
              isMobile ? 'h-5 w-5' : 'h-4 w-4'
            )} />
            <span className="truncate">{formatDisplayTime(value)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="p-3">
            <Flex gap="sm">
              {/* Hour Selector */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium text-center text-muted-foreground">Hour</div>
                <div className="h-48 overflow-y-auto border rounded-md">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleTimeChange(h, currentMinute, currentPeriod)}
                      className={cn(
                        'hover:bg-accent transition-colors',
                        isMobile ? 'w-14 py-3 text-base min-h-[48px]' : 'w-12 py-1.5 text-sm',
                        currentHour === h && 'bg-primary text-primary-foreground hover:bg-primary'
                      )}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minute Selector */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium text-center text-muted-foreground">Min</div>
                <div className="h-48 overflow-y-auto border rounded-md">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleTimeChange(currentHour, m, currentPeriod)}
                      className={cn(
                        'hover:bg-accent transition-colors',
                        isMobile ? 'w-14 py-3 text-base min-h-[48px]' : 'w-12 py-1.5 text-sm',
                        currentMinute === m && 'bg-primary text-primary-foreground hover:bg-primary'
                      )}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Selector (12h only) */}
              {use12Hour && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-center text-muted-foreground">Period</div>
                  <div className="flex flex-col gap-1 border rounded-md p-1">
                    {['AM', 'PM'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleTimeChange(currentHour, currentMinute, p)}
                        className={cn(
                          'rounded hover:bg-accent transition-colors',
                          isMobile ? 'w-14 py-3 text-base min-h-[48px]' : 'w-12 py-2 text-sm',
                          currentPeriod === p && 'bg-primary text-primary-foreground hover:bg-primary'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Flex>
          </div>
        </PopoverContent>
      </Popover>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${timePickerId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${timePickerId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
