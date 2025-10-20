/**
 * API: Check Vehicle Recalls
 * POST /api/recalls/check
 * 
 * Checks NHTSA for recalls by VIN
 */

import { NextResponse } from 'next/server'
import { checkRecalls, getCriticalRecalls } from '@/lib/recalls/nhtsa-recalls'

export async function POST(request: Request) {
  try {
    const { vin } = await request.json()

    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      )
    }

    // Check recalls
    const result = await checkRecalls(vin)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to check recalls' },
        { status: 500 }
      )
    }

    // Get critical recalls
    const criticalRecalls = getCriticalRecalls(result.recalls)

    return NextResponse.json({
      success: true,
      vin: result.vin,
      hasRecalls: result.hasOpenRecalls,
      recallCount: result.recallCount,
      criticalCount: criticalRecalls.length,
      recalls: result.recalls,
      criticalRecalls,
      lastChecked: result.lastChecked,
    })
  } catch (error) {
    console.error('[API/Recalls/Check] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
