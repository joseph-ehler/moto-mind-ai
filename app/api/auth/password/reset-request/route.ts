/**
 * Password Reset Request API Route
 * POST /api/auth/password/reset-request
 * 
 * Sends a password reset link to the user's email
 */

import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/auth/services/password-reset-service'
import { getClientIp } from '@/lib/auth/services/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get client IP
    const ipAddress = getClientIp(request)

    // Request password reset
    const result = await requestPasswordReset(email, ipAddress)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 } // Too Many Requests if rate limited
      )
    }

    // In production, send email here
    // await sendPasswordResetEmail(email, result.token!)

    console.log(`[API] Password reset requested for ${email}, expires at ${result.expiresAt}`)

    // Always return success (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
      expiresAt: result.expiresAt
    })

  } catch (error) {
    console.error('[API] Password reset request failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process reset request' },
      { status: 500 }
    )
  }
}
