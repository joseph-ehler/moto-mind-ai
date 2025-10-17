/**
 * Odometer Event Renderer - FLEXIBLE VERSION
 * 
 * Tracks mileage milestones and provides context:
 * - Hero: Current mileage
 * - Data: Trip meters, fuel range, average usage
 * - AI Summary: Mileage insights and service reminders
 * - Badge: Milestone achievements
 */

import { TrendingUp } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const OdometerEvent: EventTypeRenderer = {
  getTitle: () => 'Odometer Reading',
  
  getSubtitle: (item) => {
    if (item.mileage) {
      return `${item.mileage.toLocaleString()} miles`
    }
    return null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const mileage = item.mileage || 0
    
    const cardData: EventCardData = {
      data: []
    }
    
    // Hero - Current mileage
    if (mileage > 0) {
      cardData.hero = {
        value: mileage.toLocaleString(),
        subtext: 'miles'
      }
    }
    
    // DATA - Flexible display
    
    // Trip meters
    const tripA = data.trip_a || data.trip_distance
    const tripB = data.trip_b
    
    if (tripA) {
      cardData.data.push({
        label: 'Trip A',
        value: `${tripA.toLocaleString()} mi`
      })
    }
    
    if (tripB) {
      cardData.data.push({
        label: 'Trip B',
        value: `${tripB.toLocaleString()} mi`
      })
    }
    
    // Fuel range
    if (data.range_remaining || data.fuel_range) {
      cardData.data.push({
        label: 'Fuel range',
        value: `${(data.range_remaining || data.fuel_range).toLocaleString()} mi`
      })
    }
    
    // Average daily miles (if previous reading available)
    if (data.avg_daily_miles) {
      cardData.data.push({
        label: 'Avg daily',
        value: `${data.avg_daily_miles.toFixed(0)} mi/day`
      })
    }
    
    // Days since last reading
    if (data.days_since_last_reading) {
      cardData.data.push({
        label: 'Last reading',
        value: `${data.days_since_last_reading} days ago`
      })
    }
    
    // AI SUMMARY - Context and insights
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    }
    
    // BADGE - Milestone achievements
    const isMilestone = mileage % 10000 === 0 || (mileage % 5000 === 0 && mileage % 10000 !== 0)
    if (isMilestone && mileage > 0) {
      const milestoneText = mileage % 10000 === 0 
        ? `${(mileage / 1000).toFixed(0)}K milestone!`
        : `${(mileage / 1000).toFixed(0)}K miles`
      
      cardData.badges = [{
        text: milestoneText,
        variant: 'success',
        icon: <TrendingUp className="w-4 h-4 text-green-600" />
      }]
    }
    
    return cardData
  }
}
