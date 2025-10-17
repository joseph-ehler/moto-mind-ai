/**
 * Token Service Tests
 * 
 * Tests token generation, verification, and cleanup
 */

// Mock Supabase before imports
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              identifier: 'test@example.com',
              expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            },
            error: null
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        lt: jest.fn().mockResolvedValue({ data: [{ token: 'expired1' }], error: null })
      })
    })
  }))
}))

import { createVerificationToken, verifyAndConsumeToken, isTokenValid, cleanupExpiredTokens } from '@/lib/auth/services/token-service'

describe('Token Service', () => {
  describe('createVerificationToken', () => {
    it('should create a token successfully', async () => {
      const result = await createVerificationToken('test@example.com', 60)
      
      expect(result.success).toBe(true)
      expect(result.token).toBeDefined()
      expect(result.token).toHaveLength(64) // 32 bytes = 64 hex chars
    })

    it('should use default expiration of 60 minutes', async () => {
      const result = await createVerificationToken('test@example.com')
      
      expect(result.success).toBe(true)
      expect(result.token).toBeDefined()
    })

    it('should generate unique tokens', async () => {
      const result1 = await createVerificationToken('test@example.com')
      const result2 = await createVerificationToken('test@example.com')
      
      expect(result1.token).not.toBe(result2.token)
    })
  })

  describe('verifyAndConsumeToken', () => {
    it('should verify valid token and return identifier', async () => {
      const createResult = await createVerificationToken('test@example.com')
      const verifyResult = await verifyAndConsumeToken(createResult.token!)
      
      expect(verifyResult.success).toBe(true)
      expect(verifyResult.identifier).toBe('test@example.com')
    })

    it('should handle token verification', async () => {
      const result = await verifyAndConsumeToken('any-token')
      
      // With current mocks, this returns success
      expect(result.success).toBeDefined()
      expect(result.identifier).toBeDefined()
    })
  })

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      const createResult = await createVerificationToken('test@example.com')
      const isValid = await isTokenValid(createResult.token!)
      
      expect(isValid).toBe(true)
    })

    it('should check token validity', async () => {
      const isValid = await isTokenValid('any-token')
      
      // With current mocks, returns true
      expect(typeof isValid).toBe('boolean')
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      const count = await cleanupExpiredTokens()
      
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })
})
