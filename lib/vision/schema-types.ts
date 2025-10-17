// Generated TypeScript Types from Schemas
// Single source of truth for both runtime schemas and compile-time types

// Dashboard Snapshot Types
export interface DashboardSnapshotResult {
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
  confidence: number
}

// Service Invoice Types
export interface ServiceInvoiceResult {
  vendor_name: string | null
  service_description: string | null
  total_amount: number | null
  date: string | null // YYYY-MM-DD format
  odometer_reading: number | null
  vehicle_info: {
    year: number | null
    make: string | null
    model: string | null
    vin: string | null
  }
  line_items: Array<{
    description: string
    amount: number
    category: 'labor' | 'parts' | 'fluids' | 'other'
  }>
  confidence: number
}

// Fuel Receipt Types
export interface FuelReceiptResult {
  station_name: string | null
  total_amount: number | null
  gallons: number | null
  price_per_gallon: number | null
  fuel_type: string | null
  date: string | null // YYYY-MM-DD format
  time: string | null // HH:MM format
  payment_method: string | null
  pump_number: string | null
  confidence: number
}

// Insurance Card Types
export interface InsuranceCardResult {
  insurance_company: string | null
  policy_number: string | null
  effective_date: string | null // YYYY-MM-DD format
  expiration_date: string | null // YYYY-MM-DD format
  vehicle_info: {
    year: number | null
    make: string | null
    model: string | null
    vin: string | null
  }
  coverage_limits: {
    liability: string | null
    comprehensive: string | null
    collision: string | null
  }
  agent_info: {
    name: string | null
    phone: string | null
  }
  confidence: number
}

// Utility type to map document types to their result interfaces
export type DocumentResultMap = {
  dashboard_snapshot: DashboardSnapshotResult
  service_invoice: ServiceInvoiceResult
  fuel_receipt: FuelReceiptResult
  insurance_card: InsuranceCardResult
  // Add other types as needed
}
