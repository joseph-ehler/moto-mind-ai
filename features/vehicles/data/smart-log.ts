/**
 * Smart Event Logging API
 * 
 * Universal endpoint for AI-driven event logging
 * Supports: service, fuel, damage, warnings, inspections, etc.
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId } = req.query
  const { 
    type,           // Event type: 'service', 'fuel', 'damage', etc.
    mileage, 
    date,           // Optional: defaults to now
    notes, 
    source,
    // Type-specific fields
    service_type,   // For service events
    vendor_name,
    cost,
    // Fuel-specific
    gallons,
    price_per_gallon,
    station_name,
    trip_miles,
    // Damage-specific
    damage_type,
    severity,
    location,
    // Warning-specific
    warning_type,
    error_codes,
    // Photos
    photo_urls,
    // Generic payload
    payload
  } = req.body

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  if (!type) {
    return res.status(400).json({ error: 'Event type required' })
  }

  try {
    // Get vehicle info
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, tenant_id, year, make, model, vin')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      console.error('❌ Vehicle not found:', vehicleError)
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    console.log(`✅ Vehicle verified: ${vehicle.year} ${vehicle.make} ${vehicle.model} (VIN: ...${vehicle.vin?.slice(-6) || 'N/A'})`)

    // Build event based on type
    const eventDate = date || new Date().toISOString()
    
    const baseEvent = {
      tenant_id: vehicle.tenant_id,
      vehicle_id: vehicleId,
      type,
      date: eventDate,
      miles: mileage || null,
      notes: notes || null,
      payload: {
        source: source || 'ai_chat',
        extracted_from_chat: true,
        ...(photo_urls && photo_urls.length > 0 && { photo_urls }),
        ...(payload || {})
      }
    }

    // Add type-specific fields
    let enrichedEvent: any = { ...baseEvent }

    switch (type) {
      case 'service':
      case 'maintenance':
        enrichedEvent = {
          ...enrichedEvent,
          display_summary: service_type || 'Service',
          vendor_name: vendor_name || 'DIY / Unknown',
          total_amount: cost || null,
          notes: notes || `${service_type || 'Service'} logged from ${source || 'AI chat'} at ${mileage?.toLocaleString() || 'unknown'} miles`,
          payload: {
            ...enrichedEvent.payload,
            service_type,
            cost
          }
        }
        break

      case 'fuel':
        const mpg = trip_miles && gallons ? (trip_miles / gallons).toFixed(1) : null
        enrichedEvent = {
          ...enrichedEvent,
          display_summary: `Fuel - ${gallons || '?'} gal`,
          total_amount: cost || null,
          vendor_name: station_name || null,
          notes: notes || `Fuel fill-up: ${gallons || '?'} gallons, ${trip_miles || '?'} miles${mpg ? ` (${mpg} MPG)` : ''}`,
          payload: {
            ...enrichedEvent.payload,
            gallons,
            cost,
            price_per_gallon: price_per_gallon || (cost && gallons ? (cost / gallons).toFixed(2) : null),
            station_name,
            trip_miles,
            mpg_calculated: mpg ? parseFloat(mpg) : null
          }
        }
        break

      case 'damage':
      case 'incident':
        enrichedEvent = {
          ...enrichedEvent,
          display_summary: damage_type || 'Damage Reported',
          notes: notes || `${damage_type || 'Damage'} - ${severity || 'Unknown severity'} - ${location || 'Unknown location'}`,
          payload: {
            ...enrichedEvent.payload,
            damage_type,
            severity: severity || 'minor',
            location,
            cost
          }
        }
        break

      case 'dashboard_snapshot':
        const warningLightsList = payload?.warning_lights || []
        const warningCount = Array.isArray(warningLightsList) ? warningLightsList.length : 0
        enrichedEvent = {
          ...enrichedEvent,
          display_summary: `Dashboard Snapshot - ${mileage?.toLocaleString() || '?'} mi`,
          notes: notes || `Dashboard captured: ${mileage?.toLocaleString() || 'unknown'} miles, ${payload?.fuel_level || '?'}% fuel${warningCount > 0 ? `, ${warningCount} warning(s)` : ''}`,
          payload: {
            ...enrichedEvent.payload,
            fuel_level: payload?.fuel_level,
            engine_temp: payload?.engine_temp,
            outside_temp: payload?.outside_temp,
            warning_lights: warningLightsList,
            warning_count: warningCount
          }
        }
        break

      case 'dashboard_warning':
        enrichedEvent = {
          ...enrichedEvent,
          display_summary: warning_type || 'Dashboard Warning',
          notes: notes || `Warning: ${warning_type || 'Unknown'}${error_codes ? ` (${error_codes})` : ''}`,
          payload: {
            ...enrichedEvent.payload,
            warning_type: warning_type ? [warning_type] : [],
            error_codes: error_codes ? (Array.isArray(error_codes) ? error_codes : [error_codes]) : [],
            severity: severity || 'medium',
            resolved: false
          }
        }
        break

      case 'odometer':
        enrichedEvent = {
          ...enrichedEvent,
          display_summary: `Odometer: ${mileage?.toLocaleString() || '?'} mi`,
          notes: notes || `Odometer reading: ${mileage?.toLocaleString() || 'unknown'} miles`
        }
        break

      default:
        // Generic event - use provided fields as-is
        enrichedEvent = {
          ...enrichedEvent,
          display_summary: notes || type,
          notes: notes || `${type} event logged`
        }
    }

    // Create the event
    const { data: event, error: eventError } = await supabase
      .from('vehicle_events')
      .insert(enrichedEvent)
      .select()
      .single()

    if (eventError) {
      console.error('❌ Failed to create event:', eventError)
      throw eventError
    }

    console.log(`✅ Smart-log event created: ${event.type} (${event.id})`)

    return res.status(201).json({
      success: true,
      event: {
        id: event.id,
        type: event.type,
        date: event.date,
        miles: event.miles,
        display_summary: event.display_summary,
        notes: event.notes
      },
      message: `${type} event logged successfully`
    })
  } catch (error: any) {
    console.error('❌ Smart-log error:', error)
    return res.status(500).json({ 
      error: 'Failed to log event',
      details: error.message 
    })
  }
}


export default withTenantIsolation(handler)
