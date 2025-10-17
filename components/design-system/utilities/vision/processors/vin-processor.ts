/**
 * VIN Document Processor
 * 
 * Processes Vehicle Identification Number (VIN) documents
 * Includes validation, NHTSA API integration, and enrichment
 */

import type { 
  DocumentProcessor, 
  ValidationResult, 
  ProcessingContext 
} from '../types/document'
import { decodeVIN, validateVINCheckDigit } from '@/lib/services/nhtsa-client'

/**
 * VIN data structure
 */
export interface VINData {
  vin: string
  location?: string
  character_quality?: 'excellent' | 'good' | 'fair' | 'poor'
}

/**
 * Enriched VIN data with NHTSA information
 */
export interface EnrichedVINData extends VINData {
  // Basic vehicle info
  make?: string
  model?: string
  year?: number
  trim?: string
  series?: string
  
  // Technical specs
  bodyType?: string
  engineType?: string
  transmission?: string
  driveType?: string
  fuelType?: string
  doors?: number
  cylinders?: number
  displacement?: string
  
  // Manufacturing
  manufacturer?: string
  plantCity?: string
  plantCountry?: string
  plantState?: string
  vehicleType?: string
  
  // Validation
  validated?: boolean
  checkDigitValid?: boolean
  
  // Raw NHTSA data
  [key: string]: any
}

/**
 * VIN Processor implementation
 */
export const vinProcessor: DocumentProcessor<VINData, EnrichedVINData> = {
  type: 'vin',
  name: 'VIN Scanner',
  description: 'Extracts and validates Vehicle Identification Numbers',
  
  config: {
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.2
  },
  
  /**
   * Generate OCR prompt for VIN extraction
   */
  getPrompt: () => {
    return `You are a VIN extraction expert. Extract the Vehicle Identification Number (VIN) from this image.

IMPORTANT RULES:
- A VIN is EXACTLY 17 characters long
- Valid characters: Numbers 0-9 and capital letters A-H, J-N, P, R-Z (excludes I, O, Q)
- Common VIN locations: dashboard plate, door jamb sticker, windshield
- VINs often appear in sections like: 1HGBH41JXMN109186 or split across lines

INSTRUCTIONS:
1. Carefully scan the entire image for any 17-character alphanumeric sequence
2. If you find multiple candidates, choose the one that looks most like a VIN plate
3. Return ONLY the 17 characters with no spaces, dashes, or other formatting
4. If you cannot find a valid 17-character VIN, return "NOT_FOUND"

Examples of valid VINs:
- 1HGBH41JXMN109186
- 5YJSA1E26HF199542
- 3GNAL4EK7DS559435

Your response should be ONLY the VIN or "NOT_FOUND".`
  },
  
  /**
   * Parse OCR text to extract VIN
   */
  parse: (text: string): VINData => {
    if (text === 'NOT_FOUND' || !text.trim()) {
      throw new Error('No VIN found in image')
    }
    
    // Remove whitespace and special characters
    const cleanText = text.replace(/[\s\-_]/g, '')
    
    // Extract 17-character VIN (excluding I, O, Q)
    const vinMatch = cleanText.match(/[A-HJ-NPR-Z0-9]{17}/i)
    
    if (vinMatch) {
      const extractedVIN = vinMatch[0].toUpperCase()
      console.log(`[VIN Processor] Found VIN: ${extractedVIN}`)
      
      return {
        vin: extractedVIN,
        location: 'detected',
        character_quality: 'good'
      }
    }
    
    // Fallback: try to extract sequence close to 17 chars
    const possibleVIN = cleanText.match(/[A-HJ-NPR-Z0-9]{15,19}/i)
    
    if (possibleVIN) {
      const extracted = possibleVIN[0].toUpperCase().substring(0, 17)
      console.warn(`[VIN Processor] Found possible VIN (non-standard length): ${extracted}`)
      
      return {
        vin: extracted,
        location: 'detected',
        character_quality: 'fair'
      }
    }
    
    console.error(`[VIN Processor] No VIN found in text: "${text}"`)
    throw new Error('No valid VIN format found in image')
  },
  
  /**
   * Validate VIN format and check digit
   */
  validate: (data: VINData): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check VIN exists
    if (!data.vin) {
      errors.push('VIN is required')
      return { valid: false, errors, warnings }
    }
    
    // Check length
    if (data.vin.length !== 17) {
      errors.push(`Invalid VIN length: ${data.vin.length} (must be 17)`)
    }
    
    // Check format (no I, O, Q)
    const invalidChars = data.vin.match(/[IOQ]/gi)
    if (invalidChars) {
      errors.push(`Invalid characters in VIN: ${invalidChars.join(', ')} (I, O, Q not allowed)`)
    }
    
    // Check valid characters only
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(data.vin)) {
      errors.push('VIN contains invalid characters')
    }
    
    // Validate check digit (9th position)
    const checkDigitValid = validateVINCheckDigit(data.vin)
    if (!checkDigitValid) {
      warnings.push('VIN check digit validation failed (may be transcription error)')
    }
    
    // Warn about quality
    if (data.character_quality === 'fair') {
      warnings.push('Image quality is fair - VIN may need manual verification')
    } else if (data.character_quality === 'poor') {
      warnings.push('Image quality is poor - VIN likely needs manual verification')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  /**
   * Enrich VIN with NHTSA vehicle data
   */
  enrich: async (data: VINData, context?: ProcessingContext): Promise<EnrichedVINData> => {
    console.log(`[VIN Processor] Enriching VIN with NHTSA data: ${data.vin}`)
    
    try {
      // Decode VIN via NHTSA API
      const nhtsaData = await decodeVIN(data.vin)
      
      if (nhtsaData.error) {
        console.warn(`[VIN Processor] NHTSA error: ${nhtsaData.error}`)
        return {
          ...data,
          validated: false,
          error: nhtsaData.error
        }
      }
      
      // Validate check digit
      const checkDigitValid = validateVINCheckDigit(data.vin)
      
      // Merge with NHTSA data
      const enriched: EnrichedVINData = {
        ...data,
        ...nhtsaData,
        validated: true,
        checkDigitValid
      }
      
      console.log(`[VIN Processor] Enriched: ${enriched.year} ${enriched.make} ${enriched.model}`)
      
      return enriched
      
    } catch (error) {
      console.error('[VIN Processor] Enrichment failed:', error)
      
      // Return base data with error
      return {
        ...data,
        validated: false,
        error: error instanceof Error ? error.message : 'Enrichment failed'
      }
    }
  },
  
  /**
   * Format VIN data for display
   */
  format: (data: EnrichedVINData): string => {
    if (!data.make || !data.model) {
      return data.vin
    }
    
    const parts: string[] = []
    
    if (data.year) parts.push(data.year.toString())
    if (data.make) parts.push(data.make)
    if (data.model) parts.push(data.model)
    if (data.trim) parts.push(data.trim)
    
    return parts.join(' ')
  }
}
