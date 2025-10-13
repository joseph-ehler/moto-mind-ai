/**
 * TimePicker - Smart time input
 */

'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

interface TimePickerProps {
  value: string // HH:mm format
  onChange: (time: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'HH:MM',
  disabled = false,
  className
}: TimePickerProps) {
  return (
    <Input
      type="time"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn('text-sm', className)}
    />
  )
}
