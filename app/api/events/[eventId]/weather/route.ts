import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/events/[eventId]/weather
 * Fetch and update weather data for an event
 * 
 * Action sub-resource - retrieves historical weather based on event date/location
 * Uses Open-Meteo Historical Weather API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch current event
    const { data: event, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Need date and location for weather
    if (!event.date || (!event.geocoded_lat || !event.geocoded_lng)) {
      return NextResponse.json(
        { 
          error: 'Event must have date and geocoded location for weather lookup',
          missing: {
            date: !event.date,
            location: !event.geocoded_lat || !event.geocoded_lng
          }
        },
        { status: 400 }
      )
    }

    // Extract date without timezone conversion
    const dateStr = event.date.split('T')[0] // YYYY-MM-DD
    
    console.log('🌤️ Fetching weather for:', {
      eventId,
      date: dateStr,
      lat: event.geocoded_lat,
      lng: event.geocoded_lng
    })

    // Fetch weather from Open-Meteo Historical API
    const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${event.geocoded_lat}&` +
      `longitude=${event.geocoded_lng}&` +
      `start_date=${dateStr}&` +
      `end_date=${dateStr}&` +
      `daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&` +
      `timezone=auto&` +
      `temperature_unit=fahrenheit&` +
      `windspeed_unit=mph&` +
      `precipitation_unit=inch`

    const weatherResponse = await fetch(weatherUrl)
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text()
      console.error('❌ Weather API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch weather data from Open-Meteo' },
        { status: 500 }
      )
    }

    const weatherData = await weatherResponse.json()

    if (!weatherData.daily) {
      return NextResponse.json(
        { error: 'No weather data available for this date' },
        { status: 404 }
      )
    }

    // Calculate average temperature
    const tempMax = weatherData.daily.temperature_2m_max[0]
    const tempMin = weatherData.daily.temperature_2m_min[0]
    const avgTemp = Math.round((tempMax + tempMin) / 2)

    // Determine condition based on precipitation and temperature
    const precip = weatherData.daily.precipitation_sum[0] || 0
    const wind = weatherData.daily.windspeed_10m_max[0] || 0
    
    let condition: 'clear' | 'rain' | 'snow' | 'cloudy' | 'extreme' = 'clear'
    if (precip > 0.5) {
      condition = avgTemp < 35 ? 'snow' : 'rain'
    } else if (wind > 25 || avgTemp > 100 || avgTemp < 10) {
      condition = 'extreme'
    } else if (precip > 0.1) {
      condition = 'cloudy'
    }

    // Update event with weather data
    const updates = {
      weather_temperature_f: avgTemp,
      weather_condition: condition,
      weather_precipitation_mm: precip * 25.4, // inch to mm
      weather_windspeed_mph: wind,
      weather_humidity_percent: null, // Not available in historical API
      weather_pressure_inhg: null // Not available in historical API
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('vehicle_events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating event with weather:', updateError)
      return NextResponse.json(
        { error: 'Failed to update event with weather' },
        { status: 500 }
      )
    }

    console.log('✅ Weather updated successfully for event:', eventId)

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      weather: {
        temperature_f: avgTemp,
        temperature_max_f: tempMax,
        temperature_min_f: tempMin,
        condition,
        precipitation_inches: precip,
        windspeed_mph: wind,
        date: dateStr
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
