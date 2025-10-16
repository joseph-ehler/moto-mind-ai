import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * DELETE /api/events/[id]/delete
 * Soft deletes an event (sets deleted_at timestamp)
 * 
 * App Router version - migrated from pages/api/events/[id]/delete.ts
 */
export async function DELETE(
  request: NextRequest,
  { params }): { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()
  const { reason } = body

  if (!id) {
    return NextResponse.json(
      { error: 'Event ID required' },
      { status: 400 }
    )
  }

  // Validate deletion reason
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return NextResponse.json(
      { error: 'Deletion reason required (minimum 5 characters)' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Soft delete (set deleted_at timestamp)
    const { data, error } = await supabase
      .from('vehicle_events')
      .update({
        deleted_at: new Date().toISOString(),
        deletion_reason: reason.trim()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error soft deleting event:', error)
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully. Can be restored within 30 days.',
      event: data
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
