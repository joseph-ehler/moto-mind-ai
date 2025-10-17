/**
 * License Plate Document Processor
 * 
 * Processes vehicle license plate images
 * Includes state validation and format checking
 */

import type { 
  DocumentProcessor, 
  ValidationResult, 
  ProcessingContext 
} from '../types/document'

/**
 * License plate data structure
 */
export interface LicensePlateData {
  plate: string
  state?: string
  country?: 'US' | 'CA' | 'MX'
  location?: string
}

/**
 * US State codes for validation
 */
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

/**
 * Canadian provinces for validation
 */
const CA_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
]

/**
 * License Plate Processor implementation
 */
export const licensePlateProcessor: DocumentProcessor<LicensePlateData, LicensePlateData> = {
  type: 'license-plate',
  name: 'License Plate Scanner',
  description: 'Extracts vehicle license plate numbers and states',
  
  config: {
    model: 'gpt-4o-mini',
    maxTokens: 200,
    temperature: 0.2
  },
  
  /**
   * Generate OCR prompt for license plate extraction
   */
  getPrompt: () => {
    return `Extract the license plate number and state/province from this image.

INSTRUCTIONS:
1. Identify the license plate number (alphanumeric characters)
2. Identify the state or province (2-letter code, usually at bottom or top)
3. Return in format: "PLATE_NUMBER STATE" (e.g., "ABC1234 CA")
4. If state is not visible, return just the plate number
5. If no plate is visible, return "NOT_FOUND"

Examples:
- "ABC1234 CA"
- "XYZ987 TX"
- "123ABC NY"

Your response should be in the format shown above.`
  },
  
  /**
   * Parse OCR text to extract plate and state
   */
  parse: (text: string): LicensePlateData => {
    if (text === 'NOT_FOUND' || !text.trim()) {
      throw new Error('No license plate found in image')
    }
    
    // Clean and normalize text
    const cleanText = text.trim().toUpperCase()
    
    // Try to match "PLATE STATE" format
    const match = cleanText.match(/^([A-Z0-9\s]+?)\s+([A-Z]{2})$/i)
    
    if (match) {
      const plate = match[1].replace(/\s/g, '')
      const state = match[2].toUpperCase()
      
      console.log(`[Plate Processor] Found: ${plate} (${state})`)
      
      return {
        plate,
        state,
        location: 'detected'
      }
    }
    
    // Fallback: just extract the plate without state
    const plateOnly = cleanText.replace(/\s+/g, '').match(/[A-Z0-9]{3,8}/i)
    
    if (plateOnly) {
      console.warn(`[Plate Processor] Found plate without state: ${plateOnly[0]}`)
      
      return {
        plate: plateOnly[0],
        state: undefined,
        location: 'detected'
      }
    }
    
    console.error(`[Plate Processor] No valid format in text: "${text}"`)
    throw new Error('No valid license plate format found in image')
  },
  
  /**
   * Validate license plate format
   */
  validate: (data: LicensePlateData): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check plate exists
    if (!data.plate) {
      errors.push('License plate number is required')
      return { valid: false, errors, warnings }
    }
    
    // Check plate length
    if (data.plate.length < 2 || data.plate.length > 8) {
      errors.push(`Invalid plate length: ${data.plate.length} (typically 2-8 characters)`)
    }
    
    // Check valid characters (alphanumeric only)
    if (!/^[A-Z0-9]+$/i.test(data.plate)) {
      errors.push('License plate contains invalid characters')
    }
    
    // Validate state if provided
    if (data.state) {
      const isValidUS = US_STATES.includes(data.state.toUpperCase())
      const isValidCA = CA_PROVINCES.includes(data.state.toUpperCase())
      
      if (!isValidUS && !isValidCA) {
        warnings.push(`Unknown state/province code: ${data.state}`)
      } else if (isValidCA) {
        data.country = 'CA'
      } else {
        data.country = 'US'
      }
    } else {
      warnings.push('State/province not detected - may need manual entry')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  /**
   * Format license plate for display
   */
  format: (data: LicensePlateData): string => {
    if (data.state) {
      return `${data.plate} (${data.state})`
    }
    return data.plate
  }
}
