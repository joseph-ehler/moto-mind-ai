/**
 * Event Field Builders
 * 
 * Functions to build field configurations for event detail sections
 */

import type { EventData } from '@/types/event'
import { formatDateWithoutTimezone } from './eventUtils'

export interface DataField {
  label: string
  value: string | number
  name?: string
  editable?: boolean
  inputType?: 'text' | 'number' | 'date' | 'time' | 'address' | 'currency' | 'textarea'
  format?: (value: any) => string
  validate?: (value: any) => string | null
  aiGenerated?: boolean
  aiType?: 'generated' | 'enhanced' | 'detected' | 'calculated'
  confidence?: number
  aiDetails?: string
  helpText?: {
    title: string
    description: string
    examples?: string[]
    tips?: string[]
  }
  calculatedFrom?: {
    formula: string
    steps: Array<{ label: string; value: string | number; formula?: string }>
  }
  rawValue?: any
}

/**
 * Build financial data fields
 */
export const buildFinancialFields = (event: EventData): DataField[] => {
  return [
    { 
      label: 'Total Cost', 
      value: event.total_amount || 0,
      name: 'total_amount',
      editable: true,
      inputType: 'currency' as const,
      format: (val: number) => `$${val.toFixed(2)}`,
      validate: (val: number) => val < 0 ? 'Must be positive' : null,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: event.payload?.ai_confidence?.total_amount || (event as any).vision_confidence_detail?.receipt || 0.95,
      aiDetails: 'AI analyzed your receipt image and detected this amount using advanced OCR and pattern recognition.',
      helpText: {
        title: 'Total Cost',
        description: 'The total amount paid for this fuel purchase, including all taxes and fees.',
        examples: ['$45.50', '$67.89', '$120.00'],
        tips: ['This should match the total on your receipt', 'Includes all taxes and fees']
      }
    },
    { 
      label: 'Gallons', 
      value: event.gallons || 0,
      name: 'gallons',
      editable: true,
      inputType: 'number' as const,
      format: (val: number) => val.toFixed(3),
      validate: (val: number) => val <= 0 ? 'Must be greater than 0' : null,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: event.payload?.ai_confidence?.gallons || (event as any).vision_confidence_detail?.receipt || 0.95,
      aiDetails: 'AI detected the fuel volume from your receipt. Volume is typically displayed prominently near the price.',
      helpText: {
        title: 'Gallons',
        description: 'The amount of fuel dispensed, measured in gallons. This is used to calculate fuel efficiency (MPG).',
        examples: ['12.345 gallons', '8.920 gallons', '15.678 gallons'],
        tips: ['Most pumps show 3 decimal places', 'Used to calculate miles per gallon (MPG)']
      }
    },
    (event as any).price_per_gallon ? { 
      label: 'Price/Gallon', 
      value: (event as any).price_per_gallon,
      name: 'price_per_gallon',
      editable: true,
      inputType: 'currency' as const,
      format: (val: number) => `$${val.toFixed(3)}/gal`,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.95,
      aiDetails: 'Price per gallon extracted directly from receipt',
      helpText: {
        title: 'Price per Gallon',
        description: 'The unit price of fuel extracted from the receipt.',
        tips: [
          'Compare this across fill-ups to track price trends',
          'Useful for finding the best fuel prices in your area'
        ]
      }
    } : (event.total_amount && event.gallons ? { 
      label: 'Price/Gallon', 
      value: event.total_amount && event.gallons ? `$${(event.total_amount / event.gallons).toFixed(3)}/gal` : 'N/A',
      editable: false,
      aiGenerated: true,
      aiType: 'calculated' as const,
      calculatedFrom: event.total_amount && event.gallons ? {
        formula: 'Total Cost ÷ Gallons = Price per Gallon',
        steps: [
          { label: 'Total Cost', value: `$${event.total_amount.toFixed(2)}` },
          { label: 'Gallons', value: event.gallons.toFixed(3) },
          { label: 'Calculation', value: `$${event.total_amount.toFixed(2)} ÷ ${event.gallons.toFixed(3)}` }
        ]
      } : undefined,
      helpText: {
        title: 'Price per Gallon',
        description: 'The unit price of fuel, calculated by dividing the total cost by the number of gallons purchased.',
        tips: [
          'This updates automatically when you edit Total Cost or Gallons',
          'Compare this across fill-ups to track price trends'
        ]
      }
    } : null),
    (event as any).fuel_grade ? { 
      label: 'Fuel Grade', 
      value: (event as any).fuel_grade,
      name: 'fuel_grade',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.90,
      aiDetails: 'Fuel type/grade extracted from receipt (Regular, Premium, Diesel, etc.)',
      helpText: {
        title: 'Fuel Grade',
        description: 'The type or grade of fuel purchased (e.g., Regular, Premium, Diesel, Super Unleaded).',
        tips: [
          'Important for tracking if using premium vs regular',
          'Can affect MPG calculations'
        ]
      }
    } : null,
    event.payload?.tax_amount ? { 
      label: 'Tax', 
      value: event.payload.tax_amount,
      name: 'tax_amount',
      editable: true,
      inputType: 'currency' as const,
      format: (val: number) => `$${val.toFixed(2)}`,
      validate: (val: number) => val < 0 ? 'Must be positive' : null,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: event.payload?.ai_confidence?.tax_amount || 0.90
    } : null,
  ].filter(Boolean) as DataField[]
}

