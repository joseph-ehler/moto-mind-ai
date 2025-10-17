/**
 * Shared Image Compression
 * 
 * Common image compression logic for both FileUpload and Vision systems
 * Includes EXIF orientation correction for mobile photos
 */

import type { CompressionOptions, ImageDimensions, ProcessingResult } from './types'
import { getExifOrientation, applyExifOrientation, orientationSwapsDimensions } from './exif'

/**
 * Compress an image file with optional EXIF orientation correction
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<ProcessingResult> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg',
    maintainAspectRatio = true,
    autoRotate = true,
    outputBase64 = false
  } = options
  
  // Load image
  const img = await loadImageFromFile(file)
  
  const originalDimensions = {
    width: img.width,
    height: img.height
  }
  
  // Get EXIF orientation
  let orientation = 1
  let rotated = false
  
  if (autoRotate) {
    orientation = await getExifOrientation(file)
    rotated = orientation !== 1
  }
  
  // Calculate new dimensions
  const processedDimensions = calculateDimensions(
    originalDimensions,
    { maxWidth, maxHeight },
    maintainAspectRatio
  )
  
  // Create canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // Handle rotation (some orientations swap width/height)
  if (orientationSwapsDimensions(orientation)) {
    canvas.width = processedDimensions.height
    canvas.height = processedDimensions.width
  } else {
    canvas.width = processedDimensions.width
    canvas.height = processedDimensions.height
  }
  
  // Apply EXIF orientation
  applyExifOrientation(ctx, orientation, canvas.width, canvas.height)
  
  // Draw image
  ctx.drawImage(
    img,
    0,
    0,
    processedDimensions.width,
    processedDimensions.height
  )
  
  // Convert to output format
  const mimeType = `image/${format}`
  
  let compressedFile: File | undefined
  let base64: string | undefined
  let compressedSize: number
  
  if (outputBase64) {
    // Output as base64 data URL
    base64 = canvas.toDataURL(mimeType, quality)
    // Approximate size from base64 string
    compressedSize = Math.round((base64.length * 3) / 4)
  } else {
    // Output as File
    const blob = await canvasToBlob(canvas, mimeType, quality)
    compressedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, `.${format}`),
      { type: mimeType }
    )
    compressedSize = blob.size
  }
  
  const compressionRatio = compressedSize / file.size
  const compressionPercentage = ((file.size - compressedSize) / file.size) * 100
  
  return {
    file: compressedFile,
    base64,
    originalSize: file.size,
    compressedSize,
    compressionRatio,
    compressionPercentage,
    originalDimensions,
    processedDimensions,
    format: mimeType,
    rotated,
    orientation
  }
}

/**
 * Load image from file
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export function calculateDimensions(
  original: ImageDimensions,
  max: { maxWidth: number; maxHeight: number },
  maintainAspectRatio: boolean
): ImageDimensions {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(original.width, max.maxWidth),
      height: Math.min(original.height, max.maxHeight)
    }
  }
  
  let { width, height } = original
  
  // Scale down if needed
  if (width > max.maxWidth) {
    height = (height * max.maxWidth) / width
    width = max.maxWidth
  }
  
  if (height > max.maxHeight) {
    width = (width * max.maxHeight) / height
    height = max.maxHeight
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Convert canvas to blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      mimeType,
      quality
    )
  })
}

/**
 * Convert file to data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert data URL to file
 */
export function dataURLToFile(dataURL: string, filename: string): File {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  
  return new File([array], filename, { type: mime })
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  const img = await loadImageFromFile(file)
  return {
    width: img.width,
    height: img.height
  }
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Compress image iteratively to meet target file size
 * 
 * Reduces quality step by step until the target size is achieved
 * Useful for APIs with size limits
 * 
 * @param file - Image file to compress
 * @param targetSize - Target size in bytes
 * @param options - Compression options
 * @returns Processing result
 */
export async function compressToTargetSize(
  file: File,
  targetSize: number,
  options: CompressionOptions = {}
): Promise<ProcessingResult> {
  let quality = options.quality || 0.85
  let result = await compressImage(file, { ...options, quality })
  
  // Iteratively reduce quality until size target is met
  let attempts = 0
  const maxAttempts = 10
  
  while (result.compressedSize > targetSize && quality > 0.1 && attempts < maxAttempts) {
    quality -= 0.1
    console.log(`🔄 Reducing quality to ${(quality * 100).toFixed(0)}% to meet target size...`)
    result = await compressImage(file, { ...options, quality })
    attempts++
  }
  
  if (result.compressedSize > targetSize) {
    console.warn(`⚠️ Could not meet target size ${formatFileSize(targetSize)}. Final size: ${formatFileSize(result.compressedSize)}`)
  }
  
  return result
}

/**
 * Validate image file before processing
 * 
 * @param file - File to validate
 * @param maxSize - Optional max file size in bytes
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSize?: number
): { valid: boolean; error?: string } {
  // Check type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image'
    }
  }
  
  // Check size
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds limit (${formatFileSize(maxSize)})`
    }
  }
  
  return { valid: true }
}
