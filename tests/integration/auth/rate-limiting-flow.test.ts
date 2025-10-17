/**
 * Rate Limiting Integration Tests
 * 
 * Tests rate limiting in actual auth flows:
 * - Login attempts are rate limited
 * - Password reset is rate limited
 * - Clear error messages shown
 * - Lockout enforced correctly
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  rpc: jest.fn().mockReturnThis()
}

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabase
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn()
}))

import { checkRateLimit, recordAttempt, clearRateLimits } from '@/lib/auth/services/rate-limiter'

describe('Rate Limiting Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login Rate Limiting Flow', () => {
    it('should allow 5 login attempts within window', async () => {
      const email = 'user@test.com'

      // Mock no existing record
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null
      })

      mockSupabase.update.mockResolvedValue({
        data: null,
        error: null
      })

      // Attempt 1-4: Should all be allowed
      for (let i = 0; i < 4; i++) {
        const result = await checkRateLimit(email, 'login')
        expect(result.allowed).toBe(true)
        
        // Record failed attempt
        await recordAttempt(email, 'login')
        
        // Mock increasing attempts
        mockSupabase.single.mockResolvedValueOnce({
          data: {
            identifier: email,
            attempt_type: 'login',
            attempts: i + 1,
            window_start: new Date().toISOString(),
            locked_until: null,
            last_attempt_at: new Date().toISOString()
          },
          error: null
        })
      }

      // Attempt 5: Should be allowed but will trigger lockout
      const fifthAttempt = await checkRateLimit(email, 'login')
      expect(fifthAttempt.allowed).toBe(true)

      // Mock lockout after 5th failed attempt
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'login',
          attempts: 5,
          window_start: new Date().toISOString(),
          locked_until: new Date(Date.now() + 15 * 60000).toISOString(),
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      // Attempt 6: Should be blocked
      const sixthAttempt = await checkRateLimit(email, 'login')
      expect(sixthAttempt.allowed).toBe(false)
      expect(sixthAttempt.retryAfterMinutes).toBe(15)
    })

    it('should clear rate limits after successful login', async () => {
      const email = 'user@test.com'

      mockSupabase.delete.mockResolvedValueOnce({
        data: null,
        error: null
      })

      await clearRateLimits(email)

      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('identifier', email)
    })

    it('should provide accurate retry time in error message', async () => {
      const email = 'user@test.com'
      const lockedUntil = new Date(Date.now() + 12 * 60000) // 12 minutes
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'login',
          attempts: 5,
          window_start: new Date().toISOString(),
          locked_until: lockedUntil.toISOString(),
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      const result = await checkRateLimit(email, 'login')

      expect(result.allowed).toBe(false)
      expect(result.retryAfterMinutes).toBe(12)
    })
  })

  describe('Password Reset Rate Limiting', () => {
    it('should allow 3 reset attempts within window', async () => {
      const email = 'user@test.com'

      // Mock no existing record
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      // First attempt
      const first = await checkRateLimit(email, 'reset')
      expect(first.allowed).toBe(true)
      expect(first.attemptsRemaining).toBe(2) // 3 max - 1 = 2

      // Mock 1 attempt
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'reset',
          attempts: 1,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      // Second attempt
      const second = await checkRateLimit(email, 'reset')
      expect(second.allowed).toBe(true)
      expect(second.attemptsRemaining).toBe(1) // 3 max - 1 used - 1 current = 1

      // Mock 2 attempts
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'reset',
          attempts: 2,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      // Third attempt
      const third = await checkRateLimit(email, 'reset')
      expect(third.allowed).toBe(true)
      expect(third.attemptsRemaining).toBe(0)

      // Mock 3 attempts (will trigger lockout)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'reset',
          attempts: 3,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      // Fourth attempt - should be blocked
      const fourth = await checkRateLimit(email, 'reset')
      expect(fourth.allowed).toBe(false)
      expect(fourth.retryAfterMinutes).toBe(60) // 1 hour lockout
    })
  })

  describe('Email Verification Rate Limiting', () => {
    it('should allow only 1 verification request per 5 minutes', async () => {
      const email = 'user@test.com'

      // First attempt - allowed
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const first = await checkRateLimit(email, 'verify')
      expect(first.allowed).toBe(true)
      expect(first.attemptsRemaining).toBe(0) // 1 max - 1 = 0

      // Mock 1 attempt
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'verify',
          attempts: 1,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      // Second attempt - should be blocked
      const second = await checkRateLimit(email, 'verify')
      expect(second.allowed).toBe(false)
      expect(second.retryAfterMinutes).toBe(5)
    })
  })

  describe('Window Expiration', () => {
    it('should reset after window expires', async () => {
      const email = 'user@test.com'
      const expiredWindowStart = new Date(Date.now() - 20 * 60000) // 20 minutes ago

      // Mock expired window
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'login',
          attempts: 5, // Was locked out
          window_start: expiredWindowStart.toISOString(),
          locked_until: null,
          last_attempt_at: expiredWindowStart.toISOString()
        },
        error: null
      })

      mockSupabase.upsert.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await checkRateLimit(email, 'login')

      // Should be allowed because window expired
      expect(result.allowed).toBe(true)
      expect(mockSupabase.upsert).toHaveBeenCalled()
    })
  })

  describe('Multiple Action Types', () => {
    it('should track login and reset separately', async () => {
      const email = 'user@test.com'

      // Mock login attempts
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'login',
          attempts: 3,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      const loginResult = await checkRateLimit(email, 'login')
      expect(loginResult.allowed).toBe(true)
      expect(loginResult.attemptsRemaining).toBe(1) // 5 - 3 - 1 = 1

      // Mock reset attempts (separate tracking)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: email,
          attempt_type: 'reset',
          attempts: 1,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      const resetResult = await checkRateLimit(email, 'reset')
      expect(resetResult.allowed).toBe(true)
      expect(resetResult.attemptsRemaining).toBe(1) // 3 - 1 - 1 = 1

      // Login should still have its own count
      expect(loginResult.attemptsRemaining).not.toBe(resetResult.attemptsRemaining)
    })
  })

  describe('Error Handling', () => {
    it('should fail open on database errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Connection failed' }
      })

      const result = await checkRateLimit('user@test.com', 'login')

      // Should allow to maintain availability
      expect(result.allowed).toBe(true)
    })

    it('should handle missing data gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: undefined,
        error: null
      })

      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null
      })

      // Should not throw
      await expect(recordAttempt('user@test.com', 'login')).resolves.not.toThrow()
    })
  })
})
