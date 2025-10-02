/**
 * Specification Quality Assessment
 * Calculates and communicates data completeness to users
 */

export type SpecQuality = 'comprehensive' | 'partial' | 'generic'

export interface SpecCategory {
  category: string
  data: Record<string, any>
  sources?: string[]
}

export interface QualityAssessment {
  overall: SpecQuality
  completeness: number
  foundFields: number
  totalFields: number
  missingCritical: string[]
  message: string
  recommendation: string
}

// Critical fields that define quality thresholds
const CRITICAL_FIELDS = {
  engine: ['horsepower', 'displacement', 'cylinders', 'fuel_type'],
  drivetrain: ['drive_type', 'transmission_type'],
  maintenance_intervals: ['oil_change_normal', 'tire_rotation', 'brake_fluid_flush'],
  fluids_capacities: ['engine_oil_grade', 'engine_oil_capacity', 'fuel_tank_capacity']
}

/**
 * Calculate specification quality based on critical field availability
 */
export function calculateSpecsQuality(categories: SpecCategory[]): QualityAssessment {
  const categoryMap = new Map(categories.map(c => [c.category, c]))
  
  let foundFields = 0
  let totalFields = 0
  const missingCritical: string[] = []
  
  // Check each critical field
  for (const [category, fields] of Object.entries(CRITICAL_FIELDS)) {
    const categoryData = categoryMap.get(category)?.data || {}
    
    for (const field of fields) {
      totalFields++
      const value = categoryData[field]
      
      if (value !== null && value !== undefined && value !== '') {
        foundFields++
      } else {
        missingCritical.push(`${category}.${field}`)
      }
    }
  }
  
  const completeness = totalFields > 0 ? foundFields / totalFields : 0
  
  // Determine quality level
  let overall: SpecQuality
  let message: string
  let recommendation: string
  
  if (completeness >= 0.8) {
    overall = 'comprehensive'
    message = 'Complete specifications available'
    recommendation = 'All critical data found. System can provide accurate maintenance guidance.'
  } else if (completeness >= 0.4) {
    overall = 'partial'
    message = 'Partial specifications'
    recommendation = 'Some manufacturer data unavailable. Using industry standards where needed.'
  } else {
    overall = 'generic'
    message = 'Using recommended intervals'
    recommendation = 'Limited manufacturer data. Showing mechanic-recommended intervals for all vehicles.'
  }
  
  return {
    overall,
    completeness,
    foundFields,
    totalFields,
    missingCritical,
    message,
    recommendation
  }
}

/**
 * Get user-friendly explanation for quality level
 */
export function getQualityExplanation(quality: SpecQuality, year: number): string {
  const age = new Date().getFullYear() - year
  
  if (quality === 'comprehensive') {
    return `We found comprehensive manufacturer data for your ${year} vehicle. All maintenance recommendations are vehicle-specific.`
  }
  
  if (quality === 'partial') {
    if (age <= 5) {
      return `Some manufacturer data is unavailable, which is uncommon for newer vehicles. We're showing industry-standard recommendations where specific data is missing.`
    } else if (age <= 10) {
      return `Some manufacturer data isn't publicly available for ${year} vehicles. We're using mechanic-recommended intervals where manufacturer specifics are missing.`
    } else {
      return `Older vehicles often have limited online documentation. We're showing industry-standard intervals that work for most ${year} vehicles.`
    }
  }
  
  // generic
  if (age <= 5) {
    return `Manufacturer-specific data is unexpectedly unavailable for this vehicle. This may improve as we enhance our data sources. Using industry-standard recommendations.`
  } else {
    return `Limited manufacturer data is available for ${year} vehicles. We're showing mechanic-recommended intervals used by most service centers. Consult your owner's manual for manufacturer specifics.`
  }
}

/**
 * Get expected quality range by vehicle age
 */
export function getExpectedQuality(year: number): string {
  const age = new Date().getFullYear() - year
  
  if (age <= 3) {
    return '80-95% complete data expected'
  } else if (age <= 10) {
    return '60-80% complete data typical'
  } else {
    return '40-60% complete data common'
  }
}

/**
 * Determine source badge for a specific field value
 */
export function getFieldSource(value: any, sources?: string[]): {
  type: 'manufacturer' | 'nhtsa' | 'ai_search' | 'unavailable'
  label: string
  confidence: 'high' | 'medium' | 'low'
} {
  if (value === null || value === undefined || value === '') {
    return { type: 'unavailable', label: 'Not available', confidence: 'low' }
  }
  
  if (!sources || sources.length === 0) {
    return { type: 'ai_search', label: 'AI Enhanced', confidence: 'medium' }
  }
  
  if (sources.includes('nhtsa')) {
    return { type: 'nhtsa', label: 'NHTSA Verified', confidence: 'high' }
  }
  
  if (sources.includes('openai_web_search')) {
    return { type: 'ai_search', label: 'Web Research', confidence: 'medium' }
  }
  
  return { type: 'manufacturer', label: 'Manufacturer', confidence: 'high' }
}
