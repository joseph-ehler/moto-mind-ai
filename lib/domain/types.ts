// Domain Types and Utilities
// Core business logic types and helper functions

export interface Vehicle {
  id: string
  year?: number
  make?: string
  model?: string
  trim?: string
  vin?: string
  display_name?: string
  tenant_id: string
  created_at: string
  updated_at: string
}

export interface VehicleDisplayInfo {
  display_name: string
  year?: number
  make?: string
  model?: string
  trim?: string
}

// Generate human-readable display name for vehicle
export function getVehicleDisplayName(vehicle: Partial<Vehicle>): string {
  if (vehicle.display_name) {
    return vehicle.display_name
  }

  const parts = []
  
  if (vehicle.year) {
    parts.push(vehicle.year.toString())
  }
  
  if (vehicle.make) {
    parts.push(vehicle.make.trim())
  }
  
  if (vehicle.model) {
    parts.push(vehicle.model.trim())
  }
  
  if (vehicle.trim) {
    parts.push(vehicle.trim.trim())
  }

  if (parts.length === 0) {
    return vehicle.vin ? `Vehicle (${vehicle.vin.slice(-6)})` : 'Unknown Vehicle'
  }

  return parts.join(' ')
}

// Validate VIN format
export function isValidVIN(vin: string): boolean {
  if (!vin || vin.length !== 17) {
    return false
  }
  
  // VIN should not contain I, O, or Q
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase())
}

// Extract vehicle info from VIN (basic implementation)
export function parseVINInfo(vin: string): Partial<Vehicle> {
  if (!isValidVIN(vin)) {
    return {}
  }

  // This is a basic implementation - in production you'd use a VIN decoder service
  return {
    vin: vin.toUpperCase(),
    display_name: `Vehicle (${vin.slice(-6)})`
  }
}

export interface ServiceRecord {
  id: string
  vehicle_id: string
  service_type: string
  date: string
  mileage?: number
  cost?: number
  vendor?: string
  description?: string
  tenant_id: string
}

export interface FuelRecord {
  id: string
  vehicle_id: string
  date: string
  mileage?: number
  gallons: number
  cost: number
  station?: string
  tenant_id: string
}

export interface OdometerReading {
  id: string
  vehicle_id: string
  date: string
  mileage: number
  source: 'manual' | 'service_record' | 'fuel_record' | 'document'
  tenant_id: string
}
