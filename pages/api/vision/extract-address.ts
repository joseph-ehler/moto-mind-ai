/**
 * Address Extraction API Endpoint
 * Hybrid three-tier fallback for extracting gas station addresses
 * NOW WITH GEOCODING: Returns both address AND coordinates!
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { extractAddress } from '../../../lib/vision/address-extractor'
import { forwardGeocode } from '../../../lib/geocoding-enhanced'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      address: null,
      source: 'none',
      confidence: 'none',
      coordinates: null
    })
  }

  try {
    const { photo_base64, gps, structured_address } = req.body

    // Validate inputs
    if (!photo_base64) {
      return res.status(400).json({
        error: 'Photo required',
        address: null,
        source: 'none',
        confidence: 'none',
        coordinates: null
      })
    }

    console.log('📍 Starting hybrid address extraction...')
    const startTime = Date.now()

    // Step 1: Extract address
    const result = await extractAddress(
      photo_base64,
      gps,
      structured_address
    )

    const duration = Date.now() - startTime
    console.log(`✅ Address extraction complete (${duration}ms):`, result)

    // Step 2: Geocode the extracted address (server-side!)
    let coordinates = null
    let geocodeConfidence = 'none'
    let geocodeProvider = null
    let geocodeWarnings: string[] = []

    if (result.address) {
      console.log('📍 Geocoding extracted address:', result.address)
      try {
        const geocodeResult = await forwardGeocode(
          result.address,
          gps ? { latitude: gps.latitude, longitude: gps.longitude } : undefined
        )

        if (geocodeResult) {
          coordinates = geocodeResult.coordinates
          geocodeConfidence = geocodeResult.confidence
          geocodeProvider = geocodeResult.provider
          geocodeWarnings = geocodeResult.warnings
          
          console.log(
            `✅ Geocoded via ${geocodeResult.provider} (${geocodeResult.confidence} confidence):`,
            coordinates
          )
          
          if (geocodeResult.warnings.length > 0) {
            console.log('⚠️ Geocoding warnings:', geocodeResult.warnings)
          }
        } else {
          console.log('⚠️ Geocoding returned null - address may be invalid')
        }
      } catch (geocodeError) {
        console.error('❌ Geocoding failed:', geocodeError)
        // Don't fail the whole request if geocoding fails
      }
    }

    return res.status(200).json({
      ...result,
      coordinates,
      geocode_confidence: geocodeConfidence,
      geocode_provider: geocodeProvider,
      geocode_warnings: geocodeWarnings
    })
  } catch (error: any) {
    console.error('❌ Address extraction error:', error)
    
    return res.status(500).json({
      address: null,
      source: 'none',
      confidence: 'none',
      coordinates: null,
      error: error.message || 'Extraction failed',
      method: 'Error occurred'
    })
  }
}
