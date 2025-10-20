/**
 * Error Taxonomy Tests
 * 
 * Tests for error classification and DataSourceError.
 */

import { DataSourceError, DataSourceErrorCode, classifyError } from '@/lib/wizard/data-sources/errors'

describe('Error Taxonomy', () => {
  describe('DataSourceError', () => {
    test('creates error with code and message', () => {
      const error = new DataSourceError(
        DataSourceErrorCode.TIMEOUT,
        'Request timed out'
      )
      
      expect(error.code).toBe(DataSourceErrorCode.TIMEOUT)
      expect(error.message).toBe('Request timed out')
      expect(error.name).toBe('DataSourceError')
    })
    
    test('includes metadata', () => {
      const error = new DataSourceError(
        DataSourceErrorCode.HTTP_5XX,
        'Server error',
        { status: 503, url: '/api/test' }
      )
      
      expect(error.metadata).toEqual({ status: 503, url: '/api/test' })
    })
    
    test('is instanceof Error', () => {
      const error = new DataSourceError(DataSourceErrorCode.UNKNOWN, 'test')
      expect(error instanceof Error).toBe(true)
    })
  })
  
  describe('classifyError', () => {
    test('classifies timeout errors', () => {
      const error = new Error('timeout')
      const classified = classifyError(error)
      
      expect(classified.code).toBe(DataSourceErrorCode.TIMEOUT)
      expect(classified.retryable).toBe(true)
    })
    
    test('classifies abort errors', () => {
      const error = new Error('abort')
      error.name = 'AbortError'
      const classified = classifyError(error)
      
      expect(classified.code).toBe(DataSourceErrorCode.ABORTED)
      expect(classified.retryable).toBe(false)
    })
    
    test('classifies network errors', () => {
      const error = new Error('network')
      const classified = classifyError(error)
      
      expect(classified.code).toBe(DataSourceErrorCode.NETWORK)
      expect(classified.retryable).toBe(true)
    })
    
    test('classifies DataSourceError', () => {
      const error = new DataSourceError(
        DataSourceErrorCode.HTTP_5XX,
        'Server error'
      )
      const classified = classifyError(error)
      
      expect(classified.code).toBe(DataSourceErrorCode.HTTP_5XX)
      expect(classified.retryable).toBe(true)
    })
    
    test('classifies unknown errors', () => {
      const error = new Error('Something weird happened')
      const classified = classifyError(error)
      
      expect(classified.code).toBe(DataSourceErrorCode.UNKNOWN)
      expect(classified.retryable).toBe(false)
    })
    
    test('handles non-Error objects', () => {
      const classified = classifyError('string error')
      
      expect(classified.code).toBe(DataSourceErrorCode.UNKNOWN)
      expect(classified.message).toContain('string error')
    })
    
    test('handles null/undefined', () => {
      const classified = classifyError(null)
      
      expect(classified.code).toBe(DataSourceErrorCode.UNKNOWN)
      expect(classified.message).toBe('Unknown error')
    })
  })
  
  describe('Retryable Classification', () => {
    const retryableCodes = [
      DataSourceErrorCode.TIMEOUT,
      DataSourceErrorCode.NETWORK,
      DataSourceErrorCode.HTTP_5XX,
      DataSourceErrorCode.CB_OPEN,
    ]
    
    const nonRetryableCodes = [
      DataSourceErrorCode.ABORTED,
      DataSourceErrorCode.HTTP_4XX,
      DataSourceErrorCode.VALIDATION,
      DataSourceErrorCode.PRIVACY_BLOCKED,
      DataSourceErrorCode.SSRF_BLOCKED,
      DataSourceErrorCode.HTTPS_REQUIRED,
      DataSourceErrorCode.SOURCE_NOT_FOUND,
      DataSourceErrorCode.INVALID_CONFIG,
    ]
    
    test.each(retryableCodes)('marks %s as retryable', (code) => {
      const error = new DataSourceError(code, 'test')
      const classified = classifyError(error)
      
      expect(classified.retryable).toBe(true)
    })
    
    test.each(nonRetryableCodes)('marks %s as non-retryable', (code) => {
      const error = new DataSourceError(code, 'test')
      const classified = classifyError(error)
      
      expect(classified.retryable).toBe(false)
    })
  })
  
  describe('Error Messages', () => {
    test('uses error message from Error object', () => {
      const error = new Error('Custom error message')
      const classified = classifyError(error)
      
      expect(classified.message).toContain('Custom error message')
    })
    
    test('preserves DataSourceError message', () => {
      const error = new DataSourceError(
        DataSourceErrorCode.TIMEOUT,
        'Custom timeout message'
      )
      const classified = classifyError(error)
      
      expect(classified.message).toBe('Custom timeout message')
    })
  })
})
