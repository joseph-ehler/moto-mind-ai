/**
 * Timeline State Hook
 * 
 * Manages timeline UI state (selection, expansion, modals, etc.)
 */

import { useState } from 'react'
import { TimelineItem } from '@/types/timeline'

export function useTimelineState() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [editingEvent, setEditingEvent] = useState<TimelineItem | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<TimelineItem | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = (items: TimelineItem[]) => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(item => item.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  const toggleMonthExpanded = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey)
      } else {
        newSet.add(monthKey)
      }
      return newSet
    })
  }

  return {
    // Selection
    selectedIds,
    selectionMode,
    setSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,

    // Expansion
    expandedMonths,
    toggleMonthExpanded,

    // Modals
    editingEvent,
    setEditingEvent,
    deletingEvent,
    setDeletingEvent,
    bulkDeleting,
    setBulkDeleting
  }
}
