/**
 * Expense Event Renderer - FLEXIBLE VERSION
 * 
 * Tracks miscellaneous vehicle expenses:
 * - Hero: Expense amount
 * - Data: Vendor, description, tax info
 * - Badge: Tax deductible indicator
 */

import { DollarSign, Receipt } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const ExpenseEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const expenseType = data.expense_type || 'expense'
    
    // Format nicely: toll -> Toll, parking -> Parking, etc.
    return expenseType.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    return data.vendor || data.description || null
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const cost = data.amount || getCost(item)
    
    const cardData: EventCardData = {
      data: []
    }
    
    // HERO - Amount
    if (cost && cost > 0) {
      cardData.hero = {
        value: `$${cost.toFixed(2)}`,
        subtext: data.expense_type ? `${data.expense_type} expense` : 'Expense'
      }
    }
    
    // DATA - Flexible display
    if (data.vendor) {
      cardData.data.push({
        label: 'Vendor',
        value: data.vendor
      })
    }
    
    if (data.description) {
      cardData.data.push({
        label: 'Description',
        value: data.description
      })
    }
    
    if (item.mileage && item.mileage > 0) {
      cardData.data.push({
        label: 'Odometer',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    if (data.receipt_number) {
      cardData.data.push({
        label: 'Receipt #',
        value: data.receipt_number
      })
    }
    
    if (data.tax_deductible !== undefined) {
      cardData.data.push({
        label: 'Tax status',
        value: data.tax_deductible ? 'Deductible' : 'Not deductible',
        highlight: data.tax_deductible
      })
    }
    
    // AI SUMMARY
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'high'
      }
    }
    
    // BADGE - Tax deductible
    if (data.tax_deductible) {
      cardData.badges = [{
        text: 'Tax Deductible',
        variant: 'success',
        icon: <Receipt className="w-4 h-4 text-green-600" />
      }]
    }
    
    return cardData
  }
}
