import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/events/[id]/restore
 * Restores a soft-deleted event (clears deleted_at)
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID required' })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if event exists and is deleted
    const { data: existing, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('deleted_at')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (!existing.deleted_at) {
      return res.status(400).json({ error: 'Event is not deleted' })
    }

    // Check if within 30-day recovery window
    const deletedDate = new Date(existing.deleted_at)
    const daysSinceDelete = (Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceDelete > 30) {
      return res.status(400).json({ 
        error: 'Event was deleted more than 30 days ago and cannot be restored' 
      })
    }

    // Restore event (clear deleted_at)
    const { data, error } = await supabase
      .from('vehicle_events')
      .update({
        deleted_at: null,
        deletion_reason: null,
        restored_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error restoring event:', error)
      return res.status(500).json({ error: 'Failed to restore event' })
    }

    return res.status(200).json({ 
      success: true,
      message: 'Event restored successfully',
      event: data
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


export default withTenantIsolation(handler)
