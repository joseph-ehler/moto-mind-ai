/**
 * Driver's License Document Processor
 * 
 * Processes driver's license and state ID cards
 * Extracts personal information with validation
 */

import type { 
  DocumentProcessor, 
  ValidationResult, 
  ProcessingContext 
} from '../types/document'

/**
 * Driver's license data structure
 */
export interface DriversLicenseData {
  licenseNumber: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  address: string
  city?: string
  state: string
  zipCode?: string
  issueDate: string
  expirationDate: string
  class?: string
  restrictions?: string
  endorsements?: string
  donorStatus?: boolean
  height?: string
  weight?: string
  eyeColor?: string
  sex?: 'M' | 'F' | 'X'
}

/**
 * Enriched driver's license data with calculations
 */
export interface EnrichedDriversLicenseData extends DriversLicenseData {
  age?: number
  isExpired: boolean
  daysUntilExpiration?: number
  issuingState?: string
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string): number | undefined {
  try {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  } catch {
    return undefined
  }
}

/**
 * Check if license is expired
 */
function isExpired(expirationDate: string): boolean {
  try {
    return new Date(expirationDate) < new Date()
  } catch {
    return false
  }
}

/**
 * Calculate days until expiration
 */
function daysUntilExpiration(expirationDate: string): number | undefined {
  try {
    const expDate = new Date(expirationDate)
    const today = new Date()
    const diffTime = expDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return undefined
  }
}

/**
 * Driver's License Processor implementation
 */
export const driversLicenseProcessor: DocumentProcessor<DriversLicenseData, EnrichedDriversLicenseData> = {
  type: 'drivers-license',
  name: "Driver's License Scanner",
  description: "Extracts personal information from driver's licenses and state IDs",
  
  config: {
    model: 'gpt-4o', // Use full model for complex structured data
    maxTokens: 1000,
    temperature: 0.1
  },
  
  /**
   * Generate OCR prompt for driver's license extraction
   */
  getPrompt: () => {
    return `Extract all information from this driver's license or state ID card.

Return a JSON object with the following fields:
{
  "licenseNumber": "string (DL/ID number)",
  "firstName": "string",
  "lastName": "string",
  "middleName": "string (optional)",
  "dateOfBirth": "YYYY-MM-DD",
  "address": "string (full street address)",
  "city": "string",
  "state": "string (2-letter code)",
  "zipCode": "string",
  "issueDate": "YYYY-MM-DD",
  "expirationDate": "YYYY-MM-DD",
  "class": "string (license class, e.g., 'C', 'D')",
  "restrictions": "string (optional)",
  "endorsements": "string (optional)",
  "height": "string (e.g., '5-10', '510')",
  "weight": "string (e.g., '180 LBS')",
  "eyeColor": "string (e.g., 'BRN', 'BLU')",
  "sex": "M or F or X"
}

IMPORTANT:
- Extract ALL visible text accurately
- Use YYYY-MM-DD format for dates
- Include state abbreviation (2 letters)
- If a field is not visible, omit it from JSON
- Return ONLY valid JSON, no other text

If no license is visible, return: {"error": "NO_LICENSE_FOUND"}`
  },
  
  /**
   * Parse OCR text to extract license data
   */
  parse: (text: string): DriversLicenseData => {
    if (text.includes('NO_LICENSE_FOUND') || !text.trim()) {
      throw new Error("No driver's license found in image")
    }
    
    try {
      // Parse JSON response from AI
      const data = JSON.parse(text)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Validate required fields
      if (!data.licenseNumber) {
        throw new Error('License number not found')
      }
      if (!data.firstName || !data.lastName) {
        throw new Error('Name not found')
      }
      if (!data.dateOfBirth) {
        throw new Error('Date of birth not found')
      }
      if (!data.state) {
        throw new Error('State not found')
      }
      
      console.log(`[License Processor] Found: ${data.firstName} ${data.lastName} (${data.state})`)
      
      return data as DriversLicenseData
      
    } catch (error) {
      console.error('[License Processor] Parse error:', error)
      throw new Error('Failed to parse license data from image')
    }
  },
  
  /**
   * Validate license data
   */
  validate: (data: DriversLicenseData): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Required fields
    if (!data.licenseNumber) errors.push('License number is required')
    if (!data.firstName) errors.push('First name is required')
    if (!data.lastName) errors.push('Last name is required')
    if (!data.dateOfBirth) errors.push('Date of birth is required')
    if (!data.state) errors.push('State is required')
    
    // Date validations
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth)
      if (isNaN(dob.getTime())) {
        errors.push('Invalid date of birth format')
      } else {
        const age = calculateAge(data.dateOfBirth)
        if (age && age < 16) {
          warnings.push('License holder is under minimum driving age')
        }
        if (age && age > 120) {
          errors.push('Date of birth is unrealistic')
        }
      }
    }
    
    // Expiration validation
    if (data.expirationDate) {
      const expDate = new Date(data.expirationDate)
      if (isNaN(expDate.getTime())) {
        errors.push('Invalid expiration date format')
      } else if (isExpired(data.expirationDate)) {
        warnings.push('License is expired')
      } else {
        const days = daysUntilExpiration(data.expirationDate)
        if (days && days < 30) {
          warnings.push(`License expires in ${days} days`)
        }
      }
    }
    
    // State validation
    if (data.state && data.state.length !== 2) {
      errors.push('State must be 2-letter code')
    }
    
    // Zip code validation
    if (data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
      warnings.push('Zip code format may be invalid')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  /**
   * Enrich license data with calculations
   */
  enrich: async (data: DriversLicenseData): Promise<EnrichedDriversLicenseData> => {
    console.log(`[License Processor] Enriching license data...`)
    
    const enriched: EnrichedDriversLicenseData = {
      ...data,
      age: calculateAge(data.dateOfBirth),
      isExpired: isExpired(data.expirationDate),
      daysUntilExpiration: daysUntilExpiration(data.expirationDate),
      issuingState: data.state
    }
    
    console.log(`[License Processor] Age: ${enriched.age}, Expired: ${enriched.isExpired}`)
    
    return enriched
  },
  
  /**
   * Format license data for display
   */
  format: (data: EnrichedDriversLicenseData): string => {
    return `${data.firstName} ${data.lastName} (${data.state} ${data.licenseNumber})`
  }
}
