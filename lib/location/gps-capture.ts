/**
 * GPS Capture Utilities
 * Handles location capture with comprehensive edge case handling
 * 
 * Key Principles:
 * - Always optional (never blocks user)
 * - Clear permission prompts
 * - Timeout after 5 seconds
 * - Cache for session
 * - Graceful degradation
 */

export interface GPSData {
  latitude: number
  longitude: number
  accuracy: number  // meters
  altitude?: number
  timestamp: number
}

export interface LocationResult {
  gps: GPSData | null
  address: string | null
  error: GeolocationError | null
  source: 'gps' | 'cached' | 'denied' | 'unavailable'
}

export interface GeolocationError {
  code: 'permission_denied' | 'position_unavailable' | 'timeout' | 'not_supported'
  message: string
}

// Session cache for GPS data
let cachedGPS: GPSData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 5 * 60 * 1000  // 5 minutes

/**
 * Check if geolocation is supported
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator
}

/**
 * Get current location with timeout and error handling
 */
export async function getCurrentLocation(options?: {
  timeout?: number
  enableHighAccuracy?: boolean
  useCache?: boolean
}): Promise<LocationResult> {
  
  const {
    timeout = 5000,  // 5 seconds max
    enableHighAccuracy = true,
    useCache = true,
  } = options || {}
  
  // Check if geolocation is supported
  if (!isGeolocationSupported()) {
    return {
      gps: null,
      address: null,
      error: {
        code: 'not_supported',
        message: 'Geolocation is not supported by this browser',
      },
      source: 'unavailable',
    }
  }
  
  // Check cache (if enabled and fresh)
  if (useCache && cachedGPS && (Date.now() - cacheTimestamp) < CACHE_DURATION_MS) {
    console.log('Using cached GPS data')
    return {
      gps: cachedGPS,
      address: null,  // Cache doesn't include address
      error: null,
      source: 'cached',
    }
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      // Success
      async (position) => {
        const gps: GPSData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          timestamp: position.timestamp,
        }
        
        // Cache the result
        cachedGPS = gps
        cacheTimestamp = Date.now()
        
        // Try to get address (don't wait, can be done async)
        let address: string | null = null
        try {
          address = await reverseGeocode(gps.latitude, gps.longitude)
        } catch (error) {
          console.log('Reverse geocoding failed:', error)
        }
        
        resolve({
          gps,
          address,
          error: null,
          source: 'gps',
        })
      },
      
      // Error
      (error) => {
        let errorCode: GeolocationError['code']
        let errorMessage: string
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorCode = 'permission_denied'
            errorMessage = 'Location permission denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            errorCode = 'position_unavailable'
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorCode = 'timeout'
            errorMessage = 'Location request timed out'
            break
          default:
            errorCode = 'position_unavailable'
            errorMessage = 'Unknown error occurred'
        }
        
        resolve({
          gps: null,
          address: null,
          error: {
            code: errorCode,
            message: errorMessage,
          },
          source: errorCode === 'permission_denied' ? 'denied' : 'unavailable',
        })
      },
      
      // Options
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 0,  // Don't use cached position from browser
      }
    )
  })
}

/**
 * Reverse geocode coordinates to human-readable address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    // Using OpenStreetMap Nominatim (free, no API key required)
    // For production, consider Google Maps Geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MotoMindAI/1.0',  // Required by Nominatim
        },
      }
    )
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Build address from components
    const address = data.address
    if (!address) return null
    
    const parts = [
      address.road || address.street,
      address.city || address.town || address.village,
      address.state,
    ].filter(Boolean)
    
    return parts.join(', ') || data.display_name || null
    
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Find nearby places (gas stations, repair shops, etc.)
 */
export interface NearbyPlace {
  name: string
  address: string
  latitude: number
  longitude: number
  distance: number  // meters
  type: string
}

export async function findNearbyPlaces(
  latitude: number,
  longitude: number,
  type: 'gas_station' | 'car_repair' | 'car_wash',
  radiusMeters: number = 1000
): Promise<NearbyPlace[]> {
  try {
    // Using Overpass API (OpenStreetMap data, free)
    // For production, consider Google Places API
    const osmType = {
      gas_station: 'amenity=fuel',
      car_repair: 'shop=car_repair',
      car_wash: 'amenity=car_wash',
    }[type]
    
    const query = `
      [out:json];
      (
        node["${osmType}"](around:${radiusMeters},${latitude},${longitude});
        way["${osmType}"](around:${radiusMeters},${latitude},${longitude});
      );
      out body;
    `
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    })
    
    if (!response.ok) {
      throw new Error(`Overpass API failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Transform results
    const places: NearbyPlace[] = data.elements
      .filter((el: any) => el.tags && el.tags.name)
      .map((el: any) => ({
        name: el.tags.name || 'Unknown',
        address: formatOSMAddress(el.tags),
        latitude: el.lat || el.center?.lat,
        longitude: el.lon || el.center?.lon,
        distance: calculateDistance(
          latitude,
          longitude,
          el.lat || el.center?.lat,
          el.lon || el.center?.lon
        ),
        type: el.tags.amenity || el.tags.shop || type,
      }))
      .filter((place: NearbyPlace) => place.latitude && place.longitude)
      .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance)
    
    return places
    
  } catch (error) {
    console.error('Find nearby places error:', error)
    return []
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3  // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c  // Distance in meters
}

/**
 * Format OSM address components
 */
function formatOSMAddress(tags: any): string {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
  ].filter(Boolean)
  
  return parts.join(', ') || 'Address unavailable'
}

/**
 * Check if GPS accuracy is acceptable
 */
export function isGPSAccuracyAcceptable(
  accuracy: number,
  threshold: number = 100  // meters
): boolean {
  return accuracy <= threshold
}

/**
 * Get GPS permission status (if supported)
 */
export async function getGPSPermissionStatus(): Promise<PermissionState | 'unsupported'> {
  if (!('permissions' in navigator)) {
    return 'unsupported'
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch (error) {
    return 'unsupported'
  }
}

/**
 * Clear cached GPS data (useful for testing)
 */
export function clearGPSCache(): void {
  cachedGPS = null
  cacheTimestamp = 0
}
