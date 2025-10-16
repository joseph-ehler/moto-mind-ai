/**
 * Nearby Stations Modal
 * Shows list of nearby gas stations when location is uncertain
 * Helps user pick the correct station
 */

'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, X, AlertCircle } from 'lucide-react'
import { searchStationsByName, type GasStation, formatDistance, formatStationAddress } from '@/lib/location-search'
import { MapPreview } from '@/components/location/MapPreview'

interface NearbyStationsModalProps {
  stationName: string // Station name from receipt (e.g., "Fuel Depot")
  searchLatitude: number // Center of search (from EXIF or GPS)
  searchLongitude: number
  onSelect: (station: GasStation) => void
  onCancel: () => void
  onManualEntry: () => void
}

export function NearbyStationsModal({
  stationName,
  searchLatitude,
  searchLongitude,
  onSelect,
  onCancel,
  onManualEntry,
}: NearbyStationsModalProps) {
  const [stations, setStations] = useState<GasStation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null)

  useEffect(() => {
    async function search() {
      setIsLoading(true)
      setError(null)

      try {
        const results = await searchStationsByName(
          stationName,
          searchLatitude,
          searchLongitude,
          50 // Search within 50 miles
        )

        if (results.length === 0) {
          setError(`No "${stationName}" locations found within 50 miles`)
        }

        setStations(results)
      } catch (err) {
        console.error('Station search error:', err)
        setError('Failed to search for stations. Please try manual entry.')
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [stationName, searchLatitude, searchLongitude])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Choose the Correct Station
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              We found multiple "{stationName}" locations nearby
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">
                Searching for "{stationName}" locations...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">{error}</p>
                <button
                  onClick={onManualEntry}
                  className="text-sm text-yellow-700 underline mt-2 hover:text-yellow-800"
                >
                  Enter location manually instead
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && stations.length > 0 && (
            <div className="space-y-3">
              {stations.map((station) => (
                <StationOption
                  key={station.id}
                  station={station}
                  isSelected={selectedStation?.id === station.id}
                  onSelect={() => setSelectedStation(station)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onManualEntry}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            None of these - enter manually
          </button>
          <button
            onClick={() => selectedStation && onSelect(selectedStation)}
            disabled={!selectedStation}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              selectedStation
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            ✓ Use selected location
          </button>
        </div>
      </div>
    </div>
  )
}

function StationOption({
  station,
  isSelected,
  onSelect,
}: {
  station: GasStation
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex gap-4">
        {/* Map Preview */}
        <div className="w-32 h-32 flex-shrink-0 rounded overflow-hidden">
          <MapPreview
            lat={station.latitude}
            lng={station.longitude}
            marker={{
              position: [station.latitude, station.longitude],
              label: station.name,
            }}
            height={128}
          />
        </div>

        {/* Station Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {station.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {formatStationAddress(station)}
              </p>
            </div>

            {isSelected && (
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>

          {station.distance !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              {formatDistance(station.distance)} from search location
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
