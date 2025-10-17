/**
 * Security Events API
 * GET /api/user/security-events - Get recent security events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabaseClient } from '@/lib/supabase/client'

const supabase = getSupabaseClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recent login history from user_login_preferences
    const { data: loginHistory, error: loginError } = await supabase
      .from('user_login_preferences')
      .select('*')
      .eq('user_id', session.user.email)
      .single()

    // Get recent sessions (for location and device info)
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', session.user.email)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get failed login attempts
    const { data: rateLimits, error: rateError } = await supabase
      .from('auth_rate_limits')
      .select('*')
      .eq('identifier', session.user.email)
      .eq('attempt_type', 'login')
      .order('last_attempt_at', { ascending: false })
      .limit(5)

    const events = []

    // Add login event
    if (loginHistory) {
      events.push({
        type: 'login',
        title: 'Recent sign-in',
        description: `Using ${loginHistory.last_login_method}`,
        timestamp: loginHistory.last_login_at,
        severity: 'info',
        location: null
      })
    }

    // Add new device logins (sessions)
    sessions?.forEach(session => {
      const isRecent = new Date(session.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      if (isRecent) {
        events.push({
          type: 'new_device',
          title: 'New device sign-in',
          description: `${session.browser} on ${session.os}`,
          timestamp: session.created_at,
          severity: 'info',
          location: {
            city: session.location_city,
            country: session.location_country,
            flag: session.location_flag
          }
        })
      }
    })

    // Add failed login attempts
    rateLimits?.forEach(limit => {
      if (limit.attempts >= 3) {
        events.push({
          type: 'failed_login',
          title: 'Multiple failed login attempts',
          description: `${limit.attempts} failed attempts`,
          timestamp: limit.last_attempt_at,
          severity: 'warning',
          location: null
        })
      }
    })

    // Sort by timestamp desc
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      events: events.slice(0, 10) // Return max 10 events
    })

  } catch (error) {
    console.error('[API] Security events error:', error)
    return NextResponse.json(
      { error: 'Failed to get security events' },
      { status: 500 }
    )
  }
}
