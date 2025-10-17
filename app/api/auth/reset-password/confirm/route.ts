/**
 * Password Reset Confirmation API
 * 
 * POST /api/auth/reset-password/confirm
 * Body: { token: string, password: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth/services/password-reset'
import { validatePassword } from '@/lib/auth/services/password-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0] || 'Password does not meet requirements' },
        { status: 400 }
      )
    }

    // Reset password (validates and consumes token)
    const result = await resetPassword(token, password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reset password' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[API] Password reset confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
