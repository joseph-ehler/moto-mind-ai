/**
 * DatePicker - Smart date input with calendar UI
 */

'use client'

import { useState } from 'react'
import { format, parse } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'

interface DatePickerProps {
  value: string // YYYY-MM-DD format
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = 'Pick a date',
  disabled = false,
  className 
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  // Parse the string date to Date object
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format back to YYYY-MM-DD
      const formatted = format(date, 'yyyy-MM-dd')
      onChange(formatted)
      setOpen(false)
    } else {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(selectedDate!, 'PPP') : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
