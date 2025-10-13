/**
 * Dashboard Warning Event Renderer - REDESIGNED
 * 
 * Special card with:
 * - Orange left border
 * - Warning list
 * - Call-to-action button
 */

import { AlertCircle } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const WarningEvent: EventTypeRenderer = {
  getTitle: () => 'Dashboard Warning',
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    const warningCount = data.warning_count || data.warnings?.length || 1
    return `${warningCount} warning${warningCount > 1 ? 's' : ''} active`
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    
    // Get warning details
    const warnings = data.warnings || []
    const primaryWarning = warnings[0] || {
      system: data.system_affected || data.warning_text || 'Check Engine',
      description: data.description || data.warning_message || ''
    }
    
    const cardData: EventCardData = {
      data: [],
      accent: 'warning' // This adds the orange left border
    }
    
    // DATA - Warning info (displayed as list, not grid)
    if (primaryWarning.system) {
      cardData.data.push({
        label: 'System',
        value: primaryWarning.system
      })
    }
    
    if (primaryWarning.description) {
      cardData.data.push({
        label: 'Details',
        value: primaryWarning.description
      })
    }
    
    // Show other warnings if multiple
    if (warnings.length > 1) {
      const otherSystems = warnings.slice(1, 3).map((w: any) => w.system).filter(Boolean).join(', ')
      if (otherSystems) {
        cardData.data.push({
          label: 'Also affected',
          value: otherSystems
        })
      }
    }
    
    return cardData
  }
}
