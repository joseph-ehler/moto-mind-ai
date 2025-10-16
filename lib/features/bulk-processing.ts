/**
 * Bulk Photo Processing
 * 
 * Process multiple photos in parallel with progress tracking
 * - Parallel compression
 * - Progress callbacks
 * - Error handling per photo
 * - Quality analysis
 */

import { compressImage } from './image-processing'
import { analyzePhotoQuality } from './quality-analysis'
import { getBestImageFormat } from './webp-support'

export interface BulkProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  targetSizeKB?: number
  minQuality?: number
  analyzeQuality?: boolean
  onProgress?: (photoIndex: number, progress: number, total: number) => void
  onPhotoComplete?: (photoIndex: number, result: ProcessedPhoto) => void
}

export interface ProcessedPhoto {
  success: boolean
  originalFile?: File
  compressedBlob?: Blob
  compressionRatio?: number
  originalSize?: number
  compressedSize?: number
  width?: number
  height?: number
  format?: string
  qualityScore?: number
  qualityIssues?: string[]
  error?: string
}

export interface BulkProcessingResult {
  photos: ProcessedPhoto[]
  totalOriginalSize: number
  totalCompressedSize: number
  averageCompressionRatio: number
  successCount: number
  failureCount: number
  processingTime: number
}

/**
 * Process multiple photos in parallel
 */
export async function bulkProcessPhotos(
  files: File[],
  options: BulkProcessingOptions = {}
): Promise<BulkProcessingResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    targetSizeKB = 500,
    minQuality = 0.5,
    analyzeQuality = true,
    onProgress,
    onPhotoComplete
  } = options

  const startTime = Date.now()
  const results: ProcessedPhoto[] = []
  const outputFormat = getBestImageFormat()

  // Process all photos in parallel
  const promises = files.map(async (file, index) => {
    try {
      // Notify start
      onProgress?.(index, 0, files.length)

      // Read file as blob
      const blob = new Blob([await file.arrayBuffer()], { type: file.type })

      // Compress image
      const compressed = await compressImage(blob, {
        maxWidth,
        maxHeight,
        targetSizeKB,
        minQuality,
        format: outputFormat
      })

      // Notify compression complete (50%)
      onProgress?.(index, 50, files.length)

      // Analyze quality if requested
      let qualityScore: number | undefined
      let qualityIssues: string[] | undefined

      if (analyzeQuality) {
        // Create canvas from compressed blob for analysis
        const img = new Image()
        const imgUrl = URL.createObjectURL(compressed.blob)
        img.src = imgUrl

        await new Promise((resolve) => {
          img.onload = resolve
        })

        const canvas = document.createElement('canvas')
        canvas.width = compressed.width
        canvas.height = compressed.height
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          
          const qualityResult = await analyzePhotoQuality(canvas, {
            eventType: 'unknown',
            requiresText: false
          })
          
          qualityScore = qualityResult.score
          qualityIssues = qualityResult.issues.map(i => i.type)
        }

        URL.revokeObjectURL(imgUrl)
      }

      // Notify complete (100%)
      onProgress?.(index, 100, files.length)

      const result: ProcessedPhoto = {
        success: true,
        originalFile: file,
        compressedBlob: compressed.blob,
        compressionRatio: compressed.compressionRatio,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        width: compressed.width,
        height: compressed.height,
        format: outputFormat,
        qualityScore,
        qualityIssues
      }

      results[index] = result
      onPhotoComplete?.(index, result)

      return result
    } catch (error) {
      const errorResult: ProcessedPhoto = {
        success: false,
        originalFile: file,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      results[index] = errorResult
      onPhotoComplete?.(index, errorResult)

      return errorResult
    }
  })

  // Wait for all to complete
  await Promise.all(promises)

  // Calculate totals
  const successfulResults = results.filter(r => r.success)
  const totalOriginalSize = successfulResults.reduce((sum, r) => sum + (r.originalSize || 0), 0)
  const totalCompressedSize = successfulResults.reduce((sum, r) => sum + (r.compressedSize || 0), 0)
  const averageCompressionRatio = successfulResults.length > 0
    ? successfulResults.reduce((sum, r) => sum + (r.compressionRatio || 0), 0) / successfulResults.length
    : 0

  return {
    photos: results,
    totalOriginalSize,
    totalCompressedSize,
    averageCompressionRatio,
    successCount: successfulResults.length,
    failureCount: results.length - successfulResults.length,
    processingTime: Date.now() - startTime
  }
}

/**
 * Process single photo (wrapper for consistency)
 */
export async function processSinglePhoto(
  file: File,
  options: BulkProcessingOptions = {}
): Promise<ProcessedPhoto> {
  const result = await bulkProcessPhotos([file], options)
  return result.photos[0]
}

/**
 * Format progress percentage
 */
export function formatProgress(current: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((current / total) * 100)}%`
}

/**
 * Format processing time
 */
export function formatProcessingTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Estimate total processing time based on file sizes
 */
export function estimateProcessingTime(files: File[]): number {
  // Rough estimate: 200ms per MB
  const totalSizeMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)
  return Math.round(totalSizeMB * 200)
}
