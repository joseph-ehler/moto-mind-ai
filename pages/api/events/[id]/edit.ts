import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'

/**
 * PATCH /api/events/[id]/edit
 * Updates an event with change tracking
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { changes, reason } = req.body

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' })
  }

  if (!changes || !reason) {
    return res.status(400).json({ error: 'Changes and reason are required' })
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
      return res.status(404).json({ error: 'Event not found' })
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
      // Payload fields (time, fuel_type, pump_number, transaction_number, payment_method, etc.)
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
      return res.status(500).json({ error: 'Failed to update event' })
    }

    return res.status(200).json({
      success: true,
      event: updatedEvent
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


export default withTenantIsolation(handler)
