/**
 * Date Utility Functions
 * 
 * Helper functions for calendar date manipulation and formatting
 */

/**
 * Get the first day of the month
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get the last day of the month
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/**
 * Get all days in a month (for calendar grid)
 * Includes padding days from previous/next month
 */
export function getMonthDays(date: Date): Date[] {
  const firstDay = getFirstDayOfMonth(date)
  const lastDay = getLastDayOfMonth(date)
  
  // Start from Sunday of the week containing the first day
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  // End on Saturday of the week containing the last day
  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
  
  const days: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return compareDate < today
}

/**
 * Check if date is in current month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return (
    date.getFullYear() === currentMonth.getFullYear() &&
    date.getMonth() === currentMonth.getMonth()
  )
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'numeric' = 'short'): string {
  switch (format) {
    case 'long':
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    case 'numeric':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    case 'short':
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
  }
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Get month name
 */
export function getMonthName(date: Date, format: 'short' | 'long' = 'long'): string {
  return date.toLocaleDateString('en-US', {
    month: format
  })
}

/**
 * Get year
 */
export function getYear(date: Date): number {
  return date.getFullYear()
}

/**
 * Add months to date
 */
export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date)
  newDate.setMonth(newDate.getMonth() + months)
  return newDate
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

/**
 * Get days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get relative time description (e.g., "in 3 days", "2 days ago")
 */
export function getRelativeTime(date: Date): string {
  const today = new Date()
  const days = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 0 && days < 7) return `In ${days} days`
  if (days < 0 && days > -7) return `${Math.abs(days)} days ago`
  if (days > 0 && days < 30) return `In ${Math.floor(days / 7)} weeks`
  if (days < 0 && days > -30) return `${Math.floor(Math.abs(days) / 7)} weeks ago`
  
  return formatDate(date, 'short')
}

/**
 * Day names
 */
export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
