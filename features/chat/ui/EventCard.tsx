'use client'

import { Card, Stack, Flex, Text } from '@/components/design-system'
import { 
  MapPin, 
  Gauge, 
  Thermometer,
  Wind,
  Droplets,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import type { EventData } from '../domain'

export interface EventCardProps {
  eventData: EventData
}

export function EventCard({ eventData }: EventCardProps) {
  const {
    event_id,
    event_type,
    event_date,
    event_location,
    event_cost,
    event_gallons,
    event_miles,
    event_vendor,
    event_weather
  } = eventData

  const date = new Date(event_date)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  const pricePerGallon = (event_cost && event_gallons) 
    ? (event_cost / event_gallons).toFixed(3)
    : null

  // Event type config
  const typeConfig = {
    fuel: { 
      emoji: '⛽', 
      label: 'Fuel Fill-Up', 
      gradient: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200'
    },
    service: { 
      emoji: '🔧', 
      label: 'Service', 
      gradient: 'from-orange-50 to-amber-50',
      border: 'border-orange-200'
    },
    dashboard_snapshot: { 
      emoji: '📊', 
      label: 'Dashboard', 
      gradient: 'from-purple-50 to-pink-50',
      border: 'border-purple-200'
    },
    damage: { 
      emoji: '⚠️', 
      label: 'Damage', 
      gradient: 'from-red-50 to-rose-50',
      border: 'border-red-200'
    },
  }[event_type] || { 
    emoji: '📝', 
    label: 'Event', 
    gradient: 'from-gray-50 to-slate-50',
    border: 'border-gray-200'
  }

  // Extract city/state from full address
  const locationShort = event_location 
    ? event_location.split(',').slice(-2).join(',').trim() 
    : null

  return (
    <Link href={`/events/${event_id}`} className="block">
      <Card className={`bg-gradient-to-br ${typeConfig.gradient} ${typeConfig.border} border-2 overflow-hidden hover:shadow-md transition-shadow cursor-pointer`}>
        <Stack spacing="sm" className="p-4">
          {/* Header Row */}
          <Flex align="center" justify="between">
            <Flex align="center" gap="sm">
              <span className="text-2xl">{typeConfig.emoji}</span>
              <div>
                <Text className="text-base font-bold text-gray-900">
                  {event_vendor || typeConfig.label}
                </Text>
                <Text className="text-xs text-gray-600">
                  {formattedDate}
                </Text>
              </div>
            </Flex>
            
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </Flex>

          {/* Fuel Stats - Clean single row */}
          {event_type === 'fuel' && (event_cost || event_gallons) && (
            <div className="flex items-baseline gap-3 text-gray-900">
              {event_cost && (
                <span className="text-2xl font-bold">
                  ${event_cost.toFixed(2)}
                </span>
              )}
              {event_gallons && pricePerGallon && (
                <span className="text-sm text-gray-600">
                  {event_gallons.toFixed(2)} gal @ ${pricePerGallon}/gal
                </span>
              )}
            </div>
          )}

          {/* Location & Odometer - Compact row */}
          <Flex align="center" gap="md" className="text-xs text-gray-600">
            {locationShort && (
              <Flex align="center" gap="xs">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{locationShort}</span>
              </Flex>
            )}
            
            {event_miles && (
              <Flex align="center" gap="xs">
                <Gauge className="w-3.5 h-3.5" />
                <span>{event_miles.toLocaleString()} mi</span>
              </Flex>
            )}
          </Flex>

          {/* Weather - Compact row */}
          {event_weather && (event_weather.temperature_f || event_weather.condition) && (
            <Flex align="center" gap="md" className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              {event_weather.temperature_f && (
                <Flex align="center" gap="xs">
                  <Thermometer className="w-3 h-3" />
                  <span>{Math.round(event_weather.temperature_f)}°F</span>
                </Flex>
              )}
              
              {event_weather.condition && (
                <span className="capitalize">{event_weather.condition}</span>
              )}
              
              {event_weather.windspeed_mph && (
                <Flex align="center" gap="xs">
                  <Wind className="w-3 h-3" />
                  <span>{Math.round(event_weather.windspeed_mph)} mph</span>
                </Flex>
              )}
              
              {event_weather.humidity_percent && (
                <Flex align="center" gap="xs">
                  <Droplets className="w-3 h-3" />
                  <span>{event_weather.humidity_percent}%</span>
                </Flex>
              )}
            </Flex>
          )}
        </Stack>
      </Card>
    </Link>
  )
}
