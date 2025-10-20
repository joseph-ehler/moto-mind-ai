/**
 * Response Validation Tests
 * 
 * Tests for Zod schema validation and redacted logging.
 */

import { z } from 'zod'
import { validateResponse, isValidResponse, getValidationErrors, getRedactedPreview } from '@/lib/wizard/data-sources/response-validator'
import { DataSourceError, DataSourceErrorCode } from '@/lib/wizard/data-sources/errors'

describe('Response Validator', () => {
  const TestSchema = z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
  })
  
  describe('validateResponse', () => {
    test('validates correct data', () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      }
      
      const result = validateResponse(data, TestSchema, 'testSource')
      
      expect(result).toEqual(data)
    })
    
    test('throws on validation failure', () => {
      const data = {
        name: 'John Doe',
        age: 'thirty', // Should be number
        email: 'invalid-email',
      }
      
      expect(() => {
        validateResponse(data, TestSchema, 'testSource')
      }).toThrow(DataSourceError)
    })
    
    test('thrown error has VALIDATION code', () => {
      const data = { name: 'John', age: 'invalid', email: 'bad' }
      
      try {
        validateResponse(data, TestSchema, 'testSource')
        fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(DataSourceError)
        expect((error as DataSourceError).code).toBe(DataSourceErrorCode.VALIDATION)
      }
    })
    
    test('includes validation issues in error details', () => {
      const data = { name: 'John', age: 'invalid', email: 'bad' }
      
      try {
        validateResponse(data, TestSchema, 'testSource')
        fail('Should have thrown')
      } catch (error) {
        const dsError = error as DataSourceError
        expect(dsError.details?.issues).toBeDefined()
        expect(Array.isArray(dsError.details?.issues)).toBe(true)
        expect(dsError.details?.issues.length).toBeGreaterThan(0)
      }
    })
    
    test('transforms data according to schema', () => {
      const TransformSchema = z.object({
        count: z.string().transform(val => parseInt(val, 10)),
      })
      
      const data = { count: '42' }
      const result = validateResponse(data, TransformSchema, 'testSource')
      
      expect(result.count).toBe(42)
      expect(typeof result.count).toBe('number')
    })
  })
  
  describe('isValidResponse', () => {
    test('returns true for valid data', () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      }
      
      expect(isValidResponse(data, TestSchema)).toBe(true)
    })
    
    test('returns false for invalid data', () => {
      const data = {
        name: 'John Doe',
        age: 'thirty',
        email: 'invalid',
      }
      
      expect(isValidResponse(data, TestSchema)).toBe(false)
    })
    
    test('does not throw', () => {
      const data = { invalid: 'data' }
      
      expect(() => isValidResponse(data, TestSchema)).not.toThrow()
    })
  })
  
  describe('getValidationErrors', () => {
    test('returns null for valid data', () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      }
      
      expect(getValidationErrors(data, TestSchema)).toBeNull()
    })
    
    test('returns errors for invalid data', () => {
      const data = {
        name: 'John Doe',
        age: 'thirty',
        email: 'invalid',
      }
      
      const errors = getValidationErrors(data, TestSchema)
      
      expect(errors).not.toBeNull()
      expect(Array.isArray(errors)).toBe(true)
      expect(errors!.length).toBeGreaterThan(0)
      expect(errors![0]).toHaveProperty('path')
      expect(errors![0]).toHaveProperty('message')
    })
    
    test('includes correct paths', () => {
      const data = {
        name: 'John Doe',
        age: 'thirty',
        email: 'invalid',
      }
      
      const errors = getValidationErrors(data, TestSchema)
      
      const paths = errors!.map(e => e.path)
      expect(paths).toContain('age')
      expect(paths).toContain('email')
    })
  })
  
  describe('getRedactedPreview', () => {
    test('redacts string values', () => {
      const data = {
        password: 'supersecret123',
        apiKey: 'sk_live_abc123def456',
      }
      
      const preview = getRedactedPreview(data)
      
      expect(preview.password).not.toBe('supersecret123')
      expect(preview.password).toMatch(/\*\*\*/)
      expect(preview.apiKey).toMatch(/\*\*\*/)
    })
    
    test('shows numbers and booleans', () => {
      const data = {
        count: 42,
        isActive: true,
      }
      
      const preview = getRedactedPreview(data)
      
      expect(preview.count).toBe(42)
      expect(preview.isActive).toBe(true)
    })
    
    test('redacts nested objects', () => {
      const data = {
        user: {
          email: 'test@example.com',
          password: 'secret',
        },
      }
      
      // Use depth 3 to see the actual strings
      const preview = getRedactedPreview(data, 3)
      
      expect(preview.user).toBeDefined()
      // Email: 'test@example.com' (16 chars) -> '***e.com (16 chars)'
      expect(preview.user.email).toContain('***')
      expect(preview.user.email).toContain('16 chars')
      // Password: 'secret' (6 chars) -> '***cret (6 chars)'
      expect(preview.user.password).toContain('***')
    })
    
    test('redacts arrays', () => {
      const data = {
        tokens: ['token1', 'token2', 'token3'],
      }
      
      // Use depth 3 to see the actual redacted strings
      const preview = getRedactedPreview(data, 3)
      
      expect(Array.isArray(preview.tokens)).toBe(true)
      // First item is redacted
      expect(preview.tokens[0]).toContain('***')
      // Second item shows "... 2 more"
      expect(preview.tokens[1]).toBe('... 2 more')
    })
    
    test('respects depth limit', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              secret: 'value',
            },
          },
        },
      }
      
      const preview = getRedactedPreview(data, 2)
      
      expect(preview.level1).toBeDefined()
      expect(preview.level1.level2).toBeDefined()
      // At depth 2, level3 becomes '...'
      expect(preview.level1.level2).toBe('...')
    })
    
    test('handles null and undefined', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
      }
      
      const preview = getRedactedPreview(data)
      
      expect(preview.nullValue).toBeNull()
      expect(preview.undefinedValue).toBeUndefined()
    })
    
    test('shows last 4 chars of strings', () => {
      const data = {
        token: 'sk_live_1234567890abcdef',
      }
      
      const preview = getRedactedPreview(data)
      
      // String longer than 4: '***cdef (24 chars)'
      expect(preview.token).toContain('cdef')
      expect(preview.token).toContain('24 chars')
    })
    
    test('fully masks short strings', () => {
      const data = {
        pin: '1234',
      }
      
      const preview = getRedactedPreview(data)
      
      expect(preview.pin).toBe('***')
    })
  })
})
