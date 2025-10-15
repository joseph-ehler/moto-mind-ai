/**
 * Event Type Renderer Types
 * 
 * Defines the interface for event renderers and helper utilities
 */

import { TimelineItem } from '@/types/timeline'

export interface EventCardData {
  hero?: {
    value: string
    subtext?: string
  }
  data: Array<{
    label: string
    value: string
  }>
  summary?: string
  aiSummary?: {
    text: string
    confidence?: number
  }
  badges?: Array<{
    text: string
    variant: 'success' | 'warning' | 'danger' | 'info'
    icon?: any
  }>
  warnings?: string[] | Array<{
    type: string
    message: string
    action?: string
  }>
  sourceImage?: {
    url: string
    thumbnail?: string
    alt?: string
  }
  collapsible?: {
    summary: string
    details: any
  }
  compact?: boolean
  accent?: string
}

export interface EventTypeRenderer {
  /**
   * Get the display title for this event
   */
  getTitle: (item: TimelineItem) => string
  
  /**
   * Get subtitle/metadata text
   */
  getSubtitle: (item: TimelineItem) => string | null
  
  /**
   * Get card data sections
   */
  getCardData: (item: TimelineItem) => EventCardData
}

/**
 * Helper to safely extract data from item
 */
export function getExtractedData(item: TimelineItem): any {
  return item.extracted_data || {}
}

/**
 * Helper to get cost from item
 */
export function getCost(item: TimelineItem): number {
  const data = getExtractedData(item)
  return data.cost || data.total_cost || 0
}

/**
 * Get the appropriate renderer for a timeline item
 */
export function getEventRenderer(type: string): EventTypeRenderer {
  // Import renderers dynamically
  const renderers: Record<string, EventTypeRenderer> = {}
  
  // Return a default renderer
  return {
    getTitle: () => type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
    getSubtitle: () => null,
    getCardData: () => ({ data: [] })
  }
}
