import type { NextApiRequest, NextApiResponse } from 'next'
import { VehicleBodyType, mapToBodyType } from '../../../lib/types/vehicle-body-types'

interface GetImageRequest {
  year: string
  make: string
  model: string
  bodyType?: VehicleBodyType
  bodyClass?: string
  vehicleType?: string
  doors?: string | number
  trim?: string
}

interface GetImageResponse {
  success: boolean
  bodyType?: string
  placeholderType: 'svg'
  vehicleInfo?: {
    year: string
    make: string
    model: string
    trim?: string
    bodyType: string
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetImageResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      placeholderType: 'svg',
      error: 'Method not allowed' 
    })
  }

  try {
    const specs = req.body as Partial<GetImageRequest>
    
    if (!specs.year || !specs.make || !specs.model) {
      return res.status(400).json({
        success: false,
        placeholderType: 'svg',
        error: 'Missing required fields: year, make, model'
      })
    }

    console.log('🚗 Determining body type for vehicle:', specs)

    // Map VIN decode data to our SVG body types
    const bodyType = mapToBodyType({
      bodyClass: specs.bodyClass,
      bodyStyle: specs.bodyStyle,
      vehicleType: specs.vehicleType,
      doors: specs.doors,
      make: specs.make,
      model: specs.model
    })

    console.log('✅ Mapped to body type:', bodyType)

    // Return SVG placeholder info (actual rendering happens on frontend)
    return res.status(200).json({
      success: true,
      bodyType,
      placeholderType: 'svg',
      vehicleInfo: {
        year: specs.year,
        make: specs.make,
        model: specs.model,
        trim: specs.trim,
        bodyType
      }
    })

  } catch (error) {
    console.error('❌ Body type mapping failed:', error)
    
    return res.status(500).json({
      success: false,
      placeholderType: 'svg',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}
