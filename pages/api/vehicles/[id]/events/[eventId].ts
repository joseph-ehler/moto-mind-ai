import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: vehicleId, eventId } = req.query

  if (!vehicleId || !eventId) {
    return res.status(400).json({ error: 'Vehicle ID and Event ID required' })
  }

  try {
    switch (req.method) {
      case 'PUT':
        return await updateEvent(req, res, vehicleId as string, eventId as string)
      case 'DELETE':
        return await deleteEvent(req, res, vehicleId as string, eventId as string)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Event CRUD error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function updateEvent(req: NextApiRequest, res: NextApiResponse, vehicleId: string, eventId: string) {
  const updates = req.body

  console.log('🔧 Updating event:', eventId, 'with:', updates)

  // Build the update object
  const updateData: any = {
    edited_at: new Date().toISOString(),
    // edited_by: userId, // TODO: Add when auth is implemented
  }

  // Update payload fields
  if (updates.total_amount !== undefined) {
    updateData.payload = { 
      ...updates.payload, 
      total_amount: updates.total_amount 
    }
  }

  // Handle other common fields
  const allowedUpdates = ['type', 'date', 'miles', 'notes']
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field]
    }
  })

  // Update payload for nested fields
  if (updates.payload) {
    // Merge payload updates
    const { data: currentEvent } = await supabase
      .from('vehicle_events')
      .select('payload')
      .eq('id', eventId)
      .eq('vehicle_id', vehicleId)
      .single()

    if (currentEvent) {
      updateData.payload = {
        ...currentEvent.payload,
        ...updates.payload
      }
    }
  }

  const { data, error } = await supabase
    .from('vehicle_events')
    .update(updateData)
    .eq('id', eventId)
    .eq('vehicle_id', vehicleId)
    .select()
    .single()

  if (error) {
    console.error('❌ Update failed:', error)
    return res.status(500).json({ error: 'Failed to update event' })
  }

  console.log('✅ Event updated successfully')
  return res.status(200).json({ 
    success: true, 
    event: data,
    message: 'Event updated successfully'
  })
}

async function deleteEvent(req: NextApiRequest, res: NextApiResponse, vehicleId: string, eventId: string) {
  console.log('🗑️ Soft deleting event:', eventId)

  // Soft delete - set deleted_at timestamp
  const { data, error } = await supabase
    .from('vehicle_events')
    .update({ 
      deleted_at: new Date().toISOString(),
      // edited_by: userId, // TODO: Add when auth is implemented
    })
    .eq('id', eventId)
    .eq('vehicle_id', vehicleId)
    .select()
    .single()

  if (error) {
    console.error('❌ Delete failed:', error)
    return res.status(500).json({ error: 'Failed to delete event' })
  }

  console.log('✅ Event soft deleted successfully')
  return res.status(200).json({ 
    success: true, 
    event: data,
    message: 'Event deleted successfully'
  })
}


export default withTenantIsolation(handler)
