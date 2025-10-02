import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: vehicleId, eventId } = req.query

  if (!vehicleId || !eventId) {
    return res.status(400).json({ error: 'Vehicle ID and Event ID required' })
  }

  try {
    if (req.method === 'GET') {
      // Fetch single event with linked image
      const { data: event, error } = await supabase
        .from('vehicle_events')
        .select(`
          *,
          image:vehicle_images(
            id,
            public_url,
            filename,
            ai_category,
            ai_description
          )
        `)
        .eq('id', eventId)
        .eq('vehicle_id', vehicleId)
        .single()

      if (error) throw error

      if (!event) {
        return res.status(404).json({ error: 'Event not found' })
      }

      return res.status(200).json({ event })
    }

    if (req.method === 'DELETE') {
      // Delete event
      const { error } = await supabase
        .from('vehicle_events')
        .delete()
        .eq('id', eventId)
        .eq('vehicle_id', vehicleId)

      if (error) throw error

      return res.status(200).json({ success: true })
    }

    if (req.method === 'PATCH') {
      // Update event with audit trail
      const updates = req.body
      
      // First, get the current state to track changes
      const { data: currentEvent, error: fetchError } = await supabase
        .from('vehicle_events')
        .select('*')
        .eq('id', eventId)
        .eq('vehicle_id', vehicleId)
        .single()

      if (fetchError) {
        console.error('❌ Failed to fetch current event:', fetchError)
        throw fetchError
      }

      // Track what fields are changing
      const changes: any = {}
      const fieldsToTrack = ['miles', 'notes', 'total_amount', 'gallons', 'vendor']
      
      fieldsToTrack.forEach(field => {
        if (updates[field] !== undefined && updates[field] !== currentEvent[field]) {
          changes[field] = {
            from: currentEvent[field],
            to: updates[field]
          }
        }
      })

      // Also track payload changes
      if (updates.payload) {
        const payloadChanges: any = {}
        Object.keys(updates.payload).forEach(key => {
          if (updates.payload[key] !== currentEvent.payload?.[key]) {
            payloadChanges[key] = {
              from: currentEvent.payload?.[key],
              to: updates.payload[key]
            }
          }
        })
        if (Object.keys(payloadChanges).length > 0) {
          changes.payload = payloadChanges
        }
      }
      
      // Get existing edit history
      const existingHistory = currentEvent.edit_history || []
      
      // If this is the first edit and we have old edit_changes data, migrate it
      if (existingHistory.length === 0 && currentEvent.edit_changes && currentEvent.edited_at) {
        existingHistory.push({
          timestamp: currentEvent.edited_at,
          reason: currentEvent.edit_reason || 'Previous edit',
          changes: currentEvent.edit_changes,
        })
      }
      
      // Create new edit entry
      const newEditEntry = {
        timestamp: new Date().toISOString(),
        reason: updates.edit_reason || 'Manual edit via UI',
        changes: changes,
        // TODO: Add edited_by when auth is implemented
        // edited_by: userId,
      }
      
      console.log('📚 Edit history:', {
        existingHistoryLength: existingHistory.length,
        currentEditChanges: currentEvent.edit_changes,
        newEditEntry
      })
      
      // Add audit trail fields
      const updateData = {
        ...updates,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        edit_changes: changes, // Keep for backward compatibility
        edit_history: [...existingHistory, newEditEntry], // Full history array
        // TODO: Add edited_by when auth is implemented
        // edited_by: userId,
      }

      console.log('🔧 Updating event with changes tracked:', eventId, { changes, updateData })

      const { data: event, error } = await supabase
        .from('vehicle_events')
        .update(updateData)
        .eq('id', eventId)
        .eq('vehicle_id', vehicleId)
        .select()
        .single()

      if (error) {
        console.error('❌ Update failed:', error)
        throw error
      }

      console.log('✅ Event updated successfully with audit trail')
      return res.status(200).json({ event })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Event API error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
