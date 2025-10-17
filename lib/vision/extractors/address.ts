/**
 * Address Extractor
 * Fallback address extraction from raw OCR text when structured extraction fails
 */

/**
 * Extract gas station address from raw receipt text
 * Looks for address patterns in the top portion of the receipt
 */
export function extractAddressFromText(rawText: string): string | null {
  if (!rawText) return null

  // Split into lines and look at the top 10 lines (header area)
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 10) // Just the header

  let streetAddress: string | null = null
  let cityStateZip: string | null = null

  for (const line of lines) {
    // Look for street address patterns
    // Examples: "1 GOODSPRINGS RD", "123 MAIN ST", "456 OAK AVE"
    const streetPattern = /^\d+\s+[A-Z\s]+(RD|ROAD|ST|STREET|AVE|AVENUE|BLVD|BOULEVARD|DR|DRIVE|LN|LANE|WAY|CT|COURT|PL|PLACE|PKWY|PARKWAY)[,\s]*$/i
    if (streetPattern.test(line) && !streetAddress) {
      streetAddress = line.replace(/,\s*$/, '') // Remove trailing comma
    }

    // Look for city, state, zip patterns
    // Examples: "JEAN, NV 89019", "LAS VEGAS NV 89101", "HENDERSON, NEVADA 89015"
    const cityStateZipPattern = /^[A-Z\s]+,?\s+[A-Z]{2}\s+\d{5}(-\d{4})?$/i
    if (cityStateZipPattern.test(line) && !cityStateZip) {
      cityStateZip = line
    }

    // If we found both, combine and return
    if (streetAddress && cityStateZip) {
      return formatAddress(streetAddress, cityStateZip)
    }
  }

  // If we only found one piece, return it
  if (streetAddress || cityStateZip) {
    return streetAddress || cityStateZip
  }

  return null
}

/**
 * Format address components into a single string
 */
function formatAddress(street: string, cityStateZip: string): string {
  // Clean up the components
  const cleanStreet = street.trim().replace(/,\s*$/, '')
  const cleanCityStateZip = cityStateZip.trim()

  // Convert to title case for better readability
  const formattedStreet = toTitleCase(cleanStreet)
  const formattedCity = toTitleCase(cleanCityStateZip)

  return `${formattedStreet}, ${formattedCity}`
}

/**
 * Convert string to title case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Don't capitalize state abbreviations or "of", "and", etc.
      if (word.match(/^[A-Z]{2}$/)) return word.toUpperCase()
      if (['of', 'and', 'the', 'in', 'on', 'at'].includes(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Validate if extracted address looks reasonable
 */
export function isValidAddress(address: string | null): boolean {
  if (!address) return false
  
  // Must have at least 10 characters
  if (address.length < 10) return false
  
  // Must contain at least one number (street address)
  if (!/\d/.test(address)) return false
  
  // Should contain common address keywords
  const addressKeywords = /\b(road|rd|street|st|avenue|ave|blvd|drive|dr|lane|ln|way|court|ct)\b/i
  const hasStreetType = addressKeywords.test(address)
  
  // Should contain state abbreviation or zip code
  const hasStateOrZip = /\b[A-Z]{2}\b|\b\d{5}\b/.test(address)
  
  return hasStreetType || hasStateOrZip
}
