/**
 * Password Service
 * 
 * Handles password hashing, verification, and validation
 * Uses bcrypt for secure password hashing
 */

import bcrypt from 'bcryptjs'

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional for better UX
}

/**
 * Password validation result
 */
export interface PasswordValidation {
  valid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
  score: number // 0-100
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // Recommended by OWASP
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error('[PASSWORD] Verification failed:', error)
    return false
  }
}

/**
 * Validate password strength and requirements
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  } else {
    score += 20
    // Bonus for longer passwords
    if (password.length >= 12) score += 10
    if (password.length >= 16) score += 10
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  }

  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else if (/[A-Z]/.test(password)) {
    score += 15
  }

  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else if (/[a-z]/.test(password)) {
    score += 15
  }

  // Number check
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else if (/[0-9]/.test(password)) {
    score += 15
  }

  // Special character check (optional but gives bonus)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15
  }

  // Check for common patterns (reduce score)
  if (/^[0-9]+$/.test(password)) {
    score -= 20
    errors.push('Password should not be only numbers')
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 10
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 10 // Repeated characters
  }

  // Common password check
  if (isCommonPassword(password)) {
    errors.push('This password is too common. Please choose a more unique password')
    score = Math.min(score, 30)
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong'
  if (score < 40) {
    strength = 'weak'
  } else if (score < 70) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return {
    valid: errors.length === 0 && score >= 40,
    errors,
    strength,
    score: Math.max(0, Math.min(100, score)),
  }
}

/**
 * Check if password is in common password list
 * (This is a simplified check - in production, use a larger list)
 */
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    'password123',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
    '654321',
    'superman',
    'qazwsx',
    'michael',
    'football',
  ]

  const lowerPassword = password.toLowerCase()
  return commonPasswords.some(common => lowerPassword.includes(common))
}

/**
 * Generate a secure random password
 * Useful for temporary passwords or password reset suggestions
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + special
  
  let password = ''
  
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(
  strength: 'weak' | 'medium' | 'strong'
): string {
  switch (strength) {
    case 'weak':
      return '#ef4444' // red-500
    case 'medium':
      return '#f59e0b' // amber-500
    case 'strong':
      return '#10b981' // green-500
  }
}

/**
 * Get password strength label for UI
 */
export function getPasswordStrengthLabel(
  strength: 'weak' | 'medium' | 'strong'
): string {
  switch (strength) {
    case 'weak':
      return 'Weak'
    case 'medium':
      return 'Medium'
    case 'strong':
      return 'Strong'
  }
}
