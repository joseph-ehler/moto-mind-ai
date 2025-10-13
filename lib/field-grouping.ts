/**
 * Helper functions to group extracted fields into logical sections
 * for use with DataSection component
 */

import type { ExtractedField } from '@/components/capture/AIProposalReview'

export interface FieldSection {
  title: string
  fields: Array<{
    label: string
    value: string | number | null
    name: string
    editable: boolean
    inputType: 'text' | 'number' | 'date' | 'textarea'
  }>
}

/**
 * Group extracted fields into logical sections for fuel events
 */
export function groupFuelFields(fields: ExtractedField[]): FieldSection[] {
  const sections: FieldSection[] = []

  // Financial Section
  const financialFields = [
    'cost', 'total_amount', 'total_cost',
    'gallons', 'volume',
    'tax', 'tax_amount',
    'price_per_gallon', 'unit_price'
  ]
  const financialData = fields.filter(f => 
    financialFields.some(name => f.name.toLowerCase().includes(name.toLowerCase()))
  )
  
  if (financialData.length > 0) {
    sections.push({
      title: '💵 Payment Breakdown',
      fields: financialData.map(f => ({
        label: f.label,
        value: f.value || null,
        name: f.name,
        editable: true,
        inputType: (f.inputType || 'text') as 'text' | 'number' | 'date' | 'textarea'
      }))
    })
  }

  // When & Where Section
  const locationFields = [
    'date', 'time', 'timestamp',
    'station', 'vendor', 'location',
    'address', 'city', 'state'
  ]
  const locationData = fields.filter(f =>
    locationFields.some(name => f.name.toLowerCase().includes(name.toLowerCase()))
  )
  
  if (locationData.length > 0) {
    sections.push({
      title: '📍 Location & Time',
      fields: locationData.map(f => ({
        label: f.label,
        value: f.value || null,
        name: f.name,
        editable: f.name.toLowerCase().includes('date') || f.name.toLowerCase().includes('time'),
        inputType: (f.inputType || 'text') as 'text' | 'number' | 'date' | 'textarea'
      }))
    })
  }

  // Receipt Details Section
  const receiptFields = [
    'fuel_type', 'grade', 'octane',
    'pump', 'pump_number',
    'transaction', 'transaction_id', 'transaction_number',
    'payment', 'payment_method', 'card_type'
  ]
  const receiptData = fields.filter(f =>
    receiptFields.some(name => f.name.toLowerCase().includes(name.toLowerCase()))
  )
  
  if (receiptData.length > 0) {
    sections.push({
      title: '🧾 Transaction Details',
      fields: receiptData.map(f => ({
        label: f.label,
        value: f.value || null,
        name: f.name,
        editable: false, // Vision-extracted, read-only
        inputType: 'text' as const
      }))
    })
  }

  // Vehicle Section  
  const vehicleFields = [
    'odometer', 'mileage', 'miles',
    'notes', 'note', 'comment'
  ]
  const vehicleData = fields.filter(f =>
    vehicleFields.some(name => f.name.toLowerCase().includes(name.toLowerCase()))
  )
  
  if (vehicleData.length > 0) {
    sections.push({
      title: '🚗 Vehicle & Notes',
      fields: vehicleData.map(f => ({
        label: f.label,
        value: f.value || null,
        name: f.name,
        editable: true,
        inputType: (f.name.toLowerCase().includes('note') ? 'textarea' : 'number') as 'text' | 'number' | 'date' | 'textarea'
      }))
    })
  }

  // Catch remaining fields (shouldn't happen with good extraction)
  const categorized = new Set([
    ...financialFields,
    ...locationFields,
    ...receiptFields,
    ...vehicleFields
  ].map(f => f.toLowerCase()))
  
  const remainingFields = fields.filter(f =>
    !Array.from(categorized).some(name => f.name.toLowerCase().includes(name))
  )
  
  if (remainingFields.length > 0) {
    sections.push({
      title: 'ℹ️ Additional Details',
      fields: remainingFields.map(f => ({
        label: f.label,
        value: f.value || null,
        name: f.name,
        editable: true,
        inputType: (f.inputType || 'text') as 'text' | 'number' | 'date' | 'textarea'
      }))
    })
  }

  return sections
}
