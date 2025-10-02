// Vendor Extraction and Cleaning
// Pure functions for extracting and normalizing vendor/business names

import { VendorExtractionResult } from '../types'

/**
 * Extracts vendor name with precedence from various data sources
 */
export function extractVendorWithPrecedence(data: any): VendorExtractionResult | null {
  const sources = [
    { field: 'vendor_name', confidence: 0.9 },
    { field: 'business_name', confidence: 0.85 },
    { field: 'shop_name', confidence: 0.85 },
    { field: 'station_name', confidence: 0.8 },
    { field: 'company_name', confidence: 0.8 },
    { field: 'merchant_name', confidence: 0.75 },
    { field: 'extracted_data.vendor_name', confidence: 0.85 },
    { field: 'extracted_data.business_name', confidence: 0.8 },
    { field: 'extracted_data.shop_name', confidence: 0.8 },
    { field: 'extracted_data.station_name', confidence: 0.75 }
  ]
  
  for (const source of sources) {
    const value = getNestedValue(data, source.field)
    
    if (value && typeof value === 'string' && value.trim()) {
      const cleaned = cleanVendorName(value.trim())
      
      if (cleaned && cleaned.length >= 2) {
        return {
          data: cleaned,
          confidence: source.confidence,
          source: source.field,
          method: 'precedence_extraction',
          originalValue: value,
          cleanedValue: cleaned
        }
      }
    }
  }
  
  return null
}

/**
 * Cleans and normalizes vendor names
 */
