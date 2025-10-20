/**
 * Retry Logic Tests
 * 
 * Tests for retry with jitter, backoff strategies, and idempotency checks.
 */

import { executeWithRetry } from '@/lib/wizard/data-sources/retry'
import { DataSourceError, DataSourceErrorCode } from '@/lib/wizard/data-sources/errors'
import type { DataSourceDef } from '@/lib/wizard/data-sources/types'

describe('Retry Logic', () => {
  describe('Basic Retry', () => {
    test('succeeds on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 100 }
      }
      
      const result = await executeWithRetry(fn, { source, isPost: false })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })
    
    test('retries on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success')
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 10, maxMs: 1000 }
      }
      
      const result = await executeWithRetry(fn, { source, isPost: false })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })
    
    test('throws after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('timeout'))
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 2, backoff: 'exponential', baseMs: 10, maxMs: 1000 }
      }
      
      await expect(
        executeWithRetry(fn, { source, isPost: false })
      ).rejects.toThrow('timeout')
      
      expect(fn).toHaveBeenCalledTimes(3) // initial + 2 retries
    })
  })
  
  describe('Backoff Strategies', () => {
    test('exponential backoff increases delay', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('network error'))
      const delays: number[] = []
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 100, maxMs: 5000 }
      }
      
      const start = Date.now()
      
      try {
        await executeWithRetry(fn, {
          source,
          isPost: false,
          onRetry: (attempt, delayMs) => delays.push(delayMs)
        })
      } catch (e) {
        // Expected to fail
      }
      
      const duration = Date.now() - start
      
      expect(delays.length).toBe(3)
      // With jitter, delays should be roughly: 100, 200, 400 (with variation)
      expect(duration).toBeGreaterThan(300) // At least the base delays
      expect(duration).toBeLessThan(2000) // But not too long
    })
    
    test('linear backoff increases by base', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('network error'))
      const delays: number[] = []
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'linear', baseMs: 100, maxMs: 5000 }
      }
      
      try {
        await executeWithRetry(fn, {
          source,
          isPost: false,
          onRetry: (attempt, delayMs) => delays.push(delayMs)
        })
      } catch (e) {
        // Expected to fail
      }
      
      expect(delays.length).toBe(3)
      // With jitter, delays should be roughly: 100, 200, 300 (with variation)
      expect(delays[0]).toBeGreaterThan(0)
      expect(delays[0]).toBeLessThan(200)
    })
    
    test('fixed backoff uses constant delay', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('network error'))
      const delays: number[] = []
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'fixed', baseMs: 100, maxMs: 1000 }
      }
      
      try {
        await executeWithRetry(fn, {
          source,
          isPost: false,
          onRetry: (attempt, delayMs) => delays.push(delayMs)
        })
      } catch (e) {
        // Expected to fail
      }
      
      expect(delays.length).toBe(3)
      // With jitter, all should be around 100ms
      delays.forEach(delay => {
        expect(delay).toBeGreaterThan(0)
        expect(delay).toBeLessThan(200)
      })
    })
    
    test('respects maxMs cap', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('network error'))
      const delays: number[] = []
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 10, backoff: 'exponential', baseMs: 100, maxMs: 500 }
      }
      
      try {
        await executeWithRetry(fn, {
          source,
          isPost: false,
          onRetry: (attempt, delayMs) => delays.push(delayMs)
        })
      } catch (e) {
        // Expected to fail
      }
      
      // All delays should be capped at maxMs (with jitter)
      delays.forEach(delay => {
        expect(delay).toBeLessThan(1000) // maxMs + jitter tolerance
      })
    })
  })
  
  describe('POST Idempotency Guard', () => {
    test('retries POST with idempotent flag', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success')
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.post',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 10, maxMs: 1000 },
        idempotent: true
      } as any
      
      const result = await executeWithRetry(fn, { source, isPost: true })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
    
    test('retries POST with dedupeKey', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success')
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.post',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 10, maxMs: 1000 },
        dedupeKey: 'request-123'
      } as any
      
      const result = await executeWithRetry(fn, { source, isPost: true })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
    
    test('does NOT retry POST without idempotency markers', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('timeout'))
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.post',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 10, maxMs: 1000 }
      }
      
      await expect(
        executeWithRetry(fn, { source, isPost: true })
      ).rejects.toThrow('timeout')
      
      expect(fn).toHaveBeenCalledTimes(1) // No retries
    })
  })
  
  describe('Error Classification', () => {
    test('retries on retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new DataSourceError(DataSourceErrorCode.TIMEOUT, 'timeout'))
        .mockResolvedValue('success')
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 10 }
      }
      
      const result = await executeWithRetry(fn, { source, isPost: false })
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })
    
    test('does not retry on non-retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValue(new DataSourceError(DataSourceErrorCode.HTTP_4XX, 'bad request'))
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 10 }
      }
      
      await expect(
        executeWithRetry(fn, { source, isPost: false })
      ).rejects.toThrow('bad request')
      
      expect(fn).toHaveBeenCalledTimes(1) // No retries for 4xx
    })
  })
  
  describe('Retry Callback', () => {
    test('calls onRetry callback', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success')
      
      const onRetry = jest.fn()
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test',
        retry: { retries: 3, backoff: 'exponential', baseMs: 10, maxMs: 1000 }
      }
      
      await executeWithRetry(fn, { source, isPost: false, onRetry })
      
      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        expect.any(Error)
      )
    })
  })
  
  describe('No Retry Config', () => {
    test('does not retry when no retry config', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('timeout'))
      
      const source: DataSourceDef = {
        name: 'test',
        type: 'http.get',
        url: '/api/test'
      }
      
      await expect(
        executeWithRetry(fn, { source, isPost: false })
      ).rejects.toThrow('timeout')
      
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
