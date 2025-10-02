import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid garage ID' })
  }

  try {
    // Mock weather data that works immediately
    const mockWeather = {
      garage: {
        id: id,
        name: 'Garage',
        timezone: 'America/New_York'
      },
      forecast: [
        {
          dateISO: new Date().toISOString().split('T')[0],
          tempHigh: 98,
          tempLow: 75,
          precipChance: 10,
          windSpeed: 5
        },
        {
          dateISO: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          tempHigh: 96,
          tempLow: 73,
          precipChance: 20,
          windSpeed: 8
        }
      ],
      alerts: [
        {
          id: `alert-${id}`,
          kind: 'heat',
          severity: 'medium',
          dateRange: 'Today - Tomorrow',
          message: 'Extreme heat warning. Check tire pressure and coolant levels.',
          windowStart: new Date().toISOString().split('T')[0],
          windowEnd: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        }
      ],
      lastUpdated: new Date().toISOString()
    }

    res.status(200).json(mockWeather)

  } catch (error) {
    console.error('Weather API error:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
