/**
 * Geocoding Utilities (Client-Safe)
 * Forward and reverse geocoding using Nominatim (OpenStreetMap)
 * Free, no API key needed!
 * 
 * Features:
 * - Coordinate validation
 * - Retry logic with exponential backoff
 * - Request timeout (5s)
 * - In-memory caching
 * - Address quality validation
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface GeocodingResult {
  coordinates: Coordinates
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

// In-memory cache for geocoding results (avoid repeated API calls)
const geocodeCache = new Map<string, { coords: Coordinates; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

// Rate limiting protection
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL_MS = 1000 // Nominatim requires 1 req/sec max

/**
 * Validate coordinates are within valid range
 */
function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) && !isNaN(lon) &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  )
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Validate US address has minimum required components
 */
function validateAddressQuality(address: string): { valid: boolean; confidence: 'high' | 'medium' | 'low' } {
  const addressLower = address.toLowerCase()
  
  // Must have street number
  const hasStreetNumber = /\d+/.test(address)
  
  // Common US state abbreviations or full names
  const hasState = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i.test(address)
  
  // Has ZIP code
  const hasZip = /\b\d{5}(-\d{4})?\b/.test(address)
  
  // Has city (harder to detect, assume if has commas)
  const hasCommas = (address.match(/,/g) || []).length >= 2
  
  if (hasStreetNumber && hasState && hasZip && hasCommas) {
    return { valid: true, confidence: 'high' }
  } else if (hasStreetNumber && hasState) {
    return { valid: true, confidence: 'medium' }
  } else if (hasStreetNumber || hasState) {
    return { valid: true, confidence: 'low' }
  }
  
  return { valid: false, confidence: 'low' }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeout)
    return response
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * Forward geocoding - convert address to coordinates
 * Uses Nominatim (OpenStreetMap) - Free!
 * 
 * Features:
 * - Validates address quality before geocoding
 * - Caches results for 1 hour
 * - Retries on failure
 * - 5 second timeout
 * - Rate limit protection (1 req/sec)
 */
export async function forwardGeocode(
  address: string,
  currentGPS?: Coordinates
): Promise<GeocodingResult | null> {
  const warnings: string[] = []
  
  // Validate address quality
  const quality = validateAddressQuality(address)
  if (!quality.valid) {
    console.warn('Address missing required components:', address)
    return null
  }
  
  if (quality.confidence === 'low') {
    warnings.push('Address may be incomplete - geocoding might be inaccurate')
  }
  
  // Check cache first
  const cacheKey = address.toLowerCase().trim()
  const cached = geocodeCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('📍 Using cached geocoding result')
    return {
      coordinates: cached.coords,
      confidence: quality.confidence,
      warnings
    }
  }
  
  try {
    // Rate limit protection
    const timeSinceLastRequest = Date.now() - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest)
      )
    }
    lastRequestTime = Date.now()
    
    // Geocode with retry & timeout
    const data = await retryWithBackoff(async () => {
      const encodedAddress = encodeURIComponent(address)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`
      
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'MotoMind App (contact@motomind.app)'
        }
      }, 5000)
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`)
      }
      
      return await response.json()
    })
    
    if (!data || data.length === 0) {
      console.warn('No geocoding results for:', address)
      return null
    }
    
    const result = data[0]
    const coords: Coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    }
    
    // Validate coordinates
    if (!isValidCoordinates(coords.latitude, coords.longitude)) {
      console.error('Invalid coordinates returned:', coords)
      return null
    }
    
    // If we have current GPS, check distance
    if (currentGPS && isValidCoordinates(currentGPS.latitude, currentGPS.longitude)) {
      const distanceKm = calculateDistance(
        coords.latitude,
        coords.longitude,
        currentGPS.latitude,
        currentGPS.longitude
      )
      
      // If geocoded location is very far from current GPS, warn user
      if (distanceKm > 50) {
        warnings.push(`Geocoded location is ${Math.round(distanceKm)} km from current location`)
      }
    }
    
    // Cache the result
    geocodeCache.set(cacheKey, {
      coords,
      timestamp: Date.now()
    })
    
    return {
      coordinates: coords,
      confidence: quality.confidence,
      warnings
    }
  } catch (error) {
    console.error('Forward geocoding error:', error)
    return null
  }
}

/**
 * Reverse geocoding - convert coordinates to address
 * Uses Nominatim (OpenStreetMap) - Free!
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MotoMind App (contact@motomind.app)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.address) {
      return null
    }
    
    // Build formatted address from components
    const parts = []
    
    // Street address
    if (data.address.house_number && data.address.road) {
      parts.push(`${data.address.house_number} ${data.address.road}`)
    } else if (data.address.road) {
      parts.push(data.address.road)
    }
    
    // City
    if (data.address.city) {
      parts.push(data.address.city)
    } else if (data.address.town) {
      parts.push(data.address.town)
    } else if (data.address.village) {
      parts.push(data.address.village)
    }
    
    // State & ZIP
    if (data.address.state && data.address.postcode) {
      parts.push(`${data.address.state} ${data.address.postcode}`)
    } else if (data.address.state) {
      parts.push(data.address.state)
    }
    
    return parts.length > 0 ? parts.join(', ') : null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}
