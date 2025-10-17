/**
 * Send Email Verification API Route
 * POST /api/auth/email/send-verification
 * 
 * Sends a verification email to the user
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmailVerification } from '@/lib/auth/services/email-verification-service'
import { getClientIp } from '@/lib/auth/services/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json()

    if (!email || !userId) {
      return NextResponse.json(
        { success: false, error: 'Email and userId are required' },
        { status: 400 }
      )
    }

    // Get client IP
    const ipAddress = getClientIp(request)

    // Send verification email
    const result = await sendEmailVerification(email, userId, ipAddress)

    if (!result.success) {
      const statusCode = result.error?.includes('Too many') ? 429 : 400
      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      )
    }

    // In production, send actual email here
    // await sendVerificationEmail(email, result.token!)

    console.log(`[API] Verification email sent to ${email}, expires at ${result.expiresAt}`)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      expiresAt: result.expiresAt
    })

  } catch (error) {
    console.error('[API] Send verification failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
