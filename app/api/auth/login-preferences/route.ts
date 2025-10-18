/**
 * Login Preferences API
 * 
 * GET: Get user's last login method (by email, before auth)
 * POST: Update user's login method (after successful auth)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client'

interface LoginPreference {
  user_id: string
  last_method: string
  preferred_method: string | null
  login_count: number
  last_login_at: string
}

// GET: Get login preferences by email (unauthenticated)
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
    
    const supabase = getSupabaseClient()
    
    // Get login preferences by email (using simple email column lookup)
    const { data, error } = await supabase.rpc('get_login_preferences_by_email_simple', {
      p_email: email.toLowerCase().trim(),
    } as any) as { data: LoginPreference[] | null, error: any }
    
    if (error) {
      console.error('[LoginPreferences] Error fetching preferences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }
    
    // No preferences found (new user)
    if (!data || data.length === 0) {
      return NextResponse.json({
        found: false,
        lastMethod: null,
        message: 'No previous login found',
      })
    }
    
    const prefs = data[0]
    
    return NextResponse.json({
      found: true,
      lastMethod: prefs.last_method,
      preferredMethod: prefs.preferred_method,
      loginCount: prefs.login_count,
      lastLoginAt: prefs.last_login_at,
    })
  } catch (error: any) {
    console.error('[LoginPreferences] GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Update login preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, method, email } = body
    
    if (!userId || !method) {
      return NextResponse.json(
        { error: 'userId and method parameters required' },
        { status: 400 }
      )
    }
    
    // Validate method
    const validMethods = ['google', 'email', 'sms']
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: `Invalid method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseClient()
    
    // Update login preferences
    const { data, error } = await supabase.rpc('update_login_preferences', {
      p_user_id: userId,
      p_method: method,
      p_email: email || null,
    } as any) as { 
      data: Array<{
        last_method: string
        login_count: number
        last_login_at: string
      }> | null, 
      error: any 
    }
    
    if (error) {
      console.error('[LoginPreferences] Error updating preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }
    
    const prefs = data && data.length > 0 ? data[0] : null
    
    return NextResponse.json({
      success: true,
      lastMethod: prefs?.last_method || method,
      loginCount: prefs?.login_count || 1,
      lastLoginAt: prefs?.last_login_at || new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[LoginPreferences] POST error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
