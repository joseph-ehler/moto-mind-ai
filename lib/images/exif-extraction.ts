/**
 * EXIF Data Extraction Utilities
 * Handles photo metadata extraction with validation
 * 
 * Key Principles:
 * - Handle missing EXIF gracefully (screenshots, edited photos)
 * - Validate GPS coordinates
 * - Convert GPS format to decimal degrees
 * - Extract device info for debugging
 * - Never fail silently
 */

import EXIF from 'exif-js'

export interface ExifData {
  // GPS data
  gps: {
    latitude: number
    longitude: number
    altitude?: number
  } | null
  
  // Timestamps
  captureDate: Date | null
  modifyDate: Date | null
  
  // Device info
  device: {
    make?: string
    model?: string
    software?: string
  } | null
  
  // Image info
  image: {
    width?: number
    height?: number
    orientation?: number
    fileSize: number
  }
  
  // Metadata
  hasExif: boolean
  hasGPS: boolean
  isScreenshot: boolean
  isEdited: boolean
}

/**
 * Extract EXIF data from photo file
 */
export async function extractExifData(file: File): Promise<ExifData> {
  return new Promise((resolve) => {
    EXIF.getData(file as any, function(this: any) {
      try {
        const allTags = EXIF.getAllTags(this)
        
        // Check if EXIF exists
        const hasExif = Object.keys(allTags).length > 0
        
        // Extract GPS
        const gps = extractGPS(this)
        const hasGPS = gps !== null
        
        // Extract dates
        const captureDate = extractCaptureDate(this)
        const modifyDate = extractModifyDate(this)
        
        // Extract device info
        const device = extractDeviceInfo(this)
        
        // Detect if screenshot or edited
        const isScreenshot = detectScreenshot(device, allTags)
        const isEdited = detectEdited(captureDate, modifyDate, allTags)
        
        resolve({
          gps,
          captureDate,
          modifyDate,
          device,
          image: {
            width: allTags.PixelXDimension || allTags.ImageWidth,
            height: allTags.PixelYDimension || allTags.ImageHeight,
            orientation: allTags.Orientation,
            fileSize: file.size,
          },
          hasExif,
          hasGPS,
          isScreenshot,
          isEdited,
        })
        
      } catch (error) {
        console.error('EXIF extraction error:', error)
        
        // Return minimal data on error
        resolve({
          gps: null,
          captureDate: null,
          modifyDate: null,
          device: null,
          image: {
            fileSize: file.size,
          },
          hasExif: false,
          hasGPS: false,
          isScreenshot: false,
          isEdited: false,
        })
      }
    })
  })
}

/**
 * Extract and convert GPS coordinates
 */
function extractGPS(exifData: any): ExifData['gps'] {
  try {
    const lat = EXIF.getTag(exifData, 'GPSLatitude')
    const latRef = EXIF.getTag(exifData, 'GPSLatitudeRef')
    const lon = EXIF.getTag(exifData, 'GPSLongitude')
    const lonRef = EXIF.getTag(exifData, 'GPSLongitudeRef')
    const alt = EXIF.getTag(exifData, 'GPSAltitude')
    
    if (!lat || !lon) {
      return null
    }
    
    // Convert from degrees/minutes/seconds to decimal
    const latitude = convertDMSToDecimal(lat, latRef)
    const longitude = convertDMSToDecimal(lon, lonRef)
    
    // Validate coordinates
    if (!isValidCoordinate(latitude, longitude)) {
      console.warn('Invalid GPS coordinates in EXIF:', { latitude, longitude })
      return null
    }
    
    return {
      latitude,
      longitude,
      altitude: alt ? parseFloat(alt) : undefined,
    }
    
  } catch (error) {
    console.error('GPS extraction error:', error)
    return null
  }
}

/**
 * Convert GPS coordinates from DMS to decimal degrees
 */
function convertDMSToDecimal(
  dms: [number, number, number],
  ref: string
): number {
  const [degrees, minutes, seconds] = dms
  let decimal = degrees + minutes / 60 + seconds / 3600
  
  // Apply direction (South and West are negative)
  if (ref === 'S' || ref === 'W') {
    decimal *= -1
  }
  
  return decimal
}

/**
 * Validate GPS coordinates
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) && 
    !isNaN(lon) &&
    lat >= -90 && 
    lat <= 90 &&
    lon >= -180 && 
    lon <= 180
  )
}

/**
 * Extract capture date from EXIF
 */
function extractCaptureDate(exifData: any): Date | null {
  try {
    // Try multiple date fields (different cameras use different tags)
    const dateStr = 
      EXIF.getTag(exifData, 'DateTimeOriginal') ||
      EXIF.getTag(exifData, 'DateTime') ||
      EXIF.getTag(exifData, 'DateTimeDigitized')
    
    if (!dateStr) {
      return null
    }
    
    // Parse EXIF date format: "YYYY:MM:DD HH:MM:SS"
    const parsed = parseExifDate(dateStr)
    
    // Validate date is reasonable (not in future, not too old)
    if (parsed && isReasonableDate(parsed)) {
      return parsed
    }
    
    return null
    
  } catch (error) {
    console.error('Date extraction error:', error)
    return null
  }
}

