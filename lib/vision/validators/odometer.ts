// Odometer Reading Validation
// Pure functions for validating odometer readings and mileage data

import { ValidationResult } from '../types'

export interface OdometerValidationOptions {
  minMileage?: number
  maxMileage?: number
  previousMileage?: number
  allowDecrease?: boolean
  vehicleYear?: number
}

/**
 * Validates odometer readings for reasonableness and monotonicity
 */
export function validateOdometerReading(
  reading: any,
  options: OdometerValidationOptions = {}
): ValidationResult {
  const {
    minMileage = 0,
    maxMileage = 999999,
    previousMileage,
    allowDecrease = false,
    vehicleYear
  } = options

  const errors: string[] = []
  const warnings: string[] = []
  
  // Step 1: Parse the reading
  const parsed = parseOdometerReading(reading)
  
  if (parsed === null) {
    return {
      isValid: false,
      confidence: 0,
      errors: [`Invalid odometer reading format: ${reading}`],
      warnings
    }
  }
  
  // Step 2: Basic range validation
  if (parsed < minMileage) {
    errors.push(`Odometer reading ${parsed} below minimum ${minMileage}`)
  }
  
  if (parsed > maxMileage) {
    errors.push(`Odometer reading ${parsed} exceeds maximum ${maxMileage}`)
  }
  
  // Step 3: Monotonicity check
  if (previousMileage !== undefined && !allowDecrease && parsed < previousMileage) {
    const difference = previousMileage - parsed
    if (difference > 100000) {
      // Large decrease suggests odometer rollover
      warnings.push(`Large mileage decrease (${difference} miles) - possible odometer rollover`)
    } else {
      errors.push(`Odometer reading ${parsed} is less than previous reading ${previousMileage}`)
    }
  }
  
  // Step 4: Vehicle age reasonableness
  if (vehicleYear) {
    const currentYear = new Date().getFullYear()
    const vehicleAge = currentYear - vehicleYear
    const expectedMileage = vehicleAge * 12000 // Average 12k miles/year
    
    const reasonableness = assessMileageReasonableness(parsed, expectedMileage, vehicleAge)
    if (!reasonableness.isReasonable) {
      warnings.push(reasonableness.warning)
    }
  }
  
  // Step 5: Calculate confidence
  let confidence = 1.0
  
  // Reduce confidence for warnings
  confidence -= warnings.length * 0.1
  
  // Reduce confidence for suspicious patterns
  if (hasSuspiciousPattern(parsed)) {
    confidence -= 0.2
    warnings.push('Odometer reading has suspicious pattern (repeated digits, round numbers)')
  }
  
  return {
    isValid: errors.length === 0,
    confidence: Math.max(0, Math.min(1, confidence)),
    errors: errors.length > 0 ? errors : [],
    warnings
  }
}

/**
 * Parses various odometer reading formats
 */
export function parseOdometerReading(value: any): number | null {
  if (typeof value === 'number') {
    return isFinite(value) && value >= 0 ? Math.round(value) : null
  }
  
  if (typeof value !== 'string') {
    return null
  }
  
  // Clean the string - remove everything except digits
  const cleaned = value.replace(/[^\d]/g, '')
  
  if (!cleaned) return null
  
  const parsed = parseInt(cleaned, 10)
  
  if (isNaN(parsed) || parsed < 0) {
    return null
  }
  
  return parsed
}

/**
 * Extracts mileage from text using various patterns
 */
