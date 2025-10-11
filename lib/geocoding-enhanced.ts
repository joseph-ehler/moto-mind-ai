/**
 * Enhanced Geocoding with Multi-Provider Support
 * 
 * Features:
 * - Persistent Redis caching
 * - Multi-provider fallback (Nominatim → Google Maps)
 * - Metrics tracking
 * - All bulletproofing from geocoding.ts
 */

import { cacheGet, cacheSet, cacheIncr } from '@/lib/cache/redis'
import { env } from '@/lib/config/env'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface GeocodingResult {
  coordinates: Coordinates
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  provider: 'nominatim' | 'google' | 'cache'
}

// Rate limiting protection
let lastNominatimRequest = 0
let lastGoogleRequest = 0
const NOMINATIM_MIN_INTERVAL_MS = 1000 // 1 req/sec
const GOOGLE_MIN_INTERVAL_MS = 100 // 10 req/sec (generous)

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
  
  const hasStreetNumber = /\d+/.test(address)
  const hasState = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i.test(address)
  const hasZip = /\b\d{5}(-\d{4})?\b/.test(address)
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
 * Geocode using Nominatim (OpenStreetMap) - Free!
 */
async function geocodeWithNominatim(address: string): Promise<Coordinates | null> {
  // Rate limit protection
  const timeSinceLastRequest = Date.now() - lastNominatimRequest
  if (timeSinceLastRequest < NOMINATIM_MIN_INTERVAL_MS) {
    await new Promise(resolve => 
      setTimeout(resolve, NOMINATIM_MIN_INTERVAL_MS - timeSinceLastRequest)
    )
  }
  lastNominatimRequest = Date.now()
  
  const data = await retryWithBackoff(async () => {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'MotoMind App (contact@motomind.app)'
      }
    }, 5000)
    
    if (!response.ok) {
      throw new Error(`Nominatim geocoding failed: ${response.status}`)
    }
    
    return await response.json()
  })
  
  if (!data || data.length === 0) {
    console.log('⚠️ Nominatim: No results for:', address)
    return null
  }
  
  const result = data[0]
  const coords: Coordinates = {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon)
  }
  
  if (!isValidCoordinates(coords.latitude, coords.longitude)) {
    console.error('Invalid coordinates from Nominatim:', coords)
    return null
  }
  
  // Track success metric
  await cacheIncr('metrics:geocoding:nominatim:success')
  console.log('✅ Nominatim geocoding successful')
  
  return coords
}

/**
 * Geocode using Google Maps API - Paid fallback
 */
