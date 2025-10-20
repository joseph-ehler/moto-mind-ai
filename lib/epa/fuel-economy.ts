/**
 * EPA Fuel Economy Integration
 * 
 * Sequential menu navigation approach (Year → Make → Model → Options)
 * https://www.fueleconomy.gov/ws/rest/
 * 
 * Note: EPA API does NOT accept VIN directly!
 * Must use Year + Make + Model to get options, then match best option
 * 
 * LEGACY VERSION - Use enhanced-service.ts for GOD TIER features:
 * - Multi-factor confidence scoring
 * - Complete EPA data extraction
 * - Alternative match suggestions
 * - Cost projections (3yr, 5yr, 10yr)
 */

export interface EPAFuelEconomy {
  cityMPG: number
  highwayMPG: number
  combinedMPG: number
  fuelType: string
  annualFuelCost: number
  co2Emissions: number // grams per mile
  youSaveSpend: number // save/spend vs average
  barrels: number // barrels per year
  evRange?: number // miles (for EVs/PHEVs)
}

export interface FuelEconomyResult {
  success: boolean
  fuelEconomy?: EPAFuelEconomy
  matchQuality?: 'exact' | 'partial' | 'fallback'
  error?: string
  lastChecked: Date
}

interface EPAVehicleOption {
  text: string  // "Auto (S6), 6 cyl, 3.0 L"
  value: string // Vehicle ID: "33658"
}

interface EPAMatchCriteria {
  trim?: string | null
  cylinders?: number | null
  displacement?: number | null
  driveType?: string | null
}

/**
 * EPA Fuel Economy Service
 * Uses sequential menu navigation to find vehicle data
 */
export class EPAFuelEconomyService {
  private baseUrl = 'https://www.fueleconomy.gov/ws/rest'
  