export function extractMileageWithPatterns(text: string): Array<{
  value: number
  pattern: string
  confidence: number
  position: number
}> {
  const results: Array<{
    value: number
    pattern: string
    confidence: number
    position: number
  }> = []
  
  // Pattern 1: "123,456 miles" or "123456 mi"
  const milesPattern = /(\d{1,3}(?:,\d{3})*|\d+)\s*(?:miles?|mi)\b/gi
  let match
  while ((match = milesPattern.exec(text)) !== null) {
    const value = parseInt(match[1].replace(/,/g, ''), 10)
    if (!isNaN(value)) {
      results.push({
        value,
        pattern: 'miles_suffix',
        confidence: 0.9,
        position: match.index
      })
    }
  }
  
  // Pattern 2: "Odometer: 123,456"
  const odometerPattern = /(?:odometer|mileage|miles?)[:=\s]+(\d{1,3}(?:,\d{3})*|\d+)/gi
  while ((match = odometerPattern.exec(text)) !== null) {
    const value = parseInt(match[1].replace(/,/g, ''), 10)
    if (!isNaN(value)) {
      results.push({
        value,
        pattern: 'odometer_prefix',
        confidence: 0.95,
        position: match.index
      })
    }
  }
  
  // Pattern 3: Standalone large numbers (likely mileage)
  const standalonePattern = /\b(\d{4,6})\b/g
  while ((match = standalonePattern.exec(text)) !== null) {
    const value = parseInt(match[1], 10)
    if (!isNaN(value) && value >= 1000 && value <= 999999) {
      // Check if it's not already captured by other patterns
      const alreadyCaptured = results.some(r => 
        Math.abs(r.position - match.index) < 20 && r.value === value
      )
      
      if (!alreadyCaptured) {
        results.push({
          value,
          pattern: 'standalone_number',
          confidence: 0.6,
          position: match.index
        })
      }
    }
  }
  
  // Sort by confidence and position
  return results.sort((a, b) => b.confidence - a.confidence || a.position - b.position)
}

/**
 * Assesses whether mileage is reasonable for vehicle age
 */
function assessMileageReasonableness(
  actualMileage: number,
  expectedMileage: number,
  vehicleAge: number
): { isReasonable: boolean; warning: string } {
  const ratio = actualMileage / Math.max(expectedMileage, 1)
  
  if (ratio > 3) {
    return {
      isReasonable: false,
      warning: `Very high mileage (${actualMileage}) for ${vehicleAge}-year-old vehicle`
    }
  }
  
  if (ratio < 0.1 && vehicleAge > 2) {
    return {
      isReasonable: false,
      warning: `Unusually low mileage (${actualMileage}) for ${vehicleAge}-year-old vehicle`
    }
  }
  
  return { isReasonable: true, warning: '' }
}

/**
 * Detects suspicious patterns in odometer readings
 */
function hasSuspiciousPattern(mileage: number): boolean {
  const str = mileage.toString()
  
  // Check for repeated digits (111111, 222222, etc.)
  if (/^(\d)\1+$/.test(str)) {
    return true
  }
  
  // Check for sequential digits (123456, 654321)
  const digits = str.split('').map(Number)
  let isSequential = true
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] !== digits[i-1] + 1 && digits[i] !== digits[i-1] - 1) {
      isSequential = false
      break
    }
  }
  
  if (isSequential && digits.length >= 4) {
    return true
  }
  
  // Check for round numbers (100000, 200000, etc.)
  if (mileage % 10000 === 0 && mileage >= 100000) {
    return true
  }
  
  return false
}

/**
 * Validates mileage progression over time
 */
export function validateMileageProgression(
  readings: Array<{ mileage: number; date: string }>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (readings.length < 2) {
    return {
      isValid: true,
      confidence: 1.0,
      errors: [],
      warnings: []
    }
  }
  
  // Sort by date
  const sorted = readings
    .map(r => ({ ...r, dateObj: new Date(r.date) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    
    const daysDiff = (curr.dateObj.getTime() - prev.dateObj.getTime()) / (1000 * 60 * 60 * 24)
    const milesDiff = curr.mileage - prev.mileage
    
    if (milesDiff < 0) {
      errors.push(`Mileage decreased from ${prev.mileage} to ${curr.mileage}`)
    } else if (daysDiff > 0) {
      const milesPerDay = milesDiff / daysDiff
      
      if (milesPerDay > 500) {
        warnings.push(`Very high daily mileage: ${Math.round(milesPerDay)} miles/day`)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    confidence: errors.length === 0 ? 0.9 : 0.3,
    errors,
    warnings
  }
}
