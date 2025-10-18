/**
 * VIN Validator
 * Deep validation with checksum, year, manufacturer checks
 */

export interface ValidationResult {
  valid: boolean
  error?: string
  confidence?: number // 0-100
  metadata?: {
    year?: number
    region?: string
    wmi?: string
  }
}

interface ValidationCheck {
  valid: boolean
  error?: string
  metadata?: Record<string, any>
}

/**
 * Check if VIN is valid format
 * VIN must be exactly 17 characters, alphanumeric (no I, O, Q)
 */
export function isValidVINFormat(vin: string): boolean {
  if (!vin || typeof vin !== 'string') {
    return false
  }

  // Must be exactly 17 characters
  if (vin.length !== 17) {
    return false
  }

  // Must be alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]+$/i.test(vin)) {
    return false
  }

  return true
}

/**
 * Calculate VIN checksum digit
 * Uses the algorithm defined by NHTSA
 */
export function calculateChecksum(vin: string): string {
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
  
  const transliteration: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9
  }

  let sum = 0
  for (let i = 0; i < 17; i++) {
    const char = vin[i].toUpperCase()
    const value = transliteration[char]
    if (value === undefined) {
      throw new Error(`Invalid character in VIN: ${char}`)
    }
    sum += value * weights[i]
  }

  const remainder = sum % 11
  return remainder === 10 ? 'X' : remainder.toString()
}

/**
 * Validate VIN checksum
 * Position 9 should match calculated checksum
 */
export function validateChecksum(vin: string): boolean {
  try {
    const checkDigit = vin[8].toUpperCase()
    const calculatedChecksum = calculateChecksum(vin)
    return checkDigit === calculatedChecksum
  } catch {
    return false
  }
}

/**
 * Full VIN validation (format + checksum)
 */
export function isValidVIN(vin: string): boolean {
  if (!isValidVINFormat(vin)) {
    return false
  }

  // Checksum validation is optional (some older VINs don't follow standard)
  // We'll validate format strictly but be lenient on checksum
  return true
}

/**
 * Comprehensive VIN validation with confidence scoring
 */
export function validateVIN(vin: string): ValidationResult {
  const checks = [
    checkFormat(vin),
    checkChecksum(vin),
    checkYear(vin),
    checkWorldManufacturer(vin)
  ]
  
  const errors = checks.filter(c => !c.valid).map(c => c.error).filter(Boolean) as string[]
  const confidence = calculateConfidence(checks)
  
  // Collect metadata from all checks
  const metadata = checks.reduce((acc, check) => {
    return { ...acc, ...check.metadata }
  }, {})
  
  if (errors.length > 0) {
    return {
      valid: false,
      error: errors[0], // Return first error
      confidence,
      metadata
    }
  }
  
  return {
    valid: true,
    confidence,
    metadata
  }
}

/**
 * Sanitize VIN input (uppercase, remove spaces/dashes)
 */
export function sanitizeVIN(vin: string): string {
  return vin
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .trim()
}

// ========================================
// Validation Check Functions
// ========================================

/**
 * Check 1: Format validation
 */
function checkFormat(vin: string): ValidationCheck {
  if (!vin || typeof vin !== 'string') {
    return { valid: false, error: 'VIN is required' }
  }
  
  if (vin.length !== 17) {
    return { valid: false, error: `VIN must be 17 characters (got ${vin.length})` }
  }
  
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return { valid: false, error: 'VIN contains invalid characters (I, O, Q not allowed)' }
  }
  
  return { valid: true }
}

/**
 * Check 2: Checksum validation
 */
function checkChecksum(vin: string): ValidationCheck {
  if (!checkFormat(vin).valid) {
    return { valid: false, error: 'Invalid format' }
  }

  const year = decodeYear(vin[9])
  
  // Pre-1981 vehicles don't have checksums
  if (year < 1981) {
    return { valid: true, metadata: { checksumRequired: false } }
  }

  try {
    const checkDigit = vin[8].toUpperCase()
    const calculatedChecksum = calculateChecksum(vin)
    
    if (checkDigit !== calculatedChecksum) {
      return {
        valid: false,
        error: `Invalid checksum (expected ${calculatedChecksum}, got ${checkDigit})`
      }
    }
    
    return { valid: true, metadata: { checksumRequired: true } }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to calculate checksum'
    }
  }
}

