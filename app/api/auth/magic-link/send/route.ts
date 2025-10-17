/**
 * Magic Link Send API Route
 * POST /api/auth/magic-link/send
 * 
 * Sends a magic link to the user's email
 */

import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth/services/magic-link-service'
import { getClientIp } from '@/lib/auth/services/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get client IP for tracking
    const ipAddress = getClientIp(request)

    // Create magic link
    const result = await createMagicLink(email, ipAddress)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 } // Too Many Requests if rate limited
      )
    }

    // In production, send email here
    // await sendMagicLinkEmail(email, result.token!)

    console.log(`[API] Magic link created for ${email}, expires at ${result.expiresAt}`)

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt,
      message: 'Magic link sent to your email'
    })

  } catch (error) {
    console.error('[API] Magic link send failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send magic link' },
      { status: 500 }
    )
  }
}
