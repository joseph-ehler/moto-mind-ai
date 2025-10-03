/**
 * Geocoding Service - FREE VERSION
 * 
 * Uses OpenStreetMap Nominatim API (completely free, no API key needed!)
 */

export interface GeocodedLocation {
  lat: number
  lng: number
  formatted_address?: string
}

/**
 * Geocode an address to coordinates using free OpenStreetMap API
 * 
 * @param address - Full address string
 * @returns Coordinates or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodedLocation | null> {
  if (!address || address.trim() === '') {
    return null
  }

  try {
    // Use OpenStreetMap Nominatim API - completely free!
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'MotoMindAI/1.0'
        }
      }
    )

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (data && data.length > 0) {
      const result = data[0]

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name
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
