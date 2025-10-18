/**
 * VIN Data Normalizer
 * Cleans and standardizes NHTSA data for consistent user display
 */

/**
 * Normalize country names to readable format
 */
export function normalizeCountry(country?: string): string | undefined {
  if (!country) return undefined
  
  const normalized = country.toUpperCase().trim()
  
  // Common patterns
  const countryMap: Record<string, string> = {
    'UNITED STATES (USA)': 'USA',
    'UNITED STATES': 'USA',
    'CANADA': 'Canada',
    'MEXICO': 'Mexico',
    'JAPAN': 'Japan',
    'GERMANY': 'Germany',
    'SOUTH KOREA': 'South Korea',
    'UNITED KINGDOM': 'UK',
    'FRANCE': 'France',
    'ITALY': 'Italy',
    'SWEDEN': 'Sweden',
    'CHINA': 'China'
  }
  
  return countryMap[normalized] || titleCase(country)
}

/**
 * Normalize manufacturer names
 */
export function normalizeManufacturer(manufacturer?: string): string | undefined {
  if (!manufacturer) return undefined
  
  // Remove common suffixes
  let normalized = manufacturer
    .replace(/\s+(LLC|INC\.|INC|CORPORATION|CORP\.|CORP|LTD\.|LTD|CO\.|CO)$/i, '')
    .replace(/\s+in\s+.+$/i, '') // Remove "in CITY, STATE"
    .trim()
  
  // Title case
  return titleCase(normalized)
}

/**
 * Normalize drive type
 */
export function normalizeDriveType(driveType?: string): string | undefined {
  if (!driveType) return undefined
  
  const normalized = driveType.toUpperCase().trim()
  
  const driveMap: Record<string, string> = {
    'FWD/FRONT-WHEEL DRIVE': 'FWD',
    'FRONT-WHEEL DRIVE': 'FWD',
    'RWD/REAR-WHEEL DRIVE': 'RWD',
    'REAR-WHEEL DRIVE': 'RWD',
    '4WD/4-WHEEL DRIVE/4X4': '4WD',
    '4-WHEEL DRIVE': '4WD',
    '4X4': '4WD',
    'AWD/ALL-WHEEL DRIVE': 'AWD',
    'ALL-WHEEL DRIVE': 'AWD'
  }
  
  return driveMap[normalized] || driveType
}

/**
 * Normalize body type
 */
export function normalizeBodyType(bodyType?: string): string | undefined {
  if (!bodyType) return undefined
  
  const bodyMap: Record<string, string> = {
    'HATCHBACK/LIFTBACK/NOTCHBACK': 'Hatchback',
    'SPORT UTILITY VEHICLE (SUV)/MULTI-PURPOSE VEHICLE (MPV)': 'SUV/MPV',
    'SPORT UTILITY VEHICLE': 'SUV',
    'PICKUP': 'Pickup Truck',
    'SEDAN/SALOON': 'Sedan',
    'COUPE': 'Coupe',
    'WAGON': 'Wagon',
    'VAN': 'Van',
    'CONVERTIBLE/CABRIOLET': 'Convertible'
  }
  
  const normalized = bodyType.toUpperCase().trim()
  return bodyMap[normalized] || titleCase(bodyType)
}

/**
 * Normalize fuel type
 */
export function normalizeFuelType(fuelType?: string): string | undefined {
  if (!fuelType) return undefined
  
  const fuelMap: Record<string, string> = {
    'GASOLINE': 'Gasoline',
    'DIESEL': 'Diesel',
    'ELECTRIC': 'Electric',
    'FLEXIBLE FUEL VEHICLE (FFV)': 'Flex Fuel',
    'HYBRID': 'Hybrid',
    'PLUG-IN HYBRID': 'Plug-in Hybrid',
    'COMPRESSED NATURAL GAS (CNG)': 'CNG',
    'LIQUEFIED PETROLEUM GAS (LPG)': 'LPG',
    'E85': 'E85 (Ethanol)'
  }
  
  const normalized = fuelType.toUpperCase().trim()
  return fuelMap[normalized] || titleCase(fuelType)
}

/**
 * Normalize transmission
 */
export function normalizeTransmission(transmission?: string): string | undefined {
  if (!transmission) return undefined
  
  const transMap: Record<string, string> = {
    'AUTOMATIC': 'Automatic',
    'MANUAL': 'Manual',
    'CONTINUOUSLY VARIABLE (CVT)': 'CVT',
    'CVT': 'CVT',
    'DUAL CLUTCH (DCT)': 'Dual-Clutch',
    'AUTOMATED MANUAL': 'Auto-Manual'
  }
  
  const normalized = transmission.toUpperCase().trim()
  return transMap[normalized] || titleCase(transmission)
}

/**
 * Normalize safety feature values
 */
