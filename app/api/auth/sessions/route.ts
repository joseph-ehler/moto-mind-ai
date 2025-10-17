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

    // Get all sessions
    const sessions = await getUserSessions(userId)

    return NextResponse.json({ sessions })

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
    const { userId, currentSessionId } = await request.json()

    if (!userId || !currentSessionId) {
      return NextResponse.json(
        { error: 'userId and currentSessionId are required' },
        { status: 400 }
      )
    }

    // Terminate all other sessions
    const result = await terminateAllOtherSessions(userId, currentSessionId)

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
