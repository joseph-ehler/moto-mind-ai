/**
 * Address Extraction Types
 * Shared types for address extraction (client & server safe)
 */

export type AddressSource = 'vision_structured' | 'vision_ocr' | 'geocoding' | 'manual' | 'none'
export type AddressConfidence = 'high' | 'medium' | 'low' | 'none'

export interface AddressResult {
  address: string | null
  source: AddressSource
  confidence: AddressConfidence
  method?: string // For debugging
}

export interface GPSCoordinates {
  latitude: number
  longitude: number
}

/**
 * Get display label for address source
 */
export function getAddressSourceLabel(source: AddressSource): string {
  switch (source) {
    case 'vision_structured':
      return '✓ From receipt'
    case 'vision_ocr':
      return '📄 OCR extraction'
    case 'geocoding':
      return '📍 From GPS (approximate)'
    case 'manual':
      return '✏️ Entered manually'
    case 'none':
      return 'ℹ️ Address not detected'
  }
}

/**
 * Get badge variant for address confidence
 */
export function getAddressConfidenceBadge(confidence: AddressConfidence): 'success' | 'info' | 'warning' | 'default' {
  switch (confidence) {
    case 'high':
      return 'success'
    case 'medium':
      return 'info'
    case 'low':
      return 'warning'
    case 'none':
      return 'default'
  }
}

/**
 * Validate if extracted address looks reasonable
 */
export function isValidAddress(address: string): boolean {
  if (!address || address.length < 10) return false
  
  // Must have at least one number (street address)
  const hasNumber = /\d/.test(address)
  
  // Must have at least one letter
  const hasLetter = /[a-zA-Z]/.test(address)
  
  // Should contain either:
  // - State code (e.g., "NV", "CA")
  // - Common street types
  // - ZIP code
  const hasStateOrStreet = /\b[A-Z]{2}\b|\b(Street|St|Road|Rd|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pl|Place|Pkwy|Parkway)\b/i.test(address)
  const hasZip = /\b\d{5}(-\d{4})?\b/.test(address)
  
  return hasNumber && hasLetter && (hasStateOrStreet || hasZip)
}
