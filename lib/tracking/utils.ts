/**
 * Tracking Utility Functions
 * 
 * Helper functions for GPS calculations, distance, speed conversions
 */

import type { LocationPoint, MovementType } from './types'

/**
 * Calculate distance between two GPS points using Haversine formula
 * 
 * @param point1 - First location point
 * @param point2 - Second location point
 * @returns Distance in meters
 */
export function calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180
  const φ2 = (point2.lat * Math.PI) / 180
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Calculate bearing between two GPS points
 * 
 * @param point1 - Start point
 * @param point2 - End point
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(point1: LocationPoint, point2: LocationPoint): number {
  const φ1 = (point1.lat * Math.PI) / 180
  const φ2 = (point2.lat * Math.PI) / 180
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const θ = Math.atan2(y, x)
  const bearing = ((θ * 180) / Math.PI + 360) % 360

  return bearing
}

/**
 * Convert speed from m/s to mph
 */
export function metersPerSecondToMph(mps: number): number {
  return mps * 2.23694
}

/**
 * Convert speed from m/s to km/h
 */
export function metersPerSecondToKmh(mps: number): number {
  return mps * 3.6
}

/**
 * Convert speed from mph to m/s
 */
export function mphToMetersPerSecond(mph: number): number {
  return mph / 2.23694
}

/**
 * Format distance for display
 * 
 * @param meters - Distance in meters
 * @param unit - 'imperial' or 'metric'
 * @returns Formatted string with unit
 */
export function formatDistance(meters: number, unit: 'imperial' | 'metric' = 'imperial'): string {
  if (unit === 'imperial') {
    const miles = meters / 1609.34
    if (miles < 0.1) {
      return `${Math.round(meters * 3.28084)} ft`
    }
    return `${miles.toFixed(2)} mi`
  } else {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }
    return `${(meters / 1000).toFixed(2)} km`
  }
}

/**
 * Format speed for display
 * 
 * @param mps - Speed in meters per second
 * @param unit - 'imperial' or 'metric'
 * @returns Formatted string with unit
 */
export function formatSpeed(mps: number, unit: 'imperial' | 'metric' = 'imperial'): string {
  if (unit === 'imperial') {
    return `${Math.round(metersPerSecondToMph(mps))} mph`
  } else {
    return `${Math.round(metersPerSecondToKmh(mps))} km/h`
  }
}

/**
 * Format duration for display
 * 
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted string (e.g., "1h 23m 45s")
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const s = seconds % 60
  const m = minutes % 60
  const h = hours

  if (h > 0) {
    return `${h}h ${m}m ${s}s`
  } else if (m > 0) {
    return `${m}m ${s}s`
  } else {
    return `${s}s`
  }
}

/**
 * Detect movement type based on speed
 * 
 * @param speed - Speed in m/s
 * @param history - Recent speed history for confidence
 * @returns Movement type with confidence
 */
export function detectMovementType(speed: number, history: number[] = []): MovementType {
  const speedMph = metersPerSecondToMph(speed)
  
  // Calculate variance for confidence
  const allSpeeds = [...history, speed]
  const avgSpeed = allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length
  const variance = allSpeeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / allSpeeds.length
  const confidence = Math.max(0, Math.min(1, 1 - variance / 10))

  if (speedMph < 3) {
    return { type: 'stationary', confidence, speed }
  } else if (speedMph < 15) {
    return { type: 'walking', confidence, speed }
  } else if (speedMph < 40) {
    return { type: 'cycling', confidence, speed }
  } else {
    return { type: 'driving', confidence, speed }
  }
}

/**
 * Smooth GPS coordinates using exponential smoothing
 * Reduces GPS jitter for more accurate tracking
 * 
 * @param current - Current location
 * @param previous - Previous location
 * @param alpha - Smoothing factor (0-1, higher = less smoothing)
 * @returns Smoothed location
 */
export function smoothLocation(
  current: LocationPoint,
  previous: LocationPoint | null,
  alpha: number = 0.3
): LocationPoint {
  if (!previous) {
    return current
  }

  return {
    ...current,
    lat: previous.lat + alpha * (current.lat - previous.lat),
    lng: previous.lng + alpha * (current.lng - previous.lng),
    speed: previous.speed + alpha * (current.speed - previous.speed),
    heading: smoothAngle(current.heading, previous.heading, alpha)
  }
}

/**
 * Smooth angle transition (handles 0-360 wraparound)
 */
function smoothAngle(current: number, previous: number, alpha: number): number {
  let diff = current - previous
  
  // Handle wraparound (e.g., 359° -> 1°)
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  
  let smoothed = previous + alpha * diff
  
  // Normalize to 0-360
  if (smoothed < 0) smoothed += 360
  if (smoothed >= 360) smoothed -= 360
  
  return smoothed
}

/**
 * Check if location is valid
 */
export function isValidLocation(location: LocationPoint): boolean {
  return (
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    !isNaN(location.lat) &&
    !isNaN(location.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180 &&
    location.accuracy > 0 &&
    location.accuracy < 1000 // Ignore very inaccurate points
  )
}

/**
 * Calculate total acceleration magnitude
 * Used for crash detection
 */
export function calculateTotalAcceleration(acc: { x: number; y: number; z: number }): number {
  return Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2)
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if browser supports required APIs
 */
export function checkBrowserSupport(): {
  geolocation: boolean
  motion: boolean
  battery: boolean
  wakeLock: boolean
  indexedDB: boolean
} {
  return {
    geolocation: 'geolocation' in navigator,
    motion: 'DeviceMotionEvent' in window,
    battery: 'getBattery' in navigator,
    wakeLock: 'wakeLock' in navigator,
    indexedDB: 'indexedDB' in window
  }
}
