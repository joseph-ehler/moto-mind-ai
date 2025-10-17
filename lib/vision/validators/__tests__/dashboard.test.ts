/**
 * Dashboard Validation Tests
 * Verify validator catches common AI extraction mistakes
 */

import { validateDashboardExtraction, autoCorrectDashboard, normalizeOdometerToMiles } from '../dashboard'
import { DashboardFields } from '../../schemas/fields'

describe('validateDashboardExtraction', () => {
  test('passes valid extraction', () => {
    const validData: DashboardFields = {
      odometer_miles: 85432,
      odometer_unit: 'mi',
      trip_a_miles: 234.1,
      trip_b_miles: null,
      fuel_eighths: 8,
      coolant_temp: 'normal',
      outside_temp_value: 72,
      outside_temp_unit: 'F',
      warning_lights: [],
      oil_life_percent: 45,
      service_message: null,
      confidence: 0.95
    }

    const result = validateDashboardExtraction(validData)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('catches swapped odometer and trip meter', () => {
    const swappedData: DashboardFields = {
      odometer_miles: 234,      // Trip meter value
      odometer_unit: 'mi',
      trip_a_miles: 85432,      // Odometer value
      trip_b_miles: null,
      fuel_eighths: 8,
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.9
    }

    const result = validateDashboardExtraction(swappedData)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Trip A exceeds odometer - likely confused trip with main odometer')
  })

  test('catches fuel eighths out of range', () => {
    const badFuel: DashboardFields = {
      odometer_miles: null,
      odometer_unit: null,
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: 11,  // Should be 0-8
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.8
    }

    const result = validateDashboardExtraction(badFuel)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Fuel eighths must be 0-8 (E=0, F=8)')
  })

  test('catches non-integer fuel eighths', () => {
    const decimalFuel: DashboardFields = {
      odometer_miles: null,
      odometer_unit: null,
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: 4.5,  // Should be whole number
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.8
    }

    const result = validateDashboardExtraction(decimalFuel)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Fuel eighths must be whole number (0-8)')
  })

  test('catches confidence out of range', () => {
    const badConfidence: DashboardFields = {
      odometer_miles: null,
      odometer_unit: null,
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: null,
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 1.5  // Should be 0-1
    }

    const result = validateDashboardExtraction(badConfidence)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Confidence must be 0-1')
  })

  test('catches outside temp without unit', () => {
    const tempNoUnit: DashboardFields = {
      odometer_miles: null,
      odometer_unit: null,
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: null,
      coolant_temp: null,
      outside_temp_value: 72,
      outside_temp_unit: null,  // Missing!
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.8
    }

    const result = validateDashboardExtraction(tempNoUnit)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Outside temp value present but unit missing')
  })

  test('warns on low confidence', () => {
    const lowConfidence: DashboardFields = {
      odometer_miles: null,
      odometer_unit: null,
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: null,
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.3  // Low
    }

    const result = validateDashboardExtraction(lowConfidence)
    
    expect(result.valid).toBe(true)  // Valid but low confidence
    expect(result.warnings).toContain('Low confidence extraction - consider manual review')
  })
})

describe('autoCorrectDashboard', () => {
  test('swaps odometer and trip when obviously wrong', () => {
    const swappedData: DashboardFields = {
      odometer_miles: 234,      // Trip meter value
      odometer_unit: 'mi',
      trip_a_miles: 85432,      // Odometer value
      trip_b_miles: null,
      fuel_eighths: 8,
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.9
    }

    const corrected = autoCorrectDashboard(swappedData)
    
    expect(corrected.odometer_miles).toBe(85432)
    expect(corrected.trip_a_miles).toBe(234)
  })

  test('defaults odometer unit to miles when missing', () => {
    const noUnit: DashboardFields = {
      odometer_miles: 85432,
      odometer_unit: null,  // Missing
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: null,
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.9
    }

    const corrected = autoCorrectDashboard(noUnit)
    
    expect(corrected.odometer_unit).toBe('mi')
  })

  test('rounds non-integer fuel eighths', () => {
    const decimalFuel: DashboardFields = {
      odometer_miles: null,
      odometer_unit: null,
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: 4.7,  // Should round to 5
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.8
    }

    const corrected = autoCorrectDashboard(decimalFuel)
    
    expect(corrected.fuel_eighths).toBe(5)
  })
})

describe('normalizeOdometerToMiles', () => {
  test('converts km to miles', () => {
    const kmData: DashboardFields = {
      odometer_miles: 127856,
      odometer_unit: 'km',
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: null,
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.9
    }

    const normalized = normalizeOdometerToMiles(kmData)
    
    expect(normalized.odometer_miles).toBe(79463)  // 127856 / 1.609 = 79463.35 → rounds to 79463
    expect(normalized.odometer_unit).toBe('mi')
  })

  test('leaves miles unchanged', () => {
    const milesData: DashboardFields = {
      odometer_miles: 85432,
      odometer_unit: 'mi',
      trip_a_miles: null,
      trip_b_miles: null,
      fuel_eighths: null,
      coolant_temp: null,
      outside_temp_value: null,
      outside_temp_unit: null,
      warning_lights: null,
      oil_life_percent: null,
      service_message: null,
      confidence: 0.9
    }

    const normalized = normalizeOdometerToMiles(milesData)
    
    expect(normalized.odometer_miles).toBe(85432)
    expect(normalized.odometer_unit).toBe('mi')
  })
})
