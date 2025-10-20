/**
 * VIN Decode API - Phase 1
 * POST /api/vin/decode
 * 
 * Decodes VIN using NHTSA VPIC API + tiny safety/EPA rollup.
 * 
 * Phase 1 spec:
 * - 10s timeout per upstream
 * - 20s total with retry budget
 * - Error taxonomy: VIN_INVALID, UPSTREAM_UNAVAILABLE, UPSTREAM_TIMEOUT, UNKNOWN
 * - Returns: vehicle data + rollup (safety + EPA)
 */

import { NextResponse } from 'next/server'
import { getRollup } from '@/lib/safety/rollups'

interface DecodeRequest {
  vin: string
}

interface VehicleData {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  drivetrain?: string
  bodyClass?: string
  fuelType?: string
}

interface DecodeResponse {
  vehicle: VehicleData
  rollup?: {
    safety?: { riskLevel: 'low' | 'medium' | 'high'; score?: number }
    epa?: { class?: string }
  }
  sources: string[]
}

const TIMEOUT_MS = 10000 // 10s per upstream call

/**
 * Validate VIN format
 */
function validateVin(vin: string): { valid: boolean; error?: string } {
  if (!vin || typeof vin !== 'string') {
    return { valid: false, error: 'VIN is required' }
  }
  
  // VIN must be exactly 17 characters
  if (vin.length !== 17) {
    return { valid: false, error: 'VIN must be exactly 17 characters' }
  }
  
  // VIN cannot contain I, O, or Q
  if (/[IOQ]/i.test(vin)) {
    return { valid: false, error: 'VIN cannot contain letters I, O, or Q' }
  }
  
  return { valid: true }
}

/**
 * Decode VIN using NHTSA VPIC API
 */
async function decodeVinVpic(vin: string): Promise<VehicleData> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  
  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MotoMind/1.0'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error('UPSTREAM_UNAVAILABLE')
    }
    
    const data = await response.json()
    
    if (!data.Results || data.Results.length === 0) {
      throw new Error('VIN_INVALID')
    }
    
    // Parse VPIC response
    const results = data.Results
    const getValue = (variableId: number) => {
      const item = results.find((r: any) => r.VariableId === variableId)
      return item?.Value || null
    }
    
    const year = parseInt(getValue(29)) || new Date().getFullYear()
    const make = getValue(26) || 'Unknown'
    const model = getValue(28) || 'Unknown'
    
    return {
      vin: vin.toUpperCase(),
      year,
      make,
      model,
      trim: getValue(109) || undefined,
      engine: getValue(13) || undefined,
      drivetrain: getValue(15) || undefined,
      bodyClass: getValue(5) || undefined,
      fuelType: getValue(24) || undefined
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('UPSTREAM_TIMEOUT')
    }
    
    if (error.message.includes('UPSTREAM') || error.message.includes('VIN_')) {
      throw error
    }
    
    throw new Error('UPSTREAM_UNAVAILABLE')
  }
}

export async function POST(request: Request) {
  try {
    // Parse request
    const body: DecodeRequest = await request.json()
    const { vin } = body
    
    // Validate VIN
    const validation = validateVin(vin)
    if (!validation.valid) {
      return NextResponse.json(
        { code: 'VIN_INVALID', message: validation.error },
        { status: 400 }
      )
    }
    
    // Decode VIN (with timeout)
    const vehicle = await decodeVinVpic(vin)
    
    // Get rollup (cached, fast)
    const rollup = await getRollup({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year
    })
    
    // Success response
    const response: DecodeResponse = {
      vehicle,
      rollup,
      sources: ['vpic', 'localSafety']
    }
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error: any) {
    console.error('[VIN Decode Error]', error)
    
    // Error taxonomy
    const code = error.message || 'UNKNOWN'
    
    let status = 500
    let message = 'An unexpected error occurred'
    
    switch (code) {
      case 'VIN_INVALID':
        status = 400
        message = 'Invalid VIN format or unrecognized VIN'
        break
      case 'UPSTREAM_UNAVAILABLE':
        status = 503
        message = 'VIN database temporarily unavailable'
        break
      case 'UPSTREAM_TIMEOUT':
        status = 504
        message = 'VIN database timeout'
        break
      default:
        status = 500
        message = 'Internal server error'
        break
    }
    
    return NextResponse.json(
      { code, message },
      { status }
    )
  }
}