/**
 * Extract modify date from EXIF
 */
function extractModifyDate(exifData: any): Date | null {
  try {
    const dateStr = EXIF.getTag(exifData, 'DateTime')
    return dateStr ? parseExifDate(dateStr) : null
  } catch (error) {
    return null
  }
}

/**
 * Parse EXIF date string to Date object
 */
function parseExifDate(dateStr: string): Date | null {
  try {
    // EXIF format: "YYYY:MM:DD HH:MM:SS"
    const [datePart, timePart] = dateStr.split(' ')
    const [year, month, day] = datePart.split(':').map(Number)
    const [hour, minute, second] = timePart.split(':').map(Number)
    
    const date = new Date(year, month - 1, day, hour, minute, second)
    
    return isNaN(date.getTime()) ? null : date
    
  } catch (error) {
    return null
  }
}

/**
 * Check if date is reasonable (not in future, not older than 10 years)
 */
function isReasonableDate(date: Date): boolean {
  const now = new Date()
  const tenYearsAgo = new Date()
  tenYearsAgo.setFullYear(now.getFullYear() - 10)
  
  return date <= now && date >= tenYearsAgo
}

/**
 * Extract device information
 */
function extractDeviceInfo(exifData: any): ExifData['device'] {
  const make = EXIF.getTag(exifData, 'Make')
  const model = EXIF.getTag(exifData, 'Model')
  const software = EXIF.getTag(exifData, 'Software')
  
  if (!make && !model && !software) {
    return null
  }
  
  return {
    make: make ? String(make).trim() : undefined,
    model: model ? String(model).trim() : undefined,
    software: software ? String(software).trim() : undefined,
  }
}

/**
 * Detect if image is likely a screenshot
 */
function detectScreenshot(
  device: ExifData['device'],
  allTags: any
): boolean {
  // Screenshots typically have no device info
  if (!device) {
    return true
  }
  
  // Check for screenshot indicators
  const software = device.software?.toLowerCase() || ''
  const model = device.model?.toLowerCase() || ''
  
  const screenshotKeywords = [
    'screenshot',
    'screen capture',
    'snipping tool',
    'grab',
  ]
  
  return screenshotKeywords.some(keyword => 
    software.includes(keyword) || model.includes(keyword)
  )
}

/**
 * Detect if image was edited
 */
function detectEdited(
  captureDate: Date | null,
  modifyDate: Date | null,
  allTags: any
): boolean {
  // If modify date is significantly after capture date
  if (captureDate && modifyDate) {
    const diffMinutes = (modifyDate.getTime() - captureDate.getTime()) / 1000 / 60
    if (diffMinutes > 5) {  // Modified > 5 minutes after capture
      return true
    }
  }
  
  // Check for editing software indicators
  const software = allTags.Software?.toLowerCase() || ''
  const editingKeywords = [
    'photoshop',
    'gimp',
    'lightroom',
    'edited',
    'modified',
  ]
  
  return editingKeywords.some(keyword => software.includes(keyword))
}

/**
 * Calculate time difference from now
 */
export function getTimeSinceCapture(exifDate: Date): {
  minutes: number
  hours: number
  days: number
  formatted: string
} {
  const now = new Date()
  const diffMs = now.getTime() - exifDate.getTime()
  const diffMinutes = Math.floor(diffMs / 1000 / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  let formatted: string
  if (diffMinutes < 60) {
    formatted = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    formatted = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else {
    formatted = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }
  
  return {
    minutes: diffMinutes,
    hours: diffHours,
    days: diffDays,
    formatted,
  }
}

/**
 * Check if EXIF data is reliable
 */
export function isExifReliable(exif: ExifData): {
  reliable: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  
  if (!exif.hasExif) {
    reasons.push('No EXIF data found (may be screenshot or edited)')
  }
  
  if (exif.isScreenshot) {
    reasons.push('Image appears to be a screenshot')
  }
  
  if (exif.isEdited) {
    reasons.push('Image appears to have been edited')
  }
  
  if (exif.captureDate) {
    const { days } = getTimeSinceCapture(exif.captureDate)
    if (days > 7) {
      reasons.push(`Photo was taken ${days} days ago`)
    }
  }
  
  return {
    reliable: reasons.length === 0,
    reasons,
  }
}

/**
 * Format EXIF data for display
 */
export function formatExifForDisplay(exif: ExifData): {
  label: string
  value: string
}[] {
  const items: { label: string; value: string }[] = []
  
  if (exif.captureDate) {
    items.push({
      label: 'Photo taken',
      value: exif.captureDate.toLocaleString(),
    })
  }
  
  if (exif.device && (exif.device.make || exif.device.model)) {
    items.push({
      label: 'Device',
      value: [exif.device.make, exif.device.model].filter(Boolean).join(' '),
    })
  }
  
  if (exif.image.width && exif.image.height) {
    items.push({
      label: 'Resolution',
      value: `${exif.image.width} × ${exif.image.height}`,
    })
  }
  
  if (exif.gps) {
    items.push({
      label: 'GPS coordinates',
      value: `${exif.gps.latitude.toFixed(6)}, ${exif.gps.longitude.toFixed(6)}`,
    })
  }
  
  return items
}
