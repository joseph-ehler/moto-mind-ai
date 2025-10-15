/**
 * Image Validation Domain Logic Tests
 * 
 * Tests pure business logic functions.
 * No mocking needed - these are pure functions!
 */

import { describe, it, expect } from '@jest/globals'
import {
  validateImage,
  shouldCompressImage,
  calculateCompressionQuality,
  DEFAULT_IMAGE_CONFIG,
  type ImageMetadata
} from '../image-validation'

describe('Image Validation Domain Logic', () => {
  describe('validateImage()', () => {
    it('should accept valid images', () => {
      const validImage: ImageMetadata = {
        size: 2 * 1024 * 1024, // 2MB
        type: 'image/jpeg',
        width: 1920,
        height: 1080
      }

      const result = validateImage(validImage)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject oversized images', () => {
      const oversizedImage: ImageMetadata = {
        size: 15 * 1024 * 1024, // 15MB (over 10MB limit)
        type: 'image/jpeg'
      }

      const result = validateImage(oversizedImage)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true)
    })

    it('should reject invalid formats', () => {
      const invalidFormat: ImageMetadata = {
        size: 1 * 1024 * 1024,
        type: 'image/gif'
      }

      const result = validateImage(invalidFormat)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('not supported'))).toBe(true)
    })

    it('should warn about large images', () => {
      const largeImage: ImageMetadata = {
        size: 8 * 1024 * 1024, // 8MB (under limit but large)
        type: 'image/jpeg'
      }

      const result = validateImage(largeImage)

      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should validate image dimensions', () => {
      const tooSmall: ImageMetadata = {
        size: 1 * 1024 * 1024,
        type: 'image/jpeg',
        width: 320,  // Below 640 minimum
        height: 240  // Below 480 minimum
      }

      const result = validateImage(tooSmall)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('width'))).toBe(true)
      expect(result.errors.some(e => e.includes('height'))).toBe(true)
    })
  })

  describe('shouldCompressImage()', () => {
    it('should recommend compression for large images', () => {
      const largeSize = 6 * 1024 * 1024 // 6MB
      expect(shouldCompressImage(largeSize)).toBe(true)
    })

    it('should not recommend compression for small images', () => {
      const smallSize = 2 * 1024 * 1024 // 2MB
      expect(shouldCompressImage(smallSize)).toBe(false)
    })

    it('should use custom threshold', () => {
      const size = 3 * 1024 * 1024 // 3MB
      const threshold = 2 * 1024 * 1024 // 2MB

      expect(shouldCompressImage(size, threshold)).toBe(true)
    })
  })

  describe('calculateCompressionQuality()', () => {
    it('should return 1.0 for images under target', () => {
      const size = 2 * 1024 * 1024
      const quality = calculateCompressionQuality(size)

      expect(quality).toBe(1.0)
    })

    it('should calculate quality for oversized images', () => {
      const size = 10 * 1024 * 1024
      const quality = calculateCompressionQuality(size)

      expect(quality).toBeGreaterThanOrEqual(0.5)
      expect(quality).toBeLessThan(1.0)
    })

    it('should not go below 0.5 quality', () => {
      const hugeSize = 100 * 1024 * 1024
      const quality = calculateCompressionQuality(hugeSize)

      expect(quality).toBeGreaterThanOrEqual(0.5)
    })
  })

  describe('DEFAULT_IMAGE_CONFIG', () => {
    it('should have reasonable defaults', () => {
      expect(DEFAULT_IMAGE_CONFIG.maxSizeBytes).toBe(10 * 1024 * 1024)
      expect(DEFAULT_IMAGE_CONFIG.allowedFormats).toContain('image/jpeg')
      expect(DEFAULT_IMAGE_CONFIG.allowedFormats).toContain('image/png')
      expect(DEFAULT_IMAGE_CONFIG.minWidth).toBe(640)
      expect(DEFAULT_IMAGE_CONFIG.minHeight).toBe(480)
    })
  })
})
