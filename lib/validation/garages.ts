import { z } from 'zod'

// Garage creation request
export const createGarageRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().min(1, 'Address is required').max(500),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(50).optional(),
  is_default: z.boolean().default(false),
})

// Garage update request
export const updateGarageRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(50).optional(),
  is_default: z.boolean().optional(),
})

// Garage query parameters
export const garageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// Garage ID parameter
export const garageIdSchema = z.object({
  id: z.string().uuid('Invalid garage ID format'),
})

// Export types
export type CreateGarageRequest = z.infer<typeof createGarageRequestSchema>
export type UpdateGarageRequest = z.infer<typeof updateGarageRequestSchema>
export type GarageQuery = z.infer<typeof garageQuerySchema>
export type GarageIdParam = z.infer<typeof garageIdSchema>
