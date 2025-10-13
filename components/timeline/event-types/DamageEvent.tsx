/**
 * Damage Event Renderer - FLEXIBLE VERSION
 * 
 * Handles both initial damage reports and repair tracking:
 * - Hero: Repair cost estimate
 * - Data: Severity, location, status with dividers
 * - Badge: Severity warnings
 */

import { AlertTriangle } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const DamageEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const damageType = data.damage_type || data.type_of_damage
    if (damageType) {
      return `${damageType} Damage`
    }
    return 'Damage Report'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    return data.damage_location || data.location_on_vehicle || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = getCost(item)
    const severity = data.severity || 'moderate'
    
    const cardData: EventCardData = { data: [] }
    
    // Set accent for severe damage
    if (severity === 'severe' || severity === 'critical') {
      cardData.accent = 'danger'
    }
    
    // HERO - Repair cost
    if (cost > 0) {
      const costType = data.repair_status === 'completed' ? 'Repair cost' : 'Estimated cost'
      cardData.hero = {
        value: `$${cost.toFixed(2)}`,
        subtext: costType
      }
    }
    
    // DATA - Flexible display
    if (item.mileage) {
      cardData.data.push({
        label: 'Odometer',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    if (data.severity) {
      cardData.data.push({
        label: 'Severity',
        value: data.severity,
        highlight: severity === 'severe' || severity === 'critical'
      })
    }
    
    if (data.damage_description) {
      cardData.data.push({
        label: 'Description',
        value: data.damage_description
      })
    }
    
    if (data.repair_status) {
      cardData.data.push({
        label: 'Status',
        value: data.repair_status
      })
    }
    
    if (data.insurance_claim) {
      cardData.data.push({
        label: 'Insurance claim',
        value: data.insurance_claim
      })
    }
    
    if (data.repair_shop) {
      cardData.data.push({
        label: 'Repair shop',
        value: data.repair_shop
      })
    }
    
    if (data.repair_date) {
      cardData.data.push({
        label: 'Repair date',
        value: new Date(data.repair_date).toLocaleDateString()
      })
    }
    
    // AI SUMMARY
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'medium'
      }
    }
    
    // BADGE - Severity warning
    if (severity === 'severe' || severity === 'critical') {
      cardData.badges = [{
        text: 'Immediate attention required',
        variant: 'danger',
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />
      }]
    } else if (data.repair_status === 'completed') {
      cardData.badges = [{
        text: 'Repair completed',
        variant: 'success'
      }]
    }
    
    return cardData
  }
}
