/**
 * Password Reset API Route
 * POST /api/auth/password/reset
 * 
 * Resets the password using a valid token
 */

import { NextRequest, NextResponse } from 'next/server'
import { resetPassword, verifyResetToken } from '@/lib/auth/services/password-reset-service'
import { validatePassword } from '@/lib/auth/services/password-service'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword, deviceId } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: passwordValidation.errors[0] || 'Password does not meet requirements',
          errorCode: 'WEAK_PASSWORD'
        },
        { status: 400 }
      )
    }

    // Reset password
    const result = await resetPassword(token, newPassword, deviceId)

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

    console.log('[API] Password reset successful')

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('[API] Password reset failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/password/reset?token=xyz
 * Verify if a reset token is valid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const verification = await verifyResetToken(token)

    return NextResponse.json({
      valid: verification.valid,
      email: verification.email,
      error: verification.error,
      errorCode: verification.errorCode
    })

  } catch (error) {
    console.error('[API] Token verification failed:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to verify token' },
      { status: 500 }
    )
  }
}
