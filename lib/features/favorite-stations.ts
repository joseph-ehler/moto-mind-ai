/**
 * Favorite Stations Learning
 * Analyzes user's fill-up history to suggest frequent stations
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface FavoriteStation {
  stationName: string
  location: {
    latitude: number
    longitude: number
  }
  address?: string
  frequency: number // Number of times user filled up there
  lastVisit?: string // ISO date of last fill-up
  averageGallons?: number
  averageCost?: number
}

/**
 * Get user's favorite gas stations based on fill-up history
 */
export async function getUserFavoriteStations(
  userId: string,
  limit: number = 5
): Promise<FavoriteStation[]> {
  try {
    // Query fuel events for this user
    const { data: events, error } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'fuel')
      .order('event_date', { ascending: false })
      .limit(100) // Look at last 100 fill-ups

    if (error) {
      console.error('Error fetching fuel events:', error)
      return []
    }

    if (!events || events.length === 0) {
      return []
    }

    // Group by station and location
    const stationMap = new Map<string, {
      name: string
      location: { latitude: number; longitude: number } | null
      address?: string
      visits: Array<{
        date: string
        gallons?: number
        cost?: number
      }>
    }>()

    for (const event of events) {
      const data = event.event_data as any
      const stationName = data?.station_name || data?.station || 'Unknown Station'
      
      // Get location from supplemental data
      const supplemental = event.supplemental_data as any
      const location = supplemental?.gps || supplemental?.location

      // Create unique key (name + rough location)
      const locationKey = location
        ? `${stationName}_${Math.round(location.latitude * 100)}_${Math.round(location.longitude * 100)}`
        : stationName

      if (!stationMap.has(locationKey)) {
        stationMap.set(locationKey, {
          name: stationName,
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude
          } : null,
          address: supplemental?.address,
          visits: []
        })
      }

      const station = stationMap.get(locationKey)!
      station.visits.push({
        date: event.event_date,
        gallons: data?.gallons,
        cost: data?.total_amount || data?.cost
      })
    }

    // Convert to FavoriteStation array and calculate stats
    const favorites: FavoriteStation[] = []

    for (const [key, station] of stationMap.entries()) {
      // Skip if no valid location
      if (!station.location) continue

      // Calculate averages
      const validGallons = station.visits
        .map(v => v.gallons)
        .filter((g): g is number => typeof g === 'number' && g > 0)
      
      const validCosts = station.visits
        .map(v => v.cost)
        .filter((c): c is number => typeof c === 'number' && c > 0)

      favorites.push({
        stationName: station.name,
        location: station.location,
        address: station.address,
        frequency: station.visits.length,
        lastVisit: station.visits[0]?.date,
        averageGallons: validGallons.length > 0
          ? validGallons.reduce((a, b) => a + b, 0) / validGallons.length
          : undefined,
        averageCost: validCosts.length > 0
          ? validCosts.reduce((a, b) => a + b, 0) / validCosts.length
          : undefined,
      })
    }

    // Sort by frequency (most visited first)
    favorites.sort((a, b) => b.frequency - a.frequency)

    // Return top N
    return favorites.slice(0, limit)
  } catch (error) {
    console.error('Error analyzing favorite stations:', error)
    return []
  }
}

/**
 * Check if a location matches one of the user's favorite stations
 * Returns the matching favorite or null
 */
export async function findMatchingFavorite(
  userId: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 0.5
): Promise<FavoriteStation | null> {
  const favorites = await getUserFavoriteStations(userId, 20)

  for (const fav of favorites) {
    const distance = calculateDistanceMiles(
      latitude,
      longitude,
      fav.location.latitude,
      fav.location.longitude
    )

    if (distance < radiusMiles) {
      return fav
    }
  }

  return null
}

/**
 * Get suggestions based on current location
 * Returns favorites near the current location
 */
export async function getSuggestionsNearLocation(
  userId: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<FavoriteStation[]> {
  const favorites = await getUserFavoriteStations(userId, 20)

  return favorites
    .map(fav => ({
      ...fav,
      distance: calculateDistanceMiles(
        latitude,
        longitude,
        fav.location.latitude,
        fav.location.longitude
      )
    }))
    .filter(fav => fav.distance < radiusMiles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
}

/**
 * Calculate distance in miles (Haversine formula)
 */
function calculateDistanceMiles(
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

/**
 * Format frequency for display
 */
export function formatFrequency(count: number): string {
  if (count === 1) return '1 time'
  if (count < 10) return `${count} times`
  if (count < 20) return '10+ times'
  return '20+ times'
}

/**
 * Get user's top station (most frequent)
 */
export async function getUserTopStation(userId: string): Promise<FavoriteStation | null> {
  const favorites = await getUserFavoriteStations(userId, 1)
  return favorites[0] || null
}