/**
 * Build location data fields
 */
export const buildLocationFields = (event: EventData): DataField[] => {
  return [
    { 
      label: 'Date', 
      value: event.date?.split('T')[0] || '', // YYYY-MM-DD format
      name: 'date',
      editable: true,
      inputType: 'date' as const,
      format: (val: string) => formatDateWithoutTimezone(val),
      helpText: {
        title: 'Date',
        description: 'The date of your fuel purchase. Used for tracking fuel efficiency over time and correlating with weather conditions.',
        tips: [
          'Click to open a calendar picker',
          'Accurate dates help track seasonal fuel efficiency trends',
          'Used to fetch historical weather data'
        ]
      }
    },
    (event as any).transaction_time ? { 
      label: 'Time', 
      value: (event as any).transaction_time,
      name: 'transaction_time',
      editable: true,
      inputType: 'time' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.85,
      aiDetails: 'Transaction time extracted from receipt',
      helpText: {
        title: 'Transaction Time',
        description: 'The exact time of your fuel purchase. Used for fraud detection and impossible travel alerts.',
        tips: ['Helps detect duplicate receipts', 'Used for time-based fraud detection']
      }
    } : (event.payload?.time ? { 
      label: 'Time', 
      value: event.payload.time,
      name: 'time',
      editable: true,
      inputType: 'time' as const,
      aiGenerated: true,
      aiType: 'detected' as const
    } : null),
    { 
      label: 'Station', 
      value: event.display_vendor || event.vendor || 'Unknown',
      name: 'vendor',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: !!event.display_vendor,
      aiType: 'enhanced' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.88
    },
    (event as any).station_address ? { 
      label: 'Station Address', 
      value: (event as any).station_address,
      name: 'station_address',
      editable: true,
      inputType: 'address' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.90,
      aiDetails: 'Full address extracted directly from receipt',
      helpText: {
        title: 'Station Address',
        description: 'The full street address from the receipt. Used for geofencing and location tracking.',
        tips: [
          'Extracted from receipt header',
          'Enables geofencing alerts',
          'Used for impossible travel detection'
        ]
      }
    } : (event.geocoded_address ? { 
      label: 'Address', 
      value: event.geocoded_address,
      name: 'geocoded_address',
      editable: true,
      inputType: 'address' as const,
      aiGenerated: true,
      aiType: 'generated' as const,
      confidence: 0.92,
      aiDetails: 'AI geocoded the station name to find its precise address using location databases and mapping APIs.',
      helpText: {
        title: 'Station Address',
        description: 'The full street address of the gas station. Used to show the location on a map and fetch weather conditions.',
        tips: [
          'Start typing to see autocomplete suggestions',
          'Accurate addresses enable weather correlation',
          'Helps you remember where you filled up'
        ]
      }
    } : null),
  ].filter(Boolean) as DataField[]
}

/**
 * Build receipt detail fields
 */
export const buildReceiptFields = (event: EventData): DataField[] => {
  return [
    (event as any).pump_number ? { 
      label: 'Pump', 
      value: `#${(event as any).pump_number}`,
      name: 'pump_number',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.88,
      aiDetails: 'Pump number extracted from receipt for fraud detection',
      helpText: {
        title: 'Pump Number',
        description: 'The pump number where fuel was dispensed. Used to detect fraudulent duplicate receipts.',
        tips: ['Used for fraud detection', 'Helps verify legitimate transactions']
      }
    } : (event.payload?.pump_number ? { 
      label: 'Pump', 
      value: `#${event.payload.pump_number}`,
      name: 'pump_number',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: 0.88
    } : null),
    (event as any).payment_method ? { 
      label: 'Payment Method', 
      value: (event as any).payment_method,
      name: 'payment_method',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.91,
      aiDetails: 'Payment card and last 4 digits extracted from receipt',
      helpText: {
        title: 'Payment Method',
        description: 'The payment method used (card type and last 4 digits). Useful for expense tracking.',
        tips: ['Track which card was used', 'Helps with expense categorization']
      }
    } : (event.payload?.payment_method ? { 
      label: 'Payment', 
      value: event.payload.payment_method,
      name: 'payment_method',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: 0.91
    } : null),
    (event as any).transaction_id ? { 
      label: 'Transaction ID', 
      value: (event as any).transaction_id,
      name: 'transaction_id',
      editable: false,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.94,
      aiDetails: 'Unique transaction identifier for duplicate detection',
      helpText: {
        title: 'Transaction ID',
        description: 'Unique identifier from the gas station system. Used to detect duplicate receipt uploads.',
        tips: ['Prevents duplicate entries', 'Ensures data accuracy']
      }
    } : (event.payload?.transaction_number ? { 
      label: 'Transaction #', 
      value: event.payload.transaction_number,
      name: 'transaction_number',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: 0.94
    } : null),
    (event as any).auth_code ? { 
      label: 'Authorization Code', 
      value: (event as any).auth_code,
      name: 'auth_code',
      editable: false,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.90,
      aiDetails: 'Payment authorization code for dispute resolution'
    } : null,
    (event as any).invoice_number ? { 
      label: 'Invoice/Receipt #', 
      value: (event as any).invoice_number,
      name: 'invoice_number',
      editable: false,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.receipt || 0.92,
      aiDetails: 'Invoice number for expense reconciliation'
    } : null,
    event.payload?.fuel_type ? { 
      label: 'Fuel Type', 
      value: event.payload.fuel_type,
      name: 'fuel_type',
      editable: true,
      inputType: 'text' as const,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: 0.92
    } : null,
  ].filter(Boolean) as DataField[]
}

