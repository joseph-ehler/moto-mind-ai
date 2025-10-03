/**
 * Geocoding Service
 * 
 * Converts addresses to coordinates using Mapbox Geocoding API
 */

export interface GeocodedLocation {
  lat: number
  lng: number
  formatted_address?: string
}

/**
 * Geocode an address to coordinates
 * 
 * @param address - Full address string
 * @returns Coordinates or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodedLocation | null> {
  if (!address || address.trim() === '') {
    return null
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token) {
    console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not configured - geocoding disabled')
    return null
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [lng, lat] = feature.center

      return {
        lat,
        lng,
        formatted_address: feature.place_name
      }
    }

    console.warn('No geocoding results for address:', address)
    return null
  } catch (error) {
    console.error('Geocoding failed:', error)
    return null
  }
}

/**
 * Batch geocode multiple addresses
 * 
 * @param addresses - Array of address strings
 * @returns Array of geocoded locations (null for failed geocodes)
 */
export async function geocodeAddresses(addresses: string[]): Promise<(GeocodedLocation | null)[]> {
  // Rate limit: Don't overwhelm API
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const results: (GeocodedLocation | null)[] = []

  for (const address of addresses) {
    const result = await geocodeAddress(address)
    results.push(result)
    
    // Rate limit: 600 requests/minute = ~100ms between requests
    await delay(100)
  }

  return results
}
