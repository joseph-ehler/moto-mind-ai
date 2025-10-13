/**
 * Insurance Card Document Processor
 * 
 * Processes vehicle insurance cards
 * Extracts policy information and validates coverage
 */

import type { 
  DocumentProcessor, 
  ValidationResult, 
  ProcessingContext 
} from '../types/document'
import { decodeVIN } from '@/lib/services/nhtsa-client'
import type { EnrichedVINData } from './vin-processor'

/**
 * Insurance card data structure
 */
export interface InsuranceCardData {
  policyNumber: string
  carrier: string
  policyholderName: string
  effectiveDate: string
  expirationDate: string
  vin?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleYear?: number
  coverageType?: string
  liabilityLimits?: string
  deductible?: string
  agentName?: string
  agentPhone?: string
}

/**
 * Enriched insurance data with vehicle info
 */
export interface EnrichedInsuranceData extends InsuranceCardData {
  isActive: boolean
  daysUntilExpiration?: number
  vehicle?: EnrichedVINData
}

/**
 * Check if policy is active
 */
function isPolicyActive(effectiveDate: string, expirationDate: string): boolean {
  try {
    const now = new Date()
    const effective = new Date(effectiveDate)
    const expiration = new Date(expirationDate)
    return now >= effective && now <= expiration
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
 * Insurance Card Processor implementation
 */
export const insuranceProcessor: DocumentProcessor<InsuranceCardData, EnrichedInsuranceData> = {
  type: 'insurance',
  name: 'Insurance Card Scanner',
  description: 'Extracts policy information from vehicle insurance cards',
  
  config: {
    model: 'gpt-4o', // Complex structured data
    maxTokens: 1000,
    temperature: 0.1
  },
  
  /**
   * Generate OCR prompt for insurance card extraction
   */
  getPrompt: () => {
    return `Extract all information from this vehicle insurance card.

Return a JSON object with the following fields:
{
  "policyNumber": "string (policy/certificate number)",
  "carrier": "string (insurance company name)",
  "policyholderName": "string (insured person's name)",
  "effectiveDate": "YYYY-MM-DD",
  "expirationDate": "YYYY-MM-DD",
  "vin": "string (17-character VIN if present)",
  "vehicleMake": "string (optional)",
  "vehicleModel": "string (optional)",
  "vehicleYear": number (optional),
  "coverageType": "string (e.g., 'Full Coverage', 'Liability Only')",
  "liabilityLimits": "string (e.g., '100/300/100')",
  "deductible": "string (optional)",
  "agentName": "string (optional)",
  "agentPhone": "string (optional)"
}

IMPORTANT:
- Extract ALL visible text accurately
- Use YYYY-MM-DD format for dates
- Include VIN if visible (17 characters, no I/O/Q)
- If a field is not visible, omit it from JSON
- Return ONLY valid JSON, no other text

If no insurance card is visible, return: {"error": "NO_INSURANCE_FOUND"}`
  },
  
  /**
   * Parse OCR text to extract insurance data
   */
  parse: (text: string): InsuranceCardData => {
    if (text.includes('NO_INSURANCE_FOUND') || !text.trim()) {
      throw new Error('No insurance card found in image')
    }
    
    try {
      const data = JSON.parse(text)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Validate required fields
      if (!data.policyNumber) {
        throw new Error('Policy number not found')
      }
      if (!data.carrier) {
        throw new Error('Insurance carrier not found')
      }
      if (!data.policyholderName) {
        throw new Error('Policyholder name not found')
      }
      
      console.log(`[Insurance Processor] Found: ${data.carrier} Policy #${data.policyNumber}`)
      
      return data as InsuranceCardData
      
    } catch (error) {
      console.error('[Insurance Processor] Parse error:', error)
      throw new Error('Failed to parse insurance card data from image')
    }
  },
  
  /**
   * Validate insurance data
   */
  validate: (data: InsuranceCardData): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Required fields
    if (!data.policyNumber) errors.push('Policy number is required')
    if (!data.carrier) errors.push('Insurance carrier is required')
    if (!data.policyholderName) errors.push('Policyholder name is required')
    
    // Date validations
    if (data.effectiveDate && data.expirationDate) {
      const effective = new Date(data.effectiveDate)
      const expiration = new Date(data.expirationDate)
      
      if (isNaN(effective.getTime())) {
        errors.push('Invalid effective date format')
      }
      if (isNaN(expiration.getTime())) {
        errors.push('Invalid expiration date format')
      }
      
      if (effective > expiration) {
        errors.push('Effective date is after expiration date')
      }
      
      // Check if policy is expired
      if (expiration < new Date()) {
        warnings.push('Insurance policy is expired')
      } else {
        const days = daysUntilExpiration(data.expirationDate)
        if (days && days < 30) {
          warnings.push(`Policy expires in ${days} days`)
        }
      }
      
      // Check if policy is not yet effective
      if (effective > new Date()) {
        warnings.push('Policy has not yet taken effect')
      }
    } else {
      if (!data.effectiveDate) warnings.push('Effective date not found')
      if (!data.expirationDate) warnings.push('Expiration date not found')
    }
    
    // VIN validation if present
    if (data.vin) {
      if (data.vin.length !== 17) {
        warnings.push('VIN should be 17 characters')
      }
      if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(data.vin)) {
        warnings.push('VIN contains invalid characters')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  /**
   * Enrich insurance data with vehicle info via VIN
   */
  enrich: async (data: InsuranceCardData): Promise<EnrichedInsuranceData> => {
    console.log(`[Insurance Processor] Enriching insurance data...`)
    
    let vehicleData: EnrichedVINData | undefined
    
    // If VIN is present, decode it
    if (data.vin) {
      try {
        console.log(`[Insurance Processor] Decoding VIN: ${data.vin}`)
        const nhtsaData = await decodeVIN(data.vin)
        
        if (!nhtsaData.error) {
          vehicleData = {
            ...nhtsaData,
            vin: data.vin
          } as EnrichedVINData
          
          console.log(`[Insurance Processor] Vehicle: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`)
        }
      } catch (error) {
        console.warn('[Insurance Processor] Failed to decode VIN:', error)
      }
    }
    
    const enriched: EnrichedInsuranceData = {
      ...data,
      isActive: isPolicyActive(data.effectiveDate, data.expirationDate),
      daysUntilExpiration: daysUntilExpiration(data.expirationDate),
      vehicle: vehicleData
    }
    
    console.log(`[Insurance Processor] Active: ${enriched.isActive}, Days remaining: ${enriched.daysUntilExpiration}`)
    
    return enriched
  },
  
  /**
   * Format insurance data for display
   */
  format: (data: EnrichedInsuranceData): string => {
    const parts: string[] = [data.carrier]
    
    if (data.vehicle) {
      parts.push(`${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`)
    } else if (data.vehicleMake && data.vehicleModel) {
      parts.push(`${data.vehicleYear || ''} ${data.vehicleMake} ${data.vehicleModel}`.trim())
    }
    
    parts.push(`Policy #${data.policyNumber}`)
    
    return parts.join(' - ')
  }
}
