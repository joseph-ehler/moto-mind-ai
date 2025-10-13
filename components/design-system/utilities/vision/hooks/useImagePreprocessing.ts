/**
 * useImagePreprocessing Hook
 * 
 * React hook for preprocessing images before upload/processing
 * Uses shared image utilities for consistency across the system
 */

import { useCallback, useState } from 'react'
import { 
  compressImage, 
  compressToTargetSize, 
  validateImageFile,
  type CompressionOptions,
  type ProcessingResult
} from '../../shared/image'

// Default preprocessing options for Vision AI
const DEFAULT_PREPROCESSING: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'jpeg',
  autoRotate: true,
  stripMetadata: true,
  outputBase64: true
}

export interface UseImagePreprocessingOptions {
  enabled?: boolean
  options?: CompressionOptions
  onProgress?: (progress: number) => void
  onComplete?: (result: ProcessingResult) => void
  onError?: (error: string) => void
}

export interface UseImagePreprocessingReturn {
  isProcessing: boolean
  error: string | null
  result: ProcessingResult | null
  preprocess: (file: File) => Promise<ProcessingResult | null>
  compressTo: (file: File, targetSize: number) => Promise<ProcessingResult | null>
  reset: () => void
}

/**
 * Hook for image preprocessing
 */
export function useImagePreprocessing(
  hookOptions: UseImagePreprocessingOptions = {}
): UseImagePreprocessingReturn {
  const {
    enabled = true,
    options = DEFAULT_PREPROCESSING,
    onProgress,
    onComplete,
    onError
  } = hookOptions
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  
  /**
   * Preprocess image with validation
   */
  const preprocess = useCallback(async (file: File): Promise<ProcessingResult | null> => {
    console.log('🔄 Starting image preprocessing...', { enabled, file: file.name })
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Validate file first
      const validation = validateImageFile(file)
      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid file'
        console.error('❌ Validation failed:', errorMsg)
        setError(errorMsg)
        onError?.(errorMsg)
        setIsProcessing(false)
        return null
      }
      
      // Progress callback
      onProgress?.(50)
      
      // Compress image with shared utilities
      const processed = await compressImage(file, options)
      
      onProgress?.(100)
      
      console.log('✅ Image preprocessed:', {
        compression: `${processed.compressionPercentage.toFixed(1)}%`,
        size: `${(processed.compressedSize / 1024).toFixed(2)} KB`,
        rotated: processed.rotated
      })
      
      setResult(processed)
      onComplete?.(processed)
      setIsProcessing(false)
      
      return processed
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Preprocessing failed'
      console.error('❌ Preprocessing error:', err)
      
      setError(errorMsg)
      onError?.(errorMsg)
      setIsProcessing(false)
      
      return null
    }
  }, [enabled, options, onProgress, onComplete, onError])
  
  /**
   * Compress to target size
   */
  const compressTo = useCallback(async (file: File, targetSize: number): Promise<ProcessingResult | null> => {
    console.log('🗜️  Compressing to target size:', (targetSize / 1024).toFixed(0), 'KB')
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // Validate file first
      const validation = validateImageFile(file)
      if (!validation.valid) {
        const errorMsg = validation.error || 'Invalid file'
        console.error('❌ Validation failed:', errorMsg)
        setError(errorMsg)
        onError?.(errorMsg)
        setIsProcessing(false)
        return null
      }
      
      onProgress?.(25)
      
      // Compress to target size
      const compressed = await compressToTargetSize(file, targetSize, options)
      
      onProgress?.(100)
      
      console.log('✅ Compressed to target:', {
        target: `${(targetSize / 1024).toFixed(0)} KB`,
        actual: `${(compressed.compressedSize / 1024).toFixed(2)} KB`
      })
      
      setResult(compressed)
      onComplete?.(compressed)
      setIsProcessing(false)
      
      return compressed
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Compression failed'
      console.error('❌ Compression error:', err)
      
      setError(errorMsg)
      onError?.(errorMsg)
      setIsProcessing(false)
      
      return null
    }
  }, [options, onProgress, onComplete, onError])
  
  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsProcessing(false)
    setError(null)
    setResult(null)
  }, [])
  
  return {
    isProcessing,
    error,
    result,
    preprocess,
    compressTo,
    reset
  }
}
