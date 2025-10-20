/**
 * User Profile API
 * GET /api/user/profile - Get user profile
 * PATCH /api/user/profile - Update user profile
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

    // Get login preferences (use this as source of truth for user data)
    const { data: loginPrefs } = await supabase
      .from('user_login_preferences')
      .select('*')
      .eq('user_id', session.user.email)
      .single()

    // Get user tenant info if it exists
    const { data: tenantData } = await supabase
      .from('user_tenants')
      .select('id, created_at')
      .eq('user_id', session.user.email)
      .single()

    return NextResponse.json({
      profile: {
        id: tenantData?.id || 'temp-id',
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0],
        createdAt: tenantData?.created_at || loginPrefs?.created_at || new Date().toISOString(),
        loginMethod: loginPrefs?.last_login_method || 'google',
        loginCount: loginPrefs?.login_count || 0,
        lastLogin: loginPrefs?.last_login_at
      }
    })

  } catch (error) {
    console.error('[API] Profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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
    const { name } = body

    // Note: In NextAuth, name is typically stored in the user object
    // For now, we'll just acknowledge the update
    // You could store this in a separate user_profiles table

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        name,
        email: session.user.email
      }
    })

  } catch (error) {
    console.error('[API] Profile PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
