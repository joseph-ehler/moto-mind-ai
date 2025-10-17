/**
 * Rate Limiter Service Tests
 * 
 * Tests rate limiting functionality:
 * - checkRateLimit() validates attempt allowance
 * - recordAttempt() tracks failed attempts
 * - clearRateLimits() clears on success
 * - formatRetryTime() formats time correctly
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { AttemptType } from '@/lib/auth/services/rate-limiter'

// Polyfill Request for Node environment
global.Request = class Request {
  url: string
  headers: Map<string, string>
  
  constructor(url: string, options?: { headers?: Record<string, string> }) {
    this.url = url
    this.headers = new Map(Object.entries(options?.headers || {}))
  }
  
  get(name: string) {
    return this.headers.get(name) || null
  }
} as any

// Mock Supabase client
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

// Import after mocking
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  clearRateLimits,
  getRetryAfter,
  formatRetryTime,
  getClientIp
} from '@/lib/auth/services/rate-limiter'

describe('Rate Limiter Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkRateLimit()', () => {
    it('should allow first attempt', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No rows found
      })

      const result = await checkRateLimit('user@test.com', 'login')

      expect(result.allowed).toBe(true)
      expect(result.attemptsRemaining).toBe(4) // 5 max - 1 = 4
    })

    it('should block after max attempts', async () => {
      const lockedUntil = new Date(Date.now() + 15 * 60000).toISOString()
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: 'user@test.com',
          attempt_type: 'login',
          attempts: 5,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await checkRateLimit('user@test.com', 'login')

      expect(result.allowed).toBe(false)
      expect(result.retryAfterMinutes).toBe(15)
    })

    it('should respect existing lockout', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60000).toISOString()
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: 'user@test.com',
          attempt_type: 'login',
          attempts: 5,
          window_start: new Date().toISOString(),
          locked_until: lockedUntil,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      const result = await checkRateLimit('user@test.com', 'login')

      expect(result.allowed).toBe(false)
      expect(result.retryAfterMinutes).toBe(10)
    })

    it('should allow after window expires', async () => {
      const expiredWindowStart = new Date(Date.now() - 20 * 60000).toISOString()
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: 'user@test.com',
          attempt_type: 'login',
          attempts: 5,
          window_start: expiredWindowStart,
          locked_until: null,
          last_attempt_at: expiredWindowStart
        },
        error: null
      })

      mockSupabase.upsert.mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await checkRateLimit('user@test.com', 'login')

      expect(result.allowed).toBe(true)
    })

    it('should calculate remaining attempts correctly', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: 'user@test.com',
          attempt_type: 'login',
          attempts: 2,
          window_start: new Date().toISOString(),
          locked_until: null,
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      const result = await checkRateLimit('user@test.com', 'login')

      expect(result.allowed).toBe(true)
      expect(result.attemptsRemaining).toBe(2) // 5 max - 2 used - 1 current = 2
    })

    it('should fail open on database errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'CONNECTION_ERROR', message: 'DB down' }
      })

      const result = await checkRateLimit('user@test.com', 'login')

      expect(result.allowed).toBe(true) // Fail open for availability
    })
  })

  describe('Rate Limit Configuration', () => {
    it('should use correct limits for login attempts', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await checkRateLimit('user@test.com', 'login')

      expect(result.attemptsRemaining).toBe(4) // 5 max for login
    })

    it('should use correct limits for password reset', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await checkRateLimit('user@test.com', 'reset')

      expect(result.attemptsRemaining).toBe(2) // 3 max for reset
    })

    it('should use correct limits for email verification', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await checkRateLimit('user@test.com', 'verify')

      expect(result.attemptsRemaining).toBe(0) // 1 max for verify
    })

    it('should use correct limits for magic links', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await checkRateLimit('user@test.com', 'magic_link')

      expect(result.attemptsRemaining).toBe(2) // 3 max for magic_link
    })
  })

  describe('recordAttempt()', () => {
    it('should increment existing record', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          identifier: 'user@test.com',
          attempt_type: 'login',
          attempts: 2,
          window_start: new Date().toISOString(),
          last_attempt_at: new Date().toISOString()
        },
        error: null
      })

      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null
      })

      await recordAttempt('user@test.com', 'login')

      expect(mockSupabase.update).toHaveBeenCalled()
    })

    it('should create new record if none exists', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null
      })

      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null
      })

      await recordAttempt('user@test.com', 'login')

      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })

  describe('clearRateLimits()', () => {
    it('should delete all records for identifier', async () => {
      mockSupabase.delete.mockResolvedValueOnce({
        data: null,
        error: null
      })

      await clearRateLimits('user@test.com')

      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('identifier', 'user@test.com')
    })
  })

  describe('formatRetryTime()', () => {
    it('should format less than 1 minute', () => {
      expect(formatRetryTime(0)).toBe('less than a minute')
    })

    it('should format 1 minute', () => {
      expect(formatRetryTime(1)).toBe('1 minute')
    })

    it('should format multiple minutes', () => {
      expect(formatRetryTime(15)).toBe('15 minutes')
    })

    it('should format 1 hour', () => {
      expect(formatRetryTime(60)).toBe('1 hour')
    })

    it('should format hours and minutes', () => {
      expect(formatRetryTime(90)).toBe('1 hour and 30 minutes')
    })

    it('should format multiple hours', () => {
      expect(formatRetryTime(125)).toBe('2 hours and 5 minutes')
    })

    it('should format exact hours', () => {
      expect(formatRetryTime(120)).toBe('2 hours')
    })
  })

  describe('getClientIp()', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '203.0.113.1, 198.51.100.1'
            return null
          }
        }
      } as Request

      const ip = getClientIp(mockRequest)

      expect(ip).toBe('203.0.113.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'x-real-ip') return '203.0.113.1'
            return null
          }
        }
      } as Request

      const ip = getClientIp(mockRequest)

      expect(ip).toBe('203.0.113.1')
    })

    it('should fallback to unknown if no headers', () => {
      const mockRequest = {
        headers: {
          get: () => null
        }
      } as Request

      const ip = getClientIp(mockRequest)

      expect(ip).toBe('unknown')
    })
  })

  describe('getRetryAfter()', () => {
    it('should return minutes until lockout expires', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60000).toISOString()
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          locked_until: lockedUntil
        },
        error: null
      })

      const minutes = await getRetryAfter('user@test.com', 'login')

      // Allow for 9-10 minutes due to timing
      expect(minutes).toBeGreaterThanOrEqual(9)
      expect(minutes).toBeLessThanOrEqual(10)
    })

    it('should return null if not locked', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          locked_until: null
        },
        error: null
      })

      const minutes = await getRetryAfter('user@test.com', 'login')

      expect(minutes).toBeNull()
    })

    it('should return null if lockout expired', async () => {
      const expiredLockout = new Date(Date.now() - 5 * 60000).toISOString()
      
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          locked_until: expiredLockout
        },
        error: null
      })

      const minutes = await getRetryAfter('user@test.com', 'login')

      expect(minutes).toBeNull()
    })
  })
})
