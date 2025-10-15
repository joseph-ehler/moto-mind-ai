/**
 * Timeline Filters Hook
 * 
 * Manages filter and search logic for timeline
 */

import { useState, useMemo } from 'react'
import { TimelineItem, TimelineFilter } from '@/types/timeline'

export function useTimelineFilters(items: TimelineItem[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all')

  // Filter items based on active filter and search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filter by type
      let typeMatch = true
      if (activeFilter !== 'all') {
        if (activeFilter === 'warnings') typeMatch = item.type === 'dashboard_warning'
        else if (activeFilter === 'tires') typeMatch = item.type === 'tire_tread' || item.type === 'tire_pressure'
        else if (activeFilter === 'documents') typeMatch = item.type === 'document'
        else typeMatch = item.type === activeFilter
      }

      // Filter by search query
      let searchMatch = true
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const searchableText = [
          item.type,
          item.notes || '',
          JSON.stringify(item.extracted_data || {})
        ].join(' ').toLowerCase()
        
        searchMatch = searchableText.includes(query)
      }

      return typeMatch && searchMatch
    })
  }, [items, activeFilter, searchQuery])

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredItems
  }
}
