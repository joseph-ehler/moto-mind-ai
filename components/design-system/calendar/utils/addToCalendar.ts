/**
 * Add to Calendar Utilities
 * 
 * Generate calendar links and .ics files for Google Calendar, Apple Calendar, Outlook, etc.
 */

import { MaintenanceEvent } from '../types'

/**
 * Format date for calendar links (YYYYMMDDTHHmmssZ)
 */
function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: MaintenanceEvent): string {
  const startDate = formatDateForCalendar(event.startDate)
  const endDate = event.endDate 
    ? formatDateForCalendar(event.endDate)
    : formatDateForCalendar(new Date(event.startDate.getTime() + 60 * 60 * 1000)) // +1 hour
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || event.notes || '',
    location: event.location || event.serviceProvider || '',
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Apple Calendar (iCal) URL
 * Uses webcal protocol
 */
export function generateAppleCalendarUrl(event: MaintenanceEvent): string {
  // Apple Calendar uses .ics files, so we'll generate an ics and provide download
  const icsContent = generateICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  return URL.createObjectURL(blob)
}

/**
 * Generate Outlook Calendar URL
 */
export function generateOutlookUrl(event: MaintenanceEvent): string {
  const startDate = formatDateForCalendar(event.startDate)
  const endDate = event.endDate 
    ? formatDateForCalendar(event.endDate)
    : formatDateForCalendar(new Date(event.startDate.getTime() + 60 * 60 * 1000))
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description || event.notes || '',
    startdt: startDate,
    enddt: endDate,
    location: event.location || event.serviceProvider || '',
  })
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate .ics file content (universal calendar format)
 */
export function generateICS(event: MaintenanceEvent): string {
  const startDate = formatDateForCalendar(event.startDate)
  const endDate = event.endDate 
    ? formatDateForCalendar(event.endDate)
    : formatDateForCalendar(new Date(event.startDate.getTime() + 60 * 60 * 1000))
  
  const now = formatDateForCalendar(new Date())
  
  // Build description with maintenance details
  let description = event.description || event.notes || ''
  if (event.vehicleName) {
    description += `\\n\\nVehicle: ${event.vehicleName}`
  }
  if (event.mileage) {
    description += `\\nMileage: ${event.mileage.toLocaleString()} miles`
  }
  if (event.estimatedCost) {
    description += `\\nEstimated Cost: $${event.estimatedCost.toFixed(2)}`
  }
  
  // Build RRULE if recurring
  let rrule = ''
  if (event.isRecurring && event.recurrence) {
    const freq = event.recurrence.frequency.toUpperCase()
    const interval = event.recurrence.interval
    rrule = `RRULE:FREQ=${freq};INTERVAL=${interval}`
    if (event.recurrence.endDate) {
      rrule += `;UNTIL=${formatDateForCalendar(event.recurrence.endDate)}`
    }
    rrule += '\n'
  }
  
  // Build alarm/reminder if enabled
  let alarm = ''
  if (event.reminderEnabled && event.reminderDays) {
    const minutes = event.reminderDays * 24 * 60
    alarm = `BEGIN:VALARM
TRIGGER:-PT${minutes}M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${event.title}
END:VALARM
`
  }
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MotoMind//Maintenance Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}@motomind.app
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${description}
LOCATION:${event.location || event.serviceProvider || ''}
STATUS:${event.status.toUpperCase()}
${rrule}${alarm}END:VEVENT
END:VCALENDAR`
  
  return icsContent
}

/**
 * Download .ics file
 */
export function downloadICS(event: MaintenanceEvent, filename?: string): void {
  const icsContent = generateICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${event.title.replace(/\s+/g, '-')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Open calendar link in new window
 */
export function openCalendarLink(event: MaintenanceEvent, format: 'google' | 'outlook'): void {
  let url: string
  
  switch (format) {
    case 'google':
      url = generateGoogleCalendarUrl(event)
      break
    case 'outlook':
      url = generateOutlookUrl(event)
      break
    default:
      throw new Error(`Unsupported calendar format: ${format}`)
  }
  
  window.open(url, '_blank', 'noopener,noreferrer')
}
