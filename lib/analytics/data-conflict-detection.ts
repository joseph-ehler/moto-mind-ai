/**
 * Data Conflict Detection System
 * Detects and resolves conflicts between GPS, EXIF, and Vision AI data
 * 
 * Key Principles:
 * - Detect all conflicts
 * - Provide clear explanations
 * - Suggest resolutions
 * - Never silently choose
 * - Surface to user for final decision
 */

import type { GPSData } from './gps-capture'
import type { ExifData } from './exif-extraction'
import { calculateDistance } from './gps-capture'
import { getTimeSinceCapture } from './exif-extraction'

export type ConflictType = 
  | 'temporal_mismatch'      // Photo taken at different time
  | 'location_mismatch'      // GPS vs EXIF vs Vision disagree
  | 'stale_photo'            // Photo > 7 days old
  | 'low_gps_accuracy'       // GPS ±500m or worse
  | 'no_location_data'       // No GPS or EXIF
  | 'vision_gps_disagree'    // Extracted station ≠ nearby stations
  | 'screenshot_detected'    // Image is a screenshot
  | 'edited_photo'           // Image was edited

export type ConflictSeverity = 'high' | 'medium' | 'low'

export interface DataConflict {
  type: ConflictType
  severity: ConflictSeverity
  title: string
  message: string
  affectedFields: string[]
  suggestions: string[]
  autoResolution?: 'use_exif' | 'use_gps' | 'use_current' | 'require_user_input'
  metadata?: Record<string, any>
}

export interface ConflictDetectionInput {
  // Vision AI result
  visionData?: {
    station?: string
    date?: string
    extractedLocation?: string
  }
  
  // Current GPS
  currentGPS?: GPSData
  
  // EXIF data
  exifData?: ExifData
  
  // Nearby places (for validation)
  nearbyPlaces?: Array<{
    name: string
    distance: number
  }>
}

/**
 * Detect all conflicts in captured data
 */
export function detectConflicts(input: ConflictDetectionInput): DataConflict[] {
  const conflicts: DataConflict[] = []
  const { visionData, currentGPS, exifData, nearbyPlaces } = input
  
  // 1. Check temporal conflicts (photo taken at different time)
  if (exifData?.captureDate) {
    const timeConflict = detectTemporalMismatch(exifData.captureDate)
    if (timeConflict) {
      conflicts.push(timeConflict)
    }
  }
  
  // 2. Check location conflicts (GPS vs EXIF location)
  if (currentGPS && exifData?.gps) {
    const locationConflict = detectLocationMismatch(currentGPS, exifData.gps)
    if (locationConflict) {
      conflicts.push(locationConflict)
    }
  }
  
  // 3. Check for stale photos (> 7 days old)
  if (exifData?.captureDate) {
    const staleConflict = detectStalePhoto(exifData.captureDate)
    if (staleConflict) {
      conflicts.push(staleConflict)
    }
  }
  
  // 4. Check GPS accuracy
  if (currentGPS) {
    const accuracyConflict = detectLowGPSAccuracy(currentGPS)
    if (accuracyConflict) {
      conflicts.push(accuracyConflict)
    }
  }
  
  // 5. Check for missing location data
  if (!currentGPS && !exifData?.gps) {
    conflicts.push(detectNoLocationData(exifData))
  }
  
  // 6. Check vision AI vs GPS disagreement
  if (visionData?.station && nearbyPlaces && nearbyPlaces.length > 0) {
    const visionConflict = detectVisionGPSDisagreement(
      visionData.station,
      nearbyPlaces
    )
    if (visionConflict) {
      conflicts.push(visionConflict)
    }
  }
  
  // 7. Check for screenshots
  if (exifData?.isScreenshot) {
    conflicts.push(detectScreenshot())
  }
  
  // 8. Check for edited photos
  if (exifData?.isEdited) {
    conflicts.push(detectEditedPhoto())
  }
  
  return conflicts
}

/**
 * Detect temporal mismatch (photo taken at different time)
 */
function detectTemporalMismatch(captureDate: Date): DataConflict | null {
  const { minutes, hours, days, formatted } = getTimeSinceCapture(captureDate)
  
  // If photo was taken more than 1 hour ago
  if (minutes > 60) {
    return {
      type: 'temporal_mismatch',
      severity: days > 0 ? 'high' : 'medium',
      title: 'Photo Taken Earlier',
      message: `Photo was taken ${formatted}`,
      affectedFields: ['timestamp', 'location'],
      suggestions: [
        'Using photo date and location',
        'Verify this is the correct event date',
      ],
      autoResolution: 'use_exif',
      metadata: {
        minutesAgo: minutes,
        hoursAgo: hours,
        daysAgo: days,
        captureDate: captureDate.toISOString(),
      },
    }
  }
  
  return null
}

/**
 * Detect location mismatch (GPS vs EXIF disagree)
 */
function detectLocationMismatch(
  currentGPS: GPSData,
  exifGPS: ExifData['gps']
): DataConflict | null {
  if (!exifGPS) return null
  
  const distance = calculateDistance(
    currentGPS.latitude,
    currentGPS.longitude,
    exifGPS.latitude,
    exifGPS.longitude
  )
  
  // If locations are > 1km apart
  if (distance > 1000) {
    return {
      type: 'location_mismatch',
      severity: 'medium',
      title: 'Location Mismatch',
      message: `Current location is ${(distance / 1000).toFixed(1)}km from photo location`,
      affectedFields: ['location'],
      suggestions: [
        'Using photo location (where receipt was captured)',
        'Current location may not be accurate',
      ],
      autoResolution: 'use_exif',
      metadata: {
        distanceMeters: Math.round(distance),
        distanceKm: (distance / 1000).toFixed(1),
        currentGPS,
        exifGPS,
      },
    }
  }
  
  return null
}

