// Vision Processing Types
// Centralized type definitions for the vision system

export type ProcessingMode = 'ocr' | 'document' | 'auto'

export type DocumentType = 
  | 'service_invoice'
  | 'fuel_receipt' 
  | 'insurance_card'
  | 'dashboard_snapshot'
  | 'odometer'
  | 'license_plate'
  | 'vin'
  | 'accident_report'
  | 'inspection_certificate'

export interface VisionRequest {
  image: string
  mimeType: string
  mode: ProcessingMode
  document_type?: DocumentType
  engine_state?: 'running' | 'accessory' | null
}

export interface VisionResult {
  type: DocumentType
  summary: string
  key_facts: Record<string, any>
  validation: {
    rollup: 'ok' | 'needs_review'
    fields?: Record<string, number> // confidence scores 0..1
  }
  confidence: number // 0..1 overall confidence
  processing_metadata: {
    model_version: string
    prompt_hash: string
    processing_ms: number
    input_tokens?: number
    output_tokens?: number
    accessory_mode_filtered?: number
  }
  raw_extraction: any
  doc_url?: string
}

export interface ProcessingContext {
  mode: ProcessingMode
  document_type?: DocumentType
  tenant_id?: string
  vehicle_id?: string
}

// Validation result types
export interface ValidationResult {
  isValid: boolean
  confidence: number
  errors: string[]
  warnings: string[]
}

export interface FieldValidation {
  [fieldName: string]: {
    confidence: number
    isValid: boolean
    sanitizedValue?: any
    errors?: string[]
  }
}

// Extractor result types
export interface ExtractionResult<T = any> {
  data: T
  confidence: number
  source: string
  method: string
}

export interface VendorExtractionResult extends ExtractionResult<string> {
  originalValue: string
  cleanedValue: string
}

export interface MileageExtractionResult extends ExtractionResult<number> {
  pattern: string
  rawValue: string
}

// Processor result types
export interface ProcessorResult {
  enrichedData: any
  confidence: number
  warnings: string[]
  nextActions?: string[]
}

// Error types
export interface VisionError {
  code: string
  message: string
  details?: any
  retryable: boolean
}

// Dashboard-specific types
export interface DashboardSnapshot {
  odometer_miles: number | null
  fuel_level: {
    type: 'percent' | 'quarters' | 'eighths'
    value: number | string
  } | null
  coolant_temp: {
    status: 'cold' | 'normal' | 'hot'
    gauge_position: 'low' | 'center' | 'high'
  } | null
  warning_lights: string[] | null
  oil_life_percent: number | null
  service_message: string | null
}

// Service-specific types
export interface ServiceData {
  vendor_name: string | null
  service_description: string | null
  total_amount: number | null
  date: string | null
  odometer_reading: number | null
  line_items: Array<{
    description: string
    amount: number
    category?: string
  }> | null
}

// Fuel-specific types
export interface FuelData {
  station_name: string | null
  total_amount: number | null
  gallons: number | null
  price_per_gallon: number | null
  date: string | null
  odometer_reading: number | null
  fuel_type?: string | null
}
