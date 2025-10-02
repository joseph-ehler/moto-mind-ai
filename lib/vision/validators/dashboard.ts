/**
 * Dashboard Extraction Validation
 * Post-processing checks to catch AI extraction errors
 */

import { DashboardFields } from '../schemas/fields'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateDashboardExtraction(data: DashboardFields): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Odometer validation
  if (data.odometer_miles !== null) {
    if (data.odometer_miles < 0) {
      errors.push('Odometer cannot be negative')
    }
    if (data.odometer_miles > 999999) {
      errors.push('Odometer exceeds maximum (999,999)')
    }
    if (data.odometer_miles < 100) {
      warnings.push('Unusually low odometer reading - verify this is not a trip meter')
    }
    
    // Trip meter sanity check
    if (data.trip_a_miles && data.trip_a_miles > data.odometer_miles) {
      errors.push('Trip A exceeds odometer - likely confused trip with main odometer')
    }
    if (data.trip_b_miles && data.trip_b_miles > data.odometer_miles) {
      errors.push('Trip B exceeds odometer - likely confused trip with main odometer')
    }
  }

  // Unit validation
  if (data.odometer_miles !== null && data.odometer_unit === null) {
    warnings.push('Odometer value present but unit missing - defaulting to miles')
  }

  // Fuel validation
  if (data.fuel_eighths !== null) {
    if (!Number.isInteger(data.fuel_eighths)) {
      errors.push('Fuel eighths must be whole number (0-8)')
    }
    if (data.fuel_eighths < 0 || data.fuel_eighths > 8) {
      errors.push('Fuel eighths must be 0-8 (E=0, F=8)')
    }
  }

  // Temperature validation
  if (data.coolant_temp !== null) {
    const validTemps = ['cold', 'normal', 'hot']
    if (!validTemps.includes(data.coolant_temp)) {
      errors.push(`Invalid coolant_temp: ${data.coolant_temp}`)
    }
  }

  if (data.outside_temp_value !== null) {
    if (data.outside_temp_unit === null) {
      errors.push('Outside temp value present but unit missing')
    }
    if (data.outside_temp_unit === 'F' && (data.outside_temp_value < -50 || data.outside_temp_value > 150)) {
      warnings.push('Outside temp in Fahrenheit seems out of normal range')
    }
    if (data.outside_temp_unit === 'C' && (data.outside_temp_value < -45 || data.outside_temp_value > 65)) {
      warnings.push('Outside temp in Celsius seems out of normal range')
    }
  }

  // Oil life validation
  if (data.oil_life_percent !== null) {
    if (data.oil_life_percent < 0 || data.oil_life_percent > 100) {
      errors.push('Oil life must be 0-100%')
    }
  }

  // Warning lights validation
  if (data.warning_lights !== null && !Array.isArray(data.warning_lights)) {
    errors.push('Warning lights must be array or null')
  }

  // Confidence validation
  if (data.confidence < 0 || data.confidence > 1) {
    errors.push('Confidence must be 0-1')
  }
  if (data.confidence < 0.5) {
    warnings.push('Low confidence extraction - consider manual review')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Auto-correct common extraction mistakes
 */
export function autoCorrectDashboard(data: DashboardFields): DashboardFields {
  const corrected = { ...data }

  // If odometer is suspiciously low and trip meter is high, they might be swapped
  if (
    corrected.odometer_miles !== null &&
    corrected.odometer_miles < 1000 &&
    corrected.trip_a_miles !== null &&
    corrected.trip_a_miles > corrected.odometer_miles
  ) {
    console.warn('🔄 Auto-correcting: Odometer and Trip A appear swapped')
    const temp = corrected.odometer_miles
    corrected.odometer_miles = corrected.trip_a_miles
    corrected.trip_a_miles = temp
  }

  // Default odometer unit to miles if missing but value present
  if (corrected.odometer_miles !== null && corrected.odometer_unit === null) {
    corrected.odometer_unit = 'mi'
    console.warn('🔄 Auto-correcting: Defaulting odometer_unit to "mi"')
  }

  // Round fuel to nearest eighth
  if (corrected.fuel_eighths !== null && !Number.isInteger(corrected.fuel_eighths)) {
    corrected.fuel_eighths = Math.round(corrected.fuel_eighths)
    console.warn(`🔄 Auto-correcting: Rounded fuel_eighths to ${corrected.fuel_eighths}`)
  }

  return corrected
}

/**
 * Convert km to miles if needed
 */
export function normalizeOdometerToMiles(data: DashboardFields): DashboardFields {
  if (data.odometer_miles !== null && data.odometer_unit === 'km') {
    return {
      ...data,
      odometer_miles: Math.round(data.odometer_miles / 1.609),
      odometer_unit: 'mi'
    }
  }
  return data
}

/**
 * Full validation pipeline
 */
export function processDashboardExtraction(rawData: DashboardFields) {
  // Step 1: Auto-correct obvious mistakes
  const corrected = autoCorrectDashboard(rawData)

  // Step 2: Validate
  const validation = validateDashboardExtraction(corrected)

  // Step 3: Normalize units
  const normalized = normalizeOdometerToMiles(corrected)

  return {
    data: normalized,
    validation,
    wasAutoCorrect: JSON.stringify(rawData) !== JSON.stringify(corrected)
  }
}
