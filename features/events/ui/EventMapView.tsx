'use client'

import { MapPin } from 'lucide-react'

interface EventMapViewProps {
  lat: number
  lng: number
  address: string
  stationName: string
}

export function EventMapView({ lat, lng, address, stationName }: EventMapViewProps) {
  // OpenStreetMap tile URL with zoom controls enabled
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`

  return (
    <div className="space-y-3">
      {/* Interactive Map */}
      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden group">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          style={{ border: 0 }}
          title="Location map"
        />
        
        {/* Map Overlay Links */}
        <div className="absolute top-2 right-2 flex gap-2">
          <a
            href={openStreetMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-xs font-medium bg-white/90 hover:bg-white text-gray-700 rounded shadow-sm border border-gray-200 transition-colors"
          >
            View Larger Map
          </a>
        </div>
      </div>

      {/* Location Details */}
      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
        <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{stationName}</p>
          {address && (
            <p className="text-xs text-gray-600 mt-1">{address}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
        >
          Open in Maps
        </a>
      </div>
    </div>
  )
}
