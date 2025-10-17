/**
 * Resend Verification Email API
 * 
 * POST /api/auth/verify-email/resend
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/auth/services/email-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Resend verification email
    const result = await resendVerificationEmail(email.toLowerCase().trim())

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to resend email' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[API] Resend verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
