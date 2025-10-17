/**
 * Sessions API Route
 * GET /api/auth/sessions - Get all user sessions
 * DELETE /api/auth/sessions - Terminate all other sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserSessions, terminateAllOtherSessions } from '@/lib/auth/services/session-tracker'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get current device ID from cookie
    const currentDeviceId = request.cookies.get('device_id')?.value

    // Get all sessions
    const sessions = await getUserSessions(userId)
    
    // Mark current device
    const sessionsWithCurrent = sessions.map(s => ({
      ...s,
      isCurrent: s.deviceId === currentDeviceId
    }))

    return NextResponse.json({ sessions: sessionsWithCurrent })

  } catch (error) {
    console.error('[API] Get sessions failed:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get current device ID from cookie
    const currentDeviceId = request.cookies.get('device_id')?.value

    if (!currentDeviceId) {
      return NextResponse.json(
        { error: 'No device ID found - cannot identify current session' },
        { status: 400 }
      )
    }

    // Terminate all sessions except current device
    const result = await terminateAllOtherSessions(userId, currentDeviceId)

    return NextResponse.json({
      success: true,
      terminated: result.terminated,
      message: `Signed out ${result.terminated} other device${result.terminated !== 1 ? 's' : ''}`
    })

  } catch (error) {
    console.error('[API] Terminate sessions failed:', error)
    return NextResponse.json(
      { error: 'Failed to terminate sessions' },
      { status: 500 }
    )
  }
}
