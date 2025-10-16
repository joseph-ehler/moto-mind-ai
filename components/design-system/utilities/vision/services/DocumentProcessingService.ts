/**
 * Document Processing Service
 * 
 * Unified service for processing any document type using the processor pattern
 * Replaces type-specific processing with extensible architecture
 */

import type { 
  DocumentType,
  DocumentProcessingResult,
  BatchProcessingResult,
  ProcessingContext
} from '../types/document'
import { getProcessorRegistry } from './ProcessorRegistry'
import { compressImage, validateImageFile, type CompressionOptions } from '@/components/design-system/utilities/shared/image'

/**
 * Default preprocessing options
 */
const DEFAULT_PREPROCESSING: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'jpeg'
}

/**
 * Document Processing Service
 * Uses processor registry to handle any document type
 */
export class DocumentProcessingService {
  private apiEndpoint: string
  private preprocessingOptions: CompressionOptions
  
  constructor(options?: {
    apiEndpoint?: string
    preprocessing?: CompressionOptions
  }) {
    this.apiEndpoint = options?.apiEndpoint || '/api/vision/process-json'
    this.preprocessingOptions = { ...DEFAULT_PREPROCESSING, ...options?.preprocessing }
  }
  
  /**
   * Process a single document
   */
  async processDocument(
    file: File,
    type: DocumentType,
    context?: ProcessingContext
  ): Promise<DocumentProcessingResult> {
    const start = performance.now()
    
    try {
      console.log(`[DocumentProcessing] Processing ${type} document...`)
      
      // Get processor for this type
      const processor = getProcessorRegistry().get(type)
      
      // 1. Validate image
      const validation = validateImageFile(file)
      if (!validation.valid) {
        throw new Error(`Invalid image: ${validation.error || 'Unknown validation error'}`)
      }
      
      // 2. Preprocess image
      const compressed = await compressImage(file, this.preprocessingOptions)
      console.log(`[DocumentProcessing] Compressed: ${(compressed.compressedSize / 1024).toFixed(1)}KB`)
      
      // 3. Convert to base64
      const compressedFile = compressed.file
      if (!compressedFile) {
        throw new Error('Image compression failed')
      }
      const base64 = await this.fileToBase64(compressedFile)
      
      // 4. Call vision API with processor's prompt
      const prompt = processor.getPrompt(context)
      const ocrResult = await this.callVisionAPI(base64, type, prompt)
      
      // 5. Parse with processor
      const parsedData = processor.parse(ocrResult.rawText, context)
      
      // 6. Validate with processor
      const validationResult = await Promise.resolve(
        processor.validate(parsedData, context)
      )
      
      // 7. Enrich with processor (if available)
      const enrichedData = processor.enrich
        ? await processor.enrich(parsedData, context)
        : parsedData
      
      const processingTime = Math.round(performance.now() - start)
      
      // Success result
      return {
        success: true,
        type,
        data: enrichedData,
        validation: validationResult,
        confidence: ocrResult.confidence,
        rawText: ocrResult.rawText,
        processingTimeMs: processingTime,
        processedAt: new Date().toISOString()
      }
      
    } catch (error) {
      const processingTime = Math.round(performance.now() - start)
      
      console.error(`[DocumentProcessing] Failed:`, error)
      
      // Error result
      return {
        success: false,
        type,
        data: {},
        validation: {
          valid: false,
          errors: [error instanceof Error ? error.message : 'Processing failed']
        },
        confidence: 0,
        processingTimeMs: processingTime,
        processedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Process multiple documents in batch
   */
  async processBatch(
    files: File[],
    type: DocumentType,
    context?: ProcessingContext
  ): Promise<BatchProcessingResult> {
    const startTime = performance.now()
    
    console.log(`[DocumentProcessing] Processing batch of ${files.length} ${type} documents...`)
    
    // Process all files
    const results = await Promise.all(
      files.map(file => this.processDocument(file, type, context))
    )
    
    // Calculate statistics
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    const totalConfidence = successful.reduce((sum, r) => sum + r.confidence, 0)
    const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0)
    
    const batchResult: BatchProcessingResult = {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
      statistics: {
        averageConfidence: successful.length > 0 ? totalConfidence / successful.length : 0,
        averageProcessingTime: results.length > 0 ? totalProcessingTime / results.length : 0,
        totalProcessingTime: Math.round(performance.now() - startTime)
      }
    }
    
    console.log(`[DocumentProcessing] Batch complete:`, {
      successful: batchResult.successful,
      failed: batchResult.failed,
      avgConfidence: (batchResult.statistics.averageConfidence * 100).toFixed(1) + '%',
      totalTime: batchResult.statistics.totalProcessingTime + 'ms'
    })
    
    return batchResult
  }
  
  /**
   * Call vision API
   */
  private async callVisionAPI(
    base64Image: string,
    type: DocumentType,
    customPrompt?: string
  ): Promise<{ rawText: string; confidence: number }> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Image,
        type,
        customPrompt
      })
    })
    
    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Vision API processing failed')
    }
    
    return {
      rawText: data.raw_text || '',
      confidence: data.confidence || 0
    }
  }
  
  /**
   * Convert file to base64 data URL
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }
}

/**
 * Create singleton instance
 */
let serviceInstance: DocumentProcessingService | null = null

/**
 * Get or create service instance
 */
export function getDocumentProcessingService(): DocumentProcessingService {
  if (!serviceInstance) {
    serviceInstance = new DocumentProcessingService()
  }
  return serviceInstance
}
