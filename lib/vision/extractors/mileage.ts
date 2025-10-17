// Mileage Extraction with Multiple Patterns
// Pure functions for extracting odometer readings from various text formats

import { MileageExtractionResult } from '../types'

/**
 * Extracts mileage using multiple pattern recognition strategies
 */
export function extractMileageWithPatterns(text: string): MileageExtractionResult[] {
  const results: MileageExtractionResult[] = []
  
  // Pattern 1: Explicit odometer/mileage labels
  const explicitPatterns = [
    /(?:odometer|mileage|miles?)[:=\s]+(\d{1,3}(?:,\d{3})*|\d+)/gi,
    /(?:current\s+)?(?:vehicle\s+)?(?:odometer|mileage)[:=\s]*(\d{1,3}(?:,\d{3})*|\d+)/gi,
    /(?:at|@)\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:miles?|mi)\b/gi
  ]
  
  for (const pattern of explicitPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const value = parseInt(match[1].replace(/,/g, ''), 10)
      if (!isNaN(value) && isReasonableMileage(value)) {
        results.push({
          data: value,
          confidence: 0.95,
          source: 'explicit_label',
          method: 'pattern_extraction',
          pattern: pattern.source,
          rawValue: match[1]
        })
      }
    }
  }
  
  // Pattern 2: Miles suffix patterns
  const milesPatterns = [
    /(\d{1,3}(?:,\d{3})*|\d+)\s*(?:miles?|mi)\b/gi,
    /(\d{1,3}(?:,\d{3})*|\d+)\s*(?:mile|mil)\b/gi
  ]
  
  for (const pattern of milesPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const value = parseInt(match[1].replace(/,/g, ''), 10)
      if (!isNaN(value) && isReasonableMileage(value)) {
        // Check if not already captured by explicit patterns
        const alreadyCaptured = results.some(r => 
          Math.abs(r.data - value) < 10 && 
          Math.abs(getMatchPosition(text, match) - getResultPosition(text, r)) < 50
        )
        
        if (!alreadyCaptured) {
          results.push({
            data: value,
            confidence: 0.85,
            source: 'miles_suffix',
            method: 'pattern_extraction',
            pattern: pattern.source,
            rawValue: match[1]
          })
        }
      }
    }
  }
  
  // Pattern 3: Standalone numbers in reasonable mileage range
  const standalonePattern = /\b(\d{4,6})\b/g
  let match
  while ((match = standalonePattern.exec(text)) !== null) {
    const value = parseInt(match[1], 10)
    if (!isNaN(value) && isReasonableMileage(value)) {
      // Check context to see if it's likely mileage
      const context = getContext(text, match.index, 50)
      const contextScore = scoreMileageContext(context)
      
      if (contextScore > 0.3) {
        // Check if not already captured
        const alreadyCaptured = results.some(r => 
          Math.abs(r.data - value) < 10 &&
          Math.abs(getMatchPosition(text, match) - getResultPosition(text, r)) < 30
        )
        
        if (!alreadyCaptured) {
          results.push({
            data: value,
            confidence: 0.6 * contextScore,
            source: 'standalone_number',
            method: 'context_analysis',
            pattern: 'standalone',
            rawValue: match[1]
          })
        }
      }
    }
  }
  
  // Pattern 4: Dashboard/gauge readings
  const dashboardPatterns = [
    /(?:dashboard|gauge|display).*?(\d{1,3}(?:,\d{3})*|\d{4,6})/gi,
    /(?:shows?|reads?|displays?).*?(\d{1,3}(?:,\d{3})*|\d{4,6})/gi
  ]
  
  for (const pattern of dashboardPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const value = parseInt(match[1].replace(/,/g, ''), 10)
      if (!isNaN(value) && isReasonableMileage(value)) {
        results.push({
          data: value,
          confidence: 0.8,
          source: 'dashboard_reading',
          method: 'pattern_extraction',
          pattern: pattern.source,
          rawValue: match[1]
        })
      }
    }
  }
  
  // Sort by confidence and remove duplicates
  return deduplicateResults(results)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5) // Return top 5 candidates
}

/**
 * Checks if a number is in reasonable mileage range
 */
function isReasonableMileage(value: number): boolean {
  return value >= 1 && value <= 999999
}

/**
 * Scores context around a number for mileage likelihood
 */
