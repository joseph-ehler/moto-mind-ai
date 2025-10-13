/**
 * SimpleEventMap - Lightweight, receipt-focused location confirmation
 * 
 * Purpose: Provide quick visual confirmation of fill-up location
 * Philosophy: Context, not distraction. Receipt data is the star.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Map as MapIcon, Satellite } from 'lucide-react'

interface SimpleEventMapProps {
  lat?: number | null
  lng?: number | null
  address: string
  stationName: string
  className?: string
}

export function SimpleEventMap({
  lat,
  lng,
  address,
  stationName,
  className = ''
}: SimpleEventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets')
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const styles = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
  }

  // ALWAYS geocode the address (don't trust stored coordinates - they might be outdated)
  useEffect(() => {
    if (coordinates || !address || isGeocoding) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    setIsGeocoding(true)

    // Normalize address for better Mapbox results
    const normalizedAddress = address
      .replace(/\bUS HWY\b/gi, 'US Highway')
      .replace(/\bHWY\b/gi, 'Highway')
      .replace(/\s+S\s*,/, ' South,')
      .replace(/\s+N\s*,/, ' North,')
      .replace(/\s+E\s*,/, ' East,')
      .replace(/\s+W\s*,/, ' West,')

    console.log('🗺️ Geocoding:', normalizedAddress)

    // Use Mapbox Geocoding API with types filter for better accuracy
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedAddress)}.json?access_token=${token}&types=address,poi&limit=1&country=US`
    )
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const feature = data.features[0]
          const [lng, lat] = feature.center
          console.log('🗺️ Mapbox geocoded:', normalizedAddress, '→', { lat, lng })
          console.log('🗺️ Result:', feature.place_name)
          setCoordinates({ lng, lat })
        } else {
          console.warn('⚠️ Could not geocode address:', normalizedAddress)
        }
      })
      .catch(err => console.error('❌ Geocoding error:', err))
      .finally(() => setIsGeocoding(false))
  }, [address])

  useEffect(() => {
    if (!mapContainer.current || map.current || !coordinates) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.warn('Mapbox token not configured')
      return
    }

    mapboxgl.accessToken = token

    // Simple, clean map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: styles[mapStyle],
      center: [coordinates.lng, coordinates.lat],
      zoom: 15,
      pitch: 0,
      attributionControl: true
    })

    // Add simple controls (zoom only, no compass)
    map.current.addControl(
      new mapboxgl.NavigationControl({ 
        showCompass: false,
        visualizePitch: false
      }), 
      'top-right'
    )

    // Simple marker with popup
    new mapboxgl.Marker({ color: '#3B82F6', scale: 1.2 })
      .setLngLat([coordinates.lng, coordinates.lat])
      .setPopup(
        new mapboxgl.Popup({ 
          offset: 30, 
          className: 'mapbox-popup-custom',
          closeButton: false
        }).setHTML(`
            <div class="p-3">
              <p class="font-semibold text-sm text-gray-900">${stationName}</p>
              <p class="text-xs text-gray-600 mt-1">${address}</p>
            </div>
          `)
      )
      .addTo(map.current)

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [coordinates, address, stationName])

  // Update style when toggled
  useEffect(() => {
    if (map.current && coordinates) {
      map.current.setStyle(styles[mapStyle])
      
      // Re-add marker after style change
      const marker = new mapboxgl.Marker({ color: '#3B82F6', scale: 1.2 })
        .setLngLat([coordinates.lng, coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 30, 
            className: 'mapbox-popup-custom',
            closeButton: false
          }).setHTML(`
            <div class="p-3">
              <p class="font-semibold text-sm text-gray-900">${stationName}</p>
              <p class="text-xs text-gray-600 mt-1">${address}</p>
            </div>
          `)
        )
      
      map.current.on('style.load', () => {
        marker.addTo(map.current!)
      })
    }
  }, [mapStyle, coordinates, address, stationName])

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className={`bg-gray-50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Map unavailable</p>
          <p className="text-xs text-gray-500 mt-1">Configure Mapbox token</p>
        </div>
      </div>
    )
  }

  if (isGeocoding || !coordinates) {
    return (
      <div className={`bg-gray-50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-600">Finding location...</p>
          <p className="text-xs text-gray-500 mt-1">{address}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

      {/* Professional Style Toggle */}
      <div className="absolute top-3 left-3 flex gap-1 bg-white rounded-lg shadow-lg p-1">
        <button
          onClick={() => setMapStyle('streets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            mapStyle === 'streets' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Street map"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Map</span>
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            mapStyle === 'satellite' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Satellite view"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>
      </div>
    </div>
  )
}
