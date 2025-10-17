/**
 * Batch Location Sync API
 * 
 * POST /api/tracking/batch
 * 
 * Accepts batch uploads of location points from offline buffer
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUserServer } from '@/lib/auth/current-user'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (throws if not authenticated)
    const user = await requireUserServer()
    
    console.log('[API] User:', user.email)
    console.log('[API] User ID:', user.id)

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

    console.log('[API] Processing tracking batch for user:', user.id, user.email)

    // Check if tracking session exists
    let { data: trackingSession, error: sessionError } = await supabase
      .from('tracking_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    // Create session if it doesn't exist
    if (sessionError || !trackingSession) {
      const { data: newSession, error: createError } = await supabase
        .from('tracking_sessions')
        .insert({
          session_id: sessionId,
          user_id: user.id,
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
