/**
 * Event Correction API
 * 
 * PATCH /api/vehicles/:id/events/:eventId/correct
 * 
 * Corrects an existing event while maintaining audit trail
 * Used from AI chat for data corrections
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId, eventId } = req.query
  const { corrections, reason, source } = req.body

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID required' })
  }

  if (!corrections || typeof corrections !== 'object') {
    return res.status(400).json({ error: 'Corrections object required' })
  }

  try {
    console.log(`🛠️  Correcting event ${eventId} for vehicle ${vehicleId}:`, corrections)

    // Get existing event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', eventId)
      .eq('vehicle_id', vehicleId)
      .single()

    if (fetchError || !existingEvent) {
      console.error('❌ Event not found:', fetchError)
      return res.status(404).json({ error: 'Event not found' })
    }

    // Build changes object for audit trail
    const changes: Record<string, { from: any; to: any }> = {}
    const updates: Record<string, any> = {}

    // Process each correction
    for (const [field, newValue] of Object.entries(corrections)) {
      const oldValue = existingEvent[field]
      
      // Special handling for payload fields
      if (field.startsWith('payload.')) {
        const payloadField = field.replace('payload.', '')
        const currentPayload = existingEvent.payload || {}
        
        changes[field] = {
          from: currentPayload[payloadField],
          to: newValue
        }
        
        updates.payload = {
          ...currentPayload,
          [payloadField]: newValue
        }
      } else {
        changes[field] = {
          from: oldValue,
          to: newValue
        }
        updates[field] = newValue
      }
    }

    // Build edit history entry
    const editHistoryEntry = {
      timestamp: new Date().toISOString(),
      reason: reason || 'Correction from AI chat',
      source: source || 'ai_chat',
      changes
    }

    // Get existing edit history or create new array
    const existingHistory = existingEvent.edit_history || []
    const newHistory = [...existingHistory, editHistoryEntry]

    // Update event with corrections and audit trail
    const { data: updatedEvent, error: updateError } = await supabase
      .from('vehicle_events')
      .update({
        ...updates,
        edit_history: newHistory,
        edit_changes: changes,
        edited_at: new Date().toISOString(),
        edited_by: source || 'ai_chat',
        edit_reason: reason || 'Correction from AI chat',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update event:', updateError)
      throw updateError
    }

    // Create audit log entry
    await supabase
      .from('vehicle_event_audit_logs')
      .insert({
        event_id: eventId,
        event_date: existingEvent.date,
        vehicle_id: vehicleId,
        tenant_id: existingEvent.tenant_id,
        action: 'corrected',
        changes,
        original_values: {
          ...Object.fromEntries(
            Object.keys(corrections).map(field => [field, existingEvent[field]])
          )
        },
        created_by: source || 'ai_chat'
      })

    console.log('✅ Event corrected with audit trail:', eventId)

    return res.status(200).json({
      success: true,
      event: {
        id: updatedEvent.id,
        type: updatedEvent.type,
        date: updatedEvent.date,
        corrections_applied: Object.keys(corrections).length
      },
      changes,
      message: `Event corrected successfully. ${Object.keys(corrections).length} field(s) updated.`
    })
  } catch (error: any) {
    console.error('❌ Event correction failed:', error)
    return res.status(500).json({
      error: 'Failed to correct event',
      details: error.message
    })
  }
}


export default withTenantIsolation(handler)
