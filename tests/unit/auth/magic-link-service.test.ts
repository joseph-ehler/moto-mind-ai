/**
 * Magic Link Service Tests
 * 
 * Tests for magic link creation, verification, and expiration
 */

// Mock Supabase first (before imports)
const mockSupabase = {
  from: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  lt: jest.fn(),
  single: jest.fn()
}

// Setup chainable methods
mockSupabase.from.mockReturnValue(mockSupabase)
mockSupabase.insert.mockReturnValue(mockSupabase)
mockSupabase.update.mockReturnValue(mockSupabase)
mockSupabase.delete.mockReturnValue(mockSupabase)
mockSupabase.select.mockReturnValue(mockSupabase)
mockSupabase.eq.mockReturnValue(mockSupabase)
mockSupabase.lt.mockReturnValue(mockSupabase)

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase
}))

// Mock rate limiter
jest.mock('@/lib/auth/services/rate-limiter', () => ({
  checkRateLimit: jest.fn(),
  recordAttempt: jest.fn(),
  getClientIp: jest.fn(() => '127.0.0.1')
}))

import { 
  createMagicLink, 
  verifyMagicLink, 
  getTimeRemaining,
  cleanupExpiredLinks 
} from '@/lib/auth/services/magic-link-service'

const { checkRateLimit, recordAttempt } = require('@/lib/auth/services/rate-limiter')

