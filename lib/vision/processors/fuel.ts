// Fuel Receipt Processor
// Processes fuel receipts and extracts structured fuel data

import { ProcessorResult } from '../types'
import { validateAndSanitizeAmounts } from '../validators/amounts'
import { validateOdometerReading } from '../validators/odometer'
import { extractVendorWithPrecedence } from '../extractors/vendor'
import { rollupValidation } from '../validators/rollup'

/**
 * Processes fuel receipt data into standardized format
 */
export function processFuelReceipt(rawExtraction: any): ProcessorResult {
  const warnings: string[] = []
  
  // Step 1: Extract and validate station name
  const stationResult = extractVendorWithPrecedence({
    ...rawExtraction,
    vendor_name: rawExtraction.station_name || rawExtraction.vendor_name
  })
  
  if (!stationResult) {
    warnings.push('Could not extract station name')
  }
  
  // Step 2: Validate amounts
  const amountValidation = validateAndSanitizeAmounts(rawExtraction, {
    minAmount: 1,
    maxAmount: 500, // Reasonable max for fuel purchases
    allowZero: false
  })
  
  // Step 3: Validate fuel-specific amounts
  const fuelValidation = validateFuelAmounts(rawExtraction)
  if (!fuelValidation.isValid) {
    warnings.push(...fuelValidation.errors)
  }
  
  // Step 4: Validate odometer if present
  let odometerValidation = null
  if (rawExtraction.odometer_reading) {
    odometerValidation = validateOdometerReading(rawExtraction.odometer_reading)
    if (!odometerValidation.isValid) {
      warnings.push(...odometerValidation.errors)
    }
  }
  
  // Step 5: Calculate fuel efficiency if possible
  const efficiency = calculateFuelEfficiency(rawExtraction)
  
  // Step 6: Generate summary
  const summary = generateFuelSummary({
    station_name: stationResult?.data || null,
    total_amount: rawExtraction.total_amount || null,
    gallons: rawExtraction.gallons || null,
    price_per_gallon: rawExtraction.price_per_gallon || null,
    fuel_type: rawExtraction.fuel_type || null
  })
  
  // Step 7: Calculate confidence
  const validation = calculateFuelValidation(rawExtraction, {
    stationResult,
    amountValidation,
    fuelValidation,
    odometerValidation
  })
  
  const enrichedData = {
    key_facts: {
      // CORE FUEL DATA
      station_name: stationResult?.data || null,
      total_amount: rawExtraction.total_amount || null,
      gallons: rawExtraction.gallons || null,
      price_per_gallon: rawExtraction.price_per_gallon || null,
      fuel_type: rawExtraction.fuel_type || 'Regular',
      date: rawExtraction.date || null,
      odometer_reading: rawExtraction.odometer_reading || null,
      payment_method: rawExtraction.payment_method || null,
      pump_number: rawExtraction.pump_number || null,
      fuel_efficiency: efficiency || null,
      // RICH TRANSACTION DATA (fraud detection, reconciliation)
      station_address: rawExtraction.station_address || null,
      transaction_id: rawExtraction.transaction_id || null,
      invoice_number: rawExtraction.invoice_number || null,
      auth_code: rawExtraction.auth_code || null,
      time: rawExtraction.time || null,
      transaction_time: rawExtraction.time || null,
      card_last_four: rawExtraction.card_last_four || null,
      entry_method: rawExtraction.entry_method || null,
      // MERCHANT/SITE DATA
      site_id: rawExtraction.site_id || null,
      trace_id: rawExtraction.trace_id || null,
      merchant_id: rawExtraction.merchant_id || null,
      // EMV TRANSACTION CODES
      aid: rawExtraction.aid || null,
      tvr: rawExtraction.tvr || null,
      iad: rawExtraction.iad || null,
      tsi: rawExtraction.tsi || null,
      arc: rawExtraction.arc || null
    },
    summary,
    validation,
    confidence: validation.rollup === 'ok' ? 0.85 : 0.6,
    processing_metadata: {
      model_version: 'gpt-4o',
      prompt_hash: 'fuel_v2_enhanced',
      processing_ms: 0 // Will be set by caller
    }
  }
  
  return {
    enrichedData,
    confidence: enrichedData.confidence,
    warnings,
    nextActions: generateFuelNextActions(enrichedData.key_facts)
  }
}

/**
 * Validates fuel-specific amounts for consistency
 */
