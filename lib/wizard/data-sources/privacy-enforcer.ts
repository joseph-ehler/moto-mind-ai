/**
 * Ultra God-Tier Wizard: Privacy Enforcer
 * 
 * Enforces privacy rules before data source execution:
 * - Mask sensitive fields in logs
 * - Block SENSITIVE + allowInAI: true without consent
 * - Allowlist headers only
 * 
 * Phase B-3: Data Source Registry
 */

import type { DataSourceDef, PrivacyViolation } from './types'
import type { PrivacyConfig } from '../flow-schema'

// ============================================================================
// PRIVACY ENFORCEMENT
// ============================================================================

/**
 * Check if data source violates privacy rules
 */
export function checkPrivacyViolations(
  source: DataSourceDef,
  strictMode: boolean
): PrivacyViolation[] {
  const violations: PrivacyViolation[] = []
  
  // Check 1: Privacy block required in strict mode
  if (strictMode && !source.privacy) {
    violations.push({
      field: source.name,
      reason: 'Missing privacy configuration',
      classification: 'UNKNOWN',
      suggestion: 'Add privacy block with classification, purpose, retention, allowInAI',
    })
  }
  
  if (!source.privacy) {
    return violations
  }
  
  // Check 2: SENSITIVE data with allowInAI: true requires consent
  if (
    source.privacy.classification === 'SENSITIVE' &&
    source.privacy.allowInAI === true &&
    !source.privacy.needsConsent
  ) {
    violations.push({
      field: source.name,
      reason: 'SENSITIVE data with allowInAI: true requires needsConsent: true',
      classification: source.privacy.classification,
      suggestion: 'Set needsConsent: true or allowInAI: false',
    })
  }
  
  return violations
}

/**
 * Mask sensitive value in logs
 */
export function maskValue(value: string, privacy?: PrivacyConfig): string {
  if (!privacy || !privacy.maskInLogs) {
    return value
  }
  
  // Show last 4 characters only
  if (value.length <= 4) {
    return '***'
  }
  
  return '*'.repeat(value.length - 4) + value.slice(-4)
}

/**
 * Mask sensitive fields in object for logging
 */
export function maskForLogs(
  obj: Record<string, any>,
  privacy?: PrivacyConfig
): Record<string, any> {
  if (!privacy || !privacy.maskInLogs) {
    return obj
  }
  
  const masked: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      masked[key] = maskValue(value, privacy)
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskForLogs(value, privacy)
    } else {
      masked[key] = value
    }
  }
  
  return masked
}

/**
 * Allowlist headers
 * 
 * Only allow safe headers, block:
 * - Authorization
 * - Cookie
 * - Any header with PII
 */
export function allowlistHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const allowed = new Set([
    'content-type',
    'accept',
    'user-agent',
    'x-trace-id',
    'x-request-id',
    'x-tenant',
    'x-flow-id',
    'x-api-version',
  ])
  
  const filtered: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    
    // Check if allowlisted
    if (allowed.has(lowerKey) || lowerKey.startsWith('x-')) {
      filtered[key] = value
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[DataSource] Header blocked: ${key}`)
      }
    }
  }
  
  return filtered
}

/**
 * Check if max payload size exceeded
 */
export function checkPayloadSize(
  data: any,
  maxSizeKB = 64
): { ok: boolean; sizeKB: number } {
  const str = JSON.stringify(data)
  const sizeKB = new Blob([str]).size / 1024
  
  return {
    ok: sizeKB <= maxSizeKB,
    sizeKB,
  }
}
