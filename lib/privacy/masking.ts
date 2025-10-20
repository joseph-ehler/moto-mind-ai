/**
 * Masking Utilities
 * 
 * Display PII safely in UI/logs by masking sensitive parts.
 * 
 * Examples:
 * - VIN: 1HGCM82633A004352 → *****...04352
 * - Email: joe@example.com → j**@example.com
 * - Phone: (555) 123-4567 → (***) ***-4567
 * - GPS: 37.7749, -122.4194 → 37.77**, -122.41**
 */

/**
 * Mask VIN (show last 5 digits only)
 */
export function maskVIN(vin: string): string {
  if (!vin || vin.length < 5) {
    return '***'
  }
  
  if (vin.length !== 17) {
    // Not a valid VIN, mask most of it
    return '*'.repeat(Math.max(vin.length - 3, 0)) + vin.slice(-3)
  }
  
  // Standard VIN: show last 5
  return '*****...' + vin.slice(-5)
}

/**
 * Mask email (show first char + domain)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***'
  }
  
  const [local, domain] = email.split('@')
  
  if (local.length <= 1) {
    return `*@${domain}`
  }
  
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`
}

/**
 * Mask phone number (show last 4 digits)
 */
export function maskPhone(phone: string): string {
  // Extract digits only
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length < 4) {
    return '***'
  }
  
  if (digits.length === 10) {
    // US format: (***) ***-1234
    return `(***) ***-${digits.slice(-4)}`
  }
  
  if (digits.length === 11 && digits[0] === '1') {
    // US with country code: +1 (***) ***-1234
    return `+1 (***) ***-${digits.slice(-4)}`
  }
  
  // International: +** *** *** 1234
  return `+${'*'.repeat(Math.min(digits.length - 4, 3))} ${digits.slice(-4)}`
}

/**
 * Mask GPS coordinates (2 decimal places)
 */
export function maskGPS(lat: number, lng: number): { lat: string; lng: string } {
  // Show 2 decimal places, mask the rest
  return {
    lat: lat.toFixed(2) + '**',
    lng: lng.toFixed(2) + '**',
  }
}

/**
 * Mask credit card (show last 4 digits)
 */
export function maskCreditCard(card: string): string {
  const digits = card.replace(/\D/g, '')
  
  if (digits.length < 4) {
    return '****'
  }
  
  return `**** **** **** ${digits.slice(-4)}`
}

/**
 * Mask address (show street number + first word only)
 */
export function maskAddress(address: string): string {
  const parts = address.trim().split(/\s+/)
  
  if (parts.length <= 2) {
    return parts[0] + ' ***'
  }
  
  // Show "123 Main ***"
  return `${parts[0]} ${parts[1]} ***`
}

/**
 * Mask generic sensitive data (show first/last chars)
 */
export function maskGeneric(value: string, showChars: number = 2): string {
  if (!value || value.length <= showChars * 2) {
    return '*'.repeat(value.length)
  }
  
  const maskLength = value.length - (showChars * 2)
  return value.slice(0, showChars) + '*'.repeat(maskLength) + value.slice(-showChars)
}

/**
 * Safe display object (masks all sensitive fields)
 */
export function maskObject<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[]
): T {
  const masked = { ...obj } as Record<string, any>
  
  sensitiveFields.forEach(field => {
    if (field in masked) {
      masked[field] = maskGeneric(String(masked[field]))
    }
  })
  
  return masked as T
}
