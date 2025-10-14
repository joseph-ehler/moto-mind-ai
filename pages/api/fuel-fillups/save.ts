/**
 * Save Fuel Fill-Up API
 * Saves fuel fill-up data to vehicle_events table
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

async function saveFuelFillupHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get tenant ID and supabase client from middleware
    const tenantId = (req as any).tenantId
    const supabase = (req as any).supabase
    
    if (!tenantId || !supabase) {
      return res.status(401).json({ error: 'Unauthorized - no tenant context' })
    }

    const {
      vehicle_id,
      total_cost,
      gallons,
      price_per_gallon,
      station_name,
      station_address,
      latitude,
      longitude,
      fuel_type,
      odometer_reading,
      fillup_date,
      notes,
      receipt_image_url,
      raw_vision_data,
      // Additional receipt details
      pump_number,
      transaction_number,
      tax_amount,
      payment_method,
      time,
      // Weather data
      weather_temperature_f,
      weather_condition,
      weather_precipitation_mm,
      weather_windspeed_mph,
      weather_humidity_percent,
      weather_pressure_inhg,
    } = req.body

    // Validation
    if (!vehicle_id) {
      return res.status(400).json({ error: 'vehicle_id is required' })
    }
    if (!total_cost || total_cost <= 0) {
      return res.status(400).json({ error: 'total_cost must be greater than 0' })
    }
    if (!gallons || gallons <= 0) {
      return res.status(400).json({ error: 'gallons must be greater than 0' })
    }
    if (!fillup_date) {
      return res.status(400).json({ error: 'fillup_date is required' })
    }

    // Verify vehicle belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', vehicle_id)
      .single()

    if (vehicleError || !vehicle) {
      return res.status(403).json({ error: 'Vehicle not found or access denied' })
    }

    console.log('💾 Saving fuel fill-up:', {
      vehicle_id,
      total_cost,
      gallons,
      station_name,
      odometer_reading,
    })

    // Build payload with extra data
    const payload: Record<string, any> = {
      fuel_type,
      price_per_gallon,
      station_address,
      receipt_image_url,
      raw_vision_data,
      // Additional receipt details
      pump_number,
      transaction_number,
      tran_number: transaction_number, // Alias for display
      tax_amount,
      payment_method,
      time,
      // Store all extracted data for reference
      extracted_data: {
        total_cost,
        gallons,
        station_name,
        station_address,
        fuel_type,
        odometer_reading,
        date: fillup_date,
        time,
        pump_number,
        transaction_number,
        tax_amount,
        payment_method,
      }
    }

    // Calculate fuel efficiency if we have odometer reading
    // (This will be enhanced later with comparison to previous fill-up)
    if (odometer_reading && gallons) {
      payload.odometer_reading = odometer_reading
    }

    // Build display summary for timeline
    const displaySummary = [
      gallons ? `${gallons.toFixed(2)} gallons` : null,
      price_per_gallon ? `@ $${price_per_gallon.toFixed(2)}/gal` : null,
      station_address ? station_address : null,
    ].filter(Boolean).join(' • ')

    // Store the receipt image URL in payload
    if (receipt_image_url) {
      payload.receipt_image_url = receipt_image_url
      payload.has_receipt_photo = true
    }

    // Log what we're about to save
    console.log('💾 Saving to database:', {
      station_name,
      displaySummary,
      total_cost,
      gallons,
      station_address,
    })

    // Insert into vehicle_events table
    const { data, error } = await supabase
      .from('vehicle_events')
      .insert({
        tenant_id: tenantId,
        vehicle_id,
        type: 'fuel',
        date: fillup_date,
        miles: odometer_reading || null,
        total_amount: total_cost,
        gallons,
        vendor: station_name,
        display_vendor: station_name,
        display_amount: total_cost,
        display_summary: displaySummary,
        notes: notes || null,
        geocoded_lat: latitude || null,
        geocoded_lng: longitude || null,
        geocoded_address: station_address || null,
        geocoded_at: new Date().toISOString(),
        // Weather data
        weather_temperature_f: weather_temperature_f || null,
        weather_condition: weather_condition || null,
        weather_precipitation_mm: weather_precipitation_mm || null,
        weather_windspeed_mph: weather_windspeed_mph || null,
        weather_humidity_percent: weather_humidity_percent || null,
        weather_pressure_inhg: weather_pressure_inhg || null,
        payload,
      })
      .select()
      .single()

    console.log('✅ Saved event:', {
      id: data?.id,
      display_vendor: data?.display_vendor,
      display_summary: data?.display_summary,
      weather: {
        temperature: weather_temperature_f,
        condition: weather_condition,
      }
    })

    if (error) {
      console.error('❌ Database error:', error)
      return res.status(500).json({ error: 'Failed to save fuel fill-up', details: error.message })
    }

    console.log('✅ Fuel fill-up saved:', data.id)

    return res.status(200).json({
      success: true,
      fillup: data,
      message: 'Fuel fill-up saved successfully!',
    })
  } catch (error: any) {
    console.error('❌ Save fuel fill-up error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    })
  }
}

// Export with tenant isolation middleware
export default withTenantIsolation(saveFuelFillupHandler)
