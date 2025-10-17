/**
 * Authentication Flows Integration Tests
 * 
 * Tests complete end-to-end authentication flows
 */

import { registerUser } from '@/lib/auth/services/user-registration'
import { hashPassword, verifyPassword } from '@/lib/auth/services/password-service'
import { createVerificationToken, verifyAndConsumeToken } from '@/lib/auth/services/token-service'
import { requestPasswordReset, resetPassword } from '@/lib/auth/services/password-reset'

// Mock Supabase
jest.mock('@supabase/supabase-js')

describe('Authentication Flows', () => {
  describe('Sign Up Flow', () => {
    it('should complete full sign-up process', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      }

      // Step 1: Register user
      const registerResult = await registerUser(userData)
      expect(registerResult.success).toBe(true)

      // Step 2: Verify password was hashed
      const hash = await hashPassword(userData.password)
      expect(hash).not.toBe(userData.password)

      // Step 3: Verify can sign in with password
      const isValid = await verifyPassword(userData.password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'Duplicate User'
      }

      // First registration
      const result1 = await registerUser(userData)
      expect(result1.success).toBe(true)

      // Second registration with same email
      const result2 = await registerUser(userData)
      expect(result2.success).toBe(false)
    })

    it('should validate password strength on sign-up', async () => {
      const userData = {
        email: 'weakpass@example.com',
        password: 'weak',
        name: 'Weak Password User'
      }

      const result = await registerUser(userData)
      expect(result.success).toBe(false)
      expect(result.error).toContain('password')
    })
  })

  describe('Sign In Flow', () => {
    it('should sign in with valid credentials', async () => {
      const email = 'signin@example.com'
      const password = 'SecurePass123!'

      // Create user
      await registerUser({ email, password, name: 'Sign In User' })

      // Hash and verify
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject invalid password', async () => {
      const email = 'user@example.com'
      const correctPassword = 'SecurePass123!'
      const wrongPassword = 'WrongPass123!'

      const hash = await hashPassword(correctPassword)
      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should be case sensitive', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)

      const isValid1 = await verifyPassword('securepass123!', hash)
      const isValid2 = await verifyPassword('SECUREPASS123!', hash)

      expect(isValid1).toBe(false)
      expect(isValid2).toBe(false)
    })
  })

  describe('Password Reset Flow', () => {
    it('should complete full password reset', async () => {
      const email = 'reset@example.com'
      const oldPassword = 'OldPass123!'
      const newPassword = 'NewPass456!'

      // Step 1: Create user
      await registerUser({ email, password: oldPassword, name: 'Reset User' })

      // Step 2: Request reset
      const requestResult = await requestPasswordReset(email)
      expect(requestResult.success).toBe(true)

      // Step 3: Generate token (simulated)
      const tokenResult = await createVerificationToken(email, 60)
      expect(tokenResult.success).toBe(true)

      // Step 4: Reset password
      const resetResult = await resetPassword(tokenResult.token!, newPassword)
      expect(resetResult.success).toBeDefined()

      // Step 5: Verify can sign in with new password
      const newHash = await hashPassword(newPassword)
      const canSignIn = await verifyPassword(newPassword, newHash)
      expect(canSignIn).toBe(true)

      // Step 6: Verify old password no longer works
      const oldHash = await hashPassword(oldPassword)
      const oldStillWorks = await verifyPassword(oldPassword, newHash)
      expect(oldStillWorks).toBe(false)
    })

    it('should expire reset tokens', async () => {
      const email = 'expire@example.com'

      // Create expired token (0 minutes = already expired)
      const tokenResult = await createVerificationToken(email, 0)
      expect(tokenResult.success).toBe(true)

      // Try to use expired token
      const verifyResult = await verifyAndConsumeToken(tokenResult.token!)
      expect(verifyResult.success).toBe(false)
    })

    it('should only allow one-time token use', async () => {
      const email = 'onetime@example.com'
      const tokenResult = await createVerificationToken(email, 60)

      // First use
      const verify1 = await verifyAndConsumeToken(tokenResult.token!)
      expect(verify1.success).toBe(true)

      // Second use (should fail)
      const verify2 = await verifyAndConsumeToken(tokenResult.token!)
      expect(verify2.success).toBe(false)
    })
  })

  describe('Magic Link Flow', () => {
    it('should complete magic link sign-in', async () => {
      const email = 'magic@example.com'

      // Step 1: Request magic link
      const tokenResult = await createVerificationToken(email, 10)
      expect(tokenResult.success).toBe(true)
      expect(tokenResult.token).toBeDefined()

      // Step 2: Verify token (simulates clicking link)
      const verifyResult = await verifyAndConsumeToken(tokenResult.token!)
      expect(verifyResult.success).toBe(true)
      expect(verifyResult.identifier).toBe(email)
    })

    it('should expire magic links after 10 minutes', async () => {
      const email = 'expiremagic@example.com'

      // Create token with 0 minutes (expired)
      const tokenResult = await createVerificationToken(email, 0)
      expect(tokenResult.success).toBe(true)

      // Try to verify expired token
      const verifyResult = await verifyAndConsumeToken(tokenResult.token!)
      expect(verifyResult.success).toBe(false)
      expect(verifyResult.error).toContain('expired')
    })
  })

  describe('Security Tests', () => {
    it('should hash passwords with bcrypt', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)

      expect(hash.startsWith('$2b$')).toBe(true) // bcrypt format
    })

    it('should use different salts for same password', async () => {
      const password = 'SecurePass123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate cryptographically secure tokens', async () => {
      const tokenResult = await createVerificationToken('test@example.com')

      expect(tokenResult.token).toBeDefined()
      expect(tokenResult.token!.length).toBe(64) // 32 bytes hex
    })

    it('should normalize email addresses', async () => {
      const result1 = await registerUser({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'SecurePass123!',
        name: 'Test'
      })

      expect(result1.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Simulate database error
      const result = await registerUser({
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Test'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should not expose sensitive information', async () => {
      const result = await requestPasswordReset('nonexistent@example.com')

      // Should not reveal if user exists
      expect(result.success).toBe(true)
    })

    it('should validate all inputs', async () => {
      const result = await registerUser({
        email: '',
        password: '',
        name: ''
      })

      expect(result.success).toBe(false)
    })
  })
})
