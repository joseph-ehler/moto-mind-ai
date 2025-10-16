/**
 * Event Domain Utilities
 * 
 * Pure functions for event business logic.
 * No side effects, no API calls - just business rules.
 */

import type { EventData, EventType, CompletionScoreBreakdown } from './types'

/**
 * Calculate event completion score (0-100)
 * Based on how much data is filled in for an event
 */
export function calculateCompletionScore(event: Partial<EventData>): CompletionScoreBreakdown {
  const breakdown = {
    receipt: !!event.payload?.receipt_image_url,
    amount: event.total_amount != null && event.total_amount > 0,
    gallons: event.gallons != null && event.gallons > 0,
    vendor: !!event.vendor,
    location: !!(event.geocoded_lat && event.geocoded_lng),
    date: !!event.date,
    miles: event.miles != null && event.miles > 0,
    notes: !!event.notes,
  }

  const weights = {
    receipt: 25,  // Having a receipt is valuable
    amount: 20,   // Cost is important
    gallons: 15,  // Gallons for fuel efficiency
    vendor: 10,   // Where it happened
    location: 10, // Geographic data
    date: 10,     // When it happened (should always be present)
    miles: 5,     // Odometer reading
    notes: 5,     // Additional context
  }

  const score = Object.entries(breakdown).reduce((total, [key, value]) => {
    return total + (value ? weights[key as keyof typeof weights] : 0)
  }, 0)

  return { score, breakdown }
}

/**
 * Sort events by date (newest first)
 */
export function sortEventsByDate(events: EventData[], direction: 'asc' | 'desc' = 'desc'): EventData[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return direction === 'desc' ? dateB - dateA : dateA - dateB
  })
}

/**
 * Filter events by type
 */
export function filterEventsByType(events: EventData[], types: EventType | EventType[]): EventData[] {
  const typeArray = Array.isArray(types) ? types : [types]
  return events.filter(event => typeArray.includes(event.type as EventType))
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(
  events: EventData[],
  startDate?: string,
  endDate?: string
): EventData[] {
  return events.filter(event => {
    const eventDate = new Date(event.date).getTime()
    const start = startDate ? new Date(startDate).getTime() : -Infinity
    const end = endDate ? new Date(endDate).getTime() : Infinity
    return eventDate >= start && eventDate <= end
  })
}

/**
 * Group events by month
 */
export function groupEventsByMonth(events: EventData[]): Record<string, EventData[]> {
  return events.reduce((groups, event) => {
    const date = new Date(event.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(event)
    
    return groups
  }, {} as Record<string, EventData[]>)
}

/**
 * Calculate total cost for events
 */
export function calculateTotalCost(events: EventData[]): number {
  return events.reduce((total, event) => total + (event.total_amount || 0), 0)
}

/**
 * Calculate average fuel efficiency (MPG) from fuel events
 */
export function calculateAverageMPG(fuelEvents: EventData[]): number | null {
  const validEvents = fuelEvents.filter(e => 
    e.type === 'fuel' && e.gallons && e.miles
  )
  
  if (validEvents.length === 0) return null
  
  const totalMiles = validEvents.reduce((sum, e) => sum + (e.miles || 0), 0)
  const totalGallons = validEvents.reduce((sum, e) => sum + (e.gallons || 0), 0)
  
  return totalGallons > 0 ? totalMiles / totalGallons : null
}

/**
 * Get event type display name
 */
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    fuel: 'Fuel Fill-Up',
    service: 'Service',
    dashboard_snapshot: 'Dashboard Snapshot',
    damage: 'Damage Report',
    expense: 'Expense',
    modification: 'Modification',
    odometer: 'Odometer Reading',
    tire: 'Tire Service',
    trip: 'Trip',
    warning: 'Warning Light',
    car_wash: 'Car Wash',
    default: 'Event',
  }
  
  return labels[type] || 'Event'
}

/**
 * Check if event has been edited
 */
export function hasBeenEdited(event: EventData): boolean {
  return !!(event.edited_at || (event.edit_changes && event.edit_changes.length > 0))
}

/**
 * Get most recent edit reason
 */
export function getLastEditReason(event: EventData): string | null {
  if (!event.edit_changes || event.edit_changes.length === 0) {
    return null
  }
  
  const sortedChanges = [...event.edit_changes].sort(
    (a, b) => new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime()
  )
  
  return sortedChanges[0]?.reason || null
}
