/**
 * Location Validation Utilities
 * Validates GPS coordinates and handles edge cases
 */

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  // Check if defined
  if (lat === null || lat === undefined) return false
  if (lng === null || lng === undefined) return false

  // Check if valid number
  if (isNaN(lat) || isNaN(lng)) return false

  // Check if within valid range
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false

  // Check if null island (0,0) - usually indicates error
  if (lat === 0 && lng === 0) return false

  // Check if obviously wrong coordinates (most locations < 85° latitude)
  if (Math.abs(lat) > 85) return false

  return true
}

/**
 * Sanitize and clamp coordinates to valid ranges
 */
export function sanitizeCoordinates(
  lat: number,
  lng: number
): { lat: number; lng: number } | null {
  if (!isValidCoordinates(lat, lng)) {
    return null
  }

  // Clamp to valid ranges just in case
  return {
    lat: Math.max(-90, Math.min(90, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  }
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
  const distance = R * c

  return parseFloat(distance.toFixed(1))
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
