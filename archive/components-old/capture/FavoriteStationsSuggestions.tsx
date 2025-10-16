/**
 * Favorite Stations Suggestions
 * Shows user's most frequent fill-up locations
 * Helps quickly select a station when location is uncertain
 */

'use client'

import { useEffect, useState } from 'react'
import { MapPin, TrendingUp, Clock, Loader2 } from 'lucide-react'
import type { FavoriteStation } from '@/lib/favorite-stations'
import { formatFrequency } from '@/lib/favorite-stations'
import { formatDistance } from '@/lib/location-search'

interface FavoriteStationsSuggestionsProps {
  userId: string
  currentLatitude?: number
  currentLongitude?: number
  onSelect: (station: FavoriteStation) => void
}

export function FavoriteStationsSuggestions({
  userId,
  currentLatitude,
  currentLongitude,
  onSelect,
}: FavoriteStationsSuggestionsProps) {
  const [favorites, setFavorites] = useState<FavoriteStation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      try {
        setIsLoading(true)
        
        // Fetch favorites from API
        const response = await fetch(`/api/users/${userId}/favorite-stations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: currentLatitude,
            longitude: currentLongitude,
            limit: 3, // Show top 3
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setFavorites(data.favorites || [])
        }
      } catch (error) {
        console.error('Error loading favorite stations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()
  }, [userId, currentLatitude, currentLongitude])

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-900">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm">Loading your favorite stations...</p>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return null // Don't show anything if no favorites
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-blue-900">You usually fill up at:</h4>
      </div>

      <div className="space-y-2">
        {favorites.map((fav, index) => (
          <button
            key={`${fav.stationName}-${index}`}
            onClick={() => onSelect(fav)}
            className="w-full text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{fav.stationName}</div>
                
                {fav.address && (
                  <div className="text-sm text-gray-600 mt-1">{fav.address}</div>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {formatFrequency(fav.frequency)}
                  </div>

                  {fav.lastVisit && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last visit: {formatDate(fav.lastVisit)}
                    </div>
                  )}
                </div>

                {currentLatitude && currentLongitude && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                    <MapPin className="w-3 h-3" />
                    {formatDistance(
                      calculateDistance(
                        currentLatitude,
                        currentLongitude,
                        fav.location.latitude,
                        fav.location.longitude
                      )
                    )}
                    {' from current location'}
                  </div>
                )}
              </div>

              <div className="ml-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  #{index + 1}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-blue-700 mt-3">
        💡 These are your most frequent fill-up locations
      </p>
    </div>
  )
}

/**
 * Format date for display
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

/**
 * Calculate distance in miles
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
