/**
 * VIN Error Recovery
 * Graceful fallback strategies when NHTSA API fails
 */

import type { VINDecodeResult } from './types'
import { validateVIN } from './validator'

/**
 * Data quality indicator
 */
export type DataQuality = 'full' | 'partial' | 'minimal'

/**
 * Partial decode from VIN structure alone (no API)
 */
export async function partialDecodeFromVIN(vin: string): Promise<Partial<VINDecodeResult>> {
  // Validate and extract what we can
  const validation = validateVIN(vin)
  
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid VIN')
  }
  
  const { year, region, wmi } = validation.metadata || {}
  const manufacturer = guessManufacturerFromWMI(wmi || '')
  
  // Build minimal result with what we know
  return {
    vin,
    vehicle: {
      year: year || new Date().getFullYear(),
      make: manufacturer,
      model: 'Unknown',
      displayName: `${year} ${manufacturer} (Limited Data)`
    },
    specs: {
      // Can't decode without NHTSA
      bodyType: undefined,
      engine: undefined,
      transmission: undefined,
      driveType: undefined,
      fuelType: undefined
    },
    extendedSpecs: {
      // Add region info from WMI
      manufacturer,
      plantCountry: region
    },
    mockData: generateFallbackMockData(year || new Date().getFullYear(), manufacturer),
    aiInsights: {
      summary: `Limited data available for this ${year} ${manufacturer}. We extracted what we could from the VIN structure. Consider entering vehicle details manually for better insights.`,
      reliabilityScore: 0.5, // Neutral
      maintenanceTip: 'Unable to provide specific maintenance tips without complete vehicle data. Follow your owner\'s manual recommendations.',
      costTip: 'Cost estimates unavailable - full vehicle data required for accurate calculations.'
    }
  }
}

/**
 * Guess manufacturer from WMI (World Manufacturer Identifier)
 */
function guessManufacturerFromWMI(wmi: string): string {
  if (!wmi || wmi.length < 3) return 'Unknown'
  
  // Common WMI prefixes to manufacturer mapping
  const wmiMap: Record<string, string> = {
    // US Manufacturers
    '1FA': 'Ford',
    '1FB': 'Ford',
    '1FC': 'Ford',
    '1FD': 'Ford',
    '1FM': 'Ford',
    '1FT': 'Ford',
    '1G': 'General Motors',
    '1GC': 'Chevrolet',
    '1GM': 'Pontiac',
    '1GN': 'Chevrolet',
    '1GT': 'GMC',
    '1GY': 'Cadillac',
    '1HG': 'Honda',
    '1J4': 'Jeep',
    '1J8': 'Jeep',
    '1L': 'Lincoln',
    '1ME': 'Mercury',
    '1N': 'Nissan',
    '1VW': 'Volkswagen',
    '1YV': 'Mazda',
    '1ZV': 'Ford',
    
    // Chrysler/Dodge/Ram
    '1C3': 'Chrysler',
    '1C4': 'Chrysler',
    '1C6': 'Chrysler',
    '1D3': 'Dodge',
    '1D4': 'Dodge',
    '1D7': 'Dodge',
    '1D8': 'Dodge',
    
    // Canadian
    '2FA': 'Ford',
    '2FM': 'Ford',
    '2FT': 'Ford',
    '2G': 'General Motors',
    '2GC': 'Chevrolet',
    '2GT': 'GMC',
    '2HG': 'Honda',
    '2HM': 'Hyundai',
    '2C3': 'Chrysler',
    '2C4': 'Chrysler',
    '2D3': 'Dodge',
    '2D4': 'Dodge',
    
    // Mexican
    '3FA': 'Ford',
    '3FM': 'Ford',
    '3FT': 'Ford',
    '3G': 'General Motors',
    '3GC': 'Chevrolet',
    '3N': 'Nissan',
    '3VW': 'Volkswagen',
    
    // Japanese
    'JHM': 'Honda',
    'JM': 'Mazda',
    'JN': 'Nissan',
    'JT': 'Toyota',
    'JF': 'Subaru',
    
    // Korean
    'KM': 'Hyundai',
    'KN': 'Kia',
    'KL': 'Daewoo',
    
    // European
    'SAJ': 'Jaguar',
    'SAL': 'Land Rover',
    'SAR': 'Rover',
    'SCC': 'Lotus',
    'SCE': 'DeLorean',
    'SDB': 'Peugeot',
    'TRU': 'Audi',
    'TSM': 'Suzuki',
    'VF': 'Peugeot',
    'VF1': 'Renault',
    'VF3': 'Peugeot',
    'VF7': 'Citroen',
    'VSS': 'SEAT',
    'VWV': 'Volkswagen',
    'WAU': 'Audi',
    'WBA': 'BMW',
    'WBS': 'BMW',
    'WDB': 'Mercedes-Benz',
    'WDD': 'Mercedes-Benz',
    'WDC': 'DaimlerChrysler',
    'WEB': 'Evobus',
    'WF0': 'Ford',
    'WJM': 'Iveco',
    'WMA': 'MAN',
    'WME': 'Smart',
    'WMW': 'Mini',
    'WP0': 'Porsche',
    'WUA': 'Quattro',
    'WVG': 'Volkswagen',
    'WVW': 'Volkswagen',
    'WV1': 'Volkswagen',
    'WV2': 'Volkswagen',
    'W0L': 'Opel',
    'XTA': 'Lada',
    'YK1': 'Saab',
    'YS': 'Saab',
    'YV': 'Volvo',
    'ZAM': 'Maserati',
    'ZAR': 'Alfa Romeo',
    'ZCF': 'Ferrari',
    'ZDF': 'Ferrari',
    'ZFA': 'Fiat',
    'ZFF': 'Ferrari',
    'ZHW': 'Lamborghini',
    'ZLA': 'Lancia',
    
    // Chinese
    'LFV': 'FAW',
    'LGB': 'Dong Feng',
    'LGX': 'BYD',
    'LHG': 'Honda',
    'LJ1': 'JAC',
    'LSV': 'SAIC',
    'LVS': 'Ford',
    'LZW': 'MG'
  }
  
  // Try exact 3-char match first
  if (wmiMap[wmi]) {
    return wmiMap[wmi]
  }
  
  // Try 2-char prefix
  const prefix2 = wmi.substring(0, 2)
  if (wmiMap[prefix2]) {
    return wmiMap[prefix2]
  }
  
  // Try 1-char prefix for GM brands
  const prefix1 = wmi.substring(0, 1)
  if (prefix1 === '1' || prefix1 === '2' || prefix1 === '3') {
    return 'Unknown US/North America Manufacturer'
  }
  if (prefix1 === 'J') {
    return 'Unknown Japanese Manufacturer'
  }
  if (prefix1 === 'K') {
    return 'Unknown Korean Manufacturer'
  }
  if (prefix1 === 'W') {
    return 'Unknown German Manufacturer'
  }
  if (prefix1 === 'V') {
    return 'Unknown French Manufacturer'
  }
  if (prefix1 === 'Z') {
    return 'Unknown Italian Manufacturer'
  }
  if (prefix1 === 'L') {
    return 'Unknown Chinese Manufacturer'
  }
  
  return 'Unknown Manufacturer'
}

