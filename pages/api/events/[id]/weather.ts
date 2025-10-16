import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/events/[id]/weather
 * Re-fetches weather data for an event based on its date/time and location
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
    return res.status(400).json({ error: 'Event ID is required' })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch current event
    const { data: event, error: fetchError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Need date and location for weather
    if (!event.date || (!event.geocoded_lat || !event.geocoded_lng)) {
      console.error('❌ Missing data for weather:', {
        hasDate: !!event.date,
        hasLat: !!event.geocoded_lat,
        hasLng: !!event.geocoded_lng
      })
      return res.status(400).json({ 
        error: 'Event must have date and geocoded location for weather lookup' 
      })
    }

    // Fetch weather from Open-Meteo Historical API
    // Extract date without timezone conversion
    const dateStr = event.date.split('T')[0] // YYYY-MM-DD - no timezone conversion!
    
    console.log('🌤️ Fetching weather for:', {
      eventId: id,
      date: dateStr,
      originalDate: event.date,
      lat: event.geocoded_lat,
      lng: event.geocoded_lng
    })

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

    console.log('🌤️ Weather URL:', weatherUrl)
    const weatherResponse = await fetch(weatherUrl)
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text()
      console.error('❌ Weather API error:', errorText)
      return res.status(500).json({ error: 'Failed to fetch weather data' })
    }

    const weatherData = await weatherResponse.json()
    console.log('🌤️ Weather API response:', JSON.stringify(weatherData, null, 2))

    if (!weatherData.daily) {
      console.error('❌ No daily weather data in response')
      return res.status(404).json({ error: 'No weather data available for this date' })
    }

    // Calculate average temperature
    const tempMax = weatherData.daily.temperature_2m_max[0]
    const tempMin = weatherData.daily.temperature_2m_min[0]
    const avgTemp = Math.round((tempMax + tempMin) / 2)

    console.log('🌡️ Temperature calculation:', {
      tempMax,
      tempMin,
      avgTemp,
      date: dateStr
    })

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

    console.log('🌤️ Updating event with weather:', updates)

    const { data: updatedEvent, error: updateError } = await supabase
      .from('vehicle_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating event with weather:', updateError)
      return res.status(500).json({ error: 'Failed to update event with weather' })
    }

    console.log('✅ Weather updated successfully for event:', id)

    return res.status(200).json({
      success: true,
      event: updatedEvent,
      weather: updates
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}


export default withTenantIsolation(handler)
