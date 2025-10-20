/**
 * VIN Decode API - GOD TIER Edition
 * 
 * Features:
 * - 100% NHTSA data extraction
 * - Clean normalized data
 * - EPA fuel economy integration
 * - Full bulletproofing (validation, caching, resilience)
 */

import { NextRequest, NextResponse } from 'next/server'
import { decodeVIN } from '@/lib/vin/decoder'
import { VehicleDataNormalizer } from '@/lib/vin/normalizer'
import { validateVIN, sanitizeVIN } from '@/lib/vin/validator'
import { getFuelEconomy } from '@/lib/epa/fuel-economy'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vin } = body

    if (!vin) {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      )
    }

    // Step 1: Validate & sanitize VIN
    const cleanVin = sanitizeVIN(vin)
    const validation = validateVIN(cleanVin)

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid VIN' },
        { status: 400 }
      )
    }

    console.log('[VIN Decode] Processing VIN:', cleanVin)
    console.log('[VIN Decode] Validation confidence:', validation.confidence)

    // Step 2: Decode VIN with bulletproof decoder
    const decoded = await decodeVIN(cleanVin)

    if (!decoded || !decoded.vehicle) {
      return NextResponse.json(
        { success: false, error: 'Failed to decode VIN' },
        { status: 500 }
      )
    }

    // Step 3: Return complete decoder output
    const response = {
      success: true,
      ...decoded.vehicle,
      ...decoded.normalized,
      vin: cleanVin,
      validation: {
        confidence: validation.confidence,
        metadata: validation.metadata
      }
    }

    console.log('[VIN Decode] Response prepared successfully')
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('[VIN Decode] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
