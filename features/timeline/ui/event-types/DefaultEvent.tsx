/**
 * Default Event Renderer - FLEXIBLE VERSION
 * 
 * Fallback for event types without specific renderers.
 * Intelligently displays whatever data was extracted.
 * 
 * Handles: Dashboard Snapshot, Parking, Document, Inspection, etc.
 */

import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const DefaultEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    
    // Try to get a reasonable title
    if (data.title) return data.title
    
    // Format type name nicely
    const type = item.type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
    
    return type
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    
    // Common subtitle fields
    if (data.status) return data.status
    if (data.location) return data.location
    if (data.description && data.description.length < 50) return data.description
    
    return null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = getCost(item)
    
    const cardData: EventCardData = {
      data: []
    }
    
    // Hero - Cost if available
    if (cost > 0) {
      cardData.hero = {
        value: `$${cost.toFixed(2)}`
      }
    }
    
    // Data - Mileage if available
    if (item.mileage && item.mileage > 0) {
      cardData.data.push({
        label: 'Mileage',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    // Intelligently extract and display meaningful data
    const excludeKeys = ['title', 'description', 'location', 'cost', 'total_cost', 'ai_summary', 'ai_confidence']
    const dataKeys = Object.keys(data).filter(k => !excludeKeys.includes(k))
    
    // Add up to 10 fields (flexible for data-rich scenarios)
    dataKeys.slice(0, 10).forEach(key => {
      const value = data[key]
      if (value && typeof value !== 'object') {
        cardData.data.push({
          label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value: String(value)
        })
      }
    })
    
    // Use compact mode if many fields
    if (cardData.data.length > 5) {
      cardData.compact = true
    }
    
    // AI SUMMARY - Always show if available
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'medium'
      }
    }
    
    return cardData
  }
}
