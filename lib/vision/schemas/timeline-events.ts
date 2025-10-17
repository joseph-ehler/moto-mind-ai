// Standardized Timeline Event Schemas
// Canonical data shapes for all timeline events - eliminates inconsistent access patterns

/**
 * Base timeline event structure - all events must conform to this
 */
export interface BaseTimelineEvent {
  // Core identification
  type: string
  summary: string
  
  // Essential data (always present)
  key_facts: Record<string, any>
  
  // Metadata (always present)
  confidence: number
  processing_metadata: {
    model_version: string
    prompt_hash: string
    processing_ms: number
  }
  
  // Optional fields
  validation?: {
    rollup: 'ok' | 'needs_review'
    fields?: Record<string, number>
    // Field-level confidence scores for UI display
    odometer_conf?: number
    fuel_conf?: number
    lights_conf?: number
  }
  next_actions?: string[]
}

/**
 * Service event - standardized schema
 */
export interface ServiceTimelineEvent extends BaseTimelineEvent {
  type: 'service'
  key_facts: {
    // Required fields
    vendor_name: string
    service_description: string
    total_amount: number
    date: string
    
    // Optional fields
    odometer_reading?: number
    service_category?: string
    line_items?: Array<{
      description: string
      amount: number
      category: 'labor' | 'parts' | 'fluids' | 'other'
    }>
    labor_amount?: number
    labor_hours?: number
    vehicle_info?: {
      year?: number
      make?: string
      model?: string
    }
  }
}

/**
 * Dashboard snapshot event - standardized schema
 */
export interface DashboardTimelineEvent extends BaseTimelineEvent {
  type: 'dashboard_snapshot'
  key_facts: {
    // Optional fields (dashboard may not have all readings)
    odometer_miles?: number
    fuel_level_eighths?: number
    coolant_temp?: {
      status: 'cold' | 'normal' | 'hot'
      gauge_position: 'low' | 'center' | 'high'
    }
    outside_temp?: {
      value: number
      unit: 'F' | 'C'
    }
    warning_lights?: string[]
    oil_life_percent?: number
    service_message?: string
  }
}

/**
 * Fuel event - standardized schema
 */
export interface FuelTimelineEvent extends BaseTimelineEvent {
  type: 'fuel'
  key_facts: {
    // Required fields
    total_amount: number
    gallons: number
    price_per_gallon: number
    station_name: string
    date: string
    
    // Optional fields
    fuel_type?: string
    payment_method?: string
    location?: string
  }
}

/**
 * Odometer event - standardized schema
 */
export interface OdometerTimelineEvent extends BaseTimelineEvent {
  type: 'odometer'
  key_facts: {
    // Required fields
    odometer_miles: number
    date: string
    
    // Optional fields
    source?: 'manual' | 'service_record' | 'dashboard_snapshot'
    notes?: string
  }
}

/**
 * Insurance event - standardized schema
 */
export interface InsuranceTimelineEvent extends BaseTimelineEvent {
  type: 'insurance'
  key_facts: {
    // Required fields
    policy_number: string
    provider: string
    coverage_type: string
    
    // Optional fields
    effective_date?: string
    expiration_date?: string
    premium_amount?: number
    deductible?: number
  }
}

/**
 * Union type for all timeline events
 */
export type TimelineEvent = 
  | ServiceTimelineEvent
  | DashboardTimelineEvent
  | FuelTimelineEvent
  | OdometerTimelineEvent
  | InsuranceTimelineEvent

/**
 * Type guard functions for runtime type checking
 */
export function isServiceEvent(event: BaseTimelineEvent): event is ServiceTimelineEvent {
  return event.type === 'service'
}

export function isDashboardEvent(event: BaseTimelineEvent): event is DashboardTimelineEvent {
  return event.type === 'dashboard_snapshot'
}

export function isFuelEvent(event: BaseTimelineEvent): event is FuelTimelineEvent {
  return event.type === 'fuel'
}

export function isOdometerEvent(event: BaseTimelineEvent): event is OdometerTimelineEvent {
  return event.type === 'odometer'
}

export function isInsuranceEvent(event: BaseTimelineEvent): event is InsuranceTimelineEvent {
  return event.type === 'insurance'
}

/**
 * Schema validation functions
 */
export function validateServiceEvent(data: any): ServiceTimelineEvent | null {
  if (!data.key_facts?.vendor_name || !data.key_facts?.service_description || !data.key_facts?.total_amount) {
    return null
  }
  
  return {
    type: 'service',
    summary: data.summary || `${data.key_facts.service_description} - ${data.key_facts.vendor_name}`,
    key_facts: {
      vendor_name: data.key_facts.vendor_name,
      service_description: data.key_facts.service_description,
      total_amount: data.key_facts.total_amount,
      date: data.key_facts.date || new Date().toISOString(),
      ...data.key_facts // Include optional fields
    },
    confidence: data.confidence || 0,
    processing_metadata: data.processing_metadata || {
      model_version: 'unknown',
      prompt_hash: 'unknown',
      processing_ms: 0
    },
    validation: data.validation,
    next_actions: data.next_actions
  }
}

export function validateDashboardEvent(data: any): DashboardTimelineEvent | null {
  return {
    type: 'dashboard_snapshot',
    summary: data.summary || 'Dashboard snapshot',
    key_facts: {
      ...data.key_facts // All dashboard fields are optional
    },
    confidence: data.confidence || 0,
    processing_metadata: data.processing_metadata || {
      model_version: 'unknown',
      prompt_hash: 'unknown',
      processing_ms: 0
    },
    validation: data.validation,
    next_actions: data.next_actions
  }
}

/**
 * Utility function to normalize any event to standard schema
 */
export function normalizeTimelineEvent(rawEvent: any): TimelineEvent | null {
  switch (rawEvent.type) {
    case 'service':
      return validateServiceEvent(rawEvent)
    case 'dashboard_snapshot':
      return validateDashboardEvent(rawEvent)
    case 'fuel':
      // TODO: Implement fuel validation
      return rawEvent as FuelTimelineEvent
    case 'odometer':
      // TODO: Implement odometer validation
      return rawEvent as OdometerTimelineEvent
    case 'insurance':
      // TODO: Implement insurance validation
      return rawEvent as InsuranceTimelineEvent
    default:
      return null
  }
}
