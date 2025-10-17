/**
 * Test Email API Route
 * 
 * POST /api/email/test
 * 
 * Tests the email service by sending a test email
 * Only works in development mode for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { testEmailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Send test email
    const result = await testEmailService(email)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to send test email',
          success: false
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Test email sent to ${email}`
    })
  } catch (error) {
    console.error('[API] Email test error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
