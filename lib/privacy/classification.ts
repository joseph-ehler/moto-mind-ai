/**
 * Data Classification System
 * 
 * Every piece of data must be classified for privacy compliance.
 * Tags control how data is stored, processed, and shared.
 * 
 * Philosophy: Privacy by default, explicit opt-in for everything
 */

/**
 * Data Classification Levels
 */
export enum DataClassification {
  PUBLIC = 'PUBLIC',                 // Can be shown to anyone (make/model)
  OPERATIONAL = 'OPERATIONAL',       // Internal operations (session IDs)
  PSEUDONYMIZED = 'PSEUDONYMIZED',   // No direct PII but quasi-identifiers
  SENSITIVE = 'SENSITIVE',           // PII or quasi-PII (VIN, location)
}

/**
 * Data Purpose (why we collect it)
 */
export enum DataPurpose {
  ONBOARDING = 'onboarding',         // User setup flow
  SAFETY = 'safety',                 // Crash detection, emergencies
  ANALYTICS = 'analytics',           // Usage patterns, improvements
  SUPPORT = 'support',               // Customer service
  FEATURES = 'features',             // Core functionality
  LEGAL = 'legal',                   // Compliance, fraud prevention
}

/**
 * Retention Period
 */
export enum RetentionPeriod {
  SESSION = 'session',               // Clear on logout
  DAYS_30 = '30d',                   // 30 days
  DAYS_180 = '180d',                 // 180 days
  UNTIL_DELETE = 'until-delete',     // Keep until user deletes
  LEGAL_MINIMUM = 'legal-minimum',   // Legal requirements (varies)
}

/**
 * Data Field Metadata
 */
export interface DataFieldMetadata {
  // What sensitivity level?
  classification: DataClassification
  
  // Why do we collect it?
  purpose: DataPurpose[]
  
  // How long do we keep it?
  retention: RetentionPeriod
  
  // Can it be used for AI training?
  doNotTrain: boolean
  
  // Do we need explicit consent?
  needsConsent: boolean
  
  // Description (for privacy center)
  description?: string
}

/**
 * Field Registry
 * 
 * Centralized registry of all data fields and their classifications
 */
export const FIELD_REGISTRY: Record<string, DataFieldMetadata> = {
  // Vehicle data
  'vehicle.vin': {
    classification: DataClassification.SENSITIVE,
    purpose: [DataPurpose.ONBOARDING, DataPurpose.FEATURES],
    retention: RetentionPeriod.UNTIL_DELETE,
    doNotTrain: true,
    needsConsent: false, // Core functionality
    description: 'Vehicle Identification Number',
  },
  'vehicle.year': {
    classification: DataClassification.PUBLIC,
    purpose: [DataPurpose.ONBOARDING, DataPurpose.FEATURES],
    retention: RetentionPeriod.UNTIL_DELETE,
    doNotTrain: false,
    needsConsent: false,
    description: 'Vehicle year',
  },
  'vehicle.make': {
    classification: DataClassification.PUBLIC,
    purpose: [DataPurpose.ONBOARDING, DataPurpose.FEATURES],
    retention: RetentionPeriod.UNTIL_DELETE,
    doNotTrain: false,
    needsConsent: false,
    description: 'Vehicle manufacturer',
  },
  'vehicle.model': {
    classification: DataClassification.PUBLIC,
    purpose: [DataPurpose.ONBOARDING, DataPurpose.FEATURES],
    retention: RetentionPeriod.UNTIL_DELETE,
    doNotTrain: false,
    needsConsent: false,
    description: 'Vehicle model',
  },
  
  // Location data
  'location.gps': {
    classification: DataClassification.SENSITIVE,
    purpose: [DataPurpose.FEATURES, DataPurpose.SAFETY],
    retention: RetentionPeriod.DAYS_180,
    doNotTrain: true,
    needsConsent: true,
    description: 'GPS coordinates',
  },
  
  // User data
  'user.email': {
    classification: DataClassification.SENSITIVE,
    purpose: [DataPurpose.ONBOARDING, DataPurpose.SUPPORT],
    retention: RetentionPeriod.UNTIL_DELETE,
    doNotTrain: true,
    needsConsent: false,
    description: 'Email address',
  },
  'user.phone': {
    classification: DataClassification.SENSITIVE,
    purpose: [DataPurpose.SAFETY, DataPurpose.SUPPORT],
    retention: RetentionPeriod.UNTIL_DELETE,
    doNotTrain: true,
    needsConsent: true,
    description: 'Phone number',
  },
  
  // Analytics
  'analytics.deviceId': {
    classification: DataClassification.PSEUDONYMIZED,
    purpose: [DataPurpose.ANALYTICS],
    retention: RetentionPeriod.DAYS_180,
    doNotTrain: false,
    needsConsent: true,
    description: 'Anonymous device identifier',
  },
  'analytics.sessionId': {
    classification: DataClassification.OPERATIONAL,
    purpose: [DataPurpose.ANALYTICS],
    retention: RetentionPeriod.DAYS_30,
    doNotTrain: false,
    needsConsent: false,
    description: 'Session identifier',
  },
}

/**
 * Check if a field can be used for AI
 */
export function canUseForAI(fieldPath: string): boolean {
  const metadata = FIELD_REGISTRY[fieldPath]
  if (!metadata) {
    // Conservative default: don't use if not registered
    return false
  }
  return !metadata.doNotTrain
}

/**
 * Get fields that are safe for AI (allowlist)
 */
export function getAISafeFields(): string[] {
  return Object.entries(FIELD_REGISTRY)
    .filter(([_, metadata]) => !metadata.doNotTrain)
    .map(([fieldPath]) => fieldPath)
}

/**
 * Check if field requires consent
 */
export function requiresConsent(fieldPath: string): boolean {
  const metadata = FIELD_REGISTRY[fieldPath]
  return metadata?.needsConsent ?? true // Conservative default
}

/**
 * Get all sensitive fields (for extra protection)
 */
export function getSensitiveFields(): string[] {
  return Object.entries(FIELD_REGISTRY)
    .filter(([_, metadata]) => metadata.classification === DataClassification.SENSITIVE)
    .map(([fieldPath]) => fieldPath)
}
