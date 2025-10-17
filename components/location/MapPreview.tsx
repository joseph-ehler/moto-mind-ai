/**
 * MapPreview Component
 * Shows a static map preview with a marker
 * Uses OpenStreetMap (free, no API key required)
 */

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPinOff, Map, Loader2 } from 'lucide-react'
import { isValidCoordinates, formatCoordinates } from '@/lib/location-validation'

// Dynamically import Leaflet (prevents SSR issues)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

interface MapPreviewProps {
  lat: number
  lng: number
  marker?: {
    position: [number, number]
    label: string
  }
  height?: number
}

export function MapPreview({ 
  lat, 
  lng, 
  marker, 
  height = 200 
}: MapPreviewProps) {
  const [isClient, setIsClient] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    
    // Fix Leaflet default marker icon path issue
    if (typeof window !== 'undefined') {
      const L = require('leaflet')
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
    }
  }, [])

  // Client-side only check
  if (!isClient || typeof window === 'undefined') {
    return <MapSkeleton height={height} />
  }

  // Validate coordinates
  if (!isValidCoordinates(lat, lng)) {
    return (
      <div 
        className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPinOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Invalid location data</p>
        </div>
      </div>
    )
  }

  // Error fallback
  if (loadError) {
    return (
      <div 
        className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-4">
          <Map className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-600 font-medium">Map unavailable</p>
          <p className="text-xs text-gray-500 mt-1">
            {marker?.label || 'Location'}<br />
            {formatCoordinates(lat, lng)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="rounded-lg overflow-hidden border border-gray-200 relative"
      style={{ height }}
    >
      <style jsx global>{`
        @import url('https://unpkg.com/leaflet@1.7.1/dist/leaflet.css');
        
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
        
        .leaflet-control-container {
          display: none;
        }
      `}</style>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}
      
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
        whenReady={() => setIsLoading(false)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {marker && (
          <Marker position={marker.position}>
            <Popup>{marker.label}</Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* Subtle OSM attribution */}
      <div className="absolute bottom-1 right-1 text-[8px] text-gray-400 bg-white/80 px-1 rounded">
        © OpenStreetMap
      </div>
      
      {/* Tap to expand hint */}
      <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-medium text-gray-600 shadow-sm">
        🔍 Tap to expand
      </div>
    </div>
  )
}

/**
 * Loading skeleton for map
 */
export function MapSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div 
      className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-gray-400 text-sm">📍 Loading map...</div>
    </div>
  )
}
