import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * PATCH /api/events/[id]/edit
 * Updates an event with change tracking
 * 
 * App Router version - migrated from pages/api/events/[id]/edit.ts
 */
export async function PATCH(
  request: NextRequest,
  { params }): { params: { id: string } }
) {
  const { id } = params
  const body = await request.json()
  const { changes, reason } = body

  if (!id) {
    return NextResponse.json(
      { error: 'Event ID is required' },
      { status: 400 }
    )
  }

  if (!changes || !reason) {
    return NextResponse.json(
      { error: 'Changes and reason are required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch current event
    const { data: currentEvent, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: any = {
      edited_at: new Date().toISOString(),
      edit_reason: reason,
    }

    // Build change history entry
    const changeEntry = {
      edited_at: new Date().toISOString(),
      reason: reason,
      changes: Object.entries(changes).map(([field, newValue]) => ({
        field,
        old_value: currentEvent[field] || currentEvent.payload?.[field],
        new_value: newValue
      }))
    }

    // Append to edit_changes array or create new array
    const existingChanges = currentEvent.edit_changes || []
    updates.edit_changes = [...existingChanges, changeEntry]

    // Apply field updates
    Object.entries(changes).forEach(([field, value]) => {
      // Top-level fields
      if (['total_amount', 'gallons', 'miles', 'notes', 'date', 'vendor', 'geocoded_address'].includes(field)) {
        updates[field] = value
      } 
      // Payload fields
      else {
        updates.payload = {
          ...currentEvent.payload,
          [field]: value
        }
      }
    })

    // Update event in database
    const { data: updatedEvent, error: updateError } = await supabase
      .from('vehicle_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event:', updateError)
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
