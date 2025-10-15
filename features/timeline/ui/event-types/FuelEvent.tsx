/**
 * Fuel Event Renderer - FLEXIBLE VERSION
 * 
 * Handles both data-sparse and data-rich scenarios:
 * - Hero: Cost (optional if not extracted)
 * - Data: Flexible list with dividers
 * - AI Summary: Insights from OpenAI Vision
 * - Badge: Only if noteworthy
 */

import { TrendingUp } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const FuelEvent: EventTypeRenderer = {
  getTitle: () => 'Fuel Fill-Up',
  
  getSubtitle: (item) => {
    // Use display_vendor first (new field from database), then fall back to payload
    const displayVendor = (item as any).display_vendor
    if (displayVendor) {
      return displayVendor
    }
    const data = getExtractedData(item)
    return data.location || data.station_name || data.gas_station || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = getCost(item)
    const gallons = data.gallons || data.volume || 0
    const pricePerGal = cost && gallons ? cost / gallons : null
    const mpg = data.mpg_calculated || data.fuel_economy || data.miles_per_gallon
    const fuelType = data.fuel_type || data.gas_type || data.grade
    
    const cardData: EventCardData = {
      data: []
    }
    
    // HERO - Cost (only if extracted)
    if (cost > 0) {
      cardData.hero = {
        value: `$${cost.toFixed(2)}`,
        subtext: pricePerGal && gallons 
          ? `${gallons.toFixed(1)} gal × $${pricePerGal.toFixed(2)}/gal` 
          : gallons ? `${gallons.toFixed(1)} gal` : undefined
      }
    }
    
    // DATA - Flexible list (scales from sparse to rich)
    if (item.mileage && item.mileage > 0) {
      cardData.data.push({
        label: 'Odometer',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    if (mpg && mpg > 0) {
      cardData.data.push({
        label: 'Efficiency',
        value: `${mpg.toFixed(1)} MPG`,
        highlight: mpg >= 30 // Highlight exceptional efficiency
      })
    }
    
    if (fuelType) {
      cardData.data.push({
        label: 'Fuel type',
        value: fuelType
      })
    }

    // Pump number
    if (data.pump_number) {
      cardData.data.push({
        label: 'Pump',
        value: `#${data.pump_number}`
      })
    }

    // Transaction number
    if (data.transaction_number || data.tran_number) {
      cardData.data.push({
        label: 'Tran #',
        value: data.transaction_number || data.tran_number
      })
    }

    // Tax amount
    if (data.tax_amount && data.tax_amount > 0) {
      cardData.data.push({
        label: 'Tax',
        value: `$${data.tax_amount.toFixed(2)}`
      })
    }
    
    // Payment method
    if (data.payment_method) {
      cardData.data.push({
        label: 'Payment',
        value: data.payment_method
      })
    }

    // Time (if different from date)
    if (data.time) {
      cardData.data.push({
        label: 'Time',
        value: data.time
      })
    }
    
    // Receipt/transaction ID
    if (data.receipt_number || data.transaction_id) {
      cardData.data.push({
        label: 'Receipt #',
        value: data.receipt_number || data.transaction_id
      })
    }
    
    // AI SUMMARY - Use display_summary first, then fall back to ai_summary
    const displaySummary = (item as any).display_summary
    if (displaySummary) {
      cardData.aiSummary = {
        text: displaySummary,
        confidence: 'high'
      }
    } else if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    } else if (!cost && !gallons) {
      // Example: Low data quality scenario
      cardData.aiSummary = {
        text: 'Receipt partially visible. Could not extract volume or pricing details.',
        confidence: 'medium'
      }
    }
    
    // BADGE - Only if exceptional (>= 30 MPG)
    if (mpg && mpg >= 30) {
      cardData.badges = [{
        text: 'Exceptional efficiency',
        variant: 'success',
        icon: <TrendingUp className="w-4 h-4 text-green-600" />
      }]
    }
    
    return cardData
  }
}
