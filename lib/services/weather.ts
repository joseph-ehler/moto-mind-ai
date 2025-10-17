/**
 * Open-Meteo Weather Provider
 * Free weather API with no API key required
 * https://open-meteo.com/
 */

export interface WeatherDay {
  dateISO: string
  tempHigh: number
  tempLow: number
  precipChance: number
  windSpeed: number
}

export interface WeatherAlert {
  kind: 'heat' | 'freeze' | 'storm'
  severity: 'low' | 'medium' | 'high'
  windowStart: string
  windowEnd: string
  message: string
}

export class OpenMeteoProvider {
  private baseUrl = 'https://api.open-meteo.com/v1'
  private cache = new Map<string, { data: WeatherDay[], expires: number }>()

  /**
   * Get 7-day weather forecast for coordinates
   */
  async getDaily(lat: number, lng: number): Promise<WeatherDay[]> {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`
    const cached = this.cache.get(cacheKey)
    
    // Return cached data if still valid (6 hours)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    try {
      const url = new URL(`${this.baseUrl}/forecast`)
      url.searchParams.set('latitude', lat.toString())
      url.searchParams.set('longitude', lng.toString())
      url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max')
      url.searchParams.set('temperature_unit', 'fahrenheit')
      url.searchParams.set('wind_speed_unit', 'mph')
      url.searchParams.set('precipitation_unit', 'inch')
      url.searchParams.set('timezone', 'auto')
      url.searchParams.set('forecast_days', '7')

      console.log(`🌤️ Fetching weather for ${lat}, ${lng}`)
      
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'MotoMind-AI/1.0 (Vehicle Management App)'
        }
      })

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform to our format
      const weatherDays: WeatherDay[] = data.daily.time.map((date: string, index: number) => ({
        dateISO: date,
        tempHigh: Math.round(data.daily.temperature_2m_max[index]),
        tempLow: Math.round(data.daily.temperature_2m_min[index]),
        precipChance: Math.round(data.daily.precipitation_probability_max[index] || 0),
        windSpeed: Math.round(data.daily.wind_speed_10m_max[index] || 0)
      }))

      // Cache for 6 hours
      this.cache.set(cacheKey, {
        data: weatherDays,
        expires: Date.now() + (6 * 60 * 60 * 1000)
      })

      console.log(`✅ Got ${weatherDays.length} days of weather data`)
      return weatherDays

    } catch (error) {
      console.error('Weather fetch error:', error)
      return []
    }
  }

  /**
   * Analyze weather data and generate alerts
   */
  generateAlerts(weatherDays: WeatherDay[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = []
    
    // Group consecutive days by alert type
    let heatDays: string[] = []
    let freezeDays: string[] = []
    let stormDays: string[] = []

    for (const day of weatherDays) {
      // Heat alert (≥95°F)
      if (day.tempHigh >= 95) {
        heatDays.push(day.dateISO)
      } else {
        if (heatDays.length > 0) {
          alerts.push(this.createHeatAlert(heatDays))
          heatDays = []
        }
      }

      // Freeze alert (≤28°F)
      if (day.tempLow <= 28) {
        freezeDays.push(day.dateISO)
      } else {
        if (freezeDays.length > 0) {
          alerts.push(this.createFreezeAlert(freezeDays))
          freezeDays = []
        }
      }

      // Storm alert (≥80% precip + high wind)
      if (day.precipChance >= 80 && day.windSpeed >= 25) {
        stormDays.push(day.dateISO)
      } else {
        if (stormDays.length > 0) {
          alerts.push(this.createStormAlert(stormDays))
          stormDays = []
        }
      }
    }

    // Handle alerts that extend to the end
    if (heatDays.length > 0) alerts.push(this.createHeatAlert(heatDays))
    if (freezeDays.length > 0) alerts.push(this.createFreezeAlert(freezeDays))
    if (stormDays.length > 0) alerts.push(this.createStormAlert(stormDays))

    return alerts
  }

  private createHeatAlert(days: string[]): WeatherAlert {
    return {
      kind: 'heat',
      severity: days.length >= 3 ? 'high' : 'medium',
      windowStart: days[0],
      windowEnd: days[days.length - 1],
      message: `Extreme heat warning. Check tire pressure and coolant levels. Avoid leaving items in vehicle.`
    }
  }

  private createFreezeAlert(days: string[]): WeatherAlert {
    return {
      kind: 'freeze',
      severity: days.length >= 3 ? 'high' : 'medium', 
      windowStart: days[0],
      windowEnd: days[days.length - 1],
      message: `Freezing temperatures expected. Battery performance may drop. Check antifreeze levels.`
    }
  }

  private createStormAlert(days: string[]): WeatherAlert {
    return {
      kind: 'storm',
      severity: 'medium',
      windowStart: days[0],
      windowEnd: days[days.length - 1],
      message: `Heavy rain and wind expected. Check wipers and tires. Reduce speed and increase following distance.`
    }
  }

  /**
   * Format date range for display
   */
  formatDateRange(startISO: string, endISO: string): string {
    const start = new Date(startISO)
    const end = new Date(endISO)
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }
    
    if (startISO === endISO) {
      return start.toLocaleDateString('en-US', options)
    }
    
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
  }
}
