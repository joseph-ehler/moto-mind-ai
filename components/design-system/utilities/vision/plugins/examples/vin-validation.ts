/**
 * VIN Validation Plugin
 * 
 * Validates Vehicle Identification Numbers (VINs) according to ISO 3779 standard
 * 
 * Features:
 * - Length validation (17 characters)
 * - Character validation (no I, O, Q)
 * - Check digit validation (position 9)
 * - Transliteration validation
 * - Clear error messages
 * 
 * @example
 * ```tsx
 * <VINScanner
 *   plugins={[
 *     vinValidation({
 *       validateCheckDigit: true,
 *       strictMode: true,
 *       customMessages: {
 *         invalidLength: 'VIN must be exactly 17 characters'
 *       }
 *     })
 *   ]}
 * />
 * ```
 */

import type { VisionPlugin, VisionPluginFactory } from '../types'

// VIN validation configuration
export interface VINValidationOptions {
  /** Validate the check digit (position 9) */
  validateCheckDigit?: boolean
  
  /** Strict mode - fail on any validation warning */
  strictMode?: boolean
  
  /** Allow lowercase VINs (will be converted to uppercase) */
  allowLowercase?: boolean
  
  /** Custom error messages */
  customMessages?: {
    invalidLength?: string
    invalidCharacters?: string
    invalidCheckDigit?: string
    invalidFormat?: string
  }
  
  /** Callback for validation events */
  onValidation?: (result: VINValidationResult) => void
}

export interface VINValidationResult {
  valid: boolean
  vin: string
  errors: string[]
  warnings: string[]
  normalized?: string
}

// VIN transliteration map (for check digit calculation)
const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
}

// Position weights for check digit calculation
const POSITION_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

/**
 * Normalize VIN (uppercase, trim)
 */
function normalizeVIN(vin: string, allowLowercase: boolean): string {
  let normalized = vin.trim()
  if (allowLowercase) {
    normalized = normalized.toUpperCase()
  }
  return normalized
}

/**
 * Validate VIN length
 */
function validateLength(vin: string): { valid: boolean; error?: string } {
  if (vin.length !== 17) {
    return {
      valid: false,
      error: `VIN must be exactly 17 characters (got ${vin.length})`
    }
  }
  return { valid: true }
}

/**
 * Validate VIN characters (no I, O, Q)
 */
