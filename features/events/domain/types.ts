/**
 * Events Domain Types
 * 
 * Core types and interfaces for vehicle events.
 * Re-exports from global types plus event-specific extensions.
 */

// Re-export core event types from global types
export type { EventData, ChangeEntry } from '../../../types/event'

/**
 * Event types supported by the system
 */
export type EventType =
  | 'fuel'
  | 'service'
  | 'dashboard_snapshot'
  | 'damage'
  | 'expense'
  | 'modification'
  | 'odometer'
  | 'tire'
  | 'trip'
  | 'warning'
  | 'car_wash'
  | 'default'

/**
 * Event creation input (subset of EventData)
 */
export interface CreateEventInput {
  type: EventType
  date: string
  vehicle_id: string
  total_amount?: number
  gallons?: number
  vendor?: string
  miles?: number
  notes?: string
  geocoded_lat?: number
  geocoded_lng?: number
  payload?: any
}

/**
 * Event update input (partial event data)
 */
export interface UpdateEventInput {
  type?: EventType
  date?: string
  total_amount?: number
  gallons?: number
  vendor?: string
  miles?: number
  notes?: string
  geocoded_lat?: number
  geocoded_lng?: number
  edit_reason?: string
}

/**
 * Event filter options
 */
export interface EventFilters {
  vehicle_id?: string
  type?: EventType | EventType[]
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  hasReceipt?: boolean
  hasWeather?: boolean
}

/**
 * Event sort options
 */
export interface EventSortOptions {
  field: 'date' | 'total_amount' | 'miles' | 'created_at'
  direction: 'asc' | 'desc'
}

/**
 * Event list response
 */
export interface EventListResponse {
  events: EventData[]
  total: number
  page: number
  pageSize: number
}

/**
 * Event completion score breakdown
 */
export interface CompletionScoreBreakdown {
  score: number
  breakdown: {
    receipt: boolean
    amount: boolean
    gallons: boolean
    vendor: boolean
    location: boolean
    date: boolean
    miles: boolean
    notes: boolean
  }
}
