'use client'

import { Cloud, CloudRain, CloudSnow, Sun, Wind, ThermometerSun, Droplets, Gauge, HelpCircle } from 'lucide-react'
import { Flex } from '@/components/design-system'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

interface WeatherDisplayProps {
  temperature_f: number
  condition: 'clear' | 'rain' | 'snow' | 'cloudy' | 'extreme'
  precipitation_mm?: number | null
  windspeed_mph?: number | null
  humidity_percent?: number | null
  pressure_inhg?: number | null
  compact?: boolean // For inline display
}

const getWeatherIcon = (condition: string, temp: number) => {
  if (condition === 'rain') return { icon: CloudRain, color: 'text-blue-500', emoji: '🌧️' }
  if (condition === 'snow') return { icon: CloudSnow, color: 'text-blue-400', emoji: '❄️' }
  if (condition === 'cloudy') return { icon: Cloud, color: 'text-gray-500', emoji: '☁️' }
  if (condition === 'extreme') {
    if (temp > 100) return { icon: ThermometerSun, color: 'text-red-500', emoji: '🔥' }
    return { icon: ThermometerSun, color: 'text-blue-600', emoji: '🥶' }
  }
  return { icon: Sun, color: 'text-yellow-500', emoji: '☀️' }
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

const getEfficiencyNote = (
  condition: string,
  temp: number,
  windspeed?: number | null,
  humidity?: number | null
): { text: string; severity: 'positive' | 'neutral' | 'negative' } | null => {
  // Return detailed note about weather impact with severity
  if (temp < 20) {
    return { 
      text: 'Extreme cold can reduce fuel efficiency by 15-25% due to engine warm-up, thickened fluids, and battery strain', 
      severity: 'negative' 
    }
  }
  if (temp < 40) {
    return { 
      text: 'Cold weather can reduce fuel efficiency by 10-15% until engine reaches optimal temperature', 
      severity: 'negative' 
    }
  }
  if (temp > 100) {
    return { 
      text: 'Extreme heat can reduce fuel efficiency by 10-15% due to increased A/C use and engine strain', 
      severity: 'negative' 
    }
  }
  if (temp > 90) {
    return { 
      text: 'Hot weather can reduce fuel efficiency by 5-10% due to air conditioning use', 
      severity: 'negative' 
    }
  }
  if (condition === 'rain') {
    return { 
      text: 'Rain can reduce efficiency by 3-5% due to increased rolling resistance and use of wipers/defrost', 
      severity: 'negative' 
    }
  }
  if (condition === 'snow') {
    return { 
      text: 'Snow can reduce fuel efficiency by 15-30% due to wheel slippage, cold starts, and 4WD/AWD use', 
      severity: 'negative' 
    }
  }
  if (windspeed && windspeed > 25) {
    return { 
      text: 'Strong headwinds can reduce highway fuel efficiency by 5-15% depending on vehicle aerodynamics', 
      severity: 'negative' 
    }
  }
  if (humidity && humidity < 20) {
    return { 
      text: 'Very low humidity (arid conditions) can slightly improve efficiency due to reduced air density', 
      severity: 'neutral' 
    }
  }
  if (temp >= 60 && temp <= 80 && condition === 'clear') {
    return { 
      text: 'Ideal conditions for fuel efficiency - moderate temperature with minimal A/C or heater use', 
      severity: 'positive' 
    }
  }
  return null
}

export function WeatherDisplay({
  temperature_f,
  condition,
  precipitation_mm,
  windspeed_mph,
  humidity_percent,
  pressure_inhg,
  compact = false
}: WeatherDisplayProps) {
  const { icon: IconComponent, color, emoji } = getWeatherIcon(condition, temperature_f)
  const conditionLabel = getConditionLabel(condition)
  const efficiencyNote = getEfficiencyNote(condition, temperature_f, windspeed_mph, humidity_percent)

  if (compact) {
    // Compact inline display for data fields
    return (
      <div className="text-sm font-semibold text-gray-900">
        <span className="text-base mr-1">{emoji}</span>
        {Math.round(temperature_f)}°F, {conditionLabel.toLowerCase()}
      </div>
    )
  }

  // Full display for section content
  return (
    <div className="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 shadow-sm">
      {/* Header with icon and context */}
      <div className="px-4 py-3 bg-white/60 backdrop-blur-sm border-b border-blue-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-white shadow-sm ${color}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">
                Weather at Fill-Up
              </div>
              <div className="text-xs text-gray-500">
                How conditions affected your MPG
              </div>
            </div>
          </div>
          
          {/* Help popover */}
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <button className="p-1 hover:bg-white/80 rounded transition-colors">
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Weather at Fill-Up Time</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  This shows historical weather conditions at the exact time and location of your fill-up. These conditions affected your fuel efficiency during this tank.
                </p>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-blue-700 mb-1">Common Impacts:</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    <li>• Cold weather: Up to 25% worse MPG</li>
                    <li>• Hot weather: 10-15% worse (A/C use)</li>
                    <li>• Rain/snow: 5-30% worse (resistance)</li>
                    <li>• Strong wind: 5-15% worse (aerodynamics)</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  💡 Compare weather across fill-ups to understand MPG variations.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Main weather display - prominent */}
        <div className="flex items-start justify-between gap-4">
          <HoverCard openDelay={300}>
            <HoverCardTrigger asChild>
              <div className="cursor-help">
                <div className="text-3xl font-bold text-gray-900 leading-none mb-1">
                  <span className="text-4xl mr-2">{emoji}</span>
                  {Math.round(temperature_f)}°F
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {conditionLabel}
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-72" side="top">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-900">Temperature Impact</p>
                <p className="text-xs text-gray-600">
                  {temperature_f < 40 
                    ? 'Cold temperatures thicken engine oil and reduce battery efficiency, requiring more energy to start and warm up.'
                    : temperature_f > 90
                    ? 'Hot temperatures force your A/C to work harder, significantly increasing fuel consumption.'
                    : 'Moderate temperatures (60-80°F) are ideal for fuel efficiency - minimal heating or cooling needed.'}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Quick metrics - compact grid */}
          <div className="flex gap-4">
            {precipitation_mm !== null && precipitation_mm !== undefined && (
              <HoverCard openDelay={300}>
                <HoverCardTrigger asChild>
                  <div className="text-center cursor-help">
                    <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                    <div className="text-xs font-semibold text-gray-900">
                      {precipitation_mm.toFixed(1)}mm
                    </div>
                    <div className="text-[10px] text-gray-500">rain</div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64" side="top">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-900">Precipitation</p>
                    <p className="text-xs text-gray-600">
                      Rain increases rolling resistance and requires wipers/defrost, reducing efficiency by 3-5%.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
            
            {windspeed_mph !== null && windspeed_mph !== undefined && (
              <HoverCard openDelay={300}>
                <HoverCardTrigger asChild>
                  <div className="text-center cursor-help">
                    <Wind className="w-4 h-4 text-gray-600 mx-auto mb-0.5" />
                    <div className="text-xs font-semibold text-gray-900">
                      {Math.round(windspeed_mph)}mph
                    </div>
                    <div className="text-[10px] text-gray-500">wind</div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64" side="top">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-900">Wind Speed</p>
                    <p className="text-xs text-gray-600">
                      Headwinds increase aerodynamic drag. Strong winds (&gt;25mph) can reduce highway MPG by 5-15%.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        </div>

        {/* Extended metrics - only if available */}
        {(humidity_percent !== null && humidity_percent !== undefined) || 
         (pressure_inhg !== null && pressure_inhg !== undefined) ? (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200/50">
            {humidity_percent !== null && humidity_percent !== undefined && (
              <HoverCard openDelay={300}>
                <HoverCardTrigger asChild>
                  <div className="bg-white/70 rounded-lg p-2.5 cursor-help">
                    <div className="text-xs font-medium text-gray-500 mb-0.5">Humidity</div>
                    <div className="text-base font-bold text-gray-900">
                      {Math.round(humidity_percent)}%
                    </div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64" side="top">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-900">Humidity</p>
                    <p className="text-xs text-gray-600">
                      Very high humidity can slightly reduce engine efficiency. Low humidity in arid conditions may marginally improve fuel economy.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
            
            {pressure_inhg !== null && pressure_inhg !== undefined && (
              <div className="bg-white/70 rounded-lg p-2.5">
                <div className="text-xs font-medium text-gray-500 mb-0.5">Pressure</div>
                <div className="text-base font-bold text-gray-900">
                  {pressure_inhg.toFixed(2)}"
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Efficiency impact - highlighted with severity colors */}
        {efficiencyNote && (
          <div className={`rounded-lg px-3 py-2.5 border ${
            efficiencyNote.severity === 'positive' 
              ? 'bg-green-100/60 border-green-200/50'
              : efficiencyNote.severity === 'negative'
              ? 'bg-amber-100/60 border-amber-200/50'
              : 'bg-blue-100/60 border-blue-200/50'
          }`}>
            <div className="text-xs">
              <span className={`font-semibold ${
                efficiencyNote.severity === 'positive'
                  ? 'text-green-900'
                  : efficiencyNote.severity === 'negative'
                  ? 'text-amber-900'
                  : 'text-blue-900'
              }`}>
                {efficiencyNote.severity === 'positive' ? '✨ ' : efficiencyNote.severity === 'negative' ? '💡 ' : '⚡ '}
                Impact:{' '}
              </span>
              <span className={`${
                efficiencyNote.severity === 'positive'
                  ? 'text-green-800'
                  : efficiencyNote.severity === 'negative'
                  ? 'text-amber-800'
                  : 'text-blue-800'
              }`}>
                {efficiencyNote.text}
              </span>
            </div>
          </div>
        )}

        {/* Attribution - subtle */}
        <div className="text-[10px] text-gray-400 text-center pt-1">
          Historical weather at time of fill-up • Open-Meteo
        </div>
      </div>
    </div>
  )
}
