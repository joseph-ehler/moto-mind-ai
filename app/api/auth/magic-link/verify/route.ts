/**
 * Magic Link Verify API Route
 * POST /api/auth/magic-link/verify
 * 
 * Verifies a magic link token and returns the email
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink } from '@/lib/auth/services/magic-link-service'
import { getClientIp } from '@/lib/auth/services/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required', errorCode: 'INVALID' },
        { status: 400 }
      )
    }

    // Get client IP for optional validation
    const ipAddress = getClientIp(request)

    // Verify the magic link
    const result = await verifyMagicLink(token, ipAddress)

    if (!result.success) {
      const statusCode = result.errorCode === 'EXPIRED' ? 410 : 400
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          errorCode: result.errorCode
        },
        { status: statusCode }
      )
    }

    console.log(`[API] Magic link verified for ${result.email}`)

    return NextResponse.json({
      success: true,
      email: result.email,
      message: 'Magic link verified successfully'
    })

  } catch (error) {
    console.error('[API] Magic link verify failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify magic link', errorCode: 'INVALID' },
      { status: 500 }
    )
  }
}
