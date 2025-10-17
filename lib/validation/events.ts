// Vehicle Event Validation - Discriminated Union with Zod
// Type-safe validation for all vehicle event types

import { z } from 'zod'

// Base event schema
const BaseEventSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  vehicle_id: z.string().uuid('Invalid vehicle ID')
})

// Odometer event schema
const OdometerEventSchema = BaseEventSchema.extend({
  type: z.literal('odometer'),
  miles: z.number().int().min(0, 'Miles cannot be negative'),
  source: z.enum(['photo', 'manual']).optional()
})

// Maintenance event schema
const MaintenanceEventSchema = BaseEventSchema.extend({
  type: z.literal('maintenance'),
  miles: z.number().int().min(0, 'Miles cannot be negative'),
  kind: z.enum(['oil_change', 'tires', 'brakes', 'general']),
  vendor: z.string().optional(),
  cost_cents: z.number().int().min(0, 'Cost cannot be negative').optional(),
  miles_inferred: z.boolean().optional(),
  description: z.string().optional()
})

// Fuel event schema
const FuelEventSchema = BaseEventSchema.extend({
  type: z.literal('fuel'),
  gallons: z.number().positive('Gallons must be positive'),
  total_cents: z.number().int().min(0, 'Total cost cannot be negative'),
  miles: z.number().int().min(0, 'Miles cannot be negative').optional(),
  station: z.string().optional(),
  miles_inferred: z.boolean().optional()
})

// Document event schema
const DocumentEventSchema = BaseEventSchema.extend({
  type: z.literal('document'),
  doc_type: z.enum(['insurance', 'registration', 'invoice', 'other']),
  url: z.string().url('Invalid document URL'),
  fields: z.record(z.string()).optional()
})

// Discriminated union for all event types
export const VehicleEventSchema = z.discriminatedUnion('type', [
  OdometerEventSchema,
  MaintenanceEventSchema,
  FuelEventSchema,
  DocumentEventSchema
])

// Type inference
export type VehicleEventInput = z.infer<typeof VehicleEventSchema>

// Validation helper
export function validateVehicleEvent(data: unknown): VehicleEventInput {
  return VehicleEventSchema.parse(data)
}

// Business rule validations
export function validateMileageMonotonic(
  newMiles: number, 
  currentMiles: number | null,
  allowRollover = false
): void {
  if (currentMiles !== null && newMiles < currentMiles && !allowRollover) {
    throw new Error(
      `Mileage cannot decrease. Current: ${currentMiles}, provided: ${newMiles}. ` +
      `Use allow_rollover: true if this is intentional (e.g., odometer rollover).`
    )
  }
}

export function validateEventDate(date: string): void {
  const eventDate = new Date(date)
  const now = new Date()
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  if (eventDate < oneYearAgo) {
    throw new Error('Event date cannot be more than one year in the past')
  }
  
  if (eventDate > oneWeekFromNow) {
    throw new Error('Event date cannot be more than one week in the future')
  }
}
