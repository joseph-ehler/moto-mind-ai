/**
 * Timeline Domain Utilities
 * 
 * Pure functions for timeline business logic.
 * No side effects, no API calls - just business rules.
 */

import type { TimelineItem, TimelineItemType, TimelineFilter } from './types'

/**
 * Sort timeline items by timestamp
 */
export function sortTimelineItems(
  items: TimelineItem[],
  order: 'newest' | 'oldest' = 'newest'
): TimelineItem[] {
  return [...items].sort((a, b) => {
    const timeA = a.timestamp.getTime()
    const timeB = b.timestamp.getTime()
    return order === 'newest' ? timeB - timeA : timeA - timeB
  })
}

/**
 * Filter timeline items by type
 */
export function filterTimelineByType(
  items: TimelineItem[],
  filter: TimelineFilter
): TimelineItem[] {
  if (filter === 'all') return items
  
  const filterMap: Record<TimelineFilter, TimelineItemType[]> = {
    all: [],
    odometer: ['odometer'],
    service: ['service', 'maintenance'],
    fuel: ['fuel'],
    warnings: ['dashboard_warning', 'dashboard_snapshot'],
    tires: ['tire_tread', 'tire_pressure'],
    damage: ['damage'],
    documents: ['document', 'inspection', 'recall'],
  }
  
  const types = filterMap[filter] || []
  return items.filter(item => types.includes(item.type))
}

/**
 * Filter timeline items by date range
 */
export function filterTimelineByDateRange(
  items: TimelineItem[],
  startDate?: Date,
  endDate?: Date
): TimelineItem[] {
  return items.filter(item => {
    const itemTime = item.timestamp.getTime()
    const start = startDate ? startDate.getTime() : -Infinity
    const end = endDate ? endDate.getTime() : Infinity
    return itemTime >= start && itemTime <= end
  })
}

/**
 * Group timeline items by date (day)
 */
export function groupTimelineByDate(items: TimelineItem[]): Record<string, TimelineItem[]> {
  return items.reduce((groups, item) => {
    const date = item.timestamp.toISOString().split('T')[0] // YYYY-MM-DD
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {} as Record<string, TimelineItem[]>)
}

/**
 * Group timeline items by month
 */
export function groupTimelineByMonth(items: TimelineItem[]): Record<string, TimelineItem[]> {
  return items.reduce((groups, item) => {
    const date = item.timestamp
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(item)
    return groups
  }, {} as Record<string, TimelineItem[]>)
}

/**
 * Count items by type
 */
export function countItemsByType(items: TimelineItem[]): Record<TimelineItemType, number> {
  return items.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] || 0) + 1
    return counts
  }, {} as Record<TimelineItemType, number>)
}

/**
 * Get date range of timeline items
 */
export function getTimelineDateRange(items: TimelineItem[]): {
  earliest: Date | null
  latest: Date | null
} {
  if (items.length === 0) {
    return { earliest: null, latest: null }
  }
  
  const sorted = sortTimelineItems(items, 'oldest')
  return {
    earliest: sorted[0].timestamp,
    latest: sorted[sorted.length - 1].timestamp,
  }
}

/**
 * Calculate total mileage change from odometer readings
 */
export function calculateTotalMileage(items: TimelineItem[]): number | null {
  const odometerItems = items.filter(
    item => item.type === 'odometer' && item.extracted_data
  )
  
  if (odometerItems.length < 2) return null
  
  const sorted = sortTimelineItems(odometerItems, 'oldest')
  const first = sorted[0].extracted_data?.reading
  const last = sorted[sorted.length - 1].extracted_data?.reading
  
  if (typeof first === 'number' && typeof last === 'number') {
    return last - first
  }
  
  return null
}

/**
 * Find timeline item by ID
 */
export function findTimelineItem(
  items: TimelineItem[],
  id: string
): TimelineItem | undefined {
  return items.find(item => item.id === id)
}

/**
 * Get related timeline items (same day, nearby times)
 */
export function getRelatedTimelineItems(
  items: TimelineItem[],
  targetItem: TimelineItem,
  windowHours: number = 24
): TimelineItem[] {
  const targetTime = targetItem.timestamp.getTime()
  const windowMs = windowHours * 60 * 60 * 1000
  
  return items.filter(item => {
    if (item.id === targetItem.id) return false
    const itemTime = item.timestamp.getTime()
    return Math.abs(itemTime - targetTime) <= windowMs
  })
}

/**
 * Check if timeline item has photo
 */
export function hasPhoto(item: TimelineItem): boolean {
  return !!(item.photo_url || item.thumbnail_url)
}

/**
 * Check if timeline item has location
 */
export function hasLocation(item: TimelineItem): boolean {
  return !!item.location
}

/**
 * Get display label for timeline item type
 */
export function getTimelineTypeLabel(type: TimelineItemType): string {
  const labels: Record<TimelineItemType, string> = {
    odometer: 'Odometer Reading',
    service: 'Service',
    maintenance: 'Maintenance',
    fuel: 'Fuel Fill-Up',
    dashboard_warning: 'Dashboard Warning',
    dashboard_snapshot: 'Dashboard Snapshot',
    tire_tread: 'Tire Tread',
    tire_pressure: 'Tire Pressure',
    damage: 'Damage Report',
    parking: 'Parking',
    document: 'Document',
    inspection: 'Inspection',
    recall: 'Recall Notice',
    manual: 'Manual Entry',
    modification: 'Modification',
    car_wash: 'Car Wash',
    trip: 'Trip',
    expense: 'Expense',
  }
  
  return labels[type] || type
}
