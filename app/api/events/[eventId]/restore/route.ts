import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * POST /api/events/[eventId]/restore
 * Restore a soft-deleted event (clears deleted_at)
 * 
 * Action sub-resource - undo deletion within 30-day window
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if event exists and is deleted
    const { data: existing, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('deleted_at')
      .eq('id', eventId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!existing.deleted_at) {
      return NextResponse.json(
        { error: 'Event is not deleted' },
        { status: 400 }
      )
    }

    // Check if within 30-day recovery window
    const deletedDate = new Date(existing.deleted_at)
    const daysSinceDelete = (Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceDelete > 30) {
      return NextResponse.json(
        { 
          error: 'Event was deleted more than 30 days ago and cannot be restored',
          deleted_at: existing.deleted_at,
          days_since_delete: Math.floor(daysSinceDelete)
        },
        { status: 400 }
      )
    }

    // Restore event (clear deleted_at)
    const { data: event, error } = await supabase
      .from('vehicle_events')
      .update({
        deleted_at: null,
        deletion_reason: null,
        restored_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('Error restoring event:', error)
      return NextResponse.json(
        { error: 'Failed to restore event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Event restored successfully',
      event
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
