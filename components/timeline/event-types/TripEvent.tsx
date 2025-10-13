/**
 * Trip Event Renderer - FLEXIBLE VERSION
 * 
 * Tracks road trips, business trips, and commutes:
 * - Hero: Distance traveled
 * - Data: Destination, purpose, mileage range
 * - Badge: Trip type (business/personal)
 */

import { MapPin, Briefcase } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const TripEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const tripType = data.trip_type || 'trip'
    
    const labels: Record<string, string> = {
      business: 'Business Trip',
      personal: 'Road Trip',
      commute: 'Commute'
    }
    
    return labels[tripType] || 'Trip'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    return data.destination || data.purpose || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    
    const cardData: EventCardData = {
      data: []
    }
    
    // HERO - Distance
    const distance = data.distance_miles || 
      (data.end_mileage && data.start_mileage ? data.end_mileage - data.start_mileage : null)
    
    if (distance && distance > 0) {
      cardData.hero = {
        value: `${distance.toLocaleString()} mi`,
        subtext: 'Total distance'
      }
    }
    
    // DATA - Flexible display
    if (data.destination) {
      cardData.data.push({
        label: 'Destination',
        value: data.destination
      })
    }
    
    if (data.purpose) {
      cardData.data.push({
        label: 'Purpose',
        value: data.purpose
      })
    }
    
    if (data.start_mileage) {
      cardData.data.push({
        label: 'Start',
        value: `${data.start_mileage.toLocaleString()} mi`
      })
    }
    
    if (data.end_mileage) {
      cardData.data.push({
        label: 'End',
        value: `${data.end_mileage.toLocaleString()} mi`
      })
    }
    
    if (data.passengers) {
      cardData.data.push({
        label: 'Passengers',
        value: `${data.passengers} ${data.passengers === 1 ? 'person' : 'people'}`
      })
    }
    
    if (data.route) {
      cardData.data.push({
        label: 'Route',
        value: data.route
      })
    }
    
    // AI SUMMARY
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    }
    
    // BADGE - Business trip (tax deductible)
    if (data.trip_type === 'business') {
      cardData.badges = [{
        text: 'Business Trip',
        variant: 'info',
        icon: <Briefcase className="w-4 h-4 text-blue-600" />
      }]
    }
    
    return cardData
  }
}
