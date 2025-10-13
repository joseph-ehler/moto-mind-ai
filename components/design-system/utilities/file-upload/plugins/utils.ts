/**
 * Plugin Utilities
 * 
 * Helper functions for plugin development
 */

import type { FileState } from './types'

// ============================================================================
// File Type Helpers
// ============================================================================

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Check if file is a video
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/')
}

/**
 * Check if file is audio
 */
export function isAudio(file: File): boolean {
  return file.type.startsWith('audio/')
}

/**
 * Check if file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf'
}

/**
 * Check if file matches accept string
 */
export function matchesAccept(file: File, accept: string): boolean {
  const acceptTypes = accept.split(',').map(t => t.trim())
  
  return acceptTypes.some(acceptType => {
    // Extension match (e.g., '.pdf')
    if (acceptType.startsWith('.')) {
      return file.name.toLowerCase().endsWith(acceptType.toLowerCase())
    }
    
    // Wildcard match (e.g., 'image/*')
    if (acceptType.includes('*')) {
      const [category] = acceptType.split('/')
      return file.type.startsWith(category + '/')
    }
    
    // Exact MIME type match
    return file.type === acceptType
  })
}

// ============================================================================
// File Conversion Helpers
// ============================================================================

/**
 * Convert File to Data URL
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
 * Convert Data URL to Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  
  return new Blob([array], { type: mime })
}

/**
 * Convert Data URL to File
 */
export function dataURLToFile(
  dataURL: string,
  filename: string,
  mimeType?: string
): File {
  const blob = dataURLToBlob(dataURL)
  return new File([blob], filename, {
    type: mimeType || blob.type
  })
}

/**
 * Load image from File
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// ============================================================================
// File State Helpers
// ============================================================================

/**
 * Generate unique file ID
 */
export function generateFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`
}

/**
 * Create initial file state
 */
export function createFileState(file: File): FileState {
  return {
    id: generateFileId(file),
    file,
    progress: 0,
    status: 'pending',
    addedAt: Date.now()
  }
}

/**
 * Check if file is complete (success or error)
 */
export function isFileComplete(fileState: FileState): boolean {
  return fileState.status === 'success' || fileState.status === 'error'
}

/**
 * Check if file is uploading
 */
export function isFileUploading(fileState: FileState): boolean {
  return fileState.status === 'uploading'
}

/**
 * Get upload duration
 */
export function getUploadDuration(fileState: FileState): number | null {
  if (!fileState.uploadStartedAt) return null
  const endTime = fileState.uploadCompletedAt || Date.now()
  return endTime - fileState.uploadStartedAt
}

// ============================================================================
// Format Helpers
// ============================================================================

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Format duration (ms to human-readable)
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * Format upload speed
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`
}

// ============================================================================
// Canvas Helpers
// ============================================================================

/**
 * Create canvas from image
 */
export async function createCanvasFromFile(
  file: File,
  maxWidth?: number,
  maxHeight?: number
): Promise<HTMLCanvasElement> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  
  let { width, height } = img
  
  // Apply max dimensions
  if (maxWidth && width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }
  
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  
  return canvas
}

/**
 * Convert canvas to File
 */
export function canvasToFile(
  canvas: HTMLCanvasElement,
  filename: string,
  mimeType = 'image/jpeg',
  quality = 0.9
): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(new File([blob], filename, { type: mimeType }))
        }
      },
      mimeType,
      quality
    )
  })
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSize: number
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`
    }
  }
  return { valid: true }
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  accept: string
): { valid: boolean; error?: string } {
  if (!matchesAccept(file, accept)) {
    return {
      valid: false,
      error: `File type (${file.type}) is not accepted. Allowed: ${accept}`
    }
  }
  return { valid: true }
}

// ============================================================================
// Async Helpers
// ============================================================================

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, i)
        await delay(delayMs)
      }
    }
  }
  
  throw lastError || new Error('Max retries reached')
}
