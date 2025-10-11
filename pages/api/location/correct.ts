/**
 * Location Correction API
 * Allows users to submit corrections when geocoding/extraction is wrong
 * 
 * POST /api/location/correct
 * Body:
 * {
 *   sourceType: 'fuel_receipt',
 *   sourceId: 'uuid',
 *   extracted: { address, latitude, longitude, method, confidence },
 *   corrected: { address, latitude, longitude, method }
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const requestSchema = z.object({
  sourceType: z.enum(['fuel_receipt', 'service_receipt', 'manual_entry']),
  sourceId: z.string().uuid().optional(),
  
  extracted: z.object({
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    method: z.enum(['vision_structured', 'vision_ocr', 'geocoding', 'gps', 'manual']).optional(),
    confidence: z.enum(['high', 'medium', 'low', 'none']).optional()
  }).optional(),
  
  corrected: z.object({
    address: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    method: z.enum(['manual_entry', 'nearby_search', 'map_pin'])
  })
})

type LocationCorrectionRequest = z.infer<typeof requestSchema>

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate request body
    const body = requestSchema.parse(req.body)

    // Get user from session
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: req.headers.authorization || ''
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Insert correction
    const { data, error } = await supabase
      .from('location_corrections')
      .insert({
        user_id: user.id,
        source_type: body.sourceType,
        source_id: body.sourceId || null,
        
        extracted_address: body.extracted?.address || null,
        extracted_latitude: body.extracted?.latitude || null,
        extracted_longitude: body.extracted?.longitude || null,
        extraction_method: body.extracted?.method || null,
        extraction_confidence: body.extracted?.confidence || null,
        
        corrected_address: body.corrected.address,
        corrected_latitude: body.corrected.latitude,
        corrected_longitude: body.corrected.longitude,
        correction_method: body.corrected.method
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to save location correction:', error)
      return res.status(500).json({ error: 'Failed to save correction' })
    }

    console.log('✅ Location correction saved:', data.id)

    return res.status(200).json({
      success: true,
      correction: data
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      })
    }

    console.error('Location correction error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
