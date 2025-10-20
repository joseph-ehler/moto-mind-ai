/**
 * PII Scrubber
 * 
 * Removes or masks PII from free-text before sending to AI or logs.
 * 
 * Detects:
 * - Email addresses
 * - Phone numbers (US/international)
 * - VINs (17-character codes)
 * - Addresses (basic patterns)
 * - Credit cards
 * - SSN/Tax IDs
 * 
 * Usage:
 * ```tsx
 * const cleaned = scrubPII("My VIN is 1HGCM82633A004352 and email is joe@example.com")
 * // Result: "My VIN is [VIN_REDACTED] and email is [EMAIL_REDACTED]"
 * ```
 */

// Regex patterns for PII detection
const PATTERNS = {
  // Email: user@domain.com
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone: (123) 456-7890, 123-456-7890, +1 123 456 7890
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  
  // VIN: 17 alphanumeric (no I, O, Q)
  vin: /\b[A-HJ-NPR-Z0-9]{17}\b/g,
  
  // Credit Card: 13-19 digits with optional spaces/dashes
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4,7}\b/g,
  
  // SSN: 123-45-6789
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // Address (basic): 123 Main St, 456 Oak Ave
  address: /\b\d{1,5}\s+([A-Z][a-z]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct)\b/gi,
}

/**
 * Scrub PII from text
 */
export function scrubPII(text: string): string {
  let cleaned = text
  
  // Replace each PII type with a placeholder
  cleaned = cleaned.replace(PATTERNS.email, '[EMAIL_REDACTED]')
  cleaned = cleaned.replace(PATTERNS.phone, '[PHONE_REDACTED]')
  cleaned = cleaned.replace(PATTERNS.vin, '[VIN_REDACTED]')
  cleaned = cleaned.replace(PATTERNS.creditCard, '[CARD_REDACTED]')
  cleaned = cleaned.replace(PATTERNS.ssn, '[SSN_REDACTED]')
  cleaned = cleaned.replace(PATTERNS.address, '[ADDRESS_REDACTED]')
  
  return cleaned
}

/**
 * Check if text contains PII
 */
export function containsPII(text: string): boolean {
  return Object.values(PATTERNS).some(pattern => pattern.test(text))
}

/**
 * Extract specific PII type
 */
export function extractPII(text: string): {
  emails: string[]
  phones: string[]
  vins: string[]
  addresses: string[]
} {
  return {
    emails: text.match(PATTERNS.email) || [],
    phones: text.match(PATTERNS.phone) || [],
    vins: text.match(PATTERNS.vin) || [],
    addresses: text.match(PATTERNS.address) || [],
  }
}

/**
 * Validate that text is PII-free (for AI input)
 */
export function validateNoPII(text: string): { valid: boolean; reason?: string } {
  const pii = extractPII(text)
  
  if (pii.emails.length > 0) {
    return { valid: false, reason: `Contains ${pii.emails.length} email(s)` }
  }
  if (pii.phones.length > 0) {
    return { valid: false, reason: `Contains ${pii.phones.length} phone number(s)` }
  }
  if (pii.vins.length > 0) {
    return { valid: false, reason: `Contains ${pii.vins.length} VIN(s)` }
  }
  if (pii.addresses.length > 0) {
    return { valid: false, reason: `Contains ${pii.addresses.length} address(es)` }
  }
  
  return { valid: true }
}
