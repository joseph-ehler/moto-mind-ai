import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { OpenMeteoProvider } from '@/lib/services/weather'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const weatherProvider = new OpenMeteoProvider()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid garage ID' })
  }

  try {
    // Get garage location
    const { data: garage, error: garageError } = await supabase
      .from('garages')
      .select('id, name, lat, lng, timezone')
      .eq('id', id)
      .single()

    if (garageError || !garage) {
      return res.status(404).json({ error: 'Garage not found' })
    }

    if (!garage.lat || !garage.lng) {
      return res.status(400).json({ error: 'Garage location not available' })
    }

    // Get weather forecast
    const weatherDays = await weatherProvider.getDaily(garage.lat, garage.lng)
    
    if (weatherDays.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch weather data' })
    }

    // Generate alerts
    const alerts = weatherProvider.generateAlerts(weatherDays)

    // Store alerts in database (upsert to avoid duplicates)
    for (const alert of alerts) {
      await supabase
        .from('garage_weather_alerts')
        .upsert({
          garage_id: id,
          kind: alert.kind,
          severity: alert.severity,
          window_start_iso: alert.windowStart,
          window_end_iso: alert.windowEnd,
          message: alert.message,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'garage_id,kind,window_start_iso'
        })
    }

    // Get current active alerts from database
    const { data: activeAlerts } = await supabase
      .from('garage_weather_alerts')
      .select('*')
      .eq('garage_id', id)
      .gte('window_end_iso', new Date().toISOString().split('T')[0])
      .order('window_start_iso', { ascending: true })

    // Format response
    const response = {
      garage: {
        id: garage.id,
        name: garage.name,
        timezone: garage.timezone
      },
      forecast: weatherDays.slice(0, 3), // Next 3 days
      alerts: (activeAlerts || []).map(alert => ({
        id: alert.id,
        kind: alert.kind,
        severity: alert.severity,
        dateRange: weatherProvider.formatDateRange(alert.window_start_iso, alert.window_end_iso),
        message: alert.message,
        windowStart: alert.window_start_iso,
        windowEnd: alert.window_end_iso
      })),
      lastUpdated: new Date().toISOString()
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('Weather API error:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
