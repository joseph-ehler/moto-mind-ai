/**
 * Timeline Types - Vision-First Vehicle Journal
 * 
 * Timeline is the central organizing principle for all vehicle data.
 * Every interaction (odometer snap, receipt photo, tire check) becomes a timeline item.
 */

export type TimelineItemType = 
  | 'odometer'           // Odometer reading photo
  | 'service'            // Service receipt photo
  | 'maintenance'        // Maintenance event (alias for service)
  | 'fuel'               // Fuel receipt photo
  | 'dashboard_warning'  // Dashboard warning light photo
  | 'dashboard_snapshot' // Dashboard snapshot (general)
  | 'tire_tread'         // Tire tread depth photo
  | 'tire_pressure'      // Tire pressure reading
  | 'damage'             // Damage documentation photo
  | 'parking'            // Parking location photo
  | 'document'           // General document (insurance, registration, etc.)
  | 'inspection'         // State inspection / emissions test
  | 'recall'             // Manufacturer recall notice
  | 'manual'             // Manual entry (no photo)
  // NEW: Enhanced tracking
  | 'modification'       // Vehicle modifications, upgrades, customization
  | 'car_wash'           // Car wash, detailing, cleaning
  | 'trip'               // Road trip, business trip log
  | 'expense'            // General expense (tolls, parking fees, etc.)

export interface TimelineItemBase {
  id: string
  vehicle_id: string
  type: TimelineItemType
  timestamp: Date
  photo_url?: string
  thumbnail_url?: string
  mileage?: number
  notes?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  // Phase 2A: Supplemental data from sensors/APIs (optional enrichment)
  supplemental_data?: {
    exif?: {
      capture_date?: Date
      gps?: { latitude: number, longitude: number }
      device?: string
      resolution?: { width: number, height: number }
    }
    weather?: {
      temp_f?: number
      condition?: string
      source?: string
    }
    data_sources?: Array<{
      field: string
      source: 'user' | 'vision_ai' | 'exif' | 'gps' | 'api'
      confidence?: number
    }>
  }
  created_at: Date
  updated_at: Date
}

// Type-specific extracted data
export interface OdometerData {
  reading: number
  confidence: number
  change_since_last?: number
}

export interface ServiceData {
  service_type: string
  vendor_name?: string
  cost?: number
  parts_replaced?: string[]
  warranty?: boolean
  next_service_date?: Date
}

export interface FuelData {
  gallons: number
  cost: number
  price_per_gallon: number
  station_name?: string
  fuel_type?: string
  mpg_calculated?: number
}

export interface DashboardWarningData {
  warning_type: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
  resolved_date?: Date
  description?: string
}

export interface TireTreadData {
  position: 'front_left' | 'front_right' | 'rear_left' | 'rear_right'
  depth_32nds: number
  condition: 'excellent' | 'good' | 'fair' | 'replace_soon' | 'unsafe'
}

export interface TirePressureData {
  pressures: {
    front_left: number
    front_right: number
    rear_left: number
    rear_right: number
  }
  recommended: number
  alerts?: string[]
}

export interface DamageData {
  severity: 'minor' | 'moderate' | 'major'
  location: string
  estimated_cost?: number
  repair_status?: 'pending' | 'in_progress' | 'completed'
  insurance_claim?: boolean
}

export interface ParkingData {
  lot_name?: string
  level?: string
  spot_number?: string
  reminder_time?: Date
}

export interface InspectionData {
  inspection_type: 'safety' | 'emissions' | 'both'
  result: 'pass' | 'fail' | 'conditional'
  expiration_date?: Date
  station_name?: string
  certificate_number?: string
  notes?: string
}

export interface RecallData {
  recall_id: string
  nhtsa_number?: string
  severity: 'safety' | 'compliance' | 'info'
  affected_component: string
  status: 'open' | 'scheduled' | 'resolved'
  manufacturer?: string
  resolution_deadline?: Date
  description?: string
}

// NEW: Enhanced tracking types
export interface ModificationData {
  modification_type: 'performance' | 'cosmetic' | 'comfort' | 'audio' | 'safety' | 'other'
  part_name: string
  brand?: string
  cost?: number
  installer?: string
  warranty?: string
  description?: string
  before_after?: 'before' | 'after'
}

export interface CarWashData {
  service_type: 'basic' | 'premium' | 'detail' | 'self_wash'
  provider?: string
  cost?: number
  services_included?: string[]
  next_wash_date?: Date
}

export interface TripData {
  trip_type: 'business' | 'personal' | 'commute'
  destination?: string
  purpose?: string
  distance_miles?: number
  start_mileage?: number
  end_mileage?: number
  passengers?: number
  route?: string
}

export interface ExpenseData {
  expense_type: 'toll' | 'parking' | 'registration' | 'insurance' | 'other'
  amount: number
  vendor?: string
  description?: string
  tax_deductible?: boolean
  receipt_number?: string
}

// Union type for all timeline items
export type TimelineItem = 
  | (TimelineItemBase & { type: 'odometer', extracted_data: OdometerData })
  | (TimelineItemBase & { type: 'service', extracted_data: ServiceData })
  | (TimelineItemBase & { type: 'maintenance', extracted_data: ServiceData })
  | (TimelineItemBase & { type: 'fuel', extracted_data: FuelData })
  | (TimelineItemBase & { type: 'dashboard_warning', extracted_data: DashboardWarningData })
  | (TimelineItemBase & { type: 'dashboard_snapshot', extracted_data: DashboardWarningData })
  | (TimelineItemBase & { type: 'tire_tread', extracted_data: TireTreadData })
  | (TimelineItemBase & { type: 'tire_pressure', extracted_data: TirePressureData })
  | (TimelineItemBase & { type: 'damage', extracted_data: DamageData })
  | (TimelineItemBase & { type: 'parking', extracted_data: ParkingData })
  | (TimelineItemBase & { type: 'document', extracted_data: Record<string, any> })
  | (TimelineItemBase & { type: 'inspection', extracted_data: InspectionData })
  | (TimelineItemBase & { type: 'recall', extracted_data: RecallData })
  | (TimelineItemBase & { type: 'manual', extracted_data: Record<string, any> })
  // NEW: Enhanced tracking
  | (TimelineItemBase & { type: 'modification', extracted_data: ModificationData })
  | (TimelineItemBase & { type: 'car_wash', extracted_data: CarWashData })
  | (TimelineItemBase & { type: 'trip', extracted_data: TripData })
  | (TimelineItemBase & { type: 'expense', extracted_data: ExpenseData })

// Timeline filter options
export type TimelineFilter = 
  | 'all'
  | 'odometer'
  | 'service'
  | 'fuel'
  | 'warnings'
  | 'tires'
  | 'damage'
  | 'documents'

// Timeline display config
export interface TimelineConfig {
  filter: TimelineFilter
  sortOrder: 'newest' | 'oldest'
  showPhotos: boolean
  groupByDate: boolean
}
