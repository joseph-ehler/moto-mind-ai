/**
 * Verify Email API Route
 * POST /api/auth/email/verify
 * GET /api/auth/email/verify?token=xyz
 * 
 * Verifies an email using a token
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail, getVerificationStatus } from '@/lib/auth/services/email-verification-service'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required', errorCode: 'INVALID' },
        { status: 400 }
      )
    }

    // Verify email
    const result = await verifyEmail(token)

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

    console.log(`[API] Email verified for ${result.email}`)

    return NextResponse.json({
      success: true,
      email: result.email,
      message: 'Email verified successfully'
    })

  } catch (error) {
    console.error('[API] Email verification failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify email', errorCode: 'INVALID' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/email/verify?userId=xyz
 * Check verification status for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const status = await getVerificationStatus(userId)

    return NextResponse.json(status)

  } catch (error) {
    console.error('[API] Get verification status failed:', error)
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    )
  }
}
