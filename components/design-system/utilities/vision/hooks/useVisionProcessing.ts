/**
 * useVisionProcessing Hook
 * 
 * Handles AI vision processing via API
 * Pure side-effect management
 */

import { useState, useCallback } from 'react'
import type { VisionProcessingOptions, VisionProcessingResult } from '../types'

export interface UseVisionProcessingReturn<T = any> {
  // State
  isProcessing: boolean
  error: string | null
  result: VisionProcessingResult<T> | null
  
  // Actions
  processImage: (imageData: string, apiEndpoint: string) => Promise<VisionProcessingResult<T> | null>
  reset: () => void
}

/**
 * Vision processing hook
 * Handles image upload and AI processing
 */
export function useVisionProcessing<T = any>(
  options: VisionProcessingOptions
): UseVisionProcessingReturn<T> {
  const { type, vehicleId, maxRetries = 3, mock } = options
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VisionProcessingResult<T> | null>(null)
  
  /**
   * Process image through AI vision API (or mock)
   */
  const processImage = useCallback(async (
    imageData: string,
    apiEndpoint: string
  ): Promise<VisionProcessingResult<T> | null> => {
    console.log('🤖 Processing image...', { type, vehicleId, mock: mock?.enabled })
    
    setIsProcessing(true)
    setError(null)
    
    const startTime = Date.now()
    
    // ========================================================================
    // MOCK MODE - For development/testing without API
    // ========================================================================
    if (mock?.enabled) {
      console.log('🎭 Mock mode active - simulating processing')
      
      try {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, mock.delay || 2000))
        
        // Simulate random failures if configured
        const shouldFail = mock.shouldFail || 
          (mock.failureRate && Math.random() < mock.failureRate)
        
        if (shouldFail) {
          throw new Error('Mock failure - testing error handling')
        }
        
        const processingTime = Date.now() - startTime
        
        // Generate default mock data based on type if not provided
        let mockData = mock.data
        if (!mockData) {
          switch (type) {
            case 'vin':
              mockData = {
                vin: '1HGBH41JXMN109186',
                location: 'dashboard',
                character_quality: 'excellent'
              }
              break
            case 'license_plate':
              mockData = {
                plate: 'ABC1234',
                state: 'CA',
                location: 'rear'
              }
              break
            case 'odometer':
              mockData = {
                reading: 45678,
                unit: 'miles',
                location: 'dashboard'
              }
              break
            default:
              mockData = {
                text: 'Mock data',
                confidence: 0.95
              }
          }
        }
        
        // Return mock data
        const mockResult: VisionProcessingResult<T> = {
          success: true,
          data: mockData as T,
          confidence: mock.confidence || 0.95,
          processed_at: new Date().toISOString(),
          processing_time_ms: processingTime
        }
        
        setResult(mockResult)
        setIsProcessing(false)
        
        console.log('✅ Mock processing complete:', mockResult)
        return mockResult
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Mock processing failed'
        console.error('❌ Mock error:', err)
        
        setError(errorMessage)
        setIsProcessing(false)
        
        return null
      }
    }
    
    // ========================================================================
    // REAL API PROCESSING
    // ========================================================================
    
    try {
      // Convert base64 to blob
      const base64Data = imageData.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/jpeg' })
      
      // Create form data
      const formData = new FormData()
      formData.append('image', blob, 'capture.jpg')
      formData.append('type', type)
      
      if (vehicleId) {
        formData.append('vehicleId', vehicleId)
      }
      
      // Make API request with retries
      let lastError: Error | null = null
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 API attempt ${attempt}/${maxRetries}`)
          
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: formData
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `API error: ${response.status}`)
          }
          
          const data = await response.json()
          const processingTime = Date.now() - startTime
          
          const processedResult: VisionProcessingResult<T> = {
            ...data,
            processing_time_ms: processingTime
          }
          
          setResult(processedResult)
          setIsProcessing(false)
          
          console.log('✅ Processing complete:', {
            success: data.success,
            processingTime: `${processingTime}ms`,
            confidence: data.confidence
          })
          
          return processedResult
          
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error')
          console.warn(`⚠️  Attempt ${attempt} failed:`, lastError.message)
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }
      
      // All retries failed
      throw lastError || new Error('Processing failed after all retries')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed'
      console.error('❌ Processing error:', err)
      
      setError(errorMessage)
      setIsProcessing(false)
      
      return null
    }
  }, [type, vehicleId, maxRetries, mock])
  
  /**
   * Reset processing state
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
    processImage,
    reset
  }
}