export function cleanVendorName(vendor: string): string {
  if (!vendor || typeof vendor !== 'string') {
    return ''
  }
  
  let cleaned = vendor.trim()
  
  // Step 1: Remove common business suffixes
  const businessSuffixes = [
    /\b(LLC|L\.L\.C\.?)\b/gi,
    /\b(Inc\.?|Incorporated)\b/gi,
    /\b(Corp\.?|Corporation)\b/gi,
    /\b(Ltd\.?|Limited)\b/gi,
    /\b(Co\.?|Company)\b/gi,
    /\b(LP|L\.P\.)\b/gi,
    /\b(LLP|L\.L\.P\.)\b/gi
  ]
  
  for (const suffix of businessSuffixes) {
    cleaned = cleaned.replace(suffix, '').trim()
  }
  
  // Step 2: Remove common automotive suffixes
  const autoSuffixes = [
    /\b(Automotive|Auto)\b/gi,
    /\b(Service|Services)\b/gi,
    /\b(Repair|Repairs)\b/gi,
    /\b(Shop|Shops)\b/gi,
    /\b(Center|Centre)\b/gi,
    /\b(Station|Stations)\b/gi,
    /\b(Garage|Garages)\b/gi,
    /\b(Motors|Motor)\b/gi
  ]
  
  for (const suffix of autoSuffixes) {
    const withoutSuffix = cleaned.replace(suffix, '').trim()
    // Only remove if it leaves a meaningful name (at least 3 characters)
    if (withoutSuffix.length >= 3) {
      cleaned = withoutSuffix
    }
  }
  
  // Step 3: Clean up punctuation and spacing
  cleaned = cleaned
    .replace(/['"]/g, '') // Remove quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^[,.-]+|[,.-]+$/g, '') // Remove leading/trailing punctuation
    .trim()
  
  // Step 4: Title case for better presentation
  cleaned = toTitleCase(cleaned)
  
  return cleaned
}

/**
 * Extracts vendor from various text patterns
 */
export function extractVendorFromText(text: string): Array<{
  vendor: string
  confidence: number
  pattern: string
  position: number
}> {
  const results: Array<{
    vendor: string
    confidence: number
    pattern: string
    position: number
  }> = []
  
  // Pattern 1: "Service performed by [Vendor Name]"
  const serviceByPattern = /(?:service|work|repair)(?:\s+performed)?\s+by\s+([A-Za-z][A-Za-z0-9\s&'-]{2,40})/gi
  let match
  while ((match = serviceByPattern.exec(text)) !== null) {
    const vendor = cleanVendorName(match[1])
    if (vendor) {
      results.push({
        vendor,
        confidence: 0.85,
        pattern: 'service_by',
        position: match.index
      })
    }
  }
  
  // Pattern 2: Business header format "VENDOR NAME\nAddress"
  const headerPattern = /^([A-Z][A-Z\s&'-]{3,40})\s*\n/gm
  while ((match = headerPattern.exec(text)) !== null) {
    const vendor = cleanVendorName(match[1])
    if (vendor && !isCommonWord(vendor)) {
      results.push({
        vendor,
        confidence: 0.8,
        pattern: 'header',
        position: match.index
      })
    }
  }
  
  // Pattern 3: "Thank you for choosing [Vendor]"
  const thankYouPattern = /thank\s+you\s+for\s+choosing\s+([A-Za-z][A-Za-z0-9\s&'-]{2,40})/gi
  while ((match = thankYouPattern.exec(text)) !== null) {
    const vendor = cleanVendorName(match[1])
    if (vendor) {
      results.push({
        vendor,
        confidence: 0.75,
        pattern: 'thank_you',
        position: match.index
      })
    }
  }
  
  // Pattern 4: Common gas station chains
  const gasStationPattern = /\b(Shell|Exxon|Mobil|BP|Chevron|Texaco|Sunoco|Marathon|Speedway|Wawa|QuikTrip|Casey's|Circle K)\b/gi
  while ((match = gasStationPattern.exec(text)) !== null) {
    results.push({
      vendor: match[1],
      confidence: 0.9,
      pattern: 'gas_station_chain',
      position: match.index
    })
  }
  
  // Sort by confidence and position
  return results.sort((a, b) => b.confidence - a.confidence || a.position - b.position)
}

/**
 * Validates vendor name quality
 */
export function validateVendorName(vendor: string): {
  isValid: boolean
  confidence: number
  issues: string[]
} {
  const issues: string[] = []
  let confidence = 1.0
  
  if (!vendor || typeof vendor !== 'string') {
    return { isValid: false, confidence: 0, issues: ['Vendor name is empty or invalid'] }
  }
  
  const trimmed = vendor.trim()
  
  // Length checks
  if (trimmed.length < 2) {
    issues.push('Vendor name too short')
    confidence -= 0.5
  }
  
  if (trimmed.length > 100) {
    issues.push('Vendor name unusually long')
    confidence -= 0.2
  }
  
  // Character composition checks
  const alphaRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length
  if (alphaRatio < 0.5) {
    issues.push('Vendor name has too few letters')
    confidence -= 0.3
  }
  
  // Common invalid patterns
  if (/^\d+$/.test(trimmed)) {
    issues.push('Vendor name is only numbers')
    confidence -= 0.8
  }
  
  if (/^[^a-zA-Z]*$/.test(trimmed)) {
    issues.push('Vendor name has no letters')
    confidence -= 0.8
  }
  
  // Check for common non-vendor words
  const commonNonVendors = [
    'receipt', 'invoice', 'total', 'amount', 'date', 'time',
    'customer', 'service', 'thank you', 'address', 'phone'
  ]
  
  if (commonNonVendors.some(word => trimmed.toLowerCase().includes(word))) {
    issues.push('Contains common non-vendor words')
    confidence -= 0.4
  }
  
  return {
    isValid: issues.length === 0 && confidence > 0.3,
    confidence: Math.max(0, Math.min(1, confidence)),
    issues
  }
}

/**
 * Gets nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * Converts string to title case
 */
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => {
    // Don't capitalize common prepositions and articles
    const lowerWords = ['and', 'or', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'by']
    const lower = txt.toLowerCase()
    
    if (lowerWords.includes(lower)) {
      return lower
    }
    
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

/**
 * Checks if a word is too common to be a vendor name
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    'service', 'repair', 'auto', 'automotive', 'shop', 'center',
    'station', 'garage', 'motors', 'parts', 'oil', 'change',
    'invoice', 'receipt', 'total', 'amount', 'customer', 'date'
  ]
  
  return commonWords.includes(word.toLowerCase())
}
