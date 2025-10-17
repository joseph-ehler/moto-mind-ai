// Data Extraction Module
// Handles vendor extraction, mileage parsing, and data normalization

export function extractVendorWithPrecedence(visionData: any): string {
  // Priority order for vendor extraction
  const vendorSources = [
    'business_name',
    'vendor_name', 
    'shop_name',
    'dealer_name',
    'company_name',
    'service_center',
    'location_name'
  ]
  
  // Try each source in priority order
  for (const source of vendorSources) {
    if (visionData[source] && typeof visionData[source] === 'string') {
      const vendor = visionData[source].trim()
      if (vendor.length > 0) {
        return normalizeVendorName(vendor)
      }
    }
  }
  
  // Fallback: extract from address or other fields
  if (visionData.address) {
    const addressMatch = visionData.address.match(/^([^,\n]+)/)
    if (addressMatch) {
      return normalizeVendorName(addressMatch[1])
    }
  }
  
  // Last resort: check line items for vendor info
  if (visionData.line_items && Array.isArray(visionData.line_items)) {
    for (const item of visionData.line_items) {
      if (item.vendor || item.supplier) {
        const vendor = item.vendor || item.supplier
        if (typeof vendor === 'string' && vendor.trim().length > 0) {
          return normalizeVendorName(vendor)
        }
      }
    }
  }
  
  return 'Unknown Vendor'
}

export function normalizeVendorName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'Unknown Vendor'
  }
  
  let normalized = rawName.trim()
  
  // Remove common suffixes
  const suffixesToRemove = [
    /\s+(LLC|Inc|Corp|Corporation|Co|Company|Ltd|Limited)\s*\.?$/i,
    /\s+(Automotive|Auto|Service|Services|Center|Shop|Garage)\s*$/i,
    /\s+(Repair|Repairs|Maintenance|Care)\s*$/i
  ]
  
  suffixesToRemove.forEach(suffix => {
    normalized = normalized.replace(suffix, '')
  })
  
  // Clean up common patterns
  normalized = normalized
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/[^\w\s&'-]/g, '')  // Remove special chars except &, ', -
    .trim()
  
  // Handle common abbreviations
  const abbreviations = {
    'CHEV': 'Chevrolet',
    'CHEVY': 'Chevrolet', 
    'FORD': 'Ford',
    'GM': 'General Motors',
    'BMW': 'BMW',
    'MERC': 'Mercedes',
    'VW': 'Volkswagen',
    'TOYOTA': 'Toyota',
    'HONDA': 'Honda',
    'NISSAN': 'Nissan'
  }
  
  const upperNormalized = normalized.toUpperCase()
  for (const [abbrev, full] of Object.entries(abbreviations)) {
    if (upperNormalized.includes(abbrev)) {
      normalized = normalized.replace(new RegExp(abbrev, 'gi'), full)
      break
    }
  }
  
  // Capitalize properly
  normalized = normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return normalized || 'Unknown Vendor'
}

export function extractMileageWithPatterns(visionData: any): number | null {
  // Priority order for mileage extraction
  const mileageSources = [
    'odometer_reading',
    'mileage',
    'miles',
    'current_mileage',
    'vehicle_mileage'
  ]
  
  // Try direct numeric fields first
  for (const source of mileageSources) {
    if (visionData[source] !== undefined && visionData[source] !== null) {
      const value = typeof visionData[source] === 'number' 
        ? visionData[source] 
        : parseFloat(String(visionData[source]).replace(/[^\d.]/g, ''))
      
      if (!isNaN(value) && value > 0 && value < 2000000) {
        return Math.round(value)
      }
    }
  }
  
  // Try extracting from text fields
  const textSources = [
    'service_description',
    'work_performed', 
    'notes',
    'comments',
    'description'
  ]
  
  for (const source of textSources) {
    if (visionData[source] && typeof visionData[source] === 'string') {
      const mileage = extractMileageFromText(visionData[source])
      if (mileage) return mileage
    }
  }
  
  // Check line items
  if (visionData.line_items && Array.isArray(visionData.line_items)) {
    for (const item of visionData.line_items) {
      if (item.description) {
        const mileage = extractMileageFromText(item.description)
        if (mileage) return mileage
      }
    }
  }
  
  return null
}

function extractMileageFromText(text: string): number | null {
  if (!text || typeof text !== 'string') return null
  
  // Common mileage patterns
  const patterns = [
    /(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi|mileage)/i,
    /(?:miles?|mi|mileage)[\s:]*(\d{1,3}(?:,\d{3})*)/i,
    /odometer[\s:]*(\d{1,3}(?:,\d{3})*)/i,
    /(\d{1,3}(?:,\d{3})*)\s*(?:mile|mi)\s*service/i,
    /at\s*(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1].replace(/,/g, ''))
      if (!isNaN(value) && value > 0 && value < 2000000) {
        return value
      }
    }
  }
  
  return null
}

export function parseOpenAIResponse(content: string) {
  try {
    // Remove any markdown code block formatting
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanContent)
  } catch (error) {
    console.error('❌ Failed to parse OpenAI response:', content)
    throw new Error('Invalid JSON response from OpenAI Vision')
  }
}

export function normalizeFuelStation(rawStation: string): string {
  if (!rawStation || typeof rawStation !== 'string') {
    return 'Unknown Station'
  }
  
  let normalized = rawStation.trim()
  
  // Common fuel station name mappings
  const stationMappings = {
    'SHELL': 'Shell',
    'EXXON': 'Exxon',
    'MOBIL': 'Mobil',
    'CHEVRON': 'Chevron',
    'BP': 'BP',
    'TEXACO': 'Texaco',
    'CITGO': 'Citgo',
    'SUNOCO': 'Sunoco',
    '76': '76',
    'ARCO': 'ARCO',
    'MARATHON': 'Marathon',
    'SPEEDWAY': 'Speedway',
    'WAWA': 'Wawa',
    'SHEETZ': 'Sheetz',
    'COSTCO': 'Costco Gas',
    'SAM\'S CLUB': 'Sam\'s Club Gas'
  }
  
  // Check for exact matches first
  const upperNormalized = normalized.toUpperCase()
  for (const [key, value] of Object.entries(stationMappings)) {
    if (upperNormalized.includes(key)) {
      return value
    }
  }
  
  // Clean up the name
  normalized = normalized
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s'-]/g, '')
    .trim()
  
  // Capitalize properly
  normalized = normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return normalized || 'Unknown Station'
}
