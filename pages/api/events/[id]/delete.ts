import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * DELETE /api/events/[id]/delete
 * Soft deletes an event (sets deleted_at timestamp)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { reason } = req.body

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID required' })
  }

  // Validate deletion reason
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({ 
      error: 'Deletion reason required (minimum 5 characters)' 
    })
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
      return res.status(500).json({ error: 'Failed to delete event' })
    }

    if (!data) {
      return res.status(404).json({ error: 'Event not found' })
    }

    return res.status(200).json({ 
      success: true,
      message: 'Event deleted successfully. Can be restored within 30 days.',
      event: data
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
