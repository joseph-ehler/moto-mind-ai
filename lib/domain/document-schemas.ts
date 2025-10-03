/**
 * Canonical Document Schemas
 * 
 * These are the single source of truth for document data storage.
 * All vision extraction data gets normalized to these schemas before saving.
 * Display components read from event.payload.data with type discrimination.
 */

// ============================================================================
// FUEL RECEIPT
// ============================================================================
export interface FuelReceiptData {
  station_name: string
  total_amount: number
  gallons: number
  price_per_gallon: number
  fuel_type: string | null
  payment_method: string | null
  pump_number: string | null
  date: string // YYYY-MM-DD from receipt
  time: string | null // HH:MM from receipt
}

// ============================================================================
// DASHBOARD SNAPSHOT
// ============================================================================
export interface DashboardSnapshotData {
  odometer_miles: number
  odometer_unit: 'km' | 'mi'
  odometer_original_value: number | null
  odometer_original_unit: 'km' | 'mi' | null
  fuel_eighths: number | null
  coolant_temp: 'cold' | 'normal' | 'hot' | null
  outside_temp_value: number | null
  outside_temp_unit: 'F' | 'C' | null
  warning_lights: string[]
  oil_life_percent: number | null
  service_message: string | null
  trip_a_miles: number | null
  trip_b_miles: number | null
}

// ============================================================================
// SERVICE INVOICE
// ============================================================================
export interface ServiceInvoiceData {
  vendor_name: string
  total_amount: number
  service_description: string | null
  date: string // YYYY-MM-DD
  line_items: Array<{
    description: string
    amount: number
    category: 'labor' | 'parts' | 'fluids' | 'other'
  }>
  odometer_reading: number | null
  vehicle_info: {
    year: number | null
    make: string | null
    model: string | null
    vin: string | null
  } | null
}

// ============================================================================
// EVENT PAYLOAD (Discriminated Union)
// ============================================================================
export type DocumentData = 
  | DashboardSnapshotData 
  | FuelReceiptData 
  | ServiceInvoiceData

export interface EventPayload<T extends DocumentData = DocumentData> {
  type: 'dashboard_snapshot' | 'fuel_receipt' | 'service_invoice'
  data: T
  raw_extraction: any // Original vision response for debugging/reprocessing
  metadata?: {
    confidence: number
    processing_ms: number
    model_version: string
    prompt_hash: string
  }
}

// Type guards for discriminated unions
export function isFuelReceiptPayload(payload: EventPayload): payload is EventPayload<FuelReceiptData> {
  return payload.type === 'fuel_receipt'
}

export function isDashboardSnapshotPayload(payload: EventPayload): payload is EventPayload<DashboardSnapshotData> {
  return payload.type === 'dashboard_snapshot'
}

export function isServiceInvoicePayload(payload: EventPayload): payload is EventPayload<ServiceInvoiceData> {
  return payload.type === 'service_invoice'
}
