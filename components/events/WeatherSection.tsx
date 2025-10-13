'use client'

import { Cloud, CloudRain, CloudSnow, Sun, Wind, ThermometerSun, Droplets } from 'lucide-react'
import { Card, Stack, Flex } from '@/components/design-system'

interface WeatherSectionProps {
  temperature_f: number
  condition: 'clear' | 'rain' | 'snow' | 'cloudy' | 'extreme'
  precipitation_mm?: number | null
  windspeed_mph?: number | null
}

const getWeatherIcon = (condition: string, temp: number) => {
  if (condition === 'rain') return { icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50' }
  if (condition === 'snow') return { icon: CloudSnow, color: 'text-blue-400', bg: 'bg-blue-50' }
  if (condition === 'cloudy') return { icon: Cloud, color: 'text-gray-500', bg: 'bg-gray-50' }
  if (condition === 'extreme') {
    if (temp > 100) return { icon: ThermometerSun, color: 'text-red-500', bg: 'bg-red-50' }
    return { icon: ThermometerSun, color: 'text-blue-600', bg: 'bg-blue-50' }
  }
  return { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50' }
}

const getWeatherEmoji = (condition: string, temp: number): string => {
  if (condition === 'rain') return '🌧️'
  if (condition === 'snow') return '❄️'
  if (condition === 'cloudy') return '☁️'
  if (condition === 'extreme') {
    if (temp > 100) return '🔥'
    if (temp < 20) return '🥶'
  }
  return '☀️'
}

const getConditionLabel = (condition: string): string => {
  const labels: Record<string, string> = {
    clear: 'Clear',
    rain: 'Rainy',
    snow: 'Snowy',
    cloudy: 'Cloudy',
    extreme: 'Extreme'
  }
  return labels[condition] || condition
}

const getEfficiencyImpact = (
  condition: string,
  temp: number,
  windspeed?: number | null
): { impact: string; color: string; factors: string[] } => {
  const factors: string[] = []
  let impactLevel = 'neutral'

  // Temperature impact
  if (temp < 20) {
    factors.push('Extreme cold reduces efficiency')
    impactLevel = 'negative'
  } else if (temp < 40) {
    factors.push('Cold weather impacts MPG')
    impactLevel = 'negative'
  } else if (temp > 95) {
    factors.push('A/C use in extreme heat')
    impactLevel = 'negative'
  } else if (temp >= 60 && temp <= 80) {
    factors.push('Ideal temperature range')
    impactLevel = 'positive'
  }

  // Condition impact
  if (condition === 'rain') {
    factors.push('Rain reduces efficiency')
    impactLevel = 'negative'
  } else if (condition === 'snow') {
    factors.push('Snow significantly impacts MPG')
    impactLevel = 'negative'
  } else if (condition === 'clear') {
    if (!factors.length) factors.push('Good conditions')
    if (impactLevel !== 'negative') impactLevel = 'positive'
  }

  // Wind impact
  if (windspeed && windspeed > 20) {
    factors.push('Strong winds affect efficiency')
    impactLevel = 'negative'
  }

  const impactText = impactLevel === 'negative' 
    ? 'Lower efficiency expected'
    : impactLevel === 'positive'
    ? 'Good conditions'
    : 'Normal conditions'

  const color = impactLevel === 'negative'
    ? 'text-amber-700'
    : impactLevel === 'positive'
    ? 'text-green-700'
    : 'text-gray-700'

  return { impact: impactText, color, factors }
}

export function WeatherSection({
  temperature_f,
  condition,
  precipitation_mm,
  windspeed_mph
}: WeatherSectionProps) {
  const { icon: IconComponent, color, bg } = getWeatherIcon(condition, temperature_f)
  const emoji = getWeatherEmoji(condition, temperature_f)
  const conditionLabel = getConditionLabel(condition)
  const { impact, color: impactColor, factors } = getEfficiencyImpact(
    condition,
    temperature_f,
    windspeed_mph
  )

  return (
    <Card className="overflow-hidden border-2 border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          {emoji} Weather Conditions
        </h3>
      </div>

      <div className="p-4">
        <Stack spacing="md">
          {/* Main Weather Display */}
          <Flex className="items-center gap-4">
            <div className={`p-4 rounded-full ${bg}`}>
              <IconComponent className={`w-8 h-8 ${color}`} />
            </div>
            
            <div className="flex-1">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(temperature_f)}°F
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {conditionLabel}
              </div>
            </div>
          </Flex>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-3">
            {precipitation_mm !== null && precipitation_mm !== undefined && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <Flex className="items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-blue-700 font-medium">Precipitation</div>
                    <div className="text-sm font-semibold text-blue-900">
                      {precipitation_mm.toFixed(1)} mm
                    </div>
                  </div>
                </Flex>
              </div>
            )}
            
            {windspeed_mph !== null && windspeed_mph !== undefined && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Flex className="items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-600" />
                  <div>
                    <div className="text-xs text-gray-700 font-medium">Wind Speed</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {Math.round(windspeed_mph)} mph
                    </div>
                  </div>
                </Flex>
              </div>
            )}
          </div>

          {/* Efficiency Impact */}
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="text-xs font-medium text-amber-900 mb-1">
              Fuel Efficiency Impact
            </div>
            <div className={`text-sm font-semibold ${impactColor} mb-2`}>
              {impact}
            </div>
            {factors.length > 0 && (
              <ul className="space-y-1">
                {factors.map((factor, idx) => (
                  <li key={idx} className="text-xs text-amber-700 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Data Source */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            Historical weather data from Open-Meteo
          </div>
        </Stack>
      </div>
    </Card>
  )
}
