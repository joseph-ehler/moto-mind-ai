/**
 * Password Reset Token Verification API
 * 
 * GET /api/auth/reset-password/verify?token=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyResetToken } from '@/lib/auth/services/password-reset'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify token (doesn't consume it)
    const result = await verifyResetToken(token)

    if (!result.success) {
      return NextResponse.json(
        { valid: false, error: result.error || 'Invalid token' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      valid: true, 
      email: result.email 
    })

  } catch (error) {
    console.error('[API] Token verification error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