export function normalizeSafetyFeature(value?: string): string | undefined {
  if (!value) return undefined
  
  const normalized = value.trim()
  
  // Convert "Not Applicable" to undefined
  if (normalized.toLowerCase() === 'not applicable') {
    return undefined
  }
  
  // Normalize common values
  const safetyMap: Record<string, string> = {
    'STANDARD': 'Yes',
    'OPTIONAL': 'Optional',
    '4-WHEEL ABS': '4-Wheel',
    'REAR ABS': 'Rear Only',
    'FRONT': 'Front Only',
    '1ST ROW (DRIVER AND PASSENGER)': 'Front',
    '1ST AND 2ND ROWS': 'Front & Rear'
  }
  
  const upper = normalized.toUpperCase()
  return safetyMap[upper] || titleCase(normalized)
}

/**
 * Normalize generic NHTSA values
 */
export function normalizeValue(value?: string): string | undefined {
  if (!value) return undefined
  
  const trimmed = value.trim()
  
  // Remove if "Not Applicable" or empty
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'not applicable' ||
    trimmed.toLowerCase() === 'n/a'
  ) {
    return undefined
  }
  
  return trimmed
}

/**
 * Format location (city, state, country)
 */
export function formatLocation(
  city?: string,
  state?: string,
  country?: string
): string | undefined {
  const parts: string[] = []
  
  if (city) parts.push(titleCase(city))
  if (state) parts.push(state.toUpperCase())
  if (country) {
    const normalizedCountry = normalizeCountry(country)
    if (normalizedCountry && normalizedCountry !== 'USA') {
      parts.push(normalizedCountry)
    }
  }
  
  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * Convert string to title case
 */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Don't capitalize certain words
      const lowercase = ['of', 'the', 'and', 'in', 'on', 'at', 'to', 'for']
      if (lowercase.includes(word)) return word
      
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .replace(/^./, match => match.toUpperCase()) // Always capitalize first word
}

/**
 * Format numeric values with units
 */
export function formatWithUnit(value?: string, unit?: string): string | undefined {
  if (!value) return undefined
  
  const num = parseFloat(value)
  if (isNaN(num)) return value
  
  // Format number with commas for large numbers
  const formatted = num.toLocaleString('en-US', {
    maximumFractionDigits: 1
  })
  
  return unit ? `${formatted} ${unit}` : formatted
}

/**
 * Normalize displacement (L)
 */
export function normalizeDisplacement(displacement?: string): string | undefined {
  if (!displacement) return undefined
  
  const num = parseFloat(displacement)
  if (isNaN(num)) return displacement
  
  return `${num.toFixed(1)}L`
}

/**
 * Normalize horsepower
 */
export function normalizeHorsepower(hp?: string): string | undefined {
  if (!hp) return undefined
  
  const num = parseInt(hp)
  if (isNaN(num)) return undefined
  
  return `${num} HP`
}

/**
 * Normalize doors (remove "Doors" suffix if present)
 */
export function normalizeDoors(doors?: string): string | undefined {
  if (!doors) return undefined
  
  const num = parseInt(doors)
  if (isNaN(num)) return doors
  
  return `${num}`
}

/**
 * Normalize transmission speeds
 */
export function normalizeTransmissionSpeeds(speeds?: string): string | undefined {
  if (!speeds) return undefined
  
  const num = parseInt(speeds)
  if (isNaN(num)) return speeds
  
  return `${num}-Speed`
}

/**
 * Comprehensive normalization for all VIN data
 */
export function normalizeVINData(data: Record<string, any>): Record<string, any> {
  return {
    ...data,
    // Apply all normalizations
    manufacturer: normalizeManufacturer(data.manufacturer),
    plantCountry: normalizeCountry(data.plantCountry),
    driveType: normalizeDriveType(data.driveType),
    bodyType: normalizeBodyType(data.bodyType),
    fuelType: normalizeFuelType(data.fuelType),
    transmission: normalizeTransmission(data.transmission),
    engineDisplacement: normalizeDisplacement(data.engineDisplacement),
    engineHP: normalizeHorsepower(data.engineHP),
    doors: normalizeDoors(data.doors),
    transmissionSpeeds: normalizeTransmissionSpeeds(data.transmissionSpeeds),
    
    // Safety features
    absType: normalizeSafetyFeature(data.absType),
    electronicStabilityControl: normalizeSafetyFeature(data.electronicStabilityControl),
    tractionControl: normalizeSafetyFeature(data.tractionControl),
    airBagLocations: normalizeSafetyFeature(data.airBagLocations),
    blindSpotWarning: normalizeSafetyFeature(data.blindSpotWarning),
    forwardCollisionWarning: normalizeSafetyFeature(data.forwardCollisionWarning),
    laneDepartureWarning: normalizeSafetyFeature(data.laneDepartureWarning),
    parkAssist: normalizeSafetyFeature(data.parkAssist),
    rearVisibilitySystem: normalizeSafetyFeature(data.rearVisibilitySystem),
    
    // Format location
    location: formatLocation(data.plantCity, data.plantState, data.plantCountry)
  }
}
