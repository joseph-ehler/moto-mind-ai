/**
 * Location Intelligence
 * Smart location detection with time-based trust and context awareness
 */

import type { GPSData } from './gps-capture'
import type { ExifData } from './exif-extraction'

export type LocationSource = 'gps' | 'exif' | 'both' | 'conflict' | 'manual' | 'none'
export type LocationConfidence = 'high' | 'medium' | 'low' | 'none'
export type ImageType = 'pump_display' | 'receipt' | 'unclear'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationResult {
  source: LocationSource
  location: Coordinates | null
  alternateLocation?: Coordinates | null
  confidence: LocationConfidence
  reason: string
  warning?: string
  imageType?: ImageType
  receiptAge?: {
    minutes: number
    isOld: boolean
  }
}

/**
 * Convert GPSData to Coordinates
 */
function toCoordinates(gps: GPSData | { latitude: number; longitude: number } | null): Coordinates | null {
  if (!gps) return null
  return {
    latitude: gps.latitude,
    longitude: gps.longitude,
  }
}

/**
 * Calculate distance between two GPS coordinates (in meters)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Get minutes since a date
 */
function getMinutesSince(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  return Math.floor((now.getTime() - dateObj.getTime()) / 1000 / 60)
}

/**
 * Get days since a date
 */
function getDaysSince(date: Date | string): number {
  return Math.floor(getMinutesSince(date) / 60 / 24)
}

/**
 * Determine the best location source with smart context awareness
 */
