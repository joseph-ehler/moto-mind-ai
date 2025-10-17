/**
 * LocationCard - Display location details with native map links
 * 
 * Features:
 * - Station name and address
 * - Coordinates
 * - Open in Google Maps / Apple Maps
 * - Smart linking (address first, then coordinates)
 */

'use client'

import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import { Flex, Text } from '@/components/design-system'

interface LocationCardProps {
  stationName: string
  address: string
  lat?: number | null
  lng?: number | null
  className?: string
}

export function LocationCard({
  stationName,
  address,
  lat,
  lng,
  className = ''
}: LocationCardProps) {
  // Create map links - use address first (better for business names), coordinates as fallback
  const encodedAddress = encodeURIComponent(address)
  const encodedStation = encodeURIComponent(stationName)
  
  // Google Maps: Search by station name + address for best results
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedStation}+${encodedAddress}`
  
  // Apple Maps: Use address for better business name resolution
  const appleMapsUrl = `http://maps.apple.com/?address=${encodedAddress}&q=${encodedStation}`
  
  // Format coordinates for display (if available)
  const formattedCoords = lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : null

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <Flex direction="col" gap="sm">
        {/* Station Name */}
        <Flex align="center" gap="sm">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <Text className="text-sm font-semibold text-gray-900 truncate">
              {stationName}
            </Text>
            <Text className="text-xs text-gray-600 truncate">
              {address}
            </Text>
          </div>
        </Flex>

        {/* Coordinates (only if available) */}
        {formattedCoords && (
          <Flex align="center" gap="xs" className="pl-10">
            <Navigation className="w-3 h-3 text-gray-400" />
            <Text className="text-xs text-gray-500 font-mono">
              {formattedCoords}
            </Text>
          </Flex>
        )}

        {/* Map Links */}
        <Flex gap="xs" className="pl-10 pt-1">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Google Maps</span>
          </a>
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Apple Maps</span>
          </a>
        </Flex>
      </Flex>
    </div>
  )
}
