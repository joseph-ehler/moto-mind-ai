/**
 * Timeline Data Hook
 * 
 * Handles data transformations and grouping logic
 */

import { useMemo } from 'react'
import { TimelineItem } from '@/types/timeline'
import { groupItemsByDate } from '@/lib/utils/date-grouping'

// Helper to group items by month
export function groupItemsByMonth(items: TimelineItem[]) {
  const grouped: Record<string, TimelineItem[]> = {}
  items.forEach(item => {
    const date = new Date(item.timestamp || new Date())
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!grouped[monthKey]) {
      grouped[monthKey] = []
    }
    grouped[monthKey].push(item)
  })
  return grouped
}

export function useTimelineData(items: TimelineItem[]) {
  // Group items by month
  const monthGroups = useMemo(() => groupItemsByMonth(items), [items])

  // Calculate current mileage from most recent event
  const currentMileage = useMemo(() => {
    const eventsWithMileage = items
      .filter(e => e.mileage && e.mileage > 0)
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    return eventsWithMileage[0]?.mileage
  }, [items])

  // Calculate stats for each month
  const monthStats = useMemo(() => {
    const stats: Record<string, {
      eventCount: number
      totalCost: number
      dailySpending: number[]
      typeBreakdown: Record<string, number>
    }> = {}

    Object.entries(monthGroups).forEach(([monthKey, monthItems]) => {
      const eventCount = monthItems.length
      const totalCost = monthItems.reduce((sum, item) => {
        const cost = (item.extracted_data as any)?.cost || 0
        return sum + cost
      }, 0)

      // Calculate daily spending for sparkline (last 7 days of data)
      const dailySpending = Array.from({ length: 7 }, (_, i) => {
        const dayItems = monthItems.filter(item => {
          const itemDate = new Date(item.timestamp || new Date())
          const dayOfMonth = itemDate.getDate()
          return dayOfMonth >= (28 - 7 + i) && dayOfMonth < (28 - 7 + i + 1)
        })
        return dayItems.reduce((sum, item) => sum + ((item.extracted_data as any)?.cost || 0), 0)
      })

      // Type breakdown
      const typeBreakdown: Record<string, number> = {}
      monthItems.forEach(item => {
        typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1
      })

      stats[monthKey] = {
        eventCount,
        totalCost,
        dailySpending,
        typeBreakdown
      }
    })

    return stats
  }, [monthGroups])

  return {
    monthGroups,
    monthStats,
    currentMileage,
    groupItemsByDate
  }
}
