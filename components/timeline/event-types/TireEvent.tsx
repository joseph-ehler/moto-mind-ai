/**
 * Tire Event Renderer - FLEXIBLE VERSION
 * 
 * Handles both tire tread and pressure checks:
 * - Hero: Tread depth or average pressure
 * - Data: Per-tire readings with dividers
 * - Badge: Safety warnings if needed
 */

import { AlertTriangle } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const TireEvent: EventTypeRenderer = {
  getTitle: (item) => {
    if (item.type === 'tire_pressure') {
      return 'Tire Pressure Check'
    }
    return 'Tire Tread Check'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    return data.location || data.service_provider || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const isTreadCheck = item.type === 'tire_tread'
    
    const cardData: EventCardData = { data: [] }
    
    // HERO - Average tread depth or pressure
    if (isTreadCheck && data.average_tread_depth) {
      cardData.hero = {
        value: `${data.average_tread_depth}/32"`,
        subtext: 'Average tread depth'
      }
    } else if (!isTreadCheck && data.average_pressure) {
      cardData.hero = {
        value: `${data.average_pressure} PSI`,
        subtext: 'Average pressure'
      }
    }
    
    // DATA - Per-tire readings
    if (item.mileage) {
      cardData.data.push({
        label: 'Odometer',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    // Individual tire readings
    const tires = ['front_left', 'front_right', 'rear_left', 'rear_right']
    tires.forEach(tire => {
      const value = isTreadCheck 
        ? data[`${tire}_tread`] 
        : data[`${tire}_pressure`]
      
      if (value) {
        const label = tire.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        const unit = isTreadCheck ? '/32"' : ' PSI'
        const isLow = isTreadCheck ? value < 4 : value < 30
        
        cardData.data.push({
          label,
          value: `${value}${unit}`,
          highlight: isLow
        })
      }
    })
    
    // Overall condition
    if (data.overall_condition) {
      cardData.data.push({
        label: 'Overall',
        value: data.overall_condition
      })
    }
    
    // AI SUMMARY
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    }
    
    // BADGE - Safety warning
    const hasLowTread = data.min_tread_depth && data.min_tread_depth < 4
    const hasLowPressure = data.min_pressure && data.min_pressure < 30
    
    if (hasLowTread) {
      cardData.badges = [{
        text: 'Replace soon - low tread',
        variant: 'warning',
        icon: <AlertTriangle className="w-4 h-4 text-orange-600" />
      }]
    } else if (hasLowPressure) {
      cardData.badges = [{
        text: 'Inflate tires',
        variant: 'warning',
        icon: <AlertTriangle className="w-4 h-4 text-orange-600" />
      }]
    }
    
    return cardData
  }
}
