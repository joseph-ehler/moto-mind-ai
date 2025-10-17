/**
 * Car Wash Event Renderer - FLEXIBLE VERSION
 * 
 * Tracks cleaning, detailing, and maintenance:
 * - Hero: Service cost
 * - Data: Service type, provider, services included
 * - AI Summary: Before/after condition
 */

import { Sparkles } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const CarWashEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const serviceType = data.service_type || 'car_wash'
    
    const labels: Record<string, string> = {
      basic: 'Basic Wash',
      premium: 'Premium Wash',
      detail: 'Detail Service',
      self_wash: 'Self Wash'
    }
    
    return labels[serviceType] || 'Car Wash'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    return data.provider || null
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
        subtext: data.service_type ? `${data.service_type} wash` : 'Car wash'
      }
    }
    
    // DATA - Flexible display
    if (data.provider) {
      cardData.data.push({
        label: 'Provider',
        value: data.provider
      })
    }
    
    if (item.mileage && item.mileage > 0) {
      cardData.data.push({
        label: 'Odometer',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    if (data.services_included && data.services_included.length > 0) {
      cardData.data.push({
        label: 'Services',
        value: data.services_included.join(', ')
      })
    }
    
    if (data.next_wash_date) {
      const nextDate = new Date(data.next_wash_date)
      cardData.data.push({
        label: 'Next wash',
        value: nextDate.toLocaleDateString()
      })
    }
    
    // AI SUMMARY
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    }
    
    // BADGE - Detail service
    if (data.service_type === 'detail') {
      cardData.badges = [{
        text: 'Full Detail',
        variant: 'success',
        icon: <Sparkles className="w-4 h-4 text-green-600" />
      }]
    }
    
    return cardData
  }
}
