/**
 * Vision Processing Service
 * 
 * Standalone service for processing images through the vision pipeline.
 * Can be used with camera captures, file uploads, or any image source.
 * 
 * Handles:
 * - Image preprocessing
 * - Vision API calls
 * - Plugin pipeline execution
 * - Error handling
 */

import React from 'react'
import type { CaptureResult, VisionProcessingOptions } from '../types'
import type { VisionPlugin, VisionPluginContext } from '../plugins/types'
import { VisionPluginManager } from '../plugins/plugin-manager'
import { compressImage, validateImageFile, type CompressionOptions } from '../../shared/image'

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

export interface VisionProcessingServiceOptions {
  /** Vision API endpoint */
  apiEndpoint: string
  
  /** Vision plugins to apply */
  plugins?: VisionPlugin[]
  
  /** Plugin context */
  pluginContext?: Partial<VisionPluginContext>
  
  /** Enable image preprocessing */
  enablePreprocessing?: boolean
  
  /** Custom preprocessing options */
  preprocessingOptions?: CompressionOptions
  
  /** Analytics callback */
  onAnalytics?: (event: string, data: any) => void
}

export class VisionProcessingService {
  private apiEndpoint: string
  private plugins: VisionPlugin[]
  private pluginManager: VisionPluginManager | null = null
  private pluginContext: Partial<VisionPluginContext>
  private enablePreprocessing: boolean
  private preprocessingOptions: CompressionOptions
  private onAnalytics?: (event: string, data: any) => void
  private initialized: boolean = false
  
  constructor(options: VisionProcessingServiceOptions) {
    this.apiEndpoint = options.apiEndpoint
    this.plugins = options.plugins || []
    this.pluginContext = options.pluginContext || {}
    this.enablePreprocessing = options.enablePreprocessing ?? true
    this.preprocessingOptions = options.preprocessingOptions || DEFAULT_PREPROCESSING
    this.onAnalytics = options.onAnalytics
  }
  
  /**
   * Initialize plugin manager and register plugins
   * Called lazily on first use
   */
  private async initialize() {
    if (this.initialized || this.plugins.length === 0) {
      this.initialized = true
      return
    }
    
    try {
      // Create plugin manager with base context
      this.pluginManager = new VisionPluginManager(this.pluginContext as any)
      
      // Register all plugins
      for (const plugin of this.plugins) {
        await this.pluginManager.register(plugin)
        console.log(`✅ [VisionService] Plugin registered: ${plugin.id}`)
      }
      
      this.initialized = true
    } catch (error) {
      console.error('[VisionService] Plugin initialization failed:', error)
      throw error
    }
  }
  
  /**
   * Process a single file through the vision pipeline
   */
  async processFile(
    file: File,
    processingOptions?: VisionProcessingOptions
  ): Promise<CaptureResult> {
    // Initialize plugins if not already done
    await this.initialize()
    
    const startTime = Date.now()
    
    this.onAnalytics?.('vision_processing_started', {
      source: 'file',
      fileSize: file.size,
      fileType: file.type
    })
    
    try {
      // 1. Validate file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file')
      }
      
      // 2. Preprocess if enabled
      let base64: string
      
      if (this.enablePreprocessing) {
        console.log('🔄 Preprocessing image...')
        const preprocessed = await compressImage(file, this.preprocessingOptions)
        
        if (!preprocessed.base64) {
          throw new Error('Preprocessing failed: No base64 output')
        }
        
        base64 = preprocessed.base64
        
        console.log('✅ Image preprocessed:', {
          compression: `${preprocessed.compressionPercentage.toFixed(1)}%`,
          originalSize: `${(preprocessed.originalSize / 1024).toFixed(2)} KB`,
          compressedSize: `${(preprocessed.compressedSize / 1024).toFixed(2)} KB`,
          rotated: preprocessed.rotated
        })
        
        this.onAnalytics?.('image_preprocessed', {
          compression: preprocessed.compressionPercentage,
          originalSize: preprocessed.originalSize,
          compressedSize: preprocessed.compressedSize
        })
      } else {
        // No preprocessing - convert directly to base64
        console.log('⏭️  Skipping preprocessing')
        base64 = await this.fileToBase64(file)
      }
      
      // 3. Process image
      const result = await this.processBase64(base64, processingOptions)
      
      this.onAnalytics?.('vision_processing_success', {
        source: 'file',
        duration: Date.now() - startTime,
        confidence: result.confidence
      })
      
      return result
      
    } catch (error) {
      this.onAnalytics?.('vision_processing_failed', {
        source: 'file',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }
  
  /**
   * Process base64 image through the vision pipeline
   */
  async processBase64(
    base64: string,
    processingOptions?: VisionProcessingOptions
  ): Promise<CaptureResult> {
    // Ensure plugins are initialized
    await this.initialize()
    
    // Call vision API
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        type: processingOptions?.type || 'vin',
        vehicleId: processingOptions?.vehicleId
      })
    })
    
    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`)
    }
    
    let result: CaptureResult = await response.json()
    
    // Execute plugin pipeline
    if (this.pluginManager && this.plugins.length > 0) {
      try {
        const context = this.buildPluginContext(processingOptions)
        
        console.log('[VisionService] Executing plugin pipeline...')
        
        result = await this.pluginManager.executeAfterCapture(result, context)
        result = await this.pluginManager.executeTransformResult(result)
        await this.pluginManager.executeValidateResult(result)
        result = await this.pluginManager.executeEnrichResult(result)
        
        console.log('[VisionService] Plugin pipeline complete')
        
        // Execute success hooks
        await this.pluginManager.executeOnSuccess(result, context)
      } catch (error) {
        console.error('[VisionService] Plugin pipeline error:', error)
        
        // Execute error hooks
        if (this.pluginManager) {
          const context = this.buildPluginContext(processingOptions)
          await this.pluginManager.executeOnError(
            error instanceof Error ? error : new Error('Plugin execution failed'),
            context
          )
        }
        
        throw error
      }
    }
    
    return result
  }
  
  /**
   * Process multiple files in batch (parallel)
   */
  async processBatch(
    files: File[],
    processingOptions?: VisionProcessingOptions
  ): Promise<CaptureResult[]> {
    return Promise.all(
      files.map(file => this.processFile(file, processingOptions))
    )
  }
  
  /**
   * Process multiple files sequentially (with progress)
   */
  async processBatchSequential(
    files: File[],
    processingOptions?: VisionProcessingOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<CaptureResult[]> {
    const results: CaptureResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const result = await this.processFile(files[i], processingOptions)
      results.push(result)
      onProgress?.(i + 1, files.length)
    }
    
    return results
  }
  
  /**
   * Convert File to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  /**
   * Build plugin context from options
   */
  private buildPluginContext(
    options?: VisionProcessingOptions
  ): any {
    // Return partial context - will be completed by plugin manager
    return {
      captureType: options?.type || 'vin',
      vehicleId: options?.vehicleId,
    }
  }
}

/**
 * Hook to use vision processing service
 */
export function useVisionProcessingService(
  options: VisionProcessingServiceOptions
) {
  const serviceRef = React.useRef<VisionProcessingService | null>(null)
  
  if (!serviceRef.current) {
    serviceRef.current = new VisionProcessingService(options)
  }
  
  return serviceRef.current
}