  /**
   * Get fuel economy data using Year + Make + Model + matching
   */
  async getFuelEconomy(params: {
    year: number
    make: string
    model: string
    trim?: string | null
    cylinders?: number | null
    displacement?: number | null
    driveType?: string | null
  }): Promise<FuelEconomyResult> {
    try {
      // Import model matcher
      const { EPAModelMatcher } = await import('./model-matcher')
      
      // Step 1: Find best matching EPA model name
      const epaModelName = await EPAModelMatcher.findBestMatch({
        year: params.year,
        make: params.make,
        model: params.model,
        driveType: params.driveType,
        cylinders: params.cylinders,
        displacement: params.displacement
      })
      
      if (!epaModelName) {
        return {
          success: false,
          error: 'No EPA model match found',
          lastChecked: new Date()
        }
      }
      
      // Step 2: Get vehicle options for matched model
      const options = await this.getVehicleOptions(
        params.year,
        params.make,
        epaModelName
      )
      
      if (!options || options.length === 0) {
        return {
          success: false,
          error: 'No EPA options found for matched model',
          lastChecked: new Date()
        }
      }
      
      // Step 3: Find best matching option
      const matchResult = this.findBestMatch(options, {
        trim: params.trim,
        cylinders: params.cylinders,
        displacement: params.displacement,
        driveType: params.driveType
      })
      
      // Step 4: Get fuel economy data
      const fuelEconomy = await this.getVehicleData(matchResult.option.value)
      
      return {
        success: true,
        fuelEconomy,
        matchQuality: matchResult.quality,
        lastChecked: new Date()
      }
      
    } catch (error) {
      console.error('[EPA/FuelEconomy] Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      }
    }
  }
  
  /**
   * Step 1: Get vehicle options for year/make/model
   */
  private async getVehicleOptions(
    year: number,
    make: string,
    model: string
  ): Promise<EPAVehicleOption[]> {
    const { ResilientFetch } = await import('../utils/resilient-fetch')
    
    const url = `${this.baseUrl}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    
    try {
      const data = await ResilientFetch.fetchJSON(url)
      
      // Handle different response formats
      if (!data) {
        console.warn('[EPA] No data returned from options endpoint')
        return []
      }
      
      // EPA can return data.menuItem or just an array
      if (Array.isArray(data)) {
        return data
      }
      
      // Handle menuItem as array
      if (data.menuItem && Array.isArray(data.menuItem)) {
        return data.menuItem
      }
      
      // Handle menuItem as single object (Tesla case!)
      if (data.menuItem && typeof data.menuItem === 'object' && data.menuItem.text && data.menuItem.value) {
        console.log('[EPA] Single menuItem object, converting to array')
        return [data.menuItem]
      }
      
      // Single object response at top level (convert to array)
      if (typeof data === 'object' && data.text && data.value) {
        console.log('[EPA] Single option response, converting to array')
        return [data]
      }
      
      console.warn('[EPA] Unexpected response format:', typeof data, data)
      return []
    } catch (error) {
      console.error('[EPA] Failed to get vehicle options:', error)
      return []
    }
  }
  
  /**
   * Step 2: Find best matching option based on vehicle specs
   */
  private findBestMatch(
    options: EPAVehicleOption[],
    criteria: EPAMatchCriteria
  ): { option: EPAVehicleOption; quality: 'exact' | 'partial' | 'fallback' } {
    // Ensure options is an array
    if (!Array.isArray(options)) {
      console.warn('[EPA] Options is not an array:', options)
      return { 
        option: { text: 'Unknown', value: '0' }, 
        quality: 'fallback' 
      }
    }
    
    if (options.length === 0) {
      throw new Error('No options available')
    }
    
    if (options.length === 1) {
      return { option: options[0], quality: 'fallback' }
    }
    
    // Score each option
    const scored = options.map(option => {
      let score = 0
      const text = option.text.toLowerCase()
      
      // Match cylinders (e.g., "6 cyl")
      if (criteria.cylinders) {
        if (text.includes(`${criteria.cylinders} cyl`)) {
          score += 10
        }
      }
      
      // Match displacement (e.g., "3.0 L" or "3.0L")
      if (criteria.displacement) {
        const dispStr = criteria.displacement.toFixed(1)
        if (text.includes(`${dispStr} l`) || text.includes(`${dispStr}l`)) {
          score += 10
        }
      }
      
      // Match drive type (e.g., "4WD", "AWD", "2WD")
      if (criteria.driveType) {
        const drive = criteria.driveType.toLowerCase()
        if (drive === '4wd' && (text.includes('4wd') || text.includes('4x4'))) {
          score += 5
        } else if (drive === 'awd' && text.includes('awd')) {
          score += 5
        } else if (drive === 'fwd' && (text.includes('fwd') || text.includes('front'))) {
          score += 5
        } else if (drive === 'rwd' && (text.includes('rwd') || text.includes('rear'))) {
          score += 5
        }
      }
      
      // Match trim (partial match)
      if (criteria.trim) {
        const trim = criteria.trim.toLowerCase()
        if (text.includes(trim)) {
          score += 3
        }
      }
      
      return { option, score }
    })
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score)
    
    // Determine match quality
    const bestScore = scored[0].score
    const quality: 'exact' | 'partial' | 'fallback' = 
      bestScore >= 15 ? 'exact' :
      bestScore >= 5 ? 'partial' :
      'fallback'
    
    return { option: scored[0].option, quality }
  }
  
  /**
   * Step 3: Get vehicle data by ID
   */
  private async getVehicleData(vehicleId: string): Promise<EPAFuelEconomy> {
    const url = `${this.baseUrl}/vehicle/${vehicleId}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`EPA API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      cityMPG: data.city08 || 0,
      highwayMPG: data.highway08 || 0,
      combinedMPG: data.comb08 || 0,
      fuelType: data.fuelType1 || 'Unknown',
      annualFuelCost: data.fuelCost08 || 0,
      co2Emissions: data.co2TailpipeGpm || 0,
      youSaveSpend: data.youSaveSpend || 0,
      barrels: data.barrels08 || 0,
      evRange: data.rangeA ? parseFloat(data.rangeA) : undefined
    }
  }
}

/**
 * Convenience function for backward compatibility
 */
export async function getFuelEconomy(params: {
  year: number
  make: string
  model: string
  trim?: string | null
  cylinders?: number | null
  displacement?: number | null
  driveType?: string | null
}): Promise<FuelEconomyResult> {
  const service = new EPAFuelEconomyService()
  return service.getFuelEconomy(params)
}

/**
 * Calculate trip fuel cost
 */
export function calculateTripCost(
  miles: number,
  combinedMPG: number,
  fuelPricePerGallon: number = 3.50 // default US average
): number {
  if (combinedMPG === 0) return 0
  const gallons = miles / combinedMPG
  return gallons * fuelPricePerGallon
}

/**
 * Calculate annual fuel cost
 */
export function calculateAnnualCost(
  milesPerYear: number,
  combinedMPG: number,
  fuelPricePerGallon: number = 3.50
): number {
  return calculateTripCost(milesPerYear, combinedMPG, fuelPricePerGallon)
}

/**
 * Compare MPG to EPA estimate
 */
export function compareToEPA(
  actualMPG: number,
  epaMPG: number
): {
  difference: number
  percentage: number
  status: 'above' | 'at' | 'below'
} {
  const difference = actualMPG - epaMPG
  const percentage = ((actualMPG - epaMPG) / epaMPG) * 100

  return {
    difference,
    percentage,
    status: difference > 0 ? 'above' : difference < 0 ? 'below' : 'at',
  }
}

/**
 * Format fuel economy for display
 */
export function formatFuelEconomy(fuelEconomy: EPAFuelEconomy): string {
  const { cityMPG, highwayMPG, combinedMPG, fuelType } = fuelEconomy

  if (fuelType.toLowerCase().includes('electric')) {
    return fuelEconomy.evRange
      ? `${fuelEconomy.evRange} mi range`
      : 'Electric'
  }

  return `${combinedMPG} MPG combined (${cityMPG} city / ${highwayMPG} hwy)`
}
