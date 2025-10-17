/**
 * Password Reset Request API
 * 
 * POST /api/auth/reset-password/request
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/auth/services/password-reset'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Request password reset (sends email)
    const result = await requestPasswordReset(email.toLowerCase().trim())

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send reset email' },
        { status: 500 }
      )
    }

    // Always return success (don't reveal if user exists)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[API] Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
