/**
 * Vision Extraction Field Definitions
 * Pure TypeScript interfaces - data structure only, no instructions
 */

export interface DashboardFields {
  // Odometer
  odometer_miles: number | null
  odometer_unit: 'km' | 'mi' | null
  
  // Trip meters
  trip_a_miles: number | null
  trip_b_miles: number | null
  
  // Fuel (standardized to eighths scale)
  fuel_eighths: number | null  // 0 (empty) to 8 (full)
  
  // Temperature
  coolant_temp: 'cold' | 'normal' | 'hot' | null
  outside_temp_value: number | null
  outside_temp_unit: 'F' | 'C' | null
  
  // Indicators
  warning_lights: string[] | null
  oil_life_percent: number | null  // 0-100
  service_message: string | null
  
  // Metadata
  confidence: number  // 0-1
}

export interface FuelReceiptFields {
  station_name: string | null
  total_amount: number | null
  gallons: number | null
  price_per_gallon: number | null
  fuel_type: string | null
  date: string | null  // YYYY-MM-DD
  time: string | null  // HH:MM
  payment_method: string | null
  pump_number: string | null
  confidence: number
}

export interface ServiceInvoiceFields {
  vendor_name: string | null
  service_description: string | null
  total_amount: number | null
  date: string | null  // YYYY-MM-DD
  odometer_reading: number | null
  vehicle_info: {
    year: number | null
    make: string | null
    model: string | null
    vin: string | null
  } | null
  line_items: Array<{
    description: string
    amount: number
    category: 'labor' | 'parts' | 'fluids' | 'other'
  }> | null
  confidence: number
}

// JSON Schema representations for AI
export const DASHBOARD_JSON_SCHEMA = {
  type: 'object',
  properties: {
    odometer_miles: { type: ['number', 'null'] },
    odometer_unit: { type: ['string', 'null'], enum: ['km', 'mi', null] },
    trip_a_miles: { type: ['number', 'null'] },
    trip_b_miles: { type: ['number', 'null'] },
    fuel_eighths: { type: ['number', 'null'], minimum: 0, maximum: 8 },
    coolant_temp: { type: ['string', 'null'], enum: ['cold', 'normal', 'hot', null] },
    outside_temp_value: { type: ['number', 'null'] },
    outside_temp_unit: { type: ['string', 'null'], enum: ['F', 'C', null] },
    warning_lights: { type: ['array', 'null'], items: { type: 'string' } },
    oil_life_percent: { type: ['number', 'null'], minimum: 0, maximum: 100 },
    service_message: { type: ['string', 'null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['confidence']
}

export const FUEL_RECEIPT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    station_name: { type: ['string', 'null'] },
    total_amount: { type: ['number', 'null'] },
    gallons: { type: ['number', 'null'] },
    price_per_gallon: { type: ['number', 'null'] },
    fuel_type: { type: ['string', 'null'] },
    date: { type: ['string', 'null'], pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    time: { type: ['string', 'null'], pattern: '^\\d{2}:\\d{2}$' },
    payment_method: { type: ['string', 'null'] },
    pump_number: { type: ['string', 'null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['confidence']
}

export const SERVICE_INVOICE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    vendor_name: { type: ['string', 'null'] },
    service_description: { type: ['string', 'null'] },
    total_amount: { type: ['number', 'null'] },
    date: { type: ['string', 'null'], pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    odometer_reading: { type: ['number', 'null'] },
    vehicle_info: {
      type: ['object', 'null'],
      properties: {
        year: { type: ['number', 'null'] },
        make: { type: ['string', 'null'] },
        model: { type: ['string', 'null'] },
        vin: { type: ['string', 'null'] }
      }
    },
    line_items: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
          category: { type: 'string', enum: ['labor', 'parts', 'fluids', 'other'] }
        },
        required: ['description', 'amount', 'category']
      }
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['confidence']
}
