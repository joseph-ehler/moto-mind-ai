/**
 * API: Decode VIN
 * POST /api/vin/decode
 * 
 * Decodes VIN using NHTSA API + OpenAI insights
 * Returns complete vehicle data with AI-generated recommendations
 */

import { NextResponse } from 'next/server'
import { requireUserServer } from '@/lib/auth/server'
import { decodeVIN } from '@/lib/vin'

interface DecodeVINRequest {
  vin: string
}

export async function POST(request: Request) {
  try {
    console.log('[API/VIN/Decode] Starting VIN decode...')
    
    // Authenticate user
    const { user } = await requireUserServer()
    console.log('[API/VIN/Decode] User authenticated:', user.id)

    // Parse request body
    const body: DecodeVINRequest = await request.json()
    const { vin } = body

    // Validate input
    if (!vin || typeof vin !== 'string') {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      )
    }

    console.log('[API/VIN/Decode] Decoding VIN:', vin)

    // Decode VIN
    const result = await decodeVIN(vin)

    console.log('[API/VIN/Decode] ✅ Decode successful:', result.vehicle.displayName)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('[API/VIN/Decode] Error:', error)
    
    // Return user-friendly error
    const errorMessage = error.message || 'Failed to decode VIN'
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 400 }
    )
  }
}
