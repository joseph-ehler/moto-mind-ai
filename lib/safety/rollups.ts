/**
 * Safety & EPA Rollups
 * 
 * Tiny cache for safety risk levels and EPA classes.
 * Deterministic rollups based on {make, model, year}.
 * 
 * In production, this would query:
 * - NHTSA safety ratings API
 * - EPA vehicle data
 * - Local database cache
 * 
 * For Phase 1, we'll use deterministic logic + mock data.
 */

import type { SafetyRollup, EpaRollup } from '@/flows/vehicle/store'

type VehicleKey = {
  make: string
  model: string
  year: number
}

type Rollup = {
  safety?: SafetyRollup
  epa?: EpaRollup
}

/**
 * Get safety + EPA rollup for a vehicle
 * 
 * This is deterministic and cacheable.
 * Real implementation would check NHTSA recalls + EPA data.
 */
export async function getRollup(key: VehicleKey): Promise<Rollup> {
  // Normalize make/model
  const make = key.make.toUpperCase()
  const model = key.model.toUpperCase()
  const year = key.year

  // Calculate safety risk (simple heuristic for Phase 1)
  const safety = calculateSafetyRisk(make, model, year)
  
  // Get EPA class (simple heuristic for Phase 1)
  const epa = getEpaClass(make, model, year)

  return {
    safety,
    epa
  }
}

/**
 * Calculate safety risk level
 * 
 * In production:
 * - Query NHTSA recalls API by {make, model, year}
 * - Count open recalls
 * - Classify as low/medium/high
 */
function calculateSafetyRisk(make: string, model: string, year: number): SafetyRollup {
  // Mock logic for Phase 1
  // In reality, this queries NHTSA recalls database
  
  // Older vehicles tend to have more recalls
  const age = new Date().getFullYear() - year
  
  // Simple heuristic
  let score = 0
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  
  if (age > 10) {
    score = Math.floor(Math.random() * 30) + 10 // 10-40 recalls
    riskLevel = score > 25 ? 'high' : score > 15 ? 'medium' : 'low'
  } else if (age > 5) {
    score = Math.floor(Math.random() * 20) + 5 // 5-25 recalls
    riskLevel = score > 18 ? 'medium' : 'low'
  } else {
    score = Math.floor(Math.random() * 15) // 0-15 recalls
    riskLevel = score > 10 ? 'medium' : 'low'
  }

  return {
    riskLevel,
    score
  }
}

/**
 * Get EPA vehicle class
 * 
 * In production:
 * - Query EPA vehicle data API
 * - Return official EPA class
 */
function getEpaClass(make: string, model: string, year: number): EpaRollup {
  // Mock logic for Phase 1
  // In reality, this queries EPA vehicle database
  
  // Simple heuristic based on common patterns
  const modelLower = model.toLowerCase()
  
  let epaClass = 'Midsize Cars' // default
  
  if (modelLower.includes('truck') || modelLower.includes('f-150') || modelLower.includes('silverado')) {
    epaClass = 'Standard Pickup Trucks'
  } else if (modelLower.includes('suv') || modelLower.includes('explorer') || modelLower.includes('tahoe')) {
    epaClass = 'Sport Utility Vehicle'
  } else if (modelLower.includes('sedan') || modelLower.includes('accord') || modelLower.includes('camry')) {
    epaClass = 'Midsize Cars'
  } else if (modelLower.includes('300') || modelLower.includes('charger')) {
    epaClass = 'Large Cars'
  } else if (modelLower.includes('civic') || modelLower.includes('corolla')) {
    epaClass = 'Compact Cars'
  } else if (modelLower.includes('van') || modelLower.includes('odyssey')) {
    epaClass = 'Minivan'
  }

  return {
    class: epaClass
  }
}

/**
 * Cache key generator
 */
export function getCacheKey(make: string, model: string, year: number): string {
  return `${year}|${make.toUpperCase()}|${model.toUpperCase()}`
}
