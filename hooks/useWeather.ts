import useSWR from 'swr'
import { flags } from '@/lib/config/featureFlags'

export interface WeatherAlert {
  id: string
  kind: 'heat' | 'freeze' | 'storm'
  severity: 'low' | 'medium' | 'high'
  dateRange: string
  message: string
  windowStart: string
  windowEnd: string
}

export interface WeatherForecast {
  dateISO: string
  tempHigh: number
  tempLow: number
  precipChance: number
  windSpeed: number
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch weather data')
  }
  return response.json()
}

export function useGarageWeather(garageId: string) {
  const endpoint = flags.useSimpleWeather
    ? `/api/garages/${garageId}/weather-simple`
    : `/api/garages/${garageId}/weather`
    
  const { data, error, mutate, isLoading } = useSWR(
    garageId ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 21600000, // 6 hours
      errorRetryCount: 2,
    }
  )

  return {
    garage: data?.garage,
    forecast: data?.forecast as WeatherForecast[] | undefined,
    alerts: data?.alerts as WeatherAlert[] | undefined,
    lastUpdated: data?.lastUpdated,
    isLoading,
    error,
    mutate,
    // Helper functions
    hasAlerts: () => (data?.alerts?.length || 0) > 0,
    getActiveAlert: () => data?.alerts?.[0], // Most urgent alert
    getSeverityColor: (severity: string) => {
      switch (severity) {
        case 'high': return 'text-red-600 bg-red-50 border-red-200'
        case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
        case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        default: return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    },
    getAlertIcon: (kind: string) => {
      switch (kind) {
        case 'heat': return '🌡️'
        case 'freeze': return '🥶'
        case 'storm': return '⛈️'
        default: return '🌤️'
      }
    }
  }
}
