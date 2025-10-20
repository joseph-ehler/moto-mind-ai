/**
 * Privacy-by-Design Spine
 * 
 * Central exports for all privacy utilities.
 * 
 * Usage:
 * ```tsx
 * import { maskVIN, scrubPII, DataClassification } from '@/lib/privacy'
 * 
 * // Mask VIN for display
 * const displayVIN = maskVIN(vin) // *****...04352
 * 
 * // Scrub PII from user input
 * const clean = scrubPII(userText)
 * 
 * // Check if field is AI-safe
 * const safe = canUseForAI('vehicle.make')
 * ```
 */

// Classification system
export {
  DataClassification,
  DataPurpose,
  RetentionPeriod,
  FIELD_REGISTRY,
  canUseForAI,
  getAISafeFields,
  requiresConsent,
  getSensitiveFields,
  type DataFieldMetadata,
} from './classification'

// PII scrubbing
export {
  scrubPII,
  containsPII,
  extractPII,
  validateNoPII,
} from './scrubber'

// Masking for display
export {
  maskVIN,
  maskEmail,
  maskPhone,
  maskGPS,
  maskCreditCard,
  maskAddress,
  maskGeneric,
  maskObject,
} from './masking'
