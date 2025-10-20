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
    
    test('includes details', () => {
      const error = new DataSourceError(
        DataSourceErrorCode.HTTP_5XX,
        'Server error',
        { status: 503, url: '/api/test' }
      )
      
      expect(error.details).toEqual({ status: 503, url: '/api/test' })
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
    
    test('classifies DataSourceError by message pattern', () => {
      const error = new DataSourceError(
        DataSourceErrorCode.HTTP_5XX,
        'HTTP 503'
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
      expect(classified.message).toBe('An unexpected error occurred.')
    })
    
    test('handles null/undefined', () => {
      const classified = classifyError(null)
      
      expect(classified.code).toBe(DataSourceErrorCode.UNKNOWN)
      expect(classified.message).toBe('An unexpected error occurred.')
    })
  })
  
  describe('Retryable Classification', () => {
    const retryableCodes = [
      DataSourceErrorCode.TIMEOUT,
      DataSourceErrorCode.NETWORK,
      DataSourceErrorCode.HTTP_5XX,
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
      DataSourceErrorCode.CB_OPEN,
    ]
    
    test.each(retryableCodes)('marks %s as retryable', (code) => {
      // Create error messages that will match the classification patterns
      const messages = {
        [DataSourceErrorCode.TIMEOUT]: 'timeout',
        [DataSourceErrorCode.NETWORK]: 'network error',
        [DataSourceErrorCode.HTTP_5XX]: 'HTTP 500',
      }
      const error = new DataSourceError(code, messages[code])
      const classified = classifyError(error)
      
      expect(classified.retryable).toBe(true)
    })
    
    test.each(nonRetryableCodes)('marks %s as non-retryable', (code) => {
      // Create error messages that will match the classification patterns
      const messages = {
        [DataSourceErrorCode.ABORTED]: 'aborted',
        [DataSourceErrorCode.HTTP_4XX]: 'HTTP 400',
        [DataSourceErrorCode.VALIDATION]: 'validation failed',
        [DataSourceErrorCode.PRIVACY_BLOCKED]: 'privacy violation',
        [DataSourceErrorCode.SSRF_BLOCKED]: 'not allowed',
        [DataSourceErrorCode.HTTPS_REQUIRED]: 'HTTPS required',
        [DataSourceErrorCode.SOURCE_NOT_FOUND]: 'not found',
        [DataSourceErrorCode.INVALID_CONFIG]: 'invalid config',
        [DataSourceErrorCode.CB_OPEN]: 'CB_OPEN',
      }
      const error = new DataSourceError(code, messages[code])
      const classified = classifyError(error)
      
      expect(classified.retryable).toBe(false)
    })
  })
  
  describe('Error Messages', () => {
    test('classifies unknown errors with default message', () => {
      const error = new Error('Custom error message')
      const classified = classifyError(error)
      
      expect(classified.code).toBe(DataSourceErrorCode.UNKNOWN)
      expect(classified.message).toBe('An unexpected error occurred.')
    })
    
    test('uses default messages for classified errors', () => {
      const error = new DataSourceError(
        DataSourceErrorCode.TIMEOUT,
        'timeout'
      )
      const classified = classifyError(error)
      
      expect(classified.code).toBe(DataSourceErrorCode.TIMEOUT)
      expect(classified.message).toBe('Request timed out. Please try again.')
    })
  })
})
