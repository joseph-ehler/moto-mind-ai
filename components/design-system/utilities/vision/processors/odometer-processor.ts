/**
 * Odometer Document Processor
 * 
 * Processes vehicle odometer/mileage readings
 * Extracts numerical values with unit detection
 */

import type { 
  DocumentProcessor, 
  ValidationResult, 
  ProcessingContext 
} from '../types/document'

/**
 * Odometer data structure
 */
export interface OdometerData {
  reading: number
  unit: 'miles' | 'kilometers'
  location: string
  digitCount?: number
  isDigital?: boolean
}

/**
 * Enriched odometer data with analysis
 */
export interface EnrichedOdometerData extends OdometerData {
  readingFormatted: string
  estimatedMiles?: number
  estimatedKilometers?: number
  isHighMileage?: boolean
  mileageCategory?: 'low' | 'medium' | 'high' | 'very-high'
}

/**
 * Convert kilometers to miles
 */
function kmToMiles(km: number): number {
  return Math.round(km * 0.621371)
}

/**
 * Convert miles to kilometers
 */
function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934)
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/**
 * Categorize mileage
 */
function categorizeMileage(miles: number): 'low' | 'medium' | 'high' | 'very-high' {
  if (miles < 30000) return 'low'
  if (miles < 75000) return 'medium'
  if (miles < 150000) return 'high'
  return 'very-high'
}

/**
 * Odometer Processor implementation
 */
export const odometerProcessor: DocumentProcessor<OdometerData, EnrichedOdometerData> = {
  type: 'odometer',
  name: 'Odometer Reader',
  description: 'Extracts mileage readings from vehicle odometers',
  
  config: {
    model: 'gpt-4o-mini',
    maxTokens: 300,
    temperature: 0.2
  },
  
  /**
   * Generate OCR prompt for odometer extraction
   */
  getPrompt: () => {
    return `Extract the odometer/mileage reading from this image.

INSTRUCTIONS:
1. Find the main odometer reading (usually largest numbers on dashboard)
2. Look for indicators: "ODO", "ODOMETER", "TOTAL", "MILEAGE"
3. Determine if reading is in MILES or KILOMETERS (look for "MPH/KM/H" or unit labels)
4. Return ONLY the numeric value and unit

Return format: "NUMBER UNIT" where:
- NUMBER is the odometer reading (digits only, no commas)
- UNIT is either "MILES" or "KILOMETERS"

Examples:
- "45678 MILES"
- "123456 KILOMETERS"
- "8432 MILES"

If no odometer is visible, return "NOT_FOUND"

IMPORTANT: Return only the reading and unit, nothing else.`
  },
  
  /**
   * Parse OCR text to extract odometer data
   */
  parse: (text: string): OdometerData => {
    if (text === 'NOT_FOUND' || !text.trim()) {
      throw new Error('No odometer reading found in image')
    }
    
    // Clean and normalize text
    const cleanText = text.trim().toUpperCase()
    
    // Try to extract number and unit
    const match = cleanText.match(/(\d[\d,]*)\s*(MILE|KM|KILOMETER|KILOMETRE)/i)
    
    if (match) {
      const reading = parseInt(match[1].replace(/,/g, ''))
      const unitText = match[2].toUpperCase()
      
      // Determine unit
      const unit = (unitText.includes('KM') || unitText.includes('KILO')) 
        ? 'kilometers' 
        : 'miles'
      
      console.log(`[Odometer Processor] Found: ${reading} ${unit}`)
      
      return {
        reading,
        unit,
        location: 'dashboard',
        digitCount: reading.toString().length,
        isDigital: true // Assume digital for now
      }
    }
    
    // Fallback: try to extract just a number
    const numberMatch = cleanText.match(/(\d[\d,]+)/)
    if (numberMatch) {
      const reading = parseInt(numberMatch[1].replace(/,/g, ''))
      
      console.warn(`[Odometer Processor] Found number without unit: ${reading}, assuming miles`)
      
      return {
        reading,
        unit: 'miles', // Default to miles
        location: 'dashboard',
        digitCount: reading.toString().length,
        isDigital: true
      }
    }
    
    console.error(`[Odometer Processor] No valid reading in text: "${text}"`)
    throw new Error('Could not extract odometer reading from image')
  },
  
  /**
   * Validate odometer data
   */
  validate: (data: OdometerData): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check reading exists
    if (!data.reading && data.reading !== 0) {
      errors.push('Odometer reading is required')
      return { valid: false, errors, warnings }
    }
    
    // Check reading is reasonable
    if (data.reading < 0) {
      errors.push('Odometer reading cannot be negative')
    }
    
    if (data.reading > 1000000) {
      warnings.push('Odometer reading is unusually high (over 1 million)')
    }
    
    // Check for rollover (6-digit display showing low number)
    if (data.digitCount && data.digitCount === 6 && data.reading < 10000) {
      warnings.push('Low reading on 6-digit odometer may indicate rollover')
    }
    
    // Reasonable mileage checks
    const miles = data.unit === 'miles' ? data.reading : kmToMiles(data.reading)
    
    if (miles > 500000) {
      warnings.push('Extremely high mileage - verify reading accuracy')
    }
    
    if (miles < 100) {
      warnings.push('Very low mileage - may be new vehicle or incorrect reading')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },
  
  /**
   * Enrich odometer data with conversions and analysis
   */
  enrich: async (data: OdometerData): Promise<EnrichedOdometerData> => {
    console.log(`[Odometer Processor] Enriching odometer data...`)
    
    // Calculate both units
    const estimatedMiles = data.unit === 'miles' 
      ? data.reading 
      : kmToMiles(data.reading)
      
    const estimatedKilometers = data.unit === 'kilometers'
      ? data.reading
      : milesToKm(data.reading)
    
    // Format reading
    const readingFormatted = `${formatNumber(data.reading)} ${data.unit}`
    
    // Categorize mileage
    const mileageCategory = categorizeMileage(estimatedMiles)
    const isHighMileage = estimatedMiles > 100000
    
    const enriched: EnrichedOdometerData = {
      ...data,
      readingFormatted,
      estimatedMiles,
      estimatedKilometers,
      isHighMileage,
      mileageCategory
    }
    
    console.log(`[Odometer Processor] ${readingFormatted} (${mileageCategory} mileage)`)
    
    return enriched
  },
  
  /**
   * Format odometer data for display
   */
  format: (data: EnrichedOdometerData): string => {
    return data.readingFormatted
  }
}
