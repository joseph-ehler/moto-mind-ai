/**
 * Events Map Component
 * 
 * Displays vehicle events with addresses on an interactive map
 * Uses Mapbox GL JS for rendering
 */

import { useState, useMemo, useEffect } from 'react'
import { MapPin, Fuel, Wrench, CheckCircle, DollarSign } from 'lucide-react'

export interface EventLocation {
  id: string
  type: string
  date: string
  vendor: string
  address: string
  lat: number
  lng: number
  total_amount?: number
}

interface EventsMapProps {
  events: EventLocation[]
  height?: string
}

export function EventsMap({ events, height = '600px' }: EventsMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventLocation | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Calculate map bounds
  const bounds = useMemo(() => {
    if (events.length === 0) {
      return { lat: 40, lng: -95, zoom: 4 }
    }

    const lats = events.map(e => e.lat)
    const lngs = events.map(e => e.lng)

    return {
      lat: (Math.max(...lats) + Math.min(...lats)) / 2,
      lng: (Math.max(...lngs) + Math.min(...lngs)) / 2,
      zoom: events.length === 1 ? 12 : 10
    }
  }, [events])

  // Get icon for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <Fuel className="w-3 h-3" />
      case 'service': return <Wrench className="w-3 h-3" />
      case 'inspection': return <CheckCircle className="w-3 h-3" />
      default: return <MapPin className="w-3 h-3" />
    }
  }

  // Get color for event type
  const getEventColor = (type: string) => {
    switch (type) {
      case 'fuel': return 'bg-blue-600 hover:bg-blue-700'
      case 'service': return 'bg-emerald-600 hover:bg-emerald-700'
      case 'inspection': return 'bg-purple-600 hover:bg-purple-700'
      default: return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  // Check if Mapbox is configured
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!mapboxToken) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center" style={{ height }}>
        <MapPin className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-amber-900 mb-2">
          Map Visualization Not Configured
        </h3>
        <p className="text-sm text-amber-700 mb-4">
          Add your Mapbox token to <code className="bg-amber-100 px-2 py-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in <code className="bg-amber-100 px-2 py-1 rounded">.env.local</code>
        </p>
        <a
          href="https://account.mapbox.com/access-tokens/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-800 underline hover:text-amber-900"
        >
          Get a free Mapbox token →
        </a>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center" style={{ height }}>
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Locations to Display
        </h3>
        <p className="text-sm text-gray-600">
          Upload receipts with addresses to see them on the map
        </p>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
      {/* Map Container - Will be enhanced with actual Mapbox once dependencies installed */}
      <div className="absolute inset-0 bg-gray-100">
        {/* Placeholder map - replace with actual Mapbox Map component */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Map Component Ready</p>
            <p className="text-sm text-gray-500">Install mapbox-gl and react-map-gl to activate</p>
            <code className="text-xs bg-gray-200 px-3 py-1 rounded mt-3 inline-block">
              npm install mapbox-gl react-map-gl
            </code>
          </div>
        </div>
      </div>

      {/* Event List Overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs max-h-96 overflow-y-auto">
        <h4 className="font-semibold text-sm text-gray-900 mb-3">
          Locations ({events.length})
        </h4>
        <div className="space-y-2">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedEvent?.id === event.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded ${getEventColor(event.type)} text-white`}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {event.vendor}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  {event.total_amount && (
                    <p className="text-xs font-medium text-gray-700 mt-1">
                      ${event.total_amount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Event Details */}
      {selectedEvent && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type)} text-white`}>
              {getEventIcon(selectedEvent.type)}
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-900">{selectedEvent.vendor}</h5>
              <p className="text-sm text-gray-600 mt-1">{selectedEvent.address}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="text-gray-600">{new Date(selectedEvent.date).toLocaleDateString()}</span>
                {selectedEvent.total_amount && (
                  <span className="font-medium text-gray-900">${selectedEvent.total_amount.toFixed(2)}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
