/**
 * Single Event Map Component
 * 
 * Shows a single event location on a map for event detail pages
 */

import { MapPin, ExternalLink } from 'lucide-react'

interface SingleEventMapProps {
  event: {
    id: string
    type: string
    geocoded_lat?: number
    geocoded_lng?: number
    geocoded_address?: string
    payload?: {
      data?: {
        vendor_name?: string
        station_name?: string
        company_name?: string
        vendor_address?: string
        station_address?: string
        company_address?: string
        total_amount?: number
      }
    }
    date?: string
    created_at?: string
  }
  height?: string
}

export function SingleEventMap({ event, height = '300px' }: SingleEventMapProps) {
  // Check if we have location data
  if (!event.geocoded_lat || !event.geocoded_lng) {
    return null // Don't show anything if no location
  }

  const lat = event.geocoded_lat
  const lng = event.geocoded_lng
  
  // Get vendor/location name
  const locationName = event.payload?.data?.vendor_name || 
                      event.payload?.data?.station_name || 
                      event.payload?.data?.company_name || 
                      'Event Location'

  // Get address
  const address = event.geocoded_address || 
                 event.payload?.data?.vendor_address || 
                 event.payload?.data?.station_address || 
                 event.payload?.data?.company_address || 
                 'Address not available'

  // Build Google Maps embed URL
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed&markers=${lat},${lng}`

  // Get event type color
  const getEventColor = (type: string) => {
    switch (type) {
      case 'fuel': return 'bg-blue-600'
      case 'service': return 'bg-emerald-600'
      case 'inspection': return 'bg-purple-600'
      case 'towing': return 'bg-orange-600'
      case 'accident': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getEventColor(event.type)} text-white`}>
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            <p className="text-sm text-gray-600">{locationName}</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height }}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title={`Map showing ${locationName}`}
        />
      </div>

      {/* Location Details */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-900">{locationName}</p>
            <p className="text-sm text-gray-600 mt-1">{address}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>Lat: {lat.toFixed(6)}</span>
              <span>Lng: {lng.toFixed(6)}</span>
            </div>
          </div>
          
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Maps
          </a>
        </div>
      </div>
    </div>
  )
}