/**
 * Build vehicle data fields
 */
export const buildVehicleFields = (event: EventData): DataField[] => {
  return [
    event.miles ? { 
      label: 'Odometer', 
      value: event.miles,
      name: 'miles',
      editable: true,
      inputType: 'number' as const,
      format: (val: number) => `${val.toLocaleString()} mi`,
      validate: (val: number) => val < 0 ? 'Must be positive' : null,
      aiGenerated: !!(event as any).vision_confidence_detail?.odometer,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.odometer || 0,
      aiDetails: 'Odometer reading extracted from dashboard photo'
    } : null,
    (event as any).fuel_level ? { 
      label: 'Fuel Level', 
      value: (event as any).fuel_level,
      name: 'fuel_level',
      editable: true,
      inputType: 'number' as const,
      format: (val: number) => `${val}%`,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.gauge || 0.75,
      aiDetails: 'Fuel gauge level (before fill-up) extracted from dashboard photo',
      helpText: {
        title: 'Fuel Level',
        description: 'Fuel gauge percentage before fill-up. Used for cross-validation with gallons purchased.',
        tips: ['Helps validate fill-up amount', 'Useful for range predictions']
      }
    } : null,
    (event as any).products && Array.isArray((event as any).products) && (event as any).products.length > 0 ? { 
      label: 'Fuel Additives', 
      value: (event as any).products.map((p: any) => 
        typeof p === 'string' ? p : `${p.brand || ''} ${p.product_name || p.name || ''}`.trim()
      ).join(', '),
      name: 'products',
      editable: false,
      rawValue: (event as any).products,
      aiGenerated: true,
      aiType: 'detected' as const,
      confidence: (event as any).vision_confidence_detail?.additives || 0.80,
      aiDetails: 'Fuel additives/products detected from product label photos',
      helpText: {
        title: 'Fuel Additives',
        description: 'Products added to fuel (e.g., Sea Foam, octane boosters). Tracked for maintenance history.',
        tips: [
          'Documented for warranty claims',
          'Track product effectiveness',
          'Monitor additive spending'
        ]
      }
    } : null,
    { 
      label: 'Notes', 
      value: event.notes || 'No notes added',
      name: 'notes',
      editable: true,
      inputType: 'textarea' as const
    },
  ].filter(Boolean) as DataField[]
}

/**
 * Get field value from event data
 */
export const getFieldValue = (event: EventData | null, fieldName: string): any => {
  if (!event) return null
  
  // Map field names to event properties
  const fieldMap: Record<string, any> = {
    // Top-level fields
    total_amount: event.total_amount,
    gallons: event.gallons,
    date: event.date?.split('T')[0], // Return date-only format YYYY-MM-DD
    miles: event.miles,
    notes: event.notes,
    vendor: event.vendor,
    geocoded_address: event.geocoded_address,
    
    // New top-level fields (Phase 1B)
    price_per_gallon: (event as any).price_per_gallon,
    fuel_grade: (event as any).fuel_grade,
    fuel_level: (event as any).fuel_level,
    products: (event as any).products,
    transaction_time: (event as any).transaction_time,
    station_address: (event as any).station_address,
    pump_number: (event as any).pump_number,
    payment_method: (event as any).payment_method,
    transaction_id: (event as any).transaction_id,
    auth_code: (event as any).auth_code,
    invoice_number: (event as any).invoice_number,
    
    // Payload fields (legacy)
    tax_amount: event.payload?.tax_amount,
    time: event.payload?.time,
    fuel_type: event.payload?.fuel_type,
    transaction_number: event.payload?.transaction_number,
  }
  
  return fieldMap[fieldName]
}
