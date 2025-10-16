/**
 * Simple Events Map - No Dependencies Required!
 * 
 * Uses Google Maps embed API - works instantly, no npm install needed
 */

import { MapPin, ExternalLink } from 'lucide-react'

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

interface SimpleEventsMapProps {
  events: EventLocation[]
  height?: string
}

export function SimpleEventsMap({ events, height = '600px' }: SimpleEventsMapProps) {
  if (events.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center" style={{ height }}>
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Locations Yet
        </h3>
        <p className="text-sm text-gray-600">
          Upload fuel receipts or service invoices with addresses to see them here
        </p>
      </div>
    )
  }

  // Calculate center point
  const centerLat = events.reduce((sum, e) => sum + e.lat, 0) / events.length
  const centerLng = events.reduce((sum, e) => sum + e.lng, 0) / events.length

  // Build markers string for Google Maps embed
  const markers = events.map(e => 
    `markers=color:blue%7Clabel:${e.type[0].toUpperCase()}%7C${e.lat},${e.lng}`
  ).join('&')

  // Build Google Maps URL with markers - NO API KEY NEEDED!
  const markersParam = events.map(e => `${e.lat},${e.lng}`).join('|')
  const mapUrl = `https://maps.google.com/maps?q=${centerLat},${centerLng}&z=12&output=embed&markers=${markersParam}`

  return (
    <div className="space-y-4">
      {/* Embedded Google Map */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
        />
      </div>

      {/* Event List */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Locations ({events.length})
        </h3>
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                event.type === 'fuel' ? 'bg-blue-600' :
                event.type === 'service' ? 'bg-emerald-600' :
                'bg-purple-600'
              }`}>
                {event.type[0].toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.vendor}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{event.address}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      {event.total_amount && (
                        <span className="font-medium text-gray-700">
                          ${event.total_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
