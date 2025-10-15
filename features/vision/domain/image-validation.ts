/**
 * Image Validation Domain Logic
 * 
 * Pure functions for validating images before processing.
 * No React dependencies - fully testable business logic.
 * 
 * Extracted from UI components to address tight coupling (AI recommendation).
 */

export interface ImageValidationConfig {
  maxSizeBytes: number
  allowedFormats: string[]
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface ImageValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ImageMetadata {
  size: number
  type: string
  width?: number
  height?: number
}

/**
 * Default validation configuration
 */
export const DEFAULT_IMAGE_CONFIG: ImageValidationConfig = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  minWidth: 640,
  minHeight: 480,
  maxWidth: 4096,
  maxHeight: 4096
}

/**
 * Validate image metadata against configuration
 * 
 * @param metadata - Image metadata to validate
 * @param config - Validation rules (optional, uses defaults)
 * @returns Validation result with errors and warnings
 */
export function validateImage(
  metadata: ImageMetadata,
  config: ImageValidationConfig = DEFAULT_IMAGE_CONFIG
): ImageValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate file size
  if (metadata.size > config.maxSizeBytes) {
    errors.push(
      `Image size (${formatBytes(metadata.size)}) exceeds maximum allowed (${formatBytes(config.maxSizeBytes)})`
    )
  }

  // Validate format
  if (!config.allowedFormats.includes(metadata.type)) {
    errors.push(
      `Image format "${metadata.type}" is not supported. Allowed formats: ${config.allowedFormats.join(', ')}`
    )
  }

  // Validate dimensions if provided
  if (metadata.width && metadata.height) {
    if (config.minWidth && metadata.width < config.minWidth) {
      errors.push(`Image width (${metadata.width}px) is below minimum (${config.minWidth}px)`)
    }

    if (config.minHeight && metadata.height < config.minHeight) {
      errors.push(`Image height (${metadata.height}px) is below minimum (${config.minHeight}px)`)
    }

    if (config.maxWidth && metadata.width > config.maxWidth) {
      warnings.push(`Image width (${metadata.width}px) exceeds recommended maximum (${config.maxWidth}px)`)
    }

    if (config.maxHeight && metadata.height > config.maxHeight) {
      warnings.push(`Image height (${metadata.height}px) exceeds recommended maximum (${config.maxHeight}px)`)
    }
  }

  // Warn if image is large but under limit
  const compressionThreshold = config.maxSizeBytes * 0.7
  if (metadata.size > compressionThreshold && metadata.size <= config.maxSizeBytes) {
    warnings.push(
      `Image size (${formatBytes(metadata.size)}) is large. Consider compressing before upload.`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if image needs compression
 * 
 * @param sizeBytes - Image size in bytes
 * @param threshold - Optional threshold (defaults to 5MB)
 * @returns true if image should be compressed
 */
export function shouldCompressImage(
  sizeBytes: number,
  threshold: number = 5 * 1024 * 1024
): boolean {
  return sizeBytes > threshold
}

/**
 * Calculate recommended compression quality
 * 
 * @param sizeBytes - Current image size
 * @param targetBytes - Target size (optional)
 * @returns Recommended quality (0.0 - 1.0)
 */
export function calculateCompressionQuality(
  sizeBytes: number,
  targetBytes: number = 3 * 1024 * 1024
): number {
  if (sizeBytes <= targetBytes) return 1.0

  // Calculate ratio and apply some curve
  const ratio = targetBytes / sizeBytes
  const quality = Math.max(0.5, Math.min(0.95, ratio * 1.2))

  return Math.round(quality * 100) / 100
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate multiple images at once
 * 
 * @param images - Array of image metadata
 * @param config - Validation configuration
 * @returns Array of validation results
 */
export function validateImages(
  images: ImageMetadata[],
  config: ImageValidationConfig = DEFAULT_IMAGE_CONFIG
): ImageValidationResult[] {
  return images.map(image => validateImage(image, config))
}

/**
 * Check if any validation results have errors
 */
export function hasValidationErrors(results: ImageValidationResult[]): boolean {
  return results.some(result => !result.valid)
}

/**
 * Get all errors from validation results
 */
export function getAllErrors(results: ImageValidationResult[]): string[] {
  return results.flatMap(result => result.errors)
}

/**
 * Get all warnings from validation results
 */
export function getAllWarnings(results: ImageValidationResult[]): string[] {
  return results.flatMap(result => result.warnings)
}
