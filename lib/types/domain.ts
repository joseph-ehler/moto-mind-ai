// MotoMind Domain Types - Single Source of Truth
// These types define the canonical data model for the application

export interface Vehicle {
  id: string
  // User-facing identifier (customizable)
  display_name: string
  // Structured identity (never overwritten by user)
  year?: number
  make: string
  model: string
  trim?: string
  vin?: string
  // Relationships
  garage_id?: string
  // Legacy fields (deprecated, use display_name)
  /** @deprecated Use display_name instead */
  label?: string
  /** @deprecated Use display_name instead */
  nickname?: string
  // Metadata
  hero_image_url?: string
  created_at: string
  updated_at: string
  
}

// Utility functions for Vehicle type
export function getVehicleDefaultName(vehicle: Vehicle): string {
  const parts = [vehicle.year?.toString(), vehicle.make, vehicle.model, vehicle.trim].filter(Boolean)
  return parts.join(' ') || 'Unknown Vehicle'
}

export function getVehicleDisplayName(vehicle: Vehicle): string {
  return vehicle.display_name || getVehicleDefaultName(vehicle)
}

export interface Garage {
  id: string
  name: string
  address?: {
    line1?: string
    city?: string
    state?: string
    postal?: string
    country?: string
  }
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
  created_at: string
  updated_at: string
}

// Discriminated union for type-safe events
export type VehicleEventType = 'odometer' | 'maintenance' | 'fuel' | 'document'

export interface BaseVehicleEvent {
  id: string
  vehicle_id: string
  date: string
  created_at: string
}

export interface OdometerEvent extends BaseVehicleEvent {
  type: 'odometer'
  miles: number
  source?: 'photo' | 'manual'
}

export interface MaintenanceEvent extends BaseVehicleEvent {
  type: 'maintenance'
  miles: number
  kind: 'oil_change' | 'tires' | 'brakes' | 'general'
  vendor?: string
  cost_cents?: number
  miles_inferred?: boolean
  description?: string
}

export interface FuelEvent extends BaseVehicleEvent {
  type: 'fuel'
  gallons: number
  total_cents: number
  miles?: number
  station?: string
  miles_inferred?: boolean
}

export interface DocumentEvent extends BaseVehicleEvent {
  type: 'document'
  doc_type: 'insurance' | 'registration' | 'invoice' | 'other'
  url: string
  fields?: Record<string, string>
}

export type VehicleEvent = OdometerEvent | MaintenanceEvent | FuelEvent | DocumentEvent

export interface Reminder {
  id: string
  vehicle_id: string
  title: string
  description?: string
  category: 'registration' | 'inspection' | 'emissions' | 'maintenance' | 'other'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  due_miles?: number
  status: 'open' | 'scheduled' | 'done' | 'dismissed'
  source: 'user'
  dedupe_key: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  vehicle_id: string
  vehicle_info: {
    display_name: string
    make: string
    model: string
  }
  severity: 'urgent' | 'attention' | 'info'
  title: string
  description: string
  cta_label: string
  cta_url: string
  created_at: string
  metadata?: Record<string, any>
}

// API Response Envelopes
export interface ApiListResponse<T> {
  data: T[]
  count?: number
  cursor?: string
}

export interface ApiSingleResponse<T> {
  data: T | null
}

export interface ApiErrorResponse {
  error: string
  code?: string
  detail?: string
}
