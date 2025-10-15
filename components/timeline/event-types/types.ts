/**
 * Event Type System - REDESIGNED
 * 
 * New card structure with clear sections
 */

import { ReactNode } from 'react'
import { TimelineItem } from '@/types/timeline'

export interface HeroMetric {
  value: string
  subtext?: string
}

export interface DataItem {
  label: string
  value: string | number
  /** Optional: highlight this row */
  highlight?: boolean
}

export interface Badge {
  text: string
  variant: 'success' | 'warning' | 'danger' | 'info'
  icon?: ReactNode
}

export interface EventCardData {
  /** Hero metric (big centered value) - optional */
  hero?: HeroMetric
  
  /** Data items - flexible display with dividers */
  data: DataItem[]
  
  /** AI-generated summary from OpenAI Vision - optional */
  aiSummary?: {
    text: string
    confidence?: 'high' | 'medium' | 'low'
  }
  
  /** Status badges - only when noteworthy */
  badges?: Badge[]
  
  /** Warning/alert accent - changes left border color */
  accent?: 'warning' | 'danger'
  
  /** Use compact spacing for data rows (many items) */
  compact?: boolean
  
  // ELITE TIER: Progressive disclosure
  /** Collapsible sections for data-rich events */
  collapsible?: {
    summary: DataItem[]   // Always visible (2-4 key items)
    details: DataItem[]   // Expandable (additional items)
  }
  
  // ELITE TIER: Source image
  /** User-uploaded image that was analyzed */
  sourceImage?: {
    url: string
    thumbnail?: string
    alt: string
  }
  
  // ELITE TIER: Data quality
  /** Extraction quality indicators */
  quality?: {
    level: 'high' | 'medium' | 'low'
    details?: {
      fieldsExtracted: number
      fieldsMissing: number
      imageQuality: number
    }
  }
  
  // ELITE TIER: Warnings
  /** Inline warnings about missing/uncertain data */
  warnings?: Array<{
    type: 'missing' | 'estimated' | 'low-confidence'
    message: string
    action?: {
      label: string
      onClick: () => void
    }
  }>
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
