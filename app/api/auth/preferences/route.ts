/**
 * Login Preferences API
 * GET /api/auth/preferences?email=user@example.com
 * 
 * Returns user's last login method for smart sign-in hints
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLastLoginMethod, getLoginPreferences } from '@/lib/auth/services/login-preferences'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Fetch last login method
    const lastMethod = await getLastLoginMethod(email)

    // Optionally fetch full preferences
    const fullPrefs = searchParams.get('full') === 'true'
    if (fullPrefs) {
      const prefs = await getLoginPreferences(email)
      return NextResponse.json({
        lastMethod,
        preferences: prefs
      })
    }

    return NextResponse.json({
      lastMethod
    })

  } catch (error) {
    console.error('[API /auth/preferences] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  )
}
