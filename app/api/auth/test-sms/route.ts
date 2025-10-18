/**
 * Test Phone Magic Link API
 * 
 * Quick test endpoint to verify Twilio integration
 * Usage: POST /api/auth/test-sms with { "phone": "+1234567890" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendPhoneMagicLink } from '@/lib/auth/adapters/phone-magic'
import { getClientIP, shouldAllowRequest, recordAuthAttempt } from '@/lib/auth/services/risk-scoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, captchaToken } = body
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }
    
    // Get client IP for risk scoring
    const ipAddress = getClientIP(request)
    
    // Check risk and CAPTCHA requirement
    const allowanceCheck = await shouldAllowRequest(ipAddress, phone, captchaToken)
    
    if (!allowanceCheck.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: allowanceCheck.reason,
          captchaRequired: allowanceCheck.captchaRequired,
          riskLevel: allowanceCheck.riskLevel,
        },
        { status: allowanceCheck.captchaRequired ? 429 : 403 }
      )
    }
    
    console.log('[Test SMS] Sending verification code to:', phone, '(Risk:', allowanceCheck.riskLevel, ')')
    
    // Send SMS
    const result = await sendPhoneMagicLink({
      phone,
      countryCode: 'US',
      metadata: {
        test: true,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })
    
    console.log('[Test SMS] Result:', result)
    
    // Record attempt outcome
    await recordAuthAttempt({
      ipAddress,
      identifier: phone,
      success: result.success,
      captchaToken,
    })
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error, 
          rateLimitInfo: result.rateLimitInfo,
          captchaRequired: allowanceCheck.captchaRequired,
        },
        { status: 400 }
      )
    } else {
      console.log('[Test SMS] SMS sent successfully')
      return NextResponse.json({
        success: true,
        message: result.message,
        formattedPhone: result.formattedPhone,
        rateLimitInfo: result.rateLimitInfo,
        riskLevel: allowanceCheck.riskLevel,
        note: 'Check your phone for the 6-digit code!',
        reminder: 'You need a verified Twilio phone number to send SMS',
      })
    }
  } catch (error: any) {
    console.error('[Test SMS] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for easy browser testing
export async function GET() {
  return NextResponse.json({
    message: 'Phone Magic Link Test Endpoint',
    usage: 'POST /api/auth/test-sms with { "phone": "+1234567890" }',
    example: {
      method: 'POST',
      body: { phone: '+12025551234' },
    },
    note: 'Phone number must be in E.164 format (+country_code + number)',
    twilioSetup: 'You need to get a phone number from Twilio console first',
  })
}
