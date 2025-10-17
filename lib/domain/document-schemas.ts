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
  station_address: string | null // Full address for location intelligence
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
  vendor_address: string | null // Full address for location intelligence
  vendor_phone: string | null // Contact information
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
// INSPECTION RECORD
// ============================================================================
export interface InspectionRecordData {
  station_name: string
  station_address: string | null // Inspection station location
  station_phone: string | null
  inspection_type: string // 'emissions' | 'safety' | 'annual' etc
  result: 'pass' | 'fail' | 'conditional' | null
  certificate_number: string | null
  expiration_date: string | null // YYYY-MM-DD
  date: string // YYYY-MM-DD
  total_amount: number | null
  odometer_reading: number | null
}

// ============================================================================
// PARTS PURCHASE
// ============================================================================
export interface PartsPurchaseData {
  vendor_name: string
  vendor_address: string | null // Parts store/supplier location
  vendor_phone: string | null
  total_amount: number
  date: string // YYYY-MM-DD
  parts: Array<{
    part_name: string
    part_number: string | null
    quantity: number
    price: number
  }>
  payment_method: string | null
}

// ============================================================================
// TOWING SERVICE
// ============================================================================
export interface TowingServiceData {
  company_name: string
  company_address: string | null // Tow company location
  company_phone: string | null // CRITICAL for emergency contact
  total_amount: number
  date: string // YYYY-MM-DD
  time: string | null
  pickup_location: string | null // Where vehicle was picked up
  dropoff_location: string | null // Where vehicle was delivered
  distance_towed: number | null // Miles
  reason: string | null
}

// ============================================================================
// ACCIDENT REPORT
// ============================================================================
export interface AccidentReportData {
  date: string // YYYY-MM-DD
  time: string | null
  location: string | null // CRITICAL - where accident occurred
  police_report_number: string | null
  officer_name: string | null
  other_party_name: string | null
  other_party_insurance: string | null
  other_party_phone: string | null
  damage_description: string | null
  estimated_damage_cost: number | null
}

// ============================================================================
// INSURANCE CARD
// ============================================================================
export interface InsuranceCardData {
  insurance_company: string
  policy_number: string
  effective_date: string | null // YYYY-MM-DD
  expiration_date: string | null // YYYY-MM-DD
  coverage_type: string | null
  deductible: number | null
  // NOTE: No address - insurance company location not relevant for location intelligence
}

// ============================================================================
// EVENT PAYLOAD (Discriminated Union)
// ============================================================================
export type DocumentData = 
  | DashboardSnapshotData 
  | FuelReceiptData 
  | ServiceInvoiceData
  | InspectionRecordData
  | PartsPurchaseData
  | TowingServiceData
  | AccidentReportData
  | InsuranceCardData

export interface EventPayload<T extends DocumentData = DocumentData> {
  type: 'dashboard_snapshot' | 'fuel_receipt' | 'service_invoice' | 'inspection_record' | 'parts_purchase' | 'towing_service' | 'accident_report' | 'insurance_card'
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

export function isInspectionRecordPayload(payload: EventPayload): payload is EventPayload<InspectionRecordData> {
  return payload.type === 'inspection_record'
}

export function isPartsPurchasePayload(payload: EventPayload): payload is EventPayload<PartsPurchaseData> {
  return payload.type === 'parts_purchase'
}

export function isTowingServicePayload(payload: EventPayload): payload is EventPayload<TowingServiceData> {
  return payload.type === 'towing_service'
}

export function isAccidentReportPayload(payload: EventPayload): payload is EventPayload<AccidentReportData> {
  return payload.type === 'accident_report'
}

export function isInsuranceCardPayload(payload: EventPayload): payload is EventPayload<InsuranceCardData> {
  return payload.type === 'insurance_card'
}
