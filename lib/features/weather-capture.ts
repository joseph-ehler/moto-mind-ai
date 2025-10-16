/**
 * Weather Capture via Open-Meteo
 * Fetches historical weather data for fuel fill-ups
 * Completely FREE - No API key required
 */

export interface WeatherData {
  temperature_f: number
  precipitation_mm: number
  windspeed_mph: number
  condition: 'clear' | 'rain' | 'snow' | 'cloudy' | 'extreme'
  humidity_percent?: number
  pressure_inhg?: number
  timestamp: string
  source: 'open_meteo'
  raw?: any
}

/**
 * Fetch historical weather for a specific location and time
 * 
 * @param latitude - GPS latitude
 * @param longitude - GPS longitude
 * @param date - ISO date string (e.g., "2020-07-10")
 * @param time - Hour in 24h format (e.g., "14" for 2pm)
 * @returns Weather data or null if unavailable
 */
export async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  date: string,
  time?: string
): Promise<WeatherData | null> {
  try {
    // Parse time or default to noon
    const hour = time ? parseInt(time.split(':')[0]) : 12
    
    // Open-Meteo Archive API (FREE!)
    const url = new URL('https://archive-api.open-meteo.com/v1/archive')
    url.searchParams.set('latitude', latitude.toString())
    url.searchParams.set('longitude', longitude.toString())
    url.searchParams.set('start_date', date)
    url.searchParams.set('end_date', date)
    url.searchParams.set('hourly', 'temperature_2m,precipitation,windspeed_10m,weathercode,relativehumidity_2m,surface_pressure')
    url.searchParams.set('temperature_unit', 'fahrenheit')
    url.searchParams.set('windspeed_unit', 'mph')
    url.searchParams.set('precipitation_unit', 'mm')
    url.searchParams.set('pressure_unit', 'hPa') // Will convert to inHg
    url.searchParams.set('timezone', 'auto') // Auto-detect from coordinates

    console.log('🌤️ Fetching weather from Open-Meteo:', {
      latitude,
      longitude,
      date,
      hour
    })

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      console.warn('⚠️ Weather API returned error:', response.status)
      return null
    }

    const data = await response.json()

    // Find the closest hour to requested time
    const hourlyData = data.hourly
    const targetIndex = hour // Index corresponds to hour of day
    
    if (!hourlyData || !hourlyData.temperature_2m || !hourlyData.temperature_2m[targetIndex]) {
      console.warn('⚠️ No weather data available for this time')
      return null
    }

    const temperature = hourlyData.temperature_2m[targetIndex]
    const precipitation = hourlyData.precipitation[targetIndex] || 0
    const windspeed = hourlyData.windspeed_10m[targetIndex] || 0
    const weatherCode = hourlyData.weathercode[targetIndex] || 0
    const humidity = hourlyData.relativehumidity_2m?.[targetIndex]
    const pressureHPa = hourlyData.surface_pressure?.[targetIndex]
    
    // Convert pressure from hPa to inHg (1 hPa = 0.02953 inHg)
    const pressureInHg = pressureHPa ? pressureHPa * 0.02953 : undefined

    // Determine condition from WMO weather code
    const condition = getWeatherCondition(weatherCode, precipitation, temperature)

    console.log('✅ Weather retrieved:', {
      temperature: `${temperature}°F`,
      precipitation: `${precipitation}mm`,
      windspeed: `${windspeed}mph`,
      condition
    })
    return {
      temperature_f: temperature,
      precipitation_mm: precipitation,
      windspeed_mph: windspeed,
      condition,
      humidity_percent: humidity,
      pressure_inhg: pressureInHg,
      timestamp: new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`).toISOString(),
      source: 'open_meteo',
      raw: {
        ...data,
        weatherCode,
        hourlyData: {
          temperature: hourlyData.temperature_2m[targetIndex],
          precipitation: hourlyData.precipitation[targetIndex],
          windspeed: hourlyData.windspeed_10m[targetIndex],
        }
      }
    }
  } catch (error) {
    console.error('❌ Weather fetch failed:', error)
    return null
  }
}

/**
 * Interpret WMO weather code into simple condition
 * https://www.noaa.gov/weather
 */
function getWeatherCondition(
  code: number,
  precipitation: number,
  temperature: number
): 'clear' | 'rain' | 'snow' | 'cloudy' | 'extreme' {
  // Extreme conditions
  if (temperature < 0 || temperature > 105) return 'extreme'
  
  // Snow (codes 71-77, 85-86)
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow'
  
  // Rain (codes 51-67, 80-84)
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 84) || precipitation > 0.5) return 'rain'
  
  // Cloudy (codes 2-3)
  if (code === 2 || code === 3) return 'cloudy'
  
  // Clear (code 0-1)
  return 'clear'
}

/**
 * Calculate weather impact on fuel efficiency
 * Returns percentage adjustment (-30% to 0%)
 */
export function calculateWeatherImpact(weather: WeatherData): {
  adjustment: number
  factors: string[]
} {
  let adjustment = 0
  const factors: string[] = []

  // Temperature impact
  if (weather.temperature_f < 20) {
    adjustment -= 25
    factors.push('Extreme cold (-25%)')
  } else if (weather.temperature_f < 40) {
    adjustment -= 15
    factors.push('Cold weather (-15%)')
  } else if (weather.temperature_f > 95) {
    adjustment -= 10
    factors.push('Extreme heat/AC (-10%)')
  }

  // Precipitation impact
  if (weather.condition === 'rain') {
    adjustment -= 15
    factors.push('Rain (-15%)')
  } else if (weather.condition === 'snow') {
    adjustment -= 20
    factors.push('Snow (-20%)')
  }

  // Wind impact (simplified - headwind assumed)
  if (weather.windspeed_mph > 20) {
    adjustment -= 10
    factors.push('Strong wind (-10%)')
  } else if (weather.windspeed_mph > 10) {
    adjustment -= 5
    factors.push('Moderate wind (-5%)')
  }

  // Ideal conditions bonus
  if (
    weather.temperature_f >= 60 &&
    weather.temperature_f <= 80 &&
    weather.condition === 'clear' &&
    weather.windspeed_mph < 10
  ) {
    factors.push('Ideal conditions (baseline)')
  }

  return {
    adjustment: Math.max(adjustment, -30), // Cap at -30%
    factors
  }
}