async function geocodeWithGoogle(address: string): Promise<Coordinates | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.log('ℹ️ GOOGLE_MAPS_API_KEY not configured - skipping Google fallback')
    return null
  }
  
  // Rate limit protection
  const timeSinceLastRequest = Date.now() - lastGoogleRequest
  if (timeSinceLastRequest < GOOGLE_MIN_INTERVAL_MS) {
    await new Promise(resolve => 
      setTimeout(resolve, GOOGLE_MIN_INTERVAL_MS - timeSinceLastRequest)
    )
  }
  lastGoogleRequest = Date.now()
  
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    
    const response = await fetchWithTimeout(url, {}, 5000)
    
    if (!response.ok) {
      throw new Error(`Google geocoding failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log(`⚠️ Google: ${data.status} - No results for:`, address)
      return null
    }
    
    const result = data.results[0]
    const coords: Coordinates = {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng
    }
    
    if (!isValidCoordinates(coords.latitude, coords.longitude)) {
      console.error('Invalid coordinates from Google:', coords)
      return null
    }
    
    // Track success metric
    await cacheIncr('metrics:geocoding:google:success')
    console.log('✅ Google geocoding successful')
    
    return coords
  } catch (error) {
    console.error('Google geocoding error:', error)
    await cacheIncr('metrics:geocoding:google:error')
    return null
  }
}

/**
 * Enhanced forward geocoding with multi-provider support
 * 
 * Flow:
 * 1. Check Redis cache
 * 2. Try Nominatim (free)
 * 3. Fallback to Google Maps (paid, if configured)
 * 4. Cache successful result
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
    await cacheIncr('metrics:geocoding:invalid_address')
    return null
  }
  
  if (quality.confidence === 'low') {
    warnings.push('Address may be incomplete - geocoding might be inaccurate')
  }
  
  // Check Redis cache first
  const cacheKey = `geocode:${address.toLowerCase().trim()}`
  try {
    const cached = await cacheGet(cacheKey)
    if (cached) {
      const coords = JSON.parse(cached)
      console.log('📍 Using cached geocoding result (Redis)')
      await cacheIncr('metrics:geocoding:cache_hit')
      
      return {
        coordinates: coords,
        confidence: quality.confidence,
        warnings,
        provider: 'cache'
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error)
  }
  
  await cacheIncr('metrics:geocoding:cache_miss')
  
  // Try Nominatim first (free!)
  let coords: Coordinates | null = null
  let provider: 'nominatim' | 'google' = 'nominatim'
  
  try {
    coords = await geocodeWithNominatim(address)
  } catch (error) {
    console.warn('⚠️ Nominatim geocoding failed:', error)
    await cacheIncr('metrics:geocoding:nominatim:error')
  }
  
  // Fallback to Google Maps if Nominatim failed
  if (!coords) {
    console.log('⚠️ Nominatim failed, trying Google Maps fallback...')
    try {
      coords = await geocodeWithGoogle(address)
      if (coords) {
        provider = 'google'
      }
    } catch (error) {
      console.error('❌ Google geocoding also failed:', error)
    }
  }
  
  if (!coords) {
    console.error('❌ All geocoding providers failed for:', address)
    await cacheIncr('metrics:geocoding:total_failure')
    return null
  }
  
  // Distance warning
  if (currentGPS && isValidCoordinates(currentGPS.latitude, currentGPS.longitude)) {
    const distanceKm = calculateDistance(
      coords.latitude,
      coords.longitude,
      currentGPS.latitude,
      currentGPS.longitude
    )
    
    if (distanceKm > 50) {
      warnings.push(`Geocoded location is ${Math.round(distanceKm)} km from current location`)
    }
  }
  
  // Cache the successful result (24 hours TTL)
  try {
    await cacheSet(cacheKey, JSON.stringify(coords), 86400)
  } catch (error) {
    console.warn('Cache write error:', error)
  }
  
  return {
    coordinates: coords,
    confidence: quality.confidence,
    warnings,
    provider
  }
}

/**
 * Reverse geocoding (coordinates → address)
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  if (!isValidCoordinates(lat, lon)) {
    console.error('Invalid coordinates for reverse geocoding:', { lat, lon })
    return null
  }
  
  // Check cache
  const cacheKey = `reverse:${lat.toFixed(4)},${lon.toFixed(4)}`
  try {
    const cached = await cacheGet(cacheKey)
    if (cached) {
      console.log('📍 Using cached reverse geocoding result')
      return cached
    }
  } catch (error) {
    console.warn('Cache read error:', error)
  }
  
  // Try Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'MotoMind App (contact@motomind.app)'
      }
    }, 5000)
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.address) {
      return null
    }
    
    // Build formatted address
    const parts = []
    
    if (data.address.house_number && data.address.road) {
      parts.push(`${data.address.house_number} ${data.address.road}`)
    } else if (data.address.road) {
      parts.push(data.address.road)
    }
    
    if (data.address.city) {
      parts.push(data.address.city)
    } else if (data.address.town) {
      parts.push(data.address.town)
    } else if (data.address.village) {
      parts.push(data.address.village)
    }
    
    if (data.address.state && data.address.postcode) {
      parts.push(`${data.address.state} ${data.address.postcode}`)
    } else if (data.address.state) {
      parts.push(data.address.state)
    }
    
    const address = parts.length > 0 ? parts.join(', ') : null
    
    // Cache result
    if (address) {
      try {
        await cacheSet(cacheKey, address, 86400) // 24 hours
      } catch (error) {
        console.warn('Cache write error:', error)
      }
    }
    
    return address
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Get geocoding metrics
 */
export async function getGeocodingMetrics(): Promise<{
  cache_hit: number
  cache_miss: number
  nominatim_success: number
  nominatim_error: number
  google_success: number
  google_error: number
  total_failure: number
  invalid_address: number
}> {
  const metrics = {
    cache_hit: 0,
    cache_miss: 0,
    nominatim_success: 0,
    nominatim_error: 0,
    google_success: 0,
    google_error: 0,
    total_failure: 0,
    invalid_address: 0
  }
  
  try {
    const keys = [
      'cache_hit', 'cache_miss', 
      'nominatim_success', 'nominatim_error',
      'google_success', 'google_error',
      'total_failure', 'invalid_address'
    ]
    
    for (const key of keys) {
      const value = await cacheGet(`metrics:geocoding:${key}`)
      metrics[key as keyof typeof metrics] = value ? parseInt(value, 10) : 0
    }
  } catch (error) {
    console.warn('Failed to get geocoding metrics:', error)
  }
  
  return metrics
}
