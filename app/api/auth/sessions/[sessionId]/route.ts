/**
 * Single Session API Route
 * DELETE /api/auth/sessions/[sessionId] - Terminate specific session
 */

import { NextRequest, NextResponse } from 'next/server'
import { terminateSession } from '@/lib/auth/services/session-tracker'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const success = await terminateSession(params.sessionId, userId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to terminate session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session terminated'
    })

  } catch (error) {
    console.error('[API] Terminate session failed:', error)
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    )
  }
}
