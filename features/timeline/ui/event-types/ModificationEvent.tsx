/**
 * Modification Event Renderer - FLEXIBLE VERSION
 * 
 * Tracks vehicle modifications, upgrades, and customization:
 * - Hero: Cost of modification
 * - Data: Part details, installer, warranty
 * - AI Summary: Before/after comparisons
 * - Badge: Modification type
 */

import { Wrench } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const ModificationEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const modType = data.modification_type || 'modification'
    
    // Format nicely: performance -> Performance, audio -> Audio, etc.
    return modType.charAt(0).toUpperCase() + modType.slice(1) + ' Mod'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    return data.part_name || data.description || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = data.cost || getCost(item)
    
    const cardData: EventCardData = {
      data: []
    }
    
    // HERO - Cost
    if (cost && cost > 0) {
      cardData.hero = {
        value: `$${cost.toFixed(2)}`,
        subtext: data.part_name || 'Modification cost'
      }
    }
    
    // DATA - Flexible display
    if (data.part_name) {
      cardData.data.push({
        label: 'Part',
        value: data.part_name
      })
    }
    
    if (data.brand) {
      cardData.data.push({
        label: 'Brand',
        value: data.brand
      })
    }
    
    if (item.mileage && item.mileage > 0) {
      cardData.data.push({
        label: 'Installed at',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    if (data.installer) {
      cardData.data.push({
        label: 'Installer',
        value: data.installer
      })
    }
    
    if (data.warranty) {
      cardData.data.push({
        label: 'Warranty',
        value: data.warranty
      })
    }
    
    if (data.description) {
      cardData.data.push({
        label: 'Description',
        value: data.description
      })
    }
    
    // AI SUMMARY
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    }
    
    // BADGE - Modification type
    const badgeLabels: Record<string, string> = {
      performance: 'Performance',
      cosmetic: 'Cosmetic',
      comfort: 'Comfort',
      audio: 'Audio',
      safety: 'Safety'
    }
    
    if (data.modification_type && data.modification_type !== 'other') {
      cardData.badges = [{
        text: badgeLabels[data.modification_type] || data.modification_type,
        variant: 'info',
        icon: <Wrench className="w-4 h-4 text-blue-600" />
      }]
    }
    
    return cardData
  }
}
