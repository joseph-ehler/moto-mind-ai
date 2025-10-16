/**
 * Capture Metadata Management
 * 
 * Captures comprehensive metadata for every photo:
 * - GPS location (lat/lng)
 * - Timestamp (ISO 8601)
 * - Quality metrics
 * - Technical details
 * - User behavior
 */

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
}

export interface CaptureMetadata {
  // Core
  timestamp: string              // ISO 8601
  eventType: string              // 'fuel', 'service', 'maintenance', etc.
  stepId?: string                // 'receipt', 'odometer', etc.
  
  // Location
  location?: LocationData
  
  // Photo quality
  qualityScore: number           // 0-100
  qualityIssues: string[]        // ['blur', 'glare', 'too_dark']
  compressionRatio: number       // e.g., 5.6
  
  // Technical
  originalSize: number           // bytes
  compressedSize: number         // bytes
  resolution: {
    width: number
    height: number
  }
  
  // Camera settings
  flashMode: 'auto' | 'on' | 'off'
  facingMode: 'environment' | 'user'
  
  // User behavior
  retakeCount: number            // How many times retaken
  captureMethod: 'camera' | 'upload'
  captureDuration: number        // ms from open to capture
  
  // Device info (from user agent)
  deviceInfo: {
    platform: string             // 'iOS', 'Android', 'Web'
    userAgent: string
  }
}

/**
 * Get GPS location with timeout
 */
export async function getLocation(): Promise<LocationData | null> {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported')
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        })
      },
      (error) => {
        console.warn('Geolocation error:', error.message)
        resolve(null)
      },
      {
        timeout: 5000,           // 5 second timeout
        maximumAge: 60000,       // Accept cached position up to 1 min old
        enableHighAccuracy: true // Request GPS if available
      }
    )
  })
}

/**
 * Get device info from user agent
 */
export function getDeviceInfo(): { platform: string; userAgent: string } {
  const ua = navigator.userAgent
  
  let platform = 'Web'
  if (/iPhone|iPad|iPod/.test(ua)) {
    platform = 'iOS'
  } else if (/Android/.test(ua)) {
    platform = 'Android'
  } else if (/Mac/.test(ua)) {
    platform = 'macOS'
  } else if (/Win/.test(ua)) {
    platform = 'Windows'
  } else if (/Linux/.test(ua)) {
    platform = 'Linux'
  }
  
  return {
    platform,
    userAgent: ua
  }
}

/**
 * Create complete capture metadata
 */
export async function createCaptureMetadata(params: {
  eventType: string
  stepId?: string
  qualityScore: number
  qualityIssues: Array<{ type: string; severity: string; message: string }>
  compressionRatio: number
  originalSize: number
  compressedSize: number
  resolution: { width: number; height: number }
  flashMode: 'auto' | 'on' | 'off'
  retakeCount: number
  captureMethod: 'camera' | 'upload'
  captureDuration: number
  includeLocation?: boolean
}): Promise<CaptureMetadata> {
  const {
    eventType,
    stepId,
    qualityScore,
    qualityIssues,
    compressionRatio,
    originalSize,
    compressedSize,
    resolution,
    flashMode,
    retakeCount,
    captureMethod,
    captureDuration,
    includeLocation = true
  } = params

  // Get location (async, with timeout)
  const location = includeLocation ? await getLocation() : null

  // Extract quality issue types
  const issueTypes = qualityIssues.map(issue => issue.type)

  return {
    timestamp: new Date().toISOString(),
    eventType,
    stepId,
    location: location || undefined,
    qualityScore,
    qualityIssues: issueTypes,
    compressionRatio,
    originalSize,
    compressedSize,
    resolution,
    flashMode,
    facingMode: 'environment',
    retakeCount,
    captureMethod,
    captureDuration,
    deviceInfo: getDeviceInfo()
  }
}

/**
 * Format metadata for analytics
 */
export function formatMetadataForAnalytics(metadata: CaptureMetadata): Record<string, any> {
  return {
    // Core
    event_type: metadata.eventType,
    step_id: metadata.stepId,
    timestamp: metadata.timestamp,
    
    // Location
    has_location: !!metadata.location,
    location_accuracy: metadata.location?.accuracy,
    
    // Quality
    quality_score: metadata.qualityScore,
    quality_issues_count: metadata.qualityIssues.length,
    quality_issues: metadata.qualityIssues.join(','),
    
    // Technical
    compression_ratio: metadata.compressionRatio,
    original_size_kb: Math.round(metadata.originalSize / 1024),
    compressed_size_kb: Math.round(metadata.compressedSize / 1024),
    resolution: `${metadata.resolution.width}x${metadata.resolution.height}`,
    
    // Camera
    flash_mode: metadata.flashMode,
    
    // Behavior
    retake_count: metadata.retakeCount,
    capture_method: metadata.captureMethod,
    capture_duration_ms: metadata.captureDuration,
    
    // Device
    platform: metadata.deviceInfo.platform
  }
}

/**
 * Validate location is reasonable (basic fraud detection)
 */
export function validateLocation(location: LocationData | undefined): {
  valid: boolean
  reason?: string
} {
  if (!location) {
    return { valid: true } // OK to not have location
  }

  // Check latitude range
  if (location.latitude < -90 || location.latitude > 90) {
    return { valid: false, reason: 'Invalid latitude' }
  }

  // Check longitude range
  if (location.longitude < -180 || location.longitude > 180) {
    return { valid: false, reason: 'Invalid longitude' }
  }

  // Check accuracy (if > 1000m, probably not reliable)
  if (location.accuracy > 1000) {
    return { valid: false, reason: 'Low accuracy (>1km)' }
  }

  return { valid: true }
}

/**
 * Calculate distance between two locations (haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
  loc1: LocationData,
  loc2: LocationData
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (loc1.latitude * Math.PI) / 180
  const φ2 = (loc2.latitude * Math.PI) / 180
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
