/**
 * Quick Odometer Update API
 * 
 * POST /api/vehicles/:id/events/quick-odometer
 * 
 * Creates a new dashboard_snapshot event with current mileage
 * Used from AI chat for quick mileage logging
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId } = req.query
  const { mileage, fuel_level, notes, source, service_type, event_type } = req.body

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  if (!mileage || typeof mileage !== 'number') {
    return res.status(400).json({ error: 'Mileage required and must be a number' })
  }

  try {
    console.log(`📊 Creating quick odometer update for vehicle ${vehicleId}:`, {
      mileage,
      fuel_level,
      source: source || 'ai_chat'
    })

    // Get vehicle to verify it exists, get tenant_id, and verify VIN
    // TODO: Add auth middleware to verify user owns this vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, tenant_id, user_id, year, make, model, vin')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      console.error('❌ Vehicle not found:', vehicleError)
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // Log vehicle info for audit trail (with masked VIN for security)
    console.log(`✅ Vehicle verified: ${vehicle.year} ${vehicle.make} ${vehicle.model} (VIN: ...${vehicle.vin?.slice(-6) || 'N/A'})`)

    // TODO: Verify authenticated user owns this vehicle
    // if (vehicle.user_id !== authenticatedUserId) {
    //   return res.status(403).json({ error: 'Forbidden: Not your vehicle' })
    // }

    // Determine event type and create appropriate event
    const eventTypeToUse = event_type || (service_type ? 'service' : 'odometer')
    
    const newEvent = {
      tenant_id: vehicle.tenant_id,
      vehicle_id: vehicleId,
      type: eventTypeToUse,
      date: new Date().toISOString(),
      miles: mileage,
      notes: notes || (service_type 
        ? `${service_type} logged from ${source || 'AI chat'} at ${mileage.toLocaleString()} miles`
        : `Quick odometer update from ${source || 'AI chat'}: ${mileage.toLocaleString()} miles`),
      ...(service_type && {
        display_summary: service_type,
        vendor_name: 'DIY / Unknown'
      }),
      payload: {
        source: source || 'ai_chat',
        fuel_level: fuel_level || null,
        extracted_from_chat: true,
        ...(service_type && { service_type })
      }
    }

    const { data: event, error: eventError } = await supabase
      .from('vehicle_events')
      .insert(newEvent)
      .select()
      .single()

    if (eventError) {
      console.error('❌ Failed to create event:', eventError)
      throw eventError
    }

    console.log('✅ Quick odometer update created:', event.id)

    return res.status(201).json({
      success: true,
      event: {
        id: event.id,
        type: event.type,
        date: event.date,
        miles: event.miles
      },
      message: `Odometer updated to ${mileage.toLocaleString()} miles`
    })
  } catch (error: any) {
    console.error('❌ Quick odometer update failed:', error)
    return res.status(500).json({
      error: 'Failed to update odometer',
      details: error.message
    })
  }
}
