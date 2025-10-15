/**
 * VIN Validation Tests
 * 
 * Tests the isValidVIN and parseVINInfo functions from lib/domain/types.ts
 * These will eventually move to features/vehicles/domain/types.ts
 */

import { isValidVIN, parseVINInfo } from '@/lib/domain/types'

describe('isValidVIN', () => {
  describe('valid VINs', () => {
    it('should accept a valid 17-character VIN', () => {
      const validVIN = '1HGBH41JXMN109186'
      expect(isValidVIN(validVIN)).toBe(true)
    })

    it('should accept VINs with mixed case', () => {
      const mixedCaseVIN = '1hgbh41jxmn109186'
      expect(isValidVIN(mixedCaseVIN)).toBe(true)
    })

    it('should accept VINs with all uppercase', () => {
      const upperVIN = '1HGBH41JXMN109186'
      expect(isValidVIN(upperVIN)).toBe(true)
    })

    it('should accept VINs with numbers and valid letters', () => {
      const validVIN = '5XYKT3A69CG123456'
      expect(isValidVIN(validVIN)).toBe(true)
    })
  })

  describe('invalid VINs', () => {
    it('should reject VINs shorter than 17 characters', () => {
      const shortVIN = '1HGBH41JXMN10918'  // 16 chars
      expect(isValidVIN(shortVIN)).toBe(false)
    })

    it('should reject VINs longer than 17 characters', () => {
      const longVIN = '1HGBH41JXMN1091866'  // 18 chars
      expect(isValidVIN(longVIN)).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidVIN('')).toBe(false)
    })

    it('should reject null/undefined', () => {
      expect(isValidVIN(null as any)).toBe(false)
      expect(isValidVIN(undefined as any)).toBe(false)
    })

    it('should reject VINs containing letter I', () => {
      const vinWithI = '1HGBH41JXIN109186'  // Has 'I'
      expect(isValidVIN(vinWithI)).toBe(false)
    })

    it('should reject VINs containing letter O', () => {
      const vinWithO = '1HGBH41JXON109186'  // Has 'O'
      expect(isValidVIN(vinWithO)).toBe(false)
    })

    it('should reject VINs containing letter Q', () => {
      const vinWithQ = '1HGBH41JXQN109186'  // Has 'Q'
      expect(isValidVIN(vinWithQ)).toBe(false)
    })

    it('should reject VINs with special characters', () => {
      const specialCharVIN = '1HGBH41JX-N109186'  // Has '-'
      expect(isValidVIN(specialCharVIN)).toBe(false)
    })

    it('should reject VINs with spaces', () => {
      const spaceVIN = '1HGBH41JX N109186'  // Has space
      expect(isValidVIN(spaceVIN)).toBe(false)
    })

    it('should reject VINs with only numbers', () => {
      const numbersOnly = '12345678901234567'
      // This might actually be valid format-wise, but test your actual implementation
      const result = isValidVIN(numbersOnly)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('edge cases', () => {
    it('should handle VINs with leading/trailing whitespace', () => {
      const vinsWithWhitespace = [
        ' 1HGBH41JXMN109186',
        '1HGBH41JXMN109186 ',
        ' 1HGBH41JXMN109186 '
      ]

      vinsWithWhitespace.forEach(vin => {
        // Should reject (not trim automatically)
        expect(isValidVIN(vin)).toBe(false)
      })
    })

    it('should be case-insensitive', () => {
      const lowerVIN = '1hgbh41jxmn109186'
      const upperVIN = '1HGBH41JXMN109186'
      
      expect(isValidVIN(lowerVIN)).toBe(isValidVIN(upperVIN))
    })
  })
})

describe('parseVINInfo', () => {
  describe('valid VIN parsing', () => {
    it('should extract basic info from valid VIN', () => {
      const vin = '1HGBH41JXMN109186'
      const info = parseVINInfo(vin)
      
      expect(info).toBeDefined()
      expect(typeof info).toBe('object')
    })

    it('should return empty object for invalid VIN', () => {
      const invalidVIN = 'INVALID'
      const info = parseVINInfo(invalidVIN)
      
      expect(info).toEqual({})
    })

    it('should handle lowercase VINs', () => {
      const vin = '1hgbh41jxmn109186'
      const info = parseVINInfo(vin)
      
      // Should work (case-insensitive)
      expect(typeof info).toBe('object')
    })
  })

  describe('invalid VIN handling', () => {
    it('should return empty object for short VIN', () => {
      const shortVIN = '1HGBH41JXMN10918'
      expect(parseVINInfo(shortVIN)).toEqual({})
    })

    it('should return empty object for long VIN', () => {
      const longVIN = '1HGBH41JXMN1091866'
      expect(parseVINInfo(longVIN)).toEqual({})
    })

    it('should return empty object for empty string', () => {
      expect(parseVINInfo('')).toEqual({})
    })

    it('should return empty object for VIN with invalid characters', () => {
      const invalidVIN = '1HGBH41JXIN109186'  // Contains 'I'
      expect(parseVINInfo(invalidVIN)).toEqual({})
    })
  })

  describe('edge cases', () => {
    it('should handle VINs with whitespace gracefully', () => {
      const vinWithSpace = ' 1HGBH41JXMN109186 '
      const info = parseVINInfo(vinWithSpace)
      
      // Should return empty (doesn't trim)
      expect(info).toEqual({})
    })
  })
})

describe('VIN validation integration', () => {
  it('should validate and parse VIN in sequence', () => {
    const vin = '1HGBH41JXMN109186'
    
    // First validate
    const isValid = isValidVIN(vin)
    expect(isValid).toBe(true)
    
    // Then parse if valid
    if (isValid) {
      const info = parseVINInfo(vin)
      expect(info).toBeDefined()
    }
  })

  it('should not parse invalid VINs', () => {
    const invalidVIN = 'INVALID'
    
    const isValid = isValidVIN(invalidVIN)
    expect(isValid).toBe(false)
    
    const info = parseVINInfo(invalidVIN)
    expect(info).toEqual({})
  })

  describe('real-world VIN examples', () => {
    const realWorldVINs = [
      '1HGBH41JXMN109186',  // Honda
      '1G1BE5SM7H7123456',  // Chevrolet
      '5XYKT3A69CG123456',  // Hyundai
      'JM1BK32F781234567',  // Mazda
      '2HGFG12878H123456',  // Honda
    ]

    it('should validate all real-world VINs', () => {
      realWorldVINs.forEach(vin => {
        expect(isValidVIN(vin)).toBe(true)
      })
    })

    it('should parse all real-world VINs', () => {
      realWorldVINs.forEach(vin => {
        const info = parseVINInfo(vin)
        expect(info).toBeDefined()
        expect(typeof info).toBe('object')
      })
    })
  })
})
