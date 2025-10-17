/**
 * Email Verification API
 * 
 * POST /api/auth/verify-email
 * Body: { token: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmail } from '@/lib/auth/services/email-verification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify email
    const result = await verifyEmail(token)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Verification failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      email: result.email 
    })

  } catch (error) {
    console.error('[API] Email verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
