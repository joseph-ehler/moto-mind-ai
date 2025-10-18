/**
 * Email Utility Functions (Client-safe)
 * 
 * Helper functions for email validation and formatting
 * Safe to import on client-side
 */

/**
 * Email validation regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Check for common email typos and suggest corrections
 */
export function suggestEmailCorrection(email: string): string | null {
  const commonTypos: Record<string, string> = {
    'gnail.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
  }
  
  const [localPart, domain] = email.split('@')
  if (!domain) return null
  
  const suggestion = commonTypos[domain.toLowerCase()]
  if (suggestion) {
    return `${localPart}@${suggestion}`
  }
  
  return null
}
