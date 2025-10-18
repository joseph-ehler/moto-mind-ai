/**
 * Magic Link Verification API
 * 
 * Server-side endpoint to verify magic link tokens
 * Usage: POST /api/auth/verify-magic-link with { token }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailMagicLink } from '@/lib/auth/adapters/email-magic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }
    
    console.log('[Verify API] Verifying magic link token...')
    
    const result = await verifyEmailMagicLink(token)
    
    if (result.success) {
      console.log('[Verify API] Token verified successfully')
      return NextResponse.json({
        success: true,
        redirectUrl: result.redirectUrl,
      })
    } else {
      console.log('[Verify API] Verification failed:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[Verify API] Exception:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to verify magic link',
      },
      { status: 500 }
    )
  }
}
