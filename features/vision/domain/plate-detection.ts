/**
 * License Plate Detection Domain Logic
 * 
 * Pure functions for detecting and validating license plates.
 * No UI dependencies.
 */

export interface LicensePlateResult {
  plateNumber: string
  confidence: number
  state?: string
  boundingBox?: number[]
}

/**
 * Common US license plate patterns by state
 * Note: This is simplified - actual patterns vary significantly
 */
export const PLATE_PATTERNS = {
  // Standard patterns
  standard: [
    /^[A-Z]{3}\s?\d{3,4}$/i,      // ABC 1234
    /^\d{3}\s?[A-Z]{3}$/i,        // 123 ABC
    /^[A-Z]{2}\s?\d{4}$/i,        // AB 1234
    /^[A-Z]\d{2}\s?[A-Z]{3}$/i,   // A12 ABC
  ],
  
  // State-specific (examples)
  CA: /^[0-9][A-Z]{3}[0-9]{3}$/i, // California: 1ABC234
  NY: /^[A-Z]{3}\s?\d{4}$/i,      // New York: ABC 1234
  TX: /^[A-Z]{3}\s?\d{4}$/i,      // Texas: ABC 1234
  FL: /^[A-Z]{3}\s?\d{3}[A-Z]$/i  // Florida: ABC 123D
}

/**
 * Validate license plate format
 * 
 * @param plateNumber - License plate string
 * @param state - Optional state code for state-specific validation
 * @returns true if plate matches expected format
 */
export function isValidPlateFormat(
  plateNumber: string,
  state?: string
): boolean {
  const clean = plateNumber.toUpperCase().replace(/\s+/g, '')
  
  // Check length
  if (clean.length < 5 || clean.length > 8) {
    return false
  }
  
  // Try state-specific pattern if provided
  if (state && PLATE_PATTERNS[state as keyof typeof PLATE_PATTERNS]) {
    const pattern = PLATE_PATTERNS[state as keyof typeof PLATE_PATTERNS]
    if (pattern instanceof RegExp && pattern.test(clean)) return true
  }
  
  // Try standard patterns
  return PLATE_PATTERNS.standard.some(pattern => pattern.test(clean))
}

/**
 * Clean and normalize plate number
 * 
 * @param plateNumber - Raw plate number
 * @returns Cleaned plate number
 */
export function normalizePlateNumber(plateNumber: string): string {
  return plateNumber
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove non-alphanumeric
    .trim()
}

/**
 * Extract plate number from OCR text
 * 
 * @param text - OCR text
 * @returns Array of potential plate numbers
 */
export function extractPotentialPlates(text: string): string[] {
  const words = text.split(/\s+/)
  const plates: string[] = []
  
  for (const word of words) {
    const normalized = normalizePlateNumber(word)
    if (normalized.length >= 5 && normalized.length <= 8) {
      if (isValidPlateFormat(normalized)) {
        plates.push(normalized)
      }
    }
  }
  
  return plates
}

/**
 * Calculate confidence score for plate detection
 * 
 * @param plateNumber - Detected plate number
 * @param ocrConfidence - OCR confidence for the text
 * @param formatMatch - Whether format matches expected pattern
 * @returns Combined confidence score (0-1)
 */
export function calculatePlateConfidence(
  plateNumber: string,
  ocrConfidence: number,
  formatMatch: boolean
): number {
  let confidence = ocrConfidence
  
  // Boost if format matches
  if (formatMatch) {
    confidence = Math.min(1.0, confidence * 1.2)
  }
  
  // Reduce if too short or too long
  if (plateNumber.length < 6 || plateNumber.length > 7) {
    confidence *= 0.9
  }
  
  // Reduce if contains ambiguous characters
  if (/[0O1I]/.test(plateNumber)) {
    confidence *= 0.95
  }
  
  return Math.round(confidence * 100) / 100
}

/**
 * Disambiguate common OCR errors in plate numbers
 * 
 * @param plateNumber - Plate number that may have OCR errors
 * @returns Corrected plate number
 */
export function disambiguatePlateCharacters(plateNumber: string): string {
  return plateNumber
    .replace(/O/g, '0')  // O to 0
    .replace(/I/g, '1')  // I to 1
    .replace(/Z/g, '2')  // Sometimes Z is misread as 2
    .toUpperCase()
}

/**
 * Validate plate detection result
 * 
 * @param result - License plate detection result
 * @returns Validation result with errors
 */
export function validatePlateDetection(result: LicensePlateResult): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!result.plateNumber) {
    errors.push('No plate number detected')
  }
  
  if (result.confidence < 0.7) {
    errors.push(`Low confidence (${result.confidence}). Manual verification recommended.`)
  }
  
  if (!isValidPlateFormat(result.plateNumber, result.state)) {
    errors.push(`Plate format doesn't match expected pattern`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
