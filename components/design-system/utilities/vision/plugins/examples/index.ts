/**
 * Vision Plugin Examples
 * 
 * Production-ready example plugins demonstrating the Vision plugin system
 * 
 * Available Plugins:
 * - VIN Validation: Validates VINs according to ISO 3779 standard
 * - Confidence Scoring: Enforces minimum confidence thresholds
 * - VIN Decoding: Decodes VINs to extract vehicle information
 * 
 * @example
 * ```tsx
 * import { vinValidation, confidenceScoring, vinDecoding } from './plugins/examples'
 * 
 * <VINScanner
 *   plugins={[
 *     vinValidation({ validateCheckDigit: true }),
 *     confidenceScoring({ minConfidence: 0.90 }),
 *     vinDecoding({ apiProvider: 'nhtsa' })
 *   ]}
 * />
 * ```
 */

// Plugin exports
export { vinValidation } from './vin-validation'
export type { 
  VINValidationOptions,
  VINValidationResult 
} from './vin-validation'

export { confidenceScoring } from './confidence-scoring'
export type { 
  ConfidenceScoringOptions,
  ConfidenceCheckResult 
} from './confidence-scoring'

export { vinDecoding } from './vin-decoding'
export type { 
  VINDecodingOptions,
  DecodedVehicleInfo 
} from './vin-decoding'

// Utility exports
export {
  validateVIN,
  normalizeVIN,
  parseVINStructure,
  calculateCheckDigit
} from './vin-validation'

export {
  getConfidenceColor,
  getConfidenceLabel,
  checkConfidence
} from './confidence-scoring'

export {
  decodeVIN,
  extractModelYear,
  extractManufacturer
} from './vin-decoding'
