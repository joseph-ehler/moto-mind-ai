/**
 * Batch Location Sync API
 * 
 * POST /api/tracking/batch
 * 
 * Accepts batch uploads of location points from offline buffer
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessionId, points } = body

    if (!sessionId || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request - sessionId and points array required' },
        { status: 400 }
      )
    }

    // Validate points
    for (const point of points) {
      if (!point.lat || !point.lng || !point.timestamp) {
        return NextResponse.json(
          { error: 'Invalid point data' },
          { status: 400 }
        )
      }
    }

    // Get Supabase client
    const supabase = getSupabaseClient()

    // Use NextAuth user ID from session
    const userId = (session.user as any).id
    
    if (!userId) {
      console.error('[API] No user ID in session')
      return NextResponse.json(
        { error: 'Invalid session - no user ID' },
        { status: 400 }
      )
    }

    console.log('[API] Processing tracking batch for user:', userId, session.user.email)

    // Check if tracking session exists
    let { data: trackingSession, error: sessionError } = await supabase
      .from('tracking_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    // Create session if it doesn't exist
    if (sessionError || !trackingSession) {
      const { data: newSession, error: createError } = await supabase
        .from('tracking_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          start_time: new Date(points[0].timestamp).toISOString(),
          status: 'active'
        })
        .select()
        .single()

      if (createError || !newSession) {
        console.error('[API] Failed to create tracking session:', createError)
        return NextResponse.json(
          { error: 'Failed to create tracking session' },
          { status: 500 }
        )
      }

      trackingSession = newSession
    }

    // Insert location points
    const locationPoints = points.map(point => ({
      session_id: trackingSession.id,
      latitude: point.lat,
      longitude: point.lng,
      speed: point.speed || 0,
      heading: point.heading || 0,
      altitude: point.altitude,
      accuracy: point.accuracy,
      recorded_at: new Date(point.timestamp).toISOString()
    }))

    const { error: insertError } = await supabase
      .from('location_points')
      .insert(locationPoints)

    if (insertError) {
      console.error('[API] Failed to insert location points:', insertError)
      return NextResponse.json(
        { error: 'Failed to save location points' },
        { status: 500 }
      )
    }

    console.log(`[API] ✅ Saved ${points.length} location points for session ${sessionId}`)

    return NextResponse.json({
      success: true,
      pointsSaved: points.length,
      sessionId: trackingSession.session_id
    })
  } catch (error) {
    console.error('[API] Batch tracking error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
