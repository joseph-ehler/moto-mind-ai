/**
 * Service Event Renderer - FLEXIBLE VERSION
 * 
 * Handles both data-sparse and data-rich scenarios:
 * - Hero: Cost (optional if not extracted)
 * - Data: Flexible list with dividers
 * - AI Summary: Service recommendations from OpenAI Vision
 * - Badge: Warning if overdue
 */

import { AlertCircle } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const ServiceEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const serviceType = data.service_type || data.maintenance_type || data.work_performed
    
    if (serviceType) {
      return serviceType
        .split(/[_\-\s]+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    
    return 'Service'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    return data.service_provider || data.mechanic || data.shop_name || data.dealer || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = getCost(item)
    const nextServiceMiles = data.next_service_miles || data.next_service_mileage
    const currentMileage = item.mileage || 0
    const warranty = data.warranty_period || data.warranty_months
    const partsReplaced = data.parts_replaced || []
    
    const cardData: EventCardData = {
      data: []
    }
    
    // HERO - Cost (only if extracted)
    if (cost > 0) {
      const serviceDesc = data.service_type || data.work_performed || 'Service'
      const partsDesc = partsReplaced.length > 0 ? ` + ${partsReplaced[0]}` : ''
      
      cardData.hero = {
        value: `$${cost.toFixed(2)}`,
        subtext: `${serviceDesc}${partsDesc}`
      }
    }
    
    // DATA - Flexible list (scales from sparse to rich)
    if (currentMileage > 0) {
      cardData.data.push({
        label: 'Odometer',
        value: `${currentMileage.toLocaleString()} mi`
      })
    }
    
    if (nextServiceMiles && currentMileage) {
      const milesUntilService = nextServiceMiles - currentMileage
      const isOverdue = milesUntilService < 0
      cardData.data.push({
        label: 'Next service due',
        value: isOverdue 
          ? `Overdue by ${Math.abs(milesUntilService).toLocaleString()} mi`
          : `In ${milesUntilService.toLocaleString()} mi`,
        highlight: isOverdue
      })
    }
    
    if (warranty) {
      cardData.data.push({
        label: 'Warranty',
        value: `${warranty} months`
      })
    }
    
    if (partsReplaced.length > 1) {
      cardData.data.push({
        label: 'Parts replaced',
        value: partsReplaced.join(', ')
      })
    }
    
    if (data.labor_hours) {
      cardData.data.push({
        label: 'Labor',
        value: `${data.labor_hours} hours`
      })
    }
    
    // AI SUMMARY - Placeholder for OpenAI Vision insights
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    }
    
    // BADGE - Warning if overdue
    const isOverdue = data.overdue || (nextServiceMiles && currentMileage > nextServiceMiles)
    if (isOverdue) {
      cardData.badges = [{
        text: data.overdue_item || 'Service overdue',
        variant: 'warning',
        icon: <AlertCircle className="w-4 h-4 text-orange-600" />
      }]
    }
    
    return cardData
  }
}
