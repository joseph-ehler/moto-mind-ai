import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/events/[id]
 * Fetches a single event with all details
 * 
 * App Router version - migrated from pages/api/events/[id].ts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!id) {
    return NextResponse.json(
      { error: 'Event ID is required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch event with all data
    const { data: event, error } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
      return NextResponse.json(
        { error: 'Failed to fetch event' },
        { status: 500 }
      )
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Fetch related vehicle info
    console.log('🔍 Fetching vehicle for vehicle_id:', event.vehicle_id)
    
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, year, make, model, trim')
      .eq('id', event.vehicle_id)
      .single()
    
    // Fetch event photos
    const { data: photos, error: photosError } = await supabase
      .from('vehicle_images')
      .select('id, public_url, filename, image_type, is_primary, created_at')
      .eq('event_id', event.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
    
    if (photosError) {
      console.error('⚠️ Error fetching photos:', photosError)
    }
    
    if (vehicleError) {
      console.error('⚠️ Error fetching vehicle:', vehicleError)
    } else if (vehicle) {
      // Construct name from make/model/year
      const vehicleWithName = {
        ...vehicle,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
      }
      console.log('🚗 Vehicle data fetched:', vehicleWithName)
      // Replace vehicle reference
      Object.assign(vehicle, vehicleWithName)
    }

    // Build response
    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        type: event.type,
        date: event.date,
        
        // Financial
        total_amount: event.total_amount,
        gallons: event.gallons,
        vendor: event.vendor,
        
        // Location
        geocoded_address: event.geocoded_address,
        geocoded_lat: event.geocoded_lat,
        geocoded_lng: event.geocoded_lng,
        
        // Display fields
        display_vendor: event.display_vendor,
        display_summary: event.display_summary,
        display_amount: event.display_amount,
        
        // Vehicle
        miles: event.miles,
        notes: event.notes,
        
        // Weather
        weather_temperature_f: event.weather_temperature_f,
        weather_condition: event.weather_condition,
        weather_precipitation_mm: event.weather_precipitation_mm,
        weather_windspeed_mph: event.weather_windspeed_mph,
        weather_humidity_percent: event.weather_humidity_percent,
        weather_pressure_inhg: event.weather_pressure_inhg,
        
        // RICH FUEL DATA (fraud detection, compliance, maintenance)
        transaction_id: event.transaction_id,
        auth_code: event.auth_code,
        invoice_number: event.invoice_number,
        payment_method: event.payment_method,
        station_address: event.station_address,
        pump_number: event.pump_number,
        transaction_time: event.transaction_time,
        price_per_gallon: event.price_per_gallon,
        fuel_level: event.fuel_level,
        fuel_grade: event.fuel_grade,
        products: event.products,
        receipt_metadata: event.receipt_metadata,
        vision_confidence_detail: event.vision_confidence_detail,
        validation_results: event.validation_results,
        
        // Payload (contains all extracted data)
        payload: event.payload,
        
        // Metadata
        created_at: event.created_at,
        edited_at: event.edited_at,
        edit_reason: event.edit_reason,
        edit_changes: event.edit_changes,
        
        // Vehicle info
        vehicle: vehicle,
        
        // Event photos
        photos: photos || [],
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