function validateFuelAmounts(data: any): {
  isValid: boolean
  errors: string[]
  confidence: number
} {
  const errors: string[] = []
  let confidence = 1.0
  
  const { total_amount, gallons, price_per_gallon } = data
  
  // Check if we have the basic fuel data
  if (!total_amount || !gallons) {
    errors.push('Missing essential fuel data (amount or gallons)')
    return { isValid: false, errors, confidence: 0.2 }
  }
  
  // Validate gallon range (reasonable for passenger vehicles)
  if (gallons < 0.1 || gallons > 50) {
    errors.push(`Unusual gallon amount: ${gallons}`)
    confidence -= 0.3
  }
  
  // Validate price per gallon if available
  if (price_per_gallon) {
    if (price_per_gallon < 1 || price_per_gallon > 10) {
      errors.push(`Unusual price per gallon: $${price_per_gallon}`)
      confidence -= 0.2
    }
    
    // Check calculation consistency
    const calculatedTotal = gallons * price_per_gallon
    const difference = Math.abs(calculatedTotal - total_amount)
    const tolerance = Math.max(total_amount * 0.1, 1.0) // 10% or $1, whichever is larger
    
    if (difference > tolerance) {
      errors.push(`Amount calculation mismatch: ${calculatedTotal.toFixed(2)} calculated vs ${total_amount.toFixed(2)} actual`)
      confidence -= 0.4
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    confidence: Math.max(0, Math.min(1, confidence))
  }
}

/**
 * Calculates fuel efficiency if previous odometer reading is available
 */
function calculateFuelEfficiency(data: any): {
  mpg: number | null
  confidence: number
} | null {
  // This would require previous fuel records to calculate
  // For now, return null - could be enhanced with historical data
  return null
}

/**
 * Generates human-readable fuel summary
 */
function generateFuelSummary(data: {
  station_name: string | null
  total_amount: number | null
  gallons: number | null
  price_per_gallon: number | null
  fuel_type: string | null
}): string {
  const parts: string[] = []
  
  // Amount and gallons
  if (data.total_amount && data.gallons) {
    parts.push(`$${data.total_amount.toFixed(2)} • ${data.gallons} gallons`)
  } else if (data.total_amount) {
    parts.push(`$${data.total_amount.toFixed(2)} fuel`)
  }
  
  // Station
  if (data.station_name) {
    parts.push(`• ${data.station_name}`)
  }
  
  // Price per gallon
  if (data.price_per_gallon) {
    parts.push(`• $${data.price_per_gallon.toFixed(2)}/gal`)
  }
  
  // Fuel type
  if (data.fuel_type && data.fuel_type !== 'Regular') {
    parts.push(`• ${data.fuel_type}`)
  }
  
  return parts.join(' ') || 'Fuel purchase'
}

/**
 * Calculates validation scores for fuel data
 */
function calculateFuelValidation(
  rawExtraction: any,
  validationResults: {
    stationResult: any
    amountValidation: any
    fuelValidation: any
    odometerValidation: any
  }
) {
  const fieldValidations: Record<string, { confidence: number; isValid: boolean }> = {}
  
  // Station confidence
  if (validationResults.stationResult) {
    fieldValidations.station_conf = {
      confidence: validationResults.stationResult.confidence,
      isValid: true
    }
  }
  
  // Amount confidence
  const totalAmountValidation = validationResults.amountValidation.total_amount
  if (totalAmountValidation) {
    fieldValidations.amount_conf = {
      confidence: totalAmountValidation.confidence,
      isValid: totalAmountValidation.isValid
    }
  }
  
  // Fuel calculation confidence
  fieldValidations.fuel_calc_conf = {
    confidence: validationResults.fuelValidation.confidence,
    isValid: validationResults.fuelValidation.isValid
  }
  
  // Date confidence (basic check)
  if (rawExtraction.date) {
    const dateValid = !isNaN(Date.parse(rawExtraction.date))
    fieldValidations.date_conf = {
      confidence: dateValid ? 0.9 : 0.3,
      isValid: dateValid
    }
  }
  
  return rollupValidation(fieldValidations, rawExtraction, {
    requiredFields: ['station_name', 'total_amount', 'gallons'],
    criticalFields: ['total_amount', 'gallons'],
    minOverallConfidence: 0.7
  })
}

/**
 * Generates suggested next actions for fuel records
 */
function generateFuelNextActions(keyFacts: any): string[] {
  const actions: string[] = []
  
  // Fuel efficiency tracking
  if (keyFacts.gallons && keyFacts.odometer_reading) {
    actions.push('Track fuel efficiency with next fill-up')
  }
  
  // Price tracking
  if (keyFacts.price_per_gallon) {
    if (keyFacts.price_per_gallon > 4.50) {
      actions.push('Consider fuel-efficient driving - high gas prices')
    }
  }
  
  // Station loyalty
  if (keyFacts.station_name) {
    actions.push(`Consider loyalty program at ${keyFacts.station_name}`)
  }
  
  // Maintenance reminder
  if (keyFacts.odometer_reading) {
    actions.push('Check if oil change is due based on mileage')
  }
  
  return actions
}
