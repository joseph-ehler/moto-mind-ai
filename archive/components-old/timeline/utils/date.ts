// Timeline Event Date Utilities
// Pure functions for date validation and resolution

import { TimelineEvent } from '../VehicleTimeline'

// Date validation helper
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

// Resolve event date with fallback logic
export function resolveEventDate(event: TimelineEvent): string {
  // Priority: document date > created_at
  const documentDate = event.payload?.date || event.payload?.extracted_data?.date
  const createdAt = event.created_at
  
  if (documentDate && isValidDate(documentDate)) {
    return documentDate
  }
  
  if (createdAt && isValidDate(createdAt)) {
    return createdAt
  }
  
  return new Date().toISOString() // Fallback to now
}

// Format date for display
export function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Unknown Date'
  }
}
