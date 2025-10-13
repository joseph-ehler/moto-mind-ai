/**
 * Date Grouping Utilities for Timeline
 * 
 * Groups timeline events by relative date (Today, Yesterday, etc.)
 */

export function formatRelativeDate(date: Date | string): string {
  const eventDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const eventDay = new Date(eventDate)
  eventDay.setHours(0, 0, 0, 0)
  
  // Today
  if (eventDay.getTime() === today.getTime()) {
    return 'Today'
  }
  
  // Yesterday
  if (eventDay.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }
  
  // This week (last 7 days)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (eventDay >= weekAgo) {
    return eventDate.toLocaleDateString('en-US', { weekday: 'long' }) // "Monday", "Tuesday"
  }
  
  // This year
  if (eventDate.getFullYear() === today.getFullYear()) {
    return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) // "Oct 3"
  }
  
  // Other years
  return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) // "Oct 3, 2024"
}

export function groupItemsByDate<T extends { timestamp?: string | Date; date?: string | Date }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const dateValue = item.timestamp || item.date
    if (!dateValue) return groups
    
    const groupKey = formatRelativeDate(dateValue)
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
