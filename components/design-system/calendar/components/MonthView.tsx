/**
 * MonthView Component
 * 
 * Display calendar month grid with maintenance events
 */

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../../primitives/Layout'
import { Button } from '@/components/ui/button'
import { MaintenanceEvent, MAINTENANCE_TYPES } from '../types'
import {
  getMonthDays,
  isToday,
  isPast,
  isCurrentMonth,
  isSameDay,
  getMonthName,
  getYear,
  addMonths,
  WEEKDAY_NAMES
} from '../utils/dateUtils'

interface MonthViewProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  events: MaintenanceEvent[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: MaintenanceEvent) => void
  className?: string
}

export function MonthView({
  currentDate,
  onDateChange,
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  className
}: MonthViewProps) {
  const monthDays = getMonthDays(currentDate)
  
  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, MaintenanceEvent[]>()
    
    events.forEach(event => {
      const dateKey = event.startDate.toDateString()
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, event])
    })
    
    return map
  }, [events])
  
  const handlePrevMonth = () => {
    onDateChange(addMonths(currentDate, -1))
  }
  
  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1))
  }
  
  const handleToday = () => {
    onDateChange(new Date())
  }
  
  return (
    <Stack spacing="md" className={className}>
      {/* Header: Month navigation */}
      <Flex align="center" justify="between" className="p-3 sm:p-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {getMonthName(currentDate)} {getYear(currentDate)}
          </h2>
        </div>
        
        <Flex gap="xs" className="sm:gap-sm">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Flex>
      </Flex>
      
      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-slate-50">
          {WEEKDAY_NAMES.map(day => (
            <div
              key={day}
              className="p-2 sm:p-3 text-center text-xs font-semibold text-slate-600"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>
        
        {/* Date cells */}
        <div className="grid grid-cols-7">
          {monthDays.map((date, index) => {
            const dateEvents = eventsByDate.get(date.toDateString()) || []
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isInCurrentMonth = isCurrentMonth(date, currentDate)
            const isDateToday = isToday(date)
            const isDatePast = isPast(date)
            
            return (
              <DayCell
                key={index}
                date={date}
                events={dateEvents}
                isToday={isDateToday}
                isPast={isDatePast}
                isCurrentMonth={isInCurrentMonth}
                isSelected={isSelected || false}
                onSelect={onDateSelect}
                onEventClick={onEventClick}
              />
            )
          })}
        </div>
      </div>
    </Stack>
  )
}

// Day Cell Component
interface DayCellProps {
  date: Date
  events: MaintenanceEvent[]
  isToday: boolean
  isPast: boolean
  isCurrentMonth: boolean
  isSelected: boolean
  onSelect?: (date: Date) => void
  onEventClick?: (event: MaintenanceEvent) => void
}

function DayCell({
  date,
  events,
  isToday,
  isPast,
  isCurrentMonth,
  isSelected,
  onSelect,
  onEventClick
}: DayCellProps) {
  const handleClick = () => {
    onSelect?.(date)
  }
  
  const hasEvents = events.length > 0
  const hasOverdue = events.some(e => e.status === 'overdue')
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative min-h-[80px] sm:min-h-[100px] p-2 sm:p-3 border-r border-b text-left transition-colors",
        "hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
        !isCurrentMonth && "bg-slate-50 text-slate-400",
        isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50",
        isPast && isCurrentMonth && "bg-slate-50/50"
      )}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span
          className={cn(
            "text-sm font-semibold",
            isToday && "bg-blue-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs",
            !isToday && isCurrentMonth && "text-slate-900",
            !isToday && !isCurrentMonth && "text-slate-400"
          )}
        >
          {date.getDate()}
        </span>
        
        {hasOverdue && (
          <span className="text-red-500 text-xs font-bold">!</span>
        )}
      </div>
      
      {/* Event indicators */}
      {hasEvents && (
        <div className="space-y-1">
          {events.slice(0, 3).map((event) => {
            const config = MAINTENANCE_TYPES[event.type]
            const IconComponent = config.icon
            return (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick?.(event)
                }}
                className="w-full text-left px-2 py-1 rounded bg-blue-500 text-white text-xs font-medium truncate hover:bg-blue-600 transition-colors cursor-pointer"
                title={event.title}
              >
                <div className="flex items-center gap-1.5">
                  <IconComponent className="w-3 h-3" />
                  <span className="truncate">{event.title}</span>
                </div>
              </div>
            )
          })}
          {events.length > 3 && (
            <div className="text-xs text-blue-600 font-medium px-1.5">
              +{events.length - 3} more
            </div>
          )}
        </div>
      )}
    </button>
  )
}