/**
 * Generate fallback mock data (conservative estimates)
 */
function generateFallbackMockData(year: number, make: string): {
  mpgCity: number
  mpgHighway: number
  maintenanceInterval: number
  annualCost: number
} {
  // Conservative averages by manufacturer type
  const isLuxury = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Cadillac', 'Lincoln'].includes(make)
  const isTruck = ['Ford', 'Chevrolet', 'GMC', 'Ram', 'Dodge'].includes(make)
  const isEconomy = ['Honda', 'Toyota', 'Mazda', 'Hyundai', 'Kia'].includes(make)
  
  let mpgCity = 20
  let mpgHighway = 28
  let annualCost = 1500
  
  if (isLuxury) {
    mpgCity = 18
    mpgHighway = 26
    annualCost = 2500
  } else if (isTruck) {
    mpgCity = 16
    mpgHighway = 22
    annualCost = 1800
  } else if (isEconomy) {
    mpgCity = 28
    mpgHighway = 36
    annualCost = 1200
  }
  
  // Adjust for age (older = worse MPG, higher costs)
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  
  if (age > 15) {
    mpgCity -= 3
    mpgHighway -= 4
    annualCost += 800
  } else if (age > 10) {
    mpgCity -= 2
    mpgHighway -= 3
    annualCost += 500
  } else if (age > 5) {
    mpgCity -= 1
    mpgHighway -= 1
    annualCost += 200
  }
  
  return {
    mpgCity: Math.max(mpgCity, 10),
    mpgHighway: Math.max(mpgHighway, 15),
    maintenanceInterval: 5000, // Conservative
    annualCost: Math.max(annualCost, 800)
  }
}

/**
 * Error recovery wrapper - tries multiple strategies
 */
export interface DecodeStrategy {
  name: string
  attempt: () => Promise<VINDecodeResult>
  quality: DataQuality
}

export async function decodeWithFallbacks(
  vin: string,
  strategies: DecodeStrategy[]
): Promise<{ result: VINDecodeResult; strategy: string; quality: DataQuality }> {
  const errors: Array<{ strategy: string; error: Error }> = []
  
  for (const strategy of strategies) {
    try {
      console.log(`[VIN/Recovery] Trying strategy: ${strategy.name}`)
      const result = await strategy.attempt()
      
      console.log(`[VIN/Recovery] ✅ Success with ${strategy.name}`)
      return {
        result: result as VINDecodeResult,
        strategy: strategy.name,
        quality: strategy.quality
      }
    } catch (error) {
      console.warn(`[VIN/Recovery] ❌ ${strategy.name} failed:`, error)
      errors.push({
        strategy: strategy.name,
        error: error as Error
      })
    }
  }
  
  // All strategies failed
  const errorSummary = errors.map(e => `${e.strategy}: ${e.error.message}`).join('; ')
  throw new Error(`All decode strategies failed: ${errorSummary}`)
}
