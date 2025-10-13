/**
 * InteractiveEventMap - Rich Mapbox-powered event location visualization
 * 
 * Features:
 * - Interactive pan/zoom
 * - Style switching (street/satellite/dark)
 * - Traffic layer
 * - Weather visualization
 * - Nearby stations
 * - Custom markers
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Layers, Cloud, Navigation } from 'lucide-react'

interface WeatherData {
  temperature_f?: number
  condition?: string
  precipitation_mm?: number
  windspeed_mph?: number
}

interface InteractiveEventMapProps {
  lat: number
  lng: number
  address: string
  stationName: string
  weather?: WeatherData
  date?: string
  showTraffic?: boolean
  showNearbyStations?: boolean
  className?: string
}

export function InteractiveEventMap({
  lat,
  lng,
  address,
  stationName,
  weather,
  date,
  showTraffic = false,
  showNearbyStations = false,
  className = ''
}: InteractiveEventMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [currentStyle, setCurrentStyle] = useState<'streets' | 'satellite' | 'dark'>('streets')
  const [showTrafficLayer, setShowTrafficLayer] = useState(showTraffic)
  const [showWeatherInfo, setShowWeatherInfo] = useState(!!weather)

  const mapStyles = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    dark: 'mapbox://styles/mapbox/dark-v11'
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.warn('Mapbox token not configured')
      return
    }

    mapboxgl.accessToken = token

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyles[currentStyle],
      center: [lng, lat],
      zoom: 14,
      pitch: 0,
      bearing: 0
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left')

    // Create custom marker element
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.width = '40px'
    el.style.height = '40px'
    el.style.cursor = 'pointer'
    el.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#3B82F6" opacity="0.2"/>
        <circle cx="20" cy="20" r="12" fill="#3B82F6"/>
        <path d="M20 12 L20 28 M12 20 L28 20" stroke="white" stroke-width="2"/>
      </svg>
    `

    // Add station marker with popup
    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(
        new mapboxgl.Popup({ 
          offset: 25,
          className: 'custom-popup'
        }).setHTML(`
          <div class="p-3">
            <div class="flex items-start gap-2 mb-2">
              <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm2 2h6v8H7V6z"/>
              </svg>
              <div>
                <h3 class="font-bold text-gray-900">${stationName}</h3>
                <p class="text-sm text-gray-600">${address}</p>
              </div>
            </div>
            ${weather ? `
              <div class="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                <p>🌡️ ${weather.temperature_f}°F • ${weather.condition}</p>
                ${weather.precipitation_mm ? `<p>🌧️ ${weather.precipitation_mm}mm rain</p>` : ''}
                ${weather.windspeed_mph ? `<p>💨 ${weather.windspeed_mph} mph wind</p>` : ''}
              </div>
            ` : ''}
          </div>
        `)
      )
      .addTo(map.current)

    // Map loaded event
    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // Cleanup
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, []) // Only run once on mount

  // Handle style changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(mapStyles[currentStyle])
    }
  }, [currentStyle, mapLoaded])

  // Handle traffic layer toggle
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    if (showTrafficLayer) {
      // Add traffic source if not exists
      if (!map.current.getSource('mapbox-traffic')) {
        map.current.addSource('mapbox-traffic', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        })
      }

      // Add traffic layer if not exists
      if (!map.current.getLayer('traffic')) {
        map.current.addLayer({
          id: 'traffic',
          type: 'line',
          source: 'mapbox-traffic',
          'source-layer': 'traffic',
          paint: {
            'line-color': [
              'match',
              ['get', 'congestion'],
              'low', '#4CAF50',
              'moderate', '#FFC107',
              'heavy', '#F44336',
              'severe', '#B71C1C',
              '#757575'
            ],
            'line-width': 3,
            'line-opacity': 0.8
          }
        })
      }
    } else {
      // Remove traffic layer
      if (map.current.getLayer('traffic')) {
        map.current.removeLayer('traffic')
      }
    }
  }, [showTrafficLayer, mapLoaded])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden shadow-lg" />

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Style Switcher */}
        <div className="bg-white rounded-lg shadow-lg p-1 space-y-0.5">
          <button
            onClick={() => setCurrentStyle('streets')}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded transition-colors ${
              currentStyle === 'streets'
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Streets
          </button>
          <button
            onClick={() => setCurrentStyle('satellite')}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded transition-colors ${
              currentStyle === 'satellite'
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Satellite
          </button>
          <button
            onClick={() => setCurrentStyle('dark')}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded transition-colors ${
              currentStyle === 'dark'
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Dark
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="bg-white rounded-lg shadow-lg p-2 space-y-1">
          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded transition-colors ${
              showTrafficLayer
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'hover:bg-gray-50 text-gray-600'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showTrafficLayer ? 'bg-green-500' : 'bg-gray-300'}`} />
            Traffic
          </button>
          {weather && (
            <button
              onClick={() => setShowWeatherInfo(!showWeatherInfo)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded transition-colors ${
                showWeatherInfo
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <Cloud className="w-4 h-4" />
              Weather
            </button>
          )}
        </div>
      </div>

      {/* Weather Info Card (if enabled) */}
      {showWeatherInfo && weather && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-600" />
            Weather at Fill-up
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>🌡️ Temperature: {weather.temperature_f}°F</p>
            <p>☁️ Conditions: {weather.condition}</p>
            {weather.precipitation_mm !== undefined && (
              <p>🌧️ Precipitation: {weather.precipitation_mm} mm</p>
            )}
            {weather.windspeed_mph !== undefined && (
              <p>💨 Wind: {weather.windspeed_mph} mph</p>
            )}
          </div>
          {date && (
            <p className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              {new Date(date).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* No Token Warning */}
      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              Mapbox token not configured
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Add NEXT_PUBLIC_MAPBOX_TOKEN to .env
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