/**
 * Detect stale photo (> 7 days old)
 */
function detectStalePhoto(captureDate: Date): DataConflict | null {
  const { days } = getTimeSinceCapture(captureDate)
  
  if (days > 7) {
    return {
      type: 'stale_photo',
      severity: 'high',
      title: 'Old Photo Detected',
      message: `Photo was taken ${days} days ago`,
      affectedFields: ['timestamp'],
      suggestions: [
        'Verify this is when the event occurred',
        'Consider using current date if uploading old receipt',
      ],
      autoResolution: 'require_user_input',
      metadata: {
        daysAgo: days,
        captureDate: captureDate.toISOString(),
      },
    }
  }
  
  return null
}

/**
 * Detect low GPS accuracy
 */
function detectLowGPSAccuracy(gps: GPSData): DataConflict | null {
  if (gps.accuracy > 100) {
    return {
      type: 'low_gps_accuracy',
      severity: gps.accuracy > 500 ? 'medium' : 'low',
      title: 'Low GPS Accuracy',
      message: `GPS accuracy: ±${Math.round(gps.accuracy)}m`,
      affectedFields: ['location'],
      suggestions: [
        'Location may be approximate',
        'Consider entering manually for precision',
      ],
      metadata: {
        accuracy: gps.accuracy,
      },
    }
  }
  
  return null
}

/**
 * Detect no location data
 */
function detectNoLocationData(exifData?: ExifData): DataConflict {
  const reasons: string[] = []
  
  if (exifData?.isScreenshot) {
    reasons.push('Photo is a screenshot (no location data)')
  } else if (exifData && !exifData.hasGPS) {
    reasons.push('Photo has no GPS data')
  }
  
  return {
    type: 'no_location_data',
    severity: 'low',
    title: 'No Location Data',
    message: 'Location information unavailable',
    affectedFields: ['location'],
    suggestions: [
      'Enable location access for auto-detection',
      'Enter location manually',
      ...reasons,
    ],
  }
}

/**
 * Detect vision AI and GPS disagreement
 */
function detectVisionGPSDisagreement(
  visionStation: string,
  nearbyPlaces: Array<{ name: string; distance: number }>
): DataConflict | null {
  // Check if vision-extracted station matches any nearby station
  const match = nearbyPlaces.find(place =>
    place.name.toLowerCase().includes(visionStation.toLowerCase()) ||
    visionStation.toLowerCase().includes(place.name.toLowerCase())
  )
  
  if (!match && nearbyPlaces.length > 0) {
    return {
      type: 'vision_gps_disagree',
      severity: 'medium',
      title: 'Station Name Mismatch',
      message: `Receipt shows "${visionStation}" but GPS shows different stations nearby`,
      affectedFields: ['location', 'station'],
      suggestions: [
        `Nearby: ${nearbyPlaces.slice(0, 3).map(p => p.name).join(', ')}`,
        'Verify which station is correct',
      ],
      autoResolution: 'require_user_input',
      metadata: {
        visionStation,
        nearbyPlaces: nearbyPlaces.slice(0, 5),
      },
    }
  }
  
  return null
}

/**
 * Detect screenshot
 */
function detectScreenshot(): DataConflict {
  return {
    type: 'screenshot_detected',
    severity: 'low',
    title: 'Screenshot Detected',
    message: 'Image appears to be a screenshot',
    affectedFields: ['all'],
    suggestions: [
      'Screenshots may lack location data',
      'Photo quality may be reduced',
      'Consider capturing original photo for better data',
    ],
  }
}

/**
 * Detect edited photo
 */
function detectEditedPhoto(): DataConflict {
  return {
    type: 'edited_photo',
    severity: 'low',
    title: 'Edited Photo Detected',
    message: 'Image appears to have been edited',
    affectedFields: ['all'],
    suggestions: [
      'Edited photos may have modified metadata',
      'Some data may be unreliable',
    ],
  }
}

/**
 * Get preferred data source based on conflicts
 */
export function getPreferredDataSource(
  conflicts: DataConflict[]
): {
  location: 'exif' | 'gps' | 'manual' | 'none'
  timestamp: 'exif' | 'current' | 'manual' | 'receipt'
  reasoning: string[]
} {
  const reasoning: string[] = []
  let locationSource: 'exif' | 'gps' | 'manual' | 'none' = 'gps'
  let timestampSource: 'exif' | 'current' | 'manual' | 'receipt' = 'exif'
  
  // Check for temporal mismatch
  const temporalConflict = conflicts.find(c => c.type === 'temporal_mismatch')
  if (temporalConflict) {
    locationSource = 'exif'
    timestampSource = 'exif'
    reasoning.push('Photo taken at different time → using photo data')
  }
  
  // Check for location mismatch
  const locationConflict = conflicts.find(c => c.type === 'location_mismatch')
  if (locationConflict) {
    locationSource = 'exif'
    reasoning.push('Photo location differs from current → using photo location')
  }
  
  // Check for stale photo
  const staleConflict = conflicts.find(c => c.type === 'stale_photo')
  if (staleConflict) {
    timestampSource = 'manual'
    reasoning.push('Old photo detected → user should verify date')
  }
  
  // Check for no location data
  const noLocationConflict = conflicts.find(c => c.type === 'no_location_data')
  if (noLocationConflict) {
    locationSource = 'manual'
    reasoning.push('No location data available → manual entry required')
  }
  
  // Check for vision/GPS disagreement
  const visionConflict = conflicts.find(c => c.type === 'vision_gps_disagree')
  if (visionConflict) {
    locationSource = 'manual'
    reasoning.push('Station name mismatch → user should verify')
  }
  
  return {
    location: locationSource,
    timestamp: timestampSource,
    reasoning,
  }
}