function scoreMileageContext(context: string): number {
  let score = 0.3 // Base score for any number
  
  const mileageKeywords = [
    'odometer', 'mileage', 'miles', 'mile', 'mi',
    'reading', 'shows', 'display', 'current',
    'vehicle', 'car', 'auto', 'dashboard'
  ]
  
  const serviceKeywords = [
    'service', 'maintenance', 'repair', 'oil',
    'change', 'inspection', 'work', 'performed'
  ]
  
  const contextLower = context.toLowerCase()
  
  // Boost for mileage-related keywords
  for (const keyword of mileageKeywords) {
    if (contextLower.includes(keyword)) {
      score += 0.2
    }
  }
  
  // Boost for service-related context
  for (const keyword of serviceKeywords) {
    if (contextLower.includes(keyword)) {
      score += 0.1
    }
  }
  
  // Penalty for non-mileage contexts
  const nonMileageKeywords = [
    'phone', 'zip', 'code', 'address', 'date',
    'time', 'year', 'model', 'price', 'cost',
    'total', 'amount', 'tax', 'fee'
  ]
  
  for (const keyword of nonMileageKeywords) {
    if (contextLower.includes(keyword)) {
      score -= 0.3
    }
  }
  
  return Math.max(0, Math.min(1, score))
}

/**
 * Gets context around a match position
 */
function getContext(text: string, position: number, radius: number): string {
  const start = Math.max(0, position - radius)
  const end = Math.min(text.length, position + radius)
  return text.substring(start, end)
}

/**
 * Gets position of a regex match in text
 */
function getMatchPosition(text: string, match: RegExpExecArray): number {
  return match.index || 0
}

/**
 * Gets approximate position of a result in text
 */
function getResultPosition(text: string, result: MileageExtractionResult): number {
  // Try to find the raw value in the text
  const index = text.indexOf(result.rawValue)
  return index >= 0 ? index : 0
}

/**
 * Removes duplicate results based on value and position
 */
function deduplicateResults(results: MileageExtractionResult[]): MileageExtractionResult[] {
  const deduplicated: MileageExtractionResult[] = []
  
  for (const result of results) {
    const isDuplicate = deduplicated.some(existing => 
      Math.abs(existing.data - result.data) < 10 &&
      existing.source === result.source
    )
    
    if (!isDuplicate) {
      deduplicated.push(result)
    } else {
      // Keep the one with higher confidence
      const existingIndex = deduplicated.findIndex(existing => 
        Math.abs(existing.data - result.data) < 10 &&
        existing.source === result.source
      )
      
      if (existingIndex >= 0 && result.confidence > deduplicated[existingIndex].confidence) {
        deduplicated[existingIndex] = result
      }
    }
  }
  
  return deduplicated
}

/**
 * Extracts the best mileage candidate from results
 */
export function getBestMileageCandidate(results: MileageExtractionResult[]): MileageExtractionResult | null {
  if (results.length === 0) {
    return null
  }
  
  // Sort by confidence and source priority
  const sorted = results.sort((a, b) => {
    // First by confidence
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence
    }
    
    // Then by source priority
    const sourcePriority = {
      'explicit_label': 4,
      'dashboard_reading': 3,
      'miles_suffix': 2,
      'standalone_number': 1
    }
    
    const aPriority = sourcePriority[a.source as keyof typeof sourcePriority] || 0
    const bPriority = sourcePriority[b.source as keyof typeof sourcePriority] || 0
    
    return bPriority - aPriority
  })
  
  return sorted[0]
}

/**
 * Validates extracted mileage for reasonableness
 */
export function validateExtractedMileage(
  mileage: number,
  context?: {
    vehicleYear?: number
    previousMileage?: number
    documentDate?: string
  }
): {
  isValid: boolean
  confidence: number
  warnings: string[]
} {
  const warnings: string[] = []
  let confidence = 1.0
  
  // Basic range check
  if (mileage < 1 || mileage > 999999) {
    return {
      isValid: false,
      confidence: 0,
      warnings: [`Mileage ${mileage} outside valid range (1-999,999)`]
    }
  }
  
  // Vehicle age reasonableness
  if (context?.vehicleYear) {
    const currentYear = new Date().getFullYear()
    const vehicleAge = currentYear - context.vehicleYear
    const expectedMileage = vehicleAge * 12000 // 12k miles/year average
    
    const ratio = mileage / Math.max(expectedMileage, 1)
    
    if (ratio > 4) {
      warnings.push(`Very high mileage for ${vehicleAge}-year-old vehicle`)
      confidence -= 0.3
    } else if (ratio < 0.1 && vehicleAge > 2) {
      warnings.push(`Unusually low mileage for ${vehicleAge}-year-old vehicle`)
      confidence -= 0.2
    }
  }
  
  // Previous mileage check
  if (context?.previousMileage && mileage < context.previousMileage) {
    const difference = context.previousMileage - mileage
    if (difference > 100000) {
      warnings.push('Large mileage decrease - possible odometer rollover')
      confidence -= 0.2
    } else {
      warnings.push('Mileage decreased from previous reading')
      confidence -= 0.4
    }
  }
  
  return {
    isValid: confidence > 0.3,
    confidence: Math.max(0, Math.min(1, confidence)),
    warnings
  }
}
