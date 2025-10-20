/**
 * User Notification Preferences API
 * GET /api/user/notifications - Get notification preferences
 * PATCH /api/user/notifications - Update notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getSupabaseClient } from '@/lib/supabase/client'

const supabase = getSupabaseClient()

export interface NotificationPreferences {
  emailNotifications: boolean
  securityAlerts: boolean
  newDeviceLogin: boolean
  unusualActivity: boolean
  passwordChanged: boolean
  sessionExpired: boolean
}

const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  securityAlerts: true,
  newDeviceLogin: true,
  unusualActivity: true,
  passwordChanged: true,
  sessionExpired: false,
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get preferences from database
    const { data: prefs, error } = await supabase
      .from('user_notification_preferences')
      .select('preferences')
      .eq('user_id', session.user.email)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('[API] Failed to get preferences:', error)
    }

    return NextResponse.json({
      preferences: prefs?.preferences || defaultPreferences
    })

  } catch (error) {
    console.error('[API] Notifications GET error:', error)
    return NextResponse.json(
      { preferences: defaultPreferences }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { preferences } = body

    // Upsert preferences
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: session.user.email,
        preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('[API] Failed to save preferences:', error)
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated',
      preferences
    })

  } catch (error) {
    console.error('[API] Notifications PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