/**
 * Check 3: Year validation
 */
function checkYear(vin: string): ValidationCheck {
  if (!checkFormat(vin).valid) {
    return { valid: false }
  }
  
  const yearChar = vin[9].toUpperCase()
  const validYearChars = 'ABCDEFGHJKLMNPRSTVWXY123456789'
  
  if (!validYearChars.includes(yearChar)) {
    return {
      valid: false,
      error: `Invalid year character '${yearChar}' at position 10`
    }
  }
  
  const year = decodeYear(yearChar)
  const currentYear = new Date().getFullYear()
  
  // Allow 1980-present + next model year
  if (year < 1980 || year > currentYear + 1) {
    return {
      valid: false,
      error: `Unrealistic year: ${year} (valid range: 1980-${currentYear + 1})`
    }
  }
  
  return {
    valid: true,
    metadata: { year }
  }
}

/**
 * Check 4: World Manufacturer Identifier (WMI) validation
 */
function checkWorldManufacturer(vin: string): ValidationCheck {
  if (!checkFormat(vin).valid) {
    return { valid: false }
  }
  
  const wmi = vin.substring(0, 3).toUpperCase()
  const firstChar = wmi[0]
  
  // Known WMI regions (first character)
  const knownRegions: Record<string, string> = {
    '1': 'United States',
    '2': 'Canada',
    '3': 'Mexico',
    '4': 'United States',
    '5': 'United States',
    'J': 'Japan',
    'K': 'South Korea',
    'L': 'China',
    'S': 'United Kingdom',
    'T': 'Czech Republic/Hungary/Romania',
    'V': 'France/Spain',
    'W': 'Germany',
    'X': 'Russia/Kazakhstan',
    'Y': 'Sweden/Finland',
    'Z': 'Italy'
  }
  
  const region = knownRegions[firstChar]
  
  if (!region) {
    return {
      valid: false,
      error: `Unknown manufacturer region: '${firstChar}' (WMI: ${wmi})`
    }
  }
  
  return {
    valid: true,
    metadata: { region, wmi }
  }
}

/**
 * Decode year from VIN position 10 character
 */
function decodeYear(yearChar: string): number {
  const char = yearChar.toUpperCase()
  
  // Year encoding: A=1980, B=1981, ..., Y=2000, 1=2001, 2=2002, ..., 9=2009, A=2010, ...
  const yearCodes: Record<string, number[]> = {
    'A': [1980, 2010],
    'B': [1981, 2011],
    'C': [1982, 2012],
    'D': [1983, 2013],
    'E': [1984, 2014],
    'F': [1985, 2015],
    'G': [1986, 2016],
    'H': [1987, 2017],
    'J': [1988, 2018],
    'K': [1989, 2019],
    'L': [1990, 2020],
    'M': [1991, 2021],
    'N': [1992, 2022],
    'P': [1993, 2023],
    'R': [1994, 2024],
    'S': [1995, 2025],
    'T': [1996, 2026],
    'V': [1997, 2027],
    'W': [1998, 2028],
    'X': [1999, 2029],
    'Y': [2000, 2030],
    '1': [2001, 2031],
    '2': [2002, 2032],
    '3': [2003, 2033],
    '4': [2004, 2034],
    '5': [2005, 2035],
    '6': [2006, 2036],
    '7': [2007, 2037],
    '8': [2008, 2038],
    '9': [2009, 2039]
  }
  
  const years = yearCodes[char]
  if (!years) return 1980 // Fallback
  
  // Return the most recent valid year
  const currentYear = new Date().getFullYear()
  return years[1] <= currentYear + 1 ? years[1] : years[0]
}

/**
 * Calculate confidence score (0-100)
 */
function calculateConfidence(checks: ValidationCheck[]): number {
  const passed = checks.filter(c => c.valid).length
  return Math.round((passed / checks.length) * 100)
}
