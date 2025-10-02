// Rollup Validation
// Aggregates individual field validations into overall document confidence

import { ValidationResult, FieldValidation } from '../types'

export interface RollupOptions {
  requiredFields?: string[]
  criticalFields?: string[]
  minOverallConfidence?: number
  weightings?: Record<string, number>
}

/**
 * Rolls up individual field validations into overall document validation
 */
export function rollupValidation(
  fieldValidations: FieldValidation,
  extractedData: any,
  options: RollupOptions = {}
): ValidationResult & { rollup: 'ok' | 'needs_review' } {
  const {
    requiredFields = [],
    criticalFields = [],
    minOverallConfidence = 0.7,
    weightings = {}
  } = options

  const errors: string[] = []
  const warnings: string[] = []
  
  // Step 1: Check required fields
  for (const field of requiredFields) {
    if (!hasValidValue(extractedData, field)) {
      errors.push(`Required field missing or invalid: ${field}`)
    }
  }
  
  // Step 2: Check critical field validations
  for (const field of criticalFields) {
    const validation = fieldValidations[field]
    if (validation && !validation.isValid) {
      errors.push(`Critical field validation failed: ${field}`)
    }
  }
  
  // Step 3: Calculate weighted confidence
  const confidence = calculateWeightedConfidence(fieldValidations, weightings)
  
  // Step 4: Assess field coverage
  const coverage = assessFieldCoverage(extractedData, fieldValidations)
  if (coverage.score < 0.5) {
    warnings.push(`Low field coverage: ${Math.round(coverage.score * 100)}%`)
  }
  
  // Step 5: Check for data consistency
  const consistencyIssues = checkDataConsistency(extractedData)
  warnings.push(...consistencyIssues)
  
  // Step 6: Determine rollup status
  const rollup = determineRollupStatus(confidence, errors.length, warnings.length, minOverallConfidence)
  
  return {
    isValid: errors.length === 0,
    confidence,
    errors,
    warnings,
    rollup
  }
}

/**
 * Calculates weighted confidence across all field validations
 */
function calculateWeightedConfidence(
  fieldValidations: FieldValidation,
  weightings: Record<string, number>
): number {
  const validations = Object.entries(fieldValidations)
  
  if (validations.length === 0) {
    return 0.5 // Default confidence when no validations
  }
  
  let totalWeight = 0
  let weightedSum = 0
  
  for (const [field, validation] of validations) {
    const weight = weightings[field] || 1.0
    totalWeight += weight
    weightedSum += validation.confidence * weight
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.5
}

/**
 * Assesses how many expected fields were successfully extracted
 */
function assessFieldCoverage(
  extractedData: any,
  fieldValidations: FieldValidation
): { score: number; extractedCount: number; expectedCount: number } {
  // Define expected fields by document type
  const expectedFields = getExpectedFieldsByType(extractedData)
  
  let extractedCount = 0
  for (const field of expectedFields) {
    if (hasValidValue(extractedData, field)) {
      extractedCount++
    }
  }
  
  const score = expectedFields.length > 0 ? extractedCount / expectedFields.length : 1.0
  
  return {
    score,
    extractedCount,
    expectedCount: expectedFields.length
  }
}

/**
 * Gets expected fields based on document type
 */
function getExpectedFieldsByType(extractedData: any): string[] {
  // Try to infer document type from the data
  if (extractedData.gallons || extractedData.price_per_gallon || extractedData.station_name) {
    // Fuel receipt
    return ['station_name', 'total_amount', 'gallons', 'date']
  }
  
  if (extractedData.service_description || extractedData.line_items) {
    // Service invoice
    return ['vendor_name', 'service_description', 'total_amount', 'date']
  }
  
  if (extractedData.policy_number || extractedData.insurance_company) {
    // Insurance card
    return ['insurance_company', 'policy_number', 'effective_date', 'expiration_date']
  }
  
  if (extractedData.odometer_miles || extractedData.fuel_level) {
    // Dashboard snapshot
    return ['odometer_miles']
  }
  
  // Generic document
  return ['date', 'vendor_name']
}

/**
 * Checks for data consistency issues
 */
function checkDataConsistency(extractedData: any): string[] {
  const issues: string[] = []
  
  // Date consistency
  if (extractedData.date && extractedData.expiration_date) {
    const date = new Date(extractedData.date)
    const expiration = new Date(extractedData.expiration_date)
    
    if (date > expiration) {
      issues.push('Document date is after expiration date')
    }
  }
  
  // Amount consistency
  if (extractedData.gallons && extractedData.price_per_gallon && extractedData.total_amount) {
    const calculated = extractedData.gallons * extractedData.price_per_gallon
    const actual = extractedData.total_amount
    const difference = Math.abs(calculated - actual)
    
    if (difference > 0.50) { // Allow 50 cent tolerance for taxes/fees
      issues.push(`Fuel calculation mismatch: ${calculated.toFixed(2)} calculated vs ${actual.toFixed(2)} actual`)
    }
  }
  
  // Vehicle info consistency
  if (extractedData.vehicle_info) {
    const { year, make, model } = extractedData.vehicle_info
    
    if (year && (year < 1900 || year > new Date().getFullYear() + 2)) {
      issues.push(`Unrealistic vehicle year: ${year}`)
    }
    
    if (make && typeof make === 'string' && make.length < 2) {
      issues.push('Vehicle make too short')
    }
  }
  
  return issues
}

/**
 * Determines the rollup status based on confidence and issues
 */
function determineRollupStatus(
  confidence: number,
  errorCount: number,
  warningCount: number,
  minConfidence: number
): 'ok' | 'needs_review' {
  // Any errors = needs review
  if (errorCount > 0) {
    return 'needs_review'
  }
  
  // Low confidence = needs review
  if (confidence < minConfidence) {
    return 'needs_review'
  }
  
  // Too many warnings = needs review
  if (warningCount > 3) {
    return 'needs_review'
  }
  
  return 'ok'
}

/**
 * Checks if a field has a valid, non-empty value
 */
function hasValidValue(data: any, fieldPath: string): boolean {
  const value = getNestedValue(data, fieldPath)
  
  if (value === null || value === undefined) {
    return false
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return false
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return false
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return false
  }
  
  return true
}

/**
 * Gets nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * Creates a summary of validation results for logging/debugging
 */
export function createValidationSummary(
  fieldValidations: FieldValidation,
  rollupResult: ValidationResult & { rollup: 'ok' | 'needs_review' }
): string {
  const fieldCount = Object.keys(fieldValidations).length
  const validFields = Object.values(fieldValidations).filter(v => v.isValid).length
  const avgConfidence = Object.values(fieldValidations)
    .reduce((sum, v) => sum + v.confidence, 0) / Math.max(fieldCount, 1)
  
  return [
    `Validation Summary:`,
    `- Fields: ${validFields}/${fieldCount} valid`,
    `- Avg Confidence: ${Math.round(avgConfidence * 100)}%`,
    `- Overall: ${Math.round(rollupResult.confidence * 100)}%`,
    `- Status: ${rollupResult.rollup}`,
    `- Errors: ${rollupResult.errors.length}`,
    `- Warnings: ${rollupResult.warnings.length}`
  ].join(' ')
}
