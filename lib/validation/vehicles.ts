import { z } from 'zod'

// Common vehicle fields
export const vehicleBaseSchema = z.object({
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  nickname: z.string().min(1, 'Nickname is required').max(100),
})

// VIN validation
export const vinSchema = z.string()
  .length(17, 'VIN must be exactly 17 characters')
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format')

// Vehicle creation request
export const createVehicleRequestSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required').max(100),
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  vin: vinSchema.optional(),
  garage_id: z.string().optional(), // Allow any string for now
  hero_image_url: z.string().url().optional().nullable(),
  enrichment: z.object({
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    trim: z.string().max(50).optional(),
    body_class: z.string().max(100).optional(),
    engine: z.any().optional(),
    drivetrain: z.string().max(50).optional(),
    transmission: z.string().max(50).optional(),
    manufactured: z.any().optional(),
  }).optional(),
  smart_defaults: z.any().optional(),
  onboarding_duration_ms: z.number().int().min(0).optional(),
  source: z.string().max(50).optional(),
})

// Vehicle update request
export const updateVehicleRequestSchema = z.object({
  nickname: z.string().min(1).max(100).optional(),
  garage_id: z.string().uuid().optional(),
  hero_image_url: z.string().url().optional().nullable(),
  service_intervals: z.any().optional(),
})

// Vehicle query parameters
export const vehicleQuerySchema = z.object({
  garage_id: z.string().uuid().optional(),
  make: z.string().optional(),
  year: z.coerce.number().int().min(1900).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// Vehicle ID parameter
export const vehicleIdSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID format'),
})

// Export types
export type CreateVehicleRequest = z.infer<typeof createVehicleRequestSchema>
export type UpdateVehicleRequest = z.infer<typeof updateVehicleRequestSchema>
export type VehicleQuery = z.infer<typeof vehicleQuerySchema>
export type VehicleIdParam = z.infer<typeof vehicleIdSchema>