export function determineLocationSource(
  gps: GPSData | null,
  exif: ExifData | null,
  receiptDate?: string,
  imageType?: ImageType
): LocationResult {
  // If no location data at all
  if (!gps && !exif?.gps) {
    return {
      source: 'none',
      location: null,
      confidence: 'none',
      reason: 'No location data available',
      warning: 'Please enter gas station location manually',
    }
  }

  // Check EXIF capture time (when photo was actually taken)
  const exifCaptureTime = exif?.captureDate
  const photoAgeMinutes = exifCaptureTime ? getMinutesSince(exifCaptureTime) : 0
  const photoAgeDays = exifCaptureTime ? getDaysSince(exifCaptureTime) : 0

  // Check receipt date (from OCR)
  const receiptAgeMinutes = receiptDate ? getMinutesSince(receiptDate) : null
  const receiptAgeDays = receiptDate ? getDaysSince(receiptDate) : null

  // RULE 1: Receipt from long ago (>1 day)
  // GPS is definitely wrong (user is at home/work now, not at gas station)
  if (receiptAgeDays !== null && receiptAgeDays > 1) {
    if (exif?.gps) {
      return {
        source: 'exif',
        location: toCoordinates(exif.gps),
        alternateLocation: toCoordinates(gps) || undefined,
        confidence: 'medium',
        reason: `Receipt from ${receiptAgeDays} days ago - using photo location`,
        warning: `This receipt is from ${formatDateAge(receiptAgeDays)} ago. Please verify the location is correct.`,
        imageType,
        receiptAge: {
          minutes: receiptAgeMinutes || 0,
          isOld: true,
        },
      }
    }

    // Only GPS available, but receipt is old
    return {
      source: 'gps',
      location: toCoordinates(gps),
      confidence: 'low',
      reason: `Receipt from ${receiptAgeDays} days ago - current location may be wrong`,
      warning: `This receipt is from ${formatDateAge(receiptAgeDays)} ago. Your current location is probably not the gas station. Please verify.`,
      imageType,
      receiptAge: {
        minutes: receiptAgeMinutes || 0,
        isOld: true,
      },
    }
  }

  // RULE 2: Pump display photos are ALWAYS taken on-location
  // Trust GPS even if recent, because user must be at pump to take photo
  if (imageType === 'pump_display') {
    if (gps && exif?.gps) {
      const distance = calculateDistance(
        gps.latitude,
        gps.longitude,
        exif.gps.latitude,
        exif.gps.longitude
      )

      // If GPS and EXIF match, perfect!
      if (distance < 100) {
        return {
          source: 'both',
          location: toCoordinates(gps),
          confidence: 'high',
          reason: 'Pump photo taken at current location',
          imageType,
        }
      }
    }

    // Trust GPS for pump photos
    return {
      source: 'gps',
      location: toCoordinates(gps),
      confidence: 'high',
      reason: 'Pump photo taken at current location',
      imageType,
    }
  }

  // RULE 3: Photo taken recently (<15 min) - GPS is likely accurate
  if (photoAgeMinutes < 15 && gps) {
    return {
      source: 'gps',
      location: toCoordinates(gps),
      confidence: 'high',
      reason: 'Photo taken recently at this location',
      imageType,
    }
  }

  // RULE 4: Photo is old (>1 hour) - prefer EXIF over GPS
  if (photoAgeMinutes > 60) {
    if (exif?.gps) {
      return {
        source: 'exif',
        location: toCoordinates(exif.gps),
        alternateLocation: toCoordinates(gps) || undefined,
        confidence: 'high',
        reason: 'Photo taken at different location/time',
        warning: `Photo was taken ${formatPhotoAge(photoAgeMinutes)} ago. Using location from photo.`,
        imageType,
      }
    }

    // GPS is probably wrong, but it's all we have
    return {
      source: 'gps',
      location: toCoordinates(gps),
      confidence: 'low',
      reason: `Photo taken ${formatPhotoAge(photoAgeMinutes)} ago`,
      warning: 'Photo was taken a while ago. Please verify this is the correct location.',
      imageType,
    }
  }

  // RULE 5: GPS and EXIF agree (within 100m) - high confidence
  if (gps && exif?.gps) {
    const distance = calculateDistance(
      gps.latitude,
      gps.longitude,
      exif.gps.latitude,
      exif.gps.longitude
    )

    if (distance < 100) {
      return {
        source: 'both',
        location: toCoordinates(gps),
        confidence: 'high',
        reason: 'GPS and photo location match',
        imageType,
      }
    }

    // RULE 6: GPS and EXIF disagree significantly (>1km) - conflict!
    if (distance > 1000) {
      return {
        source: 'conflict',
        location: toCoordinates(exif.gps), // Prefer EXIF (where photo was taken)
        alternateLocation: toCoordinates(gps),
        confidence: 'medium',
        reason: 'Photo taken at different location than current',
        warning: `Photo location differs from your current location by ${Math.round(distance / 1000)} km. Please choose the correct station.`,
        imageType,
      }
    }

    // Moderate disagreement (100m - 1km)
    return {
      source: 'exif',
      location: toCoordinates(exif.gps),
      alternateLocation: toCoordinates(gps),
      confidence: 'medium',
      reason: 'Using photo location (slight GPS difference)',
      imageType,
    }
  }

  // Default: Use whatever we have
  const location = exif?.gps || gps
  return {
    source: exif?.gps ? 'exif' : 'gps',
    location: toCoordinates(location),
    confidence: 'medium',
    reason: 'Best available location data',
    imageType,
  }
}

/**
 * Format photo age for display
 */
function formatPhotoAge(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''}`
}

/**
 * Format date age for display
 */
function formatDateAge(days: number): string {
  if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''}`
  }

  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months} month${months !== 1 ? 's' : ''}`
  }

  const years = Math.floor(days / 365)
  return `${years} year${years !== 1 ? 's' : ''}`
}

/**
 * Get badge variant based on confidence
 */
export function getBadgeVariant(
  confidence: LocationConfidence
): 'success' | 'warning' | 'error' | 'default' {
  switch (confidence) {
    case 'high':
      return 'success'
    case 'medium':
      return 'default'
    case 'low':
      return 'warning'
    case 'none':
      return 'error'
  }
}

/**
 * Get source label for display
 */
export function getSourceLabel(
  source: LocationSource,
  confidence: LocationConfidence
): string {
  if (confidence === 'high' && source === 'gps') {
    return '✓ From current location'
  }
  if (confidence === 'high' && (source === 'exif' || source === 'both')) {
    return '✓ From photo location'
  }
  if (confidence === 'low') {
    return '⚠️ Location uncertain - please verify'
  }
  if (source === 'conflict') {
    return '⚠️ Different locations detected'
  }
  if (source === 'none') {
    return '📍 No location data'
  }
  return '📍 From photo'
}
