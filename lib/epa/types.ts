/**
 * EPA Fuel Economy Types - GOD TIER Edition
 * Complete type definitions for enhanced EPA integration
 */

/**
 * Complete EPA Fuel Economy Data
 * Includes ALL available EPA fields
 */
export interface CompleteEPAFuelEconomy {
  // Basic MPG (what we already have)
  cityMPG: number
  highwayMPG: number
  combinedMPG: number
  
  // Precision (unrounded values)
  unrounded: {
    city: number
    highway: number
    combined: number
  }
  
  // Fuel details
  fuelType: string           // Primary: Regular, Premium, Diesel
  fuelType2?: string         // Secondary: E85, Electricity, etc.
  
  // Costs
  annualFuelCost: number
  youSaveSpend: number       // vs average vehicle
  
  // Cost projections
  costProjections: {
    annual: number
    threeYear: number
    fiveYear: number
    tenYear: number
    scenarios: CostScenario[]
  }
  
  // Environmental
  co2Emissions: number       // grams per mile
  ghgScore: number           // 1-10 scale (10 = best)
  ghgScoreA?: number         // Alternative fuel GHG score
  barrels: number            // barrels per year
  
  // Electric/PHEV specific
  electric?: {
    range: number            // miles on electricity
    rangeCity?: number       // city range
    rangeHighway?: number    // highway range
    charge240?: number       // Level 2 charge time (hours)
    phevBlended?: boolean    // PHEV blended mode
    mpge?: number            // MPGe combined
    kwhPer100Miles?: number  // kWh/100mi
  }
  
  // Classification
  vehicleClass: string       // Pickup, SUV, Sedan, etc.
  
  // Raw vehicle ID
  vehicleId: string
}

/**
 * Cost Scenario (what-if analysis)
 */
export interface CostScenario {
  milesPerYear: number
  gasPrice: number
  annual: number
  description: string
}

/**
 * Match Confidence - Shows how confident we are in the match
 */
export interface MatchConfidence {
  overall: number            // 0-1 (e.g., 0.95 = 95% confident)
  factors: MatchFactor[]     // What we matched on
  reasons: string[]          // Why we're confident
  warnings: string[]         // What might be different
}

/**
 * Individual match factor
 */
export interface MatchFactor {
  factor: 'model' | 'driveType' | 'cylinders' | 'displacement' | 'trim' | 'transmission'
  weight: number             // How important (1-10)
  matched: boolean           // Did it match?
  value?: string            // What was matched
}

/**
 * Alternative Match - Other possible matches
 */
export interface AlternativeMatch {
  vehicleId: string
  fuelEconomy: CompleteEPAFuelEconomy
  confidence: MatchConfidence
  differentiator: string     // What makes this different
  description: string        // Human-readable description
}

/**
 * Enhanced Match Result
 */
export interface EnhancedMatchResult {
  // Primary match
  primary: {
    vehicleId: string
    fuelEconomy: CompleteEPAFuelEconomy
    confidence: MatchConfidence
  }
  
  // Alternative matches (if any)
  alternatives: AlternativeMatch[]
  
  // Range estimate (if multiple variants exist)
  rangeEstimate?: {
    cityMin: number
    cityMax: number
    highwayMin: number
    highwayMax: number
    combinedMin: number
    combinedMax: number
  }
  
  // Metadata
  totalOptionsConsidered: number
  matchedAt: Date
}

/**
 * Enhanced Fuel Economy Result
 */
export interface EnhancedFuelEconomyResult {
  success: boolean
  match?: EnhancedMatchResult
  error?: string
  lastChecked: Date
  
  // Performance metrics
  performance?: {
    totalTime: number        // ms
    apiCalls: number
    cacheHits: number
  }
}

/**
 * EPA Vehicle Option (from API)
 */
export interface EPAVehicleOption {
  text: string               // "Auto (S6), 6 cyl, 3.0 L"
  value: string             // Vehicle ID: "33658"
}

/**
 * EPA Match Criteria
 */
export interface EPAMatchCriteria {
  trim?: string | null
  cylinders?: number | null
  displacement?: number | null
  driveType?: string | null
  transmission?: string | null
  fuelType?: string | null
}

/**
 * Cache Strategy Configuration
 */
export interface CacheStrategy {
  ttl: number               // milliseconds
  reason: string            // Why this TTL
  version?: string          // Cache version for invalidation
}
