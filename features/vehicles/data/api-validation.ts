// API Input Validation Utilities
// Centralized validation schemas and helpers for API endpoints

import { z } from 'zod'
import { NextApiRequest, NextApiResponse } from 'next'

// Common validation schemas
export const commonSchemas = {
  // Vehicle ID validation
  vehicleId: z.string().uuid('Invalid vehicle ID format'),
  
  // Garage ID validation  
  garageId: z.string().uuid('Invalid garage ID format'),
  
  // VIN validation (17 characters, alphanumeric excluding I, O, Q)
  vin: z.string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format'),
  
  // Mileage validation
  mileage: z.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .max(2000000, 'Mileage seems unrealistic'),
  
  // Currency amount validation
  amount: z.number()
    .min(0, 'Amount cannot be negative')
    .max(100000, 'Amount seems unrealistic'),
  
  // Date validation
  date: z.string().datetime('Invalid date format').or(z.date()),
  
  // Base64 image validation
  base64Image: z.string()
    .min(100, 'Image data too short')
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Invalid image format'),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }).optional()
}

// VIN processing validation schemas
export const vinSchemas = {
  decodeVin: z.object({
    vin: commonSchemas.vin
  }),
  
  extractVin: z.object({
    image: commonSchemas.base64Image
  }),
  
  scanVin: z.object({
    image: commonSchemas.base64Image
  })
}

// Vision processing validation schemas
export const visionSchemas = {
  processImage: z.object({
    image: commonSchemas.base64Image,
    documentType: z.enum(['odometer', 'fuel', 'service_invoice', 'insurance', 'other']).optional(),
    vehicleId: commonSchemas.vehicleId.optional()
  }),
  
  costTracking: z.object({
    model: z.enum(['gpt-4o', 'gpt-4o-mini']),
    inputTokens: z.number().int().min(0),
    outputTokens: z.number().int().min(0),
    documentType: z.string().optional()
  })
}

// Vehicle management validation schemas
export const vehicleSchemas = {
  createVehicle: z.object({
    make: z.string().min(1, 'Make is required').max(50),
    model: z.string().min(1, 'Model is required').max(50),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
    vin: commonSchemas.vin.optional(),
    nickname: z.string().max(100).optional(),
    garageId: commonSchemas.garageId.optional()
  }),
  
  updateVehicle: z.object({
    make: z.string().min(1).max(50).optional(),
    model: z.string().min(1).max(50).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
    nickname: z.string().max(100).optional(),
    garageId: commonSchemas.garageId.optional()
  }),
  
  addFuel: z.object({
    vehicleId: commonSchemas.vehicleId,
    amount: commonSchemas.amount,
    gallons: z.number().min(0).max(200),
    pricePerGallon: z.number().min(0).max(20).optional(),
    station: z.string().max(100).optional(),
    date: commonSchemas.date.optional(),
    mileage: commonSchemas.mileage.optional()
  }),
  
  addService: z.object({
    vehicleId: commonSchemas.vehicleId,
    serviceType: z.string().min(1, 'Service type is required'),
    amount: commonSchemas.amount.optional(),
    vendor: z.string().max(100).optional(),
    date: commonSchemas.date.optional(),
    mileage: commonSchemas.mileage.optional(),
    description: z.string().max(500).optional()
  }),
  
  updateOdometer: z.object({
    vehicleId: commonSchemas.vehicleId,
    mileage: commonSchemas.mileage,
    date: commonSchemas.date.optional()
  })
}

// Garage management validation schemas
export const garageSchemas = {
  createGarage: z.object({
    name: z.string().min(1, 'Garage name is required').max(100),
    address: z.string().max(200).optional(),
    isDefault: z.boolean().default(false)
  }),
  
  updateGarage: z.object({
    name: z.string().min(1).max(100).optional(),
    address: z.string().max(200).optional(),
    isDefault: z.boolean().optional()
  })
}

// Upload validation schemas
export const uploadSchemas = {
  uploadVehiclePhoto: z.object({
    vehicleId: commonSchemas.vehicleId,
    image: commonSchemas.base64Image,
    imageType: z.enum(['hero', 'front', 'rear', 'side_left', 'side_right', 'interior', 'engine', 'odometer', 'damage', 'maintenance', 'general']).default('general'),
    description: z.string().max(200).optional()
  }),
  
  photoUpload: z.object({
    image: commonSchemas.base64Image,
    category: z.string().max(50).optional(),
    metadata: z.record(z.any()).optional()
  })
}

// Demo/testing validation schemas
export const demoSchemas = {
  demoReset: z.object({
    confirmReset: z.boolean().refine(val => val === true, 'Must confirm reset'),
    preserveUsers: z.boolean().default(false)
  }),
  
  demoSeed: z.object({
    dataType: z.enum(['vehicles', 'garages', 'events', 'all']).default('all'),
    count: z.number().int().min(1).max(100).default(10)
  })
}

// Validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    try {
      const validatedData = schema.parse(req.body)
      // Attach validated data to request
      ;(req as any).validatedData = validatedData
      
      if (next) {
        next()
      }
      return validatedData
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return null
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal validation error'
      })
      return null
    }
  }
}

// Helper to validate and handle request
export async function withValidation<T>(
  req: NextApiRequest,
  res: NextApiResponse,
  schema: z.ZodSchema<T>,
  handler: (validatedData: T) => Promise<any>
) {
  const validatedData = validateRequest(schema)(req, res)
  if (!validatedData) return // Response already sent by validator
  
  try {
    const result = await handler(validatedData)
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Handler error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

// Export all schemas for easy access
export const validationSchemas = {
  common: commonSchemas,
  vin: vinSchemas,
  vision: visionSchemas,
  vehicle: vehicleSchemas,
  garage: garageSchemas,
  upload: uploadSchemas,
  demo: demoSchemas
}