function validateCharacters(vin: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const invalidChars = ['I', 'O', 'Q']
  
  for (let i = 0; i < vin.length; i++) {
    const char = vin[i]
    
    // Check for invalid characters (I, O, Q)
    if (invalidChars.includes(char)) {
      errors.push(`Invalid character '${char}' at position ${i + 1} (I, O, Q not allowed)`)
    }
    
    // Check for valid VIN characters (A-Z, 0-9)
    if (!/^[A-HJ-NPR-Z0-9]$/.test(char)) {
      errors.push(`Invalid character '${char}' at position ${i + 1} (only A-Z, 0-9 allowed)`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Calculate VIN check digit
 * 
 * The check digit is position 9 (index 8) and is calculated using:
 * 1. Transliterate each character to a number
 * 2. Multiply by position weight
 * 3. Sum all values
 * 4. Modulo 11
 * 5. If 10, check digit is 'X', otherwise the digit itself
 */
function calculateCheckDigit(vin: string): string {
  let sum = 0
  
  for (let i = 0; i < 17; i++) {
    const char = vin[i]
    const value = VIN_TRANSLITERATION[char]
    
    if (value === undefined) {
      throw new Error(`Invalid character for check digit: ${char}`)
    }
    
    sum += value * POSITION_WEIGHTS[i]
  }
  
  const remainder = sum % 11
  return remainder === 10 ? 'X' : remainder.toString()
}

/**
 * Validate VIN check digit (position 9)
 */
function validateCheckDigit(vin: string): { valid: boolean; error?: string } {
  const actualCheckDigit = vin[8]
  
  try {
    const expectedCheckDigit = calculateCheckDigit(vin)
    
    if (actualCheckDigit !== expectedCheckDigit) {
      return {
        valid: false,
        error: `Invalid check digit: expected '${expectedCheckDigit}', got '${actualCheckDigit}'`
      }
    }
    
    return { valid: true }
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Check digit validation failed'
    }
  }
}

/**
 * Parse VIN structure
 * 
 * VIN Structure:
 * - Positions 1-3: World Manufacturer Identifier (WMI)
 * - Positions 4-8: Vehicle Descriptor Section (VDS)
 * - Position 9: Check digit
 * - Position 10: Model year
 * - Position 11: Plant code
 * - Positions 12-17: Sequential number
 */
function parseVINStructure(vin: string) {
  return {
    wmi: vin.substring(0, 3),           // World Manufacturer Identifier
    vds: vin.substring(3, 8),           // Vehicle Descriptor Section
    checkDigit: vin[8],                 // Check digit
    modelYear: vin[9],                  // Model year code
    plantCode: vin[10],                 // Manufacturing plant
    sequential: vin.substring(11, 17)   // Sequential number
  }
}

/**
 * Perform complete VIN validation
 */
function validateVIN(
  vin: string,
  options: VINValidationOptions
): VINValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Normalize VIN
  const normalized = normalizeVIN(vin, options.allowLowercase ?? true)
  
  // Length validation
  const lengthResult = validateLength(normalized)
  if (!lengthResult.valid) {
    errors.push(options.customMessages?.invalidLength || lengthResult.error!)
    return { valid: false, vin, errors, warnings }
  }
  
  // Character validation
  const charResult = validateCharacters(normalized)
  if (!charResult.valid) {
    errors.push(
      options.customMessages?.invalidCharacters || 
      `Invalid characters found: ${charResult.errors.join(', ')}`
    )
    if (!options.strictMode) {
      warnings.push(...charResult.errors)
    }
  }
  
  // Check digit validation (optional)
  if (options.validateCheckDigit ?? true) {
    const checkDigitResult = validateCheckDigit(normalized)
    if (!checkDigitResult.valid) {
      const error = options.customMessages?.invalidCheckDigit || checkDigitResult.error!
      if (options.strictMode) {
        errors.push(error)
      } else {
        warnings.push(error)
      }
    }
  }
  
  // Structure validation
  const structure = parseVINStructure(normalized)
  if (!/^[A-HJ-NPR-Z0-9]{3}$/.test(structure.wmi)) {
    warnings.push('World Manufacturer Identifier (WMI) may be invalid')
  }
  
  const valid = errors.length === 0 && (options.strictMode ? warnings.length === 0 : true)
  
  return {
    valid,
    vin: normalized,
    errors,
    warnings,
    normalized
  }
}

/**
 * VIN Validation Plugin Factory
 * 
 * Creates a plugin that validates VINs according to ISO 3779 standard
 */
export const vinValidation: VisionPluginFactory<VINValidationOptions> = (
  options = {}
) => {
  const plugin: VisionPlugin = {
    id: '@motomind/vin-validation',
    version: '1.0.0',
    type: 'validator',
    name: 'VIN Validation',
    
    hooks: {
      /**
       * Validate VIN after capture
       */
      'after-capture': async (result, context) => {
        console.log('🔍 VIN Validation: Validating captured VIN...')
        
        // Only validate VIN capture types
        if (context.captureType !== 'vin') {
          console.log('⏭️  VIN Validation: Not a VIN capture, skipping')
          return result
        }
        
        const vin = result.data?.vin as string
        
        if (!vin || typeof vin !== 'string') {
          console.warn('⚠️  VIN Validation: No VIN found in capture result')
          // Don't throw - mark as invalid instead
          return {
            ...result,
            data: {
              ...result.data,
              validated: false,
              validationErrors: ['No VIN found in image - OCR may have failed']
            }
          }
        }
        
        // Perform validation
        const validation = validateVIN(vin, options)
        
        // Callback
        options.onValidation?.(validation)
        
        // Log results
        console.log('✅ VIN Validation:', {
          vin: validation.vin,
          valid: validation.valid,
          errors: validation.errors.length,
          warnings: validation.warnings.length
        })
        
        if (validation.warnings.length > 0) {
          console.warn('⚠️  VIN Validation Warnings:', validation.warnings)
        }
        
        // Handle validation failure
        if (!validation.valid) {
          const errorMessage = validation.errors.join('; ')
          console.error('❌ VIN Validation Failed:', errorMessage)
          throw new Error(`Invalid VIN: ${errorMessage}`)
        }
        
        // Update result with normalized VIN
        if (validation.normalized && validation.normalized !== vin) {
          console.log('🔄 VIN normalized:', vin, '→', validation.normalized)
          result.data.vin = validation.normalized
        }
        
        // Add validation metadata
        result.metadata = {
          ...result.metadata,
          vinValidation: {
            validated: true,
            warnings: validation.warnings,
            structure: parseVINStructure(validation.vin)
          }
        }
        
        return result
      },
      
      /**
       * Additional validation hook
       */
      'validate-result': async (result) => {
        const vin = result.data?.vin as string
        if (!vin) {
          return false
        }
        
        const validation = validateVIN(vin, options)
        return validation.valid
      }
    }
  }
  
  return plugin
}

// Export validation utilities for standalone use
export {
  validateVIN,
  normalizeVIN,
  validateLength,
  validateCharacters,
  validateCheckDigit,
  calculateCheckDigit,
  parseVINStructure
}
