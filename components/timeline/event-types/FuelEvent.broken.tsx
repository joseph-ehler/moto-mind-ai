/**
 * Fuel Event Renderer - REDESIGNED
 * 
 * Matches the clean card design specification:
 * - Hero metric (cost)
 * - Clean 2-column data grid
 * - Badge only if exceptional
 */

import { TrendingUp } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const FuelEvent: EventTypeRenderer = {
  getTitle: () => 'Fuel Fill-Up',
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    // Just station name for subtitle
    return data.location || data.station_name || data.gas_station || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = getCost(item)
    const gallons = data.gallons || data.volume || 0
    const pricePerGal = cost && gallons ? cost / gallons : null
    const mpg = data.mpg_calculated || data.fuel_economy || data.miles_per_gallon
    
    const cardData: EventCardData = {
      data: []
    }
    
    // HERO METRIC - Cost (big, centered)
    if (cost > 0) {
      cardData.hero = {
        value: `$${cost.toFixed(2)}`,
        subtext: pricePerGal ? `${gallons.toFixed(1)} gal × $${pricePerGal.toFixed(2)}` : undefined
      }
    }
    
    // DATA GRID - 2 columns
    if (item.mileage && item.mileage > 0) {
      cardData.data.push({
        label: 'Odometer',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    if (mpg && mpg > 0) {
      cardData.data.push({
        label: 'Efficiency',
        value: `${mpg.toFixed(1)} MPG`
      })
    }
    
    // BADGE - Only if exceptional (MPG >= 30)
    if (mpg && mpg >= 30) {
      cardData.badges = [{
        text: 'Exceptional efficiency',
        variant: 'success',
        icon: <TrendingUp className="w-3.5 h-3.5 text-green-600" />
      }]
    }
    
    return cardData
  }
}
