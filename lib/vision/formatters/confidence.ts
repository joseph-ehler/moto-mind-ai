// Confidence Calculation Utilities
// Pure functions for calculating overall confidence scores

/**
 * Calculates overall confidence from individual field confidences
 */
export function calculateOverallConfidence(data: any): number {
  if (!data || typeof data !== 'object') {
    return 0.5
  }
  
  // Extract confidence from various sources
  const confidences: number[] = []
  
  // Direct confidence field
  if (typeof data.confidence === 'number') {
    confidences.push(normalizeConfidence(data.confidence))
  }
  
  // Extraction confidence
  if (typeof data.extraction_confidence === 'number') {
    confidences.push(normalizeConfidence(data.extraction_confidence))
  }
  
  // Field-specific confidences
  const fieldConfidences = extractFieldConfidences(data)
  confidences.push(...fieldConfidences)
  
  // Data quality indicators
  const qualityScore = assessDataQuality(data)
  confidences.push(qualityScore)
  
  if (confidences.length === 0) {
    return 0.7 // Default confidence when no indicators available
  }
  
  // Calculate weighted average
  return calculateWeightedAverage(confidences)
}

/**
 * Normalizes confidence values to 0-1 range
 */
function normalizeConfidence(value: number): number {
  if (value >= 0 && value <= 1) {
    return value
  }
  
  if (value > 1 && value <= 100) {
    return value / 100
  }
  
  // Invalid confidence values
  return 0.5
}

/**
 * Extracts field-specific confidence scores
 */
function extractFieldConfidences(data: any): number[] {
  const confidences: number[] = []
  
  // Look for confidence fields in the data
  const confidenceFields = [
    'odometer_conf', 'fuel_conf', 'lights_conf', 'vendor_conf',
    'amount_conf', 'date_conf', 'service_conf'
  ]
  
  for (const field of confidenceFields) {
    if (typeof data[field] === 'number') {
      confidences.push(normalizeConfidence(data[field]))
    }
  }
  
  // Check nested objects
  if (data.validation && typeof data.validation === 'object') {
    if (data.validation.fields && typeof data.validation.fields === 'object') {
      for (const [fieldName, fieldData] of Object.entries(data.validation.fields)) {
        if (typeof fieldData === 'object' && fieldData !== null) {
          const fieldObj = fieldData as any
          if (typeof fieldObj.confidence === 'number') {
            confidences.push(normalizeConfidence(fieldObj.confidence))
          }
        }
      }
    }
  }
  
  return confidences
}

/**
 * Assesses data quality based on completeness and consistency
 */
function assessDataQuality(data: any): number {
  let score = 0.5 // Base score
  
  // Completeness check
  const completeness = assessCompleteness(data)
  score += completeness * 0.3
  
  // Consistency check
  const consistency = assessConsistency(data)
  score += consistency * 0.2
  
  return Math.max(0, Math.min(1, score))
}

/**
 * Assesses data completeness
 */
function assessCompleteness(data: any): number {
  const importantFields = [
    'vendor_name', 'business_name', 'station_name',
    'total_amount', 'amount',
    'date', 'service_date',
    'odometer_miles'
  ]
  
  let foundFields = 0
  let totalFields = 0
  
  for (const field of importantFields) {
    totalFields++
    
    if (hasValidValue(data, field) || 
        (data.extracted_data && hasValidValue(data.extracted_data, field))) {
      foundFields++
    }
  }
  
  return totalFields > 0 ? foundFields / totalFields : 0.5
}

/**
 * Assesses data consistency
 */
function assessConsistency(data: any): number {
  let consistencyScore = 1.0
  
  // Date consistency
  if (data.date && data.expiration_date) {
    const date = new Date(data.date)
    const expiration = new Date(data.expiration_date)
    
    if (!isNaN(date.getTime()) && !isNaN(expiration.getTime()) && date > expiration) {
      consistencyScore -= 0.3
    }
  }
  
  // Amount calculation consistency (for fuel)
  if (data.gallons && data.price_per_gallon && data.total_amount) {
    const calculated = data.gallons * data.price_per_gallon
    const actual = data.total_amount
    const difference = Math.abs(calculated - actual)
    
    if (difference > actual * 0.1) { // More than 10% difference
      consistencyScore -= 0.2
    }
  }
  
  // Odometer reasonableness
  if (data.odometer_miles && typeof data.odometer_miles === 'number') {
    if (data.odometer_miles < 0 || data.odometer_miles > 999999) {
      consistencyScore -= 0.4
    }
  }
  
  return Math.max(0, consistencyScore)
}

/**
 * Calculates weighted average of confidence scores
 */
function calculateWeightedAverage(confidences: number[]): number {
  if (confidences.length === 0) {
    return 0.5
  }
  
  if (confidences.length === 1) {
    return confidences[0]
  }
  
  // Sort confidences to give more weight to higher values
  const sorted = confidences.sort((a, b) => b - a)
  
  // Weighted average: higher confidences get more weight
  let weightedSum = 0
  let totalWeight = 0
  
  for (let i = 0; i < sorted.length; i++) {
    const weight = Math.pow(0.8, i) // Decreasing weights: 1, 0.8, 0.64, etc.
    weightedSum += sorted[i] * weight
    totalWeight += weight
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.5
}

/**
 * Checks if a field has a valid, non-empty value
 */
function hasValidValue(obj: any, field: string): boolean {
  const value = obj[field]
  
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
 * Gets confidence level description
 */
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) {
    return 'high'
  }
  
  if (confidence >= 0.6) {
    return 'medium'
  }
  
  return 'low'
}

/**
 * Gets confidence color for UI display
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) {
    return 'text-green-600 bg-green-100'
  }
  
  if (confidence >= 0.6) {
    return 'text-yellow-600 bg-yellow-100'
  }
  
  return 'text-red-600 bg-red-100'
}

/**
 * Determines if confidence warning should be shown
 */
export function shouldShowConfidenceWarning(confidence: number, documentType?: string): boolean {
  // Financial documents need higher confidence
  const financialTypes = ['service_invoice', 'fuel_receipt', 'insurance_card']
  const threshold = financialTypes.includes(documentType || '') ? 0.85 : 0.7
  
  return confidence < threshold
}

/**
 * Gets confidence warning message
 */
export function getConfidenceWarningMessage(confidence: number, documentType?: string): string {
  const level = getConfidenceLevel(confidence)
  
  const messages = {
    high: 'Data extraction looks good',
    medium: 'Some fields may need review',
    low: 'Please verify extracted information carefully'
  }
  
  return messages[level]
}
