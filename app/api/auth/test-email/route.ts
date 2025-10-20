/**
 * Test Email Magic Link API
 * 
 * Quick test endpoint to verify Resend integration
 * Usage: POST /api/auth/test-email with { "email": "your@email.com" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmailMagicLink } from '@/lib/auth/adapters/email-magic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    console.log('[Test Email] Sending magic link to:', email)
    
    // Send magic link
    const result = await sendEmailMagicLink({
      email,
      callbackPath: '/auth/verify',
      metadata: {
        test: true,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })
    
    console.log('[Test Email] Result:', result)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          rateLimitInfo: result.rateLimitInfo,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      rateLimitInfo: result.rateLimitInfo,
      note: 'Check your email for the magic link!',
    })
  } catch (error: any) {
    console.error('[Test Email] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for easy browser testing
export async function GET() {
  return NextResponse.json({
    message: 'Email Magic Link Test Endpoint',
    usage: 'POST /api/auth/test-email with { "email": "your@email.com" }',
    example: {
      method: 'POST',
      body: { email: 'test@example.com' },
    },
  })
}
