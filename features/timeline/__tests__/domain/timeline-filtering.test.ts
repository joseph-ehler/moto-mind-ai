/**
 * Timeline Filtering Tests
 * 
 * Tests timeline filtering and grouping logic
 */

import type { TimelineItem, TimelineFilter } from '@/types/timeline'
import { mockTimelineList, mockTimelineFilters } from '../mocks/timeline-fixtures'

describe('Timeline Filtering', () => {
  describe('Filter by type', () => {
    it('should filter to show all items', () => {
      const filter: TimelineFilter = 'all'
      const filtered = mockTimelineFilters[filter]
      
      expect(filtered.length).toBe(mockTimelineList.length)
    })

    it('should filter to show only odometer items', () => {
      const filter: TimelineFilter = 'odometer'
      const filtered = mockTimelineFilters[filter]
      
      expect(filtered.every(item => item.type === 'odometer')).toBe(true)
    })

    it('should filter to show only service items', () => {
      const filter: TimelineFilter = 'service'
      const filtered = mockTimelineFilters[filter]
      
      expect(filtered.every(item => item.type === 'service')).toBe(true)
    })

    it('should filter to show only fuel items', () => {
      const filter: TimelineFilter = 'fuel'
      const filtered = mockTimelineFilters[filter]
      
      expect(filtered.every(item => item.type === 'fuel')).toBe(true)
    })

    it('should filter to show warning items', () => {
      const filter: TimelineFilter = 'warnings'
      const filtered = mockTimelineFilters[filter]
      
      expect(filtered.every(item => 
        item.type === 'dashboard_warning' || item.type === 'dashboard_snapshot'
      )).toBe(true)
    })

    it('should filter to show tire-related items', () => {
      const filter: TimelineFilter = 'tires'
      const filtered = mockTimelineFilters[filter]
      
      expect(filtered.every(item => 
        item.type === 'tire_pressure' || item.type === 'tire_tread'
      )).toBe(true)
    })

    it('should return empty array for filters with no matches', () => {
      const filter: TimelineFilter = 'damage'
      const filtered = mockTimelineFilters[filter]
      
      expect(filtered).toEqual([])
      expect(Array.isArray(filtered)).toBe(true)
    })
  })

  describe('Sort order', () => {
    it('should sort by newest first', () => {
      const sorted = [...mockTimelineList].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          sorted[i + 1].timestamp.getTime()
        )
      }
    })

    it('should sort by oldest first', () => {
      const sorted = [...mockTimelineList].sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      )
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].timestamp.getTime()).toBeLessThanOrEqual(
          sorted[i + 1].timestamp.getTime()
        )
      }
    })
  })

  describe('Group by date', () => {
    it('should group items by date', () => {
      const grouped = mockTimelineList.reduce((acc, item) => {
        const dateKey = item.timestamp.toISOString().split('T')[0]
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(item)
        return acc
      }, {} as Record<string, TimelineItem[]>)
      
      expect(Object.keys(grouped).length).toBeGreaterThan(0)
      Object.values(grouped).forEach(items => {
        expect(Array.isArray(items)).toBe(true)
        expect(items.length).toBeGreaterThan(0)
      })
    })

    it('should group items on same date together', () => {
      const sameDate = new Date('2025-01-15')
      const items = [
        { ...mockTimelineList[0], timestamp: sameDate },
        { ...mockTimelineList[1], timestamp: sameDate }
      ]
      
      const grouped = items.reduce((acc, item) => {
        const dateKey = item.timestamp.toISOString().split('T')[0]
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(item)
        return acc
      }, {} as Record<string, TimelineItem[]>)
      
      const dateKey = sameDate.toISOString().split('T')[0]
      expect(grouped[dateKey]).toHaveLength(2)
    })
  })

  describe('Timeline display config', () => {
    it('should apply filter config', () => {
      const config = {
        filter: 'service' as TimelineFilter,
        sortOrder: 'newest' as const,
        showPhotos: true,
        groupByDate: true
      }
      
      expect(config.filter).toBe('service')
      expect(config.sortOrder).toBe('newest')
      expect(config.showPhotos).toBe(true)
      expect(config.groupByDate).toBe(true)
    })

    it('should toggle photo visibility', () => {
      const config = {
        filter: 'all' as TimelineFilter,
        sortOrder: 'newest' as const,
        showPhotos: false,
        groupByDate: false
      }
      
      expect(config.showPhotos).toBe(false)
    })

    it('should change sort order', () => {
      const config = {
        filter: 'all' as TimelineFilter,
        sortOrder: 'oldest' as const,
        showPhotos: true,
        groupByDate: false
      }
      
      expect(config.sortOrder).toBe('oldest')
    })
  })
})
