/**
 * Calendar Module Exports
 * 
 * Clean exports for the Calendar component and utilities
 */

// Main component
export { Calendar } from './Calendar'
export type { CalendarProps } from './Calendar'

// Sub-components (for advanced usage)
export { EventCard } from './components/EventCard'
export { AddToCalendarButton } from './components/AddToCalendarButton'
export { MonthView } from './components/MonthView'
export { AgendaView } from './components/AgendaView'
export { EventFormModal } from './components/EventFormModal'
export type { EventFormData } from './components/EventFormModal'
export { RecurrenceSelector } from './components/RecurrenceSelector'
export type { RecurrenceConfig } from './components/RecurrenceSelector'

// Types
export type {
  MaintenanceEvent,
  MaintenanceType,
  RecurrenceFrequency,
  CalendarViewProps,
  AddToCalendarOptions,
  MaintenanceTypeConfig
} from './types'

export { MAINTENANCE_TYPES } from './types'

// Utilities
export {
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  generateICS,
  downloadICS,
  openCalendarLink
} from './utils/addToCalendar'

export {
  getMonthDays,
  isSameDay,
  isToday,
  isPast,
  isCurrentMonth,
  formatDate,
  formatTime,
  getMonthName,
  getYear,
  addMonths,
  addDays,
  daysBetween,
  getRelativeTime
} from './utils/dateUtils'
