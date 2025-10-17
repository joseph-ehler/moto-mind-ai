/**
 * Location Search Utilities
 * Search for nearby gas stations using various APIs/services
 */

export interface GasStation {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  latitude: number
  longitude: number
  distance?: number // Distance in miles from search location
  brand?: string // Shell, Exxon, BP, etc.
}

export interface SearchNearbyOptions {
  latitude: number
  longitude: number
  radius?: number // In miles, default 25
  stationName?: string // Filter by station name/brand
  limit?: number // Max results, default 10
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
export function calculateDistanceMiles(
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
 * Search for nearby gas stations
 * 
 * IMPLEMENTATION OPTIONS:
 * 1. Google Places API (best, but costs $$)
 * 2. Overpass API (OpenStreetMap, free!)
 * 3. Local database of known stations
 * 
 * Starting with Overpass API (free, no API key needed)
 */
export async function searchNearbyStations(
  options: SearchNearbyOptions
): Promise<GasStation[]> {
  const {
    latitude,
    longitude,
    radius = 25, // 25 miles default
    stationName,
    limit = 10,
  } = options

  try {
    // Convert miles to meters for Overpass API
    const radiusMeters = radius * 1609.34

    // Build Overpass query
    // Query for fuel stations within radius
    const query = `
[out:json][timeout:25];
(
  node["amenity"="fuel"](around:${radiusMeters},${latitude},${longitude});
  way["amenity"="fuel"](around:${radiusMeters},${latitude},${longitude});
);
out body;
>;
out skel qt;
`

    const url = 'https://overpass-api.de/api/interpreter'
    const response = await fetch(url, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const data = await response.json()

    // Parse results
    const stations: GasStation[] = data.elements
      .filter((element: any) => element.lat && element.lon)
      .map((element: any) => {
        const tags = element.tags || {}
        const distance = calculateDistanceMiles(
          latitude,
          longitude,
          element.lat,
          element.lon
        )

        return {
          id: `osm-${element.id}`,
          name: tags.name || tags.brand || 'Gas Station',
          address: tags['addr:street']
            ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`
            : 'Address not available',
          city: tags['addr:city'] || '',
          state: tags['addr:state'] || '',
          zip: tags['addr:postcode'] || '',
          latitude: element.lat,
          longitude: element.lon,
          distance,
          brand: tags.brand || undefined,
        }
      })

    // Filter by station name if provided
    let filteredStations = stations
    if (stationName) {
      const searchTerm = stationName.toLowerCase()
      filteredStations = stations.filter(
        (station) =>
          station.name.toLowerCase().includes(searchTerm) ||
          station.brand?.toLowerCase().includes(searchTerm)
      )
    }

    // Sort by distance
    filteredStations.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    // Limit results
    return filteredStations.slice(0, limit)
  } catch (error) {
    console.error('Error searching nearby stations:', error)
    return []
  }
}

/**
 * Search for stations matching a specific name/brand
 * Useful when user uploads receipt with station name but uncertain location
 */
export async function searchStationsByName(
  stationName: string,
  nearLatitude: number,
  nearLongitude: number,
  radiusMiles: number = 50
): Promise<GasStation[]> {
  return searchNearbyStations({
    latitude: nearLatitude,
    longitude: nearLongitude,
    radius: radiusMiles,
    stationName,
    limit: 10,
  })
}

/**
 * Get closest station to a location
 */
export async function getClosestStation(
  latitude: number,
  longitude: number
): Promise<GasStation | null> {
  const stations = await searchNearbyStations({
    latitude,
    longitude,
    radius: 5, // Search within 5 miles
    limit: 1,
  })

  return stations[0] || null
}

/**
 * Validate if a location is near a known gas station
 * Returns true if within 0.5 miles of a station
 */
export async function isNearGasStation(
  latitude: number,
  longitude: number
): Promise<boolean> {
  const closest = await getClosestStation(latitude, longitude)
  return closest !== null && (closest.distance || Infinity) < 0.5
}

/**
 * Format station address for display
 */
export function formatStationAddress(station: GasStation): string {
  const parts = [station.address, station.city, station.state, station.zip].filter(
    (part) => part && part.length > 0
  )
  return parts.join(', ')
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    return 'Less than 0.1 miles'
  }
  if (miles < 1) {
    return `${miles.toFixed(1)} miles`
  }
  return `${Math.round(miles)} miles`
}