describe('Magic Link Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createMagicLink()', () => {
    it('should create a magic link with 15-minute expiration', async () => {
      // Mock rate limit check (allowed)
      checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 2
      })

      // Mock database insert
      mockSupabase.insert.mockResolvedValue({ error: null })

      const result = await createMagicLink('test@example.com', '127.0.0.1')

      expect(result.success).toBe(true)
      expect(result.token).toBeDefined()
      expect(result.token?.length).toBe(64) // 32 bytes hex = 64 chars
      expect(result.expiresAt).toBeDefined()

      // Check expiration is ~15 minutes from now
      const expiryTime = result.expiresAt!.getTime()
      const expectedExpiry = Date.now() + 15 * 60000
      const timeDiff = Math.abs(expiryTime - expectedExpiry)
      expect(timeDiff).toBeLessThan(1000) // Within 1 second

      // Verify database was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('magic_links')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          email: 'test@example.com',
          expires_at: expect.any(String),
          ip_address: '127.0.0.1',
          used: false
        })
      )
    })

    it('should enforce rate limiting (3 per hour)', async () => {
      // Mock rate limit exceeded
      checkRateLimit.mockResolvedValue({
        allowed: false,
        retryAfterMinutes: 45
      })

      const result = await createMagicLink('test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Too many magic link requests')
      expect(result.error).toContain('45 minutes')
      expect(recordAttempt).toHaveBeenCalledWith('test@example.com', 'magic_link')
    })

    it('should track IP address', async () => {
      checkRateLimit.mockResolvedValue({ allowed: true })
      mockSupabase.insert.mockResolvedValue({ error: null })

      await createMagicLink('test@example.com', '192.168.1.100')

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: '192.168.1.100'
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      checkRateLimit.mockResolvedValue({ allowed: true })
      mockSupabase.insert.mockResolvedValue({ 
        error: new Error('Database error') 
      })

      const result = await createMagicLink('test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create magic link')
    })
  })

  describe('verifyMagicLink()', () => {
    it('should verify valid unexpired token', async () => {
      const futureTime = new Date(Date.now() + 10 * 60000).toISOString() // 10 min future

      mockSupabase.single.mockResolvedValue({
        data: {
          token: 'valid-token',
          email: 'test@example.com',
          expires_at: futureTime,
          used: false,
          ip_address: '127.0.0.1'
        },
        error: null
      })

      mockSupabase.update.mockResolvedValue({ error: null })

      const result = await verifyMagicLink('valid-token', '127.0.0.1')

      expect(result.success).toBe(true)
      expect(result.email).toBe('test@example.com')

      // Verify token was marked as used
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          used: true,
          used_at: expect.any(String)
        })
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('token', 'valid-token')
    })

    it('should reject already used token', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          token: 'used-token',
          email: 'test@example.com',
          expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
          used: true // Already used!
        },
        error: null
      })

      const result = await verifyMagicLink('used-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('This link has already been used')
      expect(result.errorCode).toBe('USED')

      // Should NOT update database
      expect(mockSupabase.update).not.toHaveBeenCalled()
    })

    it('should reject expired token', async () => {
      const pastTime = new Date(Date.now() - 5 * 60000).toISOString() // 5 min ago

      mockSupabase.single.mockResolvedValue({
        data: {
          token: 'expired-token',
          email: 'test@example.com',
          expires_at: pastTime,
          used: false
        },
        error: null
      })

      const result = await verifyMagicLink('expired-token')

      expect(result.success).toBe(false)
      expect(result.error).toContain('expired')
      expect(result.errorCode).toBe('EXPIRED')
    })

    it('should reject invalid token', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const result = await verifyMagicLink('invalid-token')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid or expired')
      expect(result.errorCode).toBe('INVALID')
    })

    it('should warn on IP mismatch (but still allow)', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockSupabase.single.mockResolvedValue({
        data: {
          token: 'valid-token',
          email: 'test@example.com',
          expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
          used: false,
          ip_address: '127.0.0.1' // Different from request
        },
        error: null
      })

      mockSupabase.update.mockResolvedValue({ error: null })

      const result = await verifyMagicLink('valid-token', '192.168.1.100')

      expect(result.success).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('IP mismatch')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getTimeRemaining()', () => {
    it('should return seconds remaining until expiration', async () => {
      const futureTime = new Date(Date.now() + 5 * 60000).toISOString() // 5 min

      mockSupabase.single.mockResolvedValue({
        data: {
          expires_at: futureTime,
          used: false
        },
        error: null
      })

      const remaining = await getTimeRemaining('test-token')

      expect(remaining).toBeGreaterThan(299) // At least 4:59
      expect(remaining).toBeLessThanOrEqual(300) // At most 5:00
    })

    it('should return 0 for expired token', async () => {
      const pastTime = new Date(Date.now() - 5 * 60000).toISOString()

      mockSupabase.single.mockResolvedValue({
        data: {
          expires_at: pastTime,
          used: false
        },
        error: null
      })

      const remaining = await getTimeRemaining('test-token')

      expect(remaining).toBe(0)
    })

    it('should return null for used token', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          expires_at: new Date(Date.now() + 5 * 60000).toISOString(),
          used: true
        },
        error: null
      })

      const remaining = await getTimeRemaining('test-token')

      expect(remaining).toBeNull()
    })

    it('should return null for invalid token', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const remaining = await getTimeRemaining('invalid-token')

      expect(remaining).toBeNull()
    })
  })

  describe('cleanupExpiredLinks()', () => {
    it('should delete expired links', async () => {
      mockSupabase.delete.mockResolvedValue({
        error: null,
        count: 5
      })

      const result = await cleanupExpiredLinks()

      expect(result.deleted).toBe(5)
      expect(mockSupabase.from).toHaveBeenCalledWith('magic_links')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.lt).toHaveBeenCalledWith(
        'expires_at',
        expect.any(String)
      )
    })

    it('should handle cleanup errors gracefully', async () => {
      mockSupabase.delete.mockResolvedValue({
        error: new Error('Cleanup failed'),
        count: null
      })

      const result = await cleanupExpiredLinks()

      expect(result.deleted).toBe(0)
    })
  })

  describe('Security Features', () => {
    it('should generate cryptographically secure tokens', async () => {
      checkRateLimit.mockResolvedValue({ allowed: true })
      mockSupabase.insert.mockResolvedValue({ error: null })

      const tokens = new Set()
      
      // Generate 10 tokens
      for (let i = 0; i < 10; i++) {
        const result = await createMagicLink('test@example.com')
        tokens.add(result.token)
      }

      // All tokens should be unique
      expect(tokens.size).toBe(10)
      
      // All tokens should be 64 characters (32 bytes hex)
      tokens.forEach(token => {
        expect(token).toHaveLength(64)
        expect(token).toMatch(/^[0-9a-f]{64}$/)
      })
    })

    it('should enforce one-time use strictly', async () => {
      const token = 'test-token'
      const futureTime = new Date(Date.now() + 10 * 60000).toISOString()

      mockSupabase.single.mockResolvedValue({
        data: {
          token,
          email: 'test@example.com',
          expires_at: futureTime,
          used: false
        },
        error: null
      })

      mockSupabase.update.mockResolvedValue({ error: null })

      // First use - should succeed
      const result1 = await verifyMagicLink(token)
      expect(result1.success).toBe(true)

      // Update mock to show token is now used
      mockSupabase.single.mockResolvedValue({
        data: {
          token,
          email: 'test@example.com',
          expires_at: futureTime,
          used: true // Now marked as used
        },
        error: null
      })

      // Second use - should fail
      const result2 = await verifyMagicLink(token)
      expect(result2.success).toBe(false)
      expect(result2.errorCode).toBe('USED')
    })
  })
})
