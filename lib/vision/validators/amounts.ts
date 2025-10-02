// Amount Validation and Sanitization
// Pure functions for validating and cleaning monetary amounts

import { ValidationResult, FieldValidation } from '../types'

export interface AmountValidationOptions {
  minAmount?: number
  maxAmount?: number
  allowZero?: boolean
  currency?: string
}

/**
 * Validates and sanitizes monetary amounts from extracted data
 */
export function validateAndSanitizeAmounts(
  data: any, 
  options: AmountValidationOptions = {}
): FieldValidation {
  const {
    minAmount = 0,
    maxAmount = 50000, // Reasonable max for automotive services
    allowZero = false,
    currency = 'USD'
  } = options

  const results: FieldValidation = {}
  
  // Find all amount-related fields
  const amountFields = findAmountFields(data)
  
  for (const [fieldName, rawValue] of amountFields) {
    const validation = validateSingleAmount(rawValue, {
      minAmount,
      maxAmount,
      allowZero,
      fieldName
    })
    
    results[fieldName] = validation
  }
  
  return results
}

/**
 * Validates a single amount value
 */
export function validateSingleAmount(
  value: any,
  options: {
    minAmount: number
    maxAmount: number
    allowZero: boolean
    fieldName?: string
  }
): {
  confidence: number
  isValid: boolean
  sanitizedValue?: number
  errors?: string[]
} {
  const errors: string[] = []
  
  // Step 1: Parse the amount
  const parsed = parseAmount(value)
  
  if (parsed === null) {
    return {
      confidence: 0,
      isValid: false,
      errors: [`Invalid amount format: ${value}`]
    }
  }
  
  // Step 2: Range validation
  if (!options.allowZero && parsed === 0) {
    errors.push('Amount cannot be zero')
  }
  
  if (parsed < options.minAmount) {
    errors.push(`Amount ${parsed} below minimum ${options.minAmount}`)
  }
  
  if (parsed > options.maxAmount) {
    errors.push(`Amount ${parsed} exceeds maximum ${options.maxAmount}`)
  }
  
  // Step 3: Reasonableness checks
  const reasonableness = assessAmountReasonableness(parsed, options.fieldName)
  
  return {
    confidence: reasonableness.confidence,
    isValid: errors.length === 0 && reasonableness.isReasonable,
    sanitizedValue: parsed,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Parses various amount formats into a clean number
 */
export function parseAmount(value: any): number | null {
  if (typeof value === 'number') {
    return isFinite(value) ? Math.round(value * 100) / 100 : null
  }
  
  if (typeof value !== 'string') {
    return null
  }
  
  // Clean the string
  let cleaned = value
    .replace(/[$,\s]/g, '') // Remove $, commas, spaces
    .replace(/[^\d.-]/g, '') // Keep only digits, dots, dashes
    .trim()
  
  if (!cleaned) return null
  
  // Handle negative amounts (refunds, credits)
  const isNegative = cleaned.startsWith('-')
  if (isNegative) {
    cleaned = cleaned.substring(1)
  }
  
  // Parse the number
  const parsed = parseFloat(cleaned)
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null
  }
  
  // Round to 2 decimal places and apply sign
  const result = Math.round(parsed * 100) / 100
  return isNegative ? -result : result
}

/**
 * Finds all fields that look like monetary amounts
 */
function findAmountFields(data: any): Array<[string, any]> {
  const amountFields: Array<[string, any]> = []
  
  const amountFieldNames = [
    'total_amount',
    'amount',
    'cost',
    'price',
    'fee',
    'charge',
    'subtotal',
    'tax',
    'labor_amount',
    'parts_amount',
    'price_per_gallon'
  ]
  
  function searchObject(obj: any, prefix = ''): void {
    if (!obj || typeof obj !== 'object') return
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      // Check if this field name suggests it's an amount
      if (amountFieldNames.some(name => key.toLowerCase().includes(name.toLowerCase()))) {
        amountFields.push([fullKey, value])
      }
      
      // Check if the value looks like a monetary amount
      if (typeof value === 'string' && /^\$?\d+\.?\d*$/.test(value.replace(/[,\s]/g, ''))) {
        amountFields.push([fullKey, value])
      }
      
      // Recurse into nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        searchObject(value, fullKey)
      }
    }
  }
  
  searchObject(data)
  return amountFields
}

/**
 * Assesses whether an amount is reasonable for automotive context
 */
function assessAmountReasonableness(
  amount: number,
  fieldName?: string
): { isReasonable: boolean; confidence: number } {
  const absAmount = Math.abs(amount)
  
  // Context-specific reasonableness
  if (fieldName?.toLowerCase().includes('fuel')) {
    // Fuel purchases: $5 - $200 is reasonable
    if (absAmount >= 5 && absAmount <= 200) {
      return { isReasonable: true, confidence: 0.95 }
    }
    if (absAmount >= 1 && absAmount <= 500) {
      return { isReasonable: true, confidence: 0.7 }
    }
    return { isReasonable: false, confidence: 0.3 }
  }
  
  if (fieldName?.toLowerCase().includes('service') || fieldName?.toLowerCase().includes('repair')) {
    // Service/repair: $20 - $5000 is reasonable
    if (absAmount >= 20 && absAmount <= 5000) {
      return { isReasonable: true, confidence: 0.9 }
    }
    if (absAmount >= 5 && absAmount <= 15000) {
      return { isReasonable: true, confidence: 0.7 }
    }
    return { isReasonable: false, confidence: 0.3 }
  }
  
  if (fieldName?.toLowerCase().includes('insurance')) {
    // Insurance: $100 - $3000 annually is reasonable
    if (absAmount >= 100 && absAmount <= 3000) {
      return { isReasonable: true, confidence: 0.9 }
    }
    if (absAmount >= 50 && absAmount <= 10000) {
      return { isReasonable: true, confidence: 0.6 }
    }
    return { isReasonable: false, confidence: 0.3 }
  }
  
  // General automotive amounts: $1 - $10000
  if (absAmount >= 1 && absAmount <= 10000) {
    return { isReasonable: true, confidence: 0.8 }
  }
  
  if (absAmount < 0.01) {
    return { isReasonable: false, confidence: 0.1 }
  }
  
  if (absAmount > 50000) {
    return { isReasonable: false, confidence: 0.2 }
  }
  
  return { isReasonable: true, confidence: 0.5 }
}
