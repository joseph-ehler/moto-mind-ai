/**
 * Service Event Renderer - REDESIGNED
 * 
 * Clean service card with:
 * - Hero metric (cost)
 * - Next service due info
 * - Warning badge if overdue
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
    const provider = data.service_provider || data.mechanic || data.shop_name || data.dealer
    return provider || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = getCost(item)
    const nextServiceMiles = data.next_service_miles || data.next_service_mileage
    const currentMileage = item.mileage || 0
    
    const cardData: EventCardData = {
      data: []
    }
    
    // HERO METRIC - Cost
    if (cost > 0) {
      cardData.hero = {
        value: `$${cost.toFixed(2)}`,
        subtext: data.service_type || 'Service'
      }
    }
    
    // DATA - Next service due
    if (nextServiceMiles && currentMileage) {
      const milesUntilService = nextServiceMiles - currentMileage
      cardData.data.push({
        label: 'Next service due',
        value: `In ${milesUntilService.toLocaleString()} mi (at ${nextServiceMiles.toLocaleString()} mi)`
      })
    }
    
    // BADGE - Warning if something is overdue
    const isOverdue = data.overdue || (data.next_service_miles && currentMileage > data.next_service_miles)
    if (isOverdue) {
      cardData.badges = [{
        text: `${data.overdue_item || 'Service'} overdue`,
        variant: 'warning',
        icon: <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
      }]
    }
    
    return cardData
  }
}
