/**
 * Multi-Document Vision System Types
 * 
 * Core type definitions for the unified document processing architecture
 */

/**
 * Supported document types
 */
export type DocumentType = 
  | 'vin'
  | 'license-plate'
  | 'drivers-license'
  | 'insurance'
  | 'odometer'
  | 'registration'
  | 'title'
  | 'receipt'
  | 'other'

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Processing context passed to processors
 */
export interface ProcessingContext {
  documentType: DocumentType
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

/**
 * Document processor configuration
 */
export interface DocumentProcessorConfig {
  /** Model to use for OCR */
  model?: 'gpt-4o' | 'gpt-4o-mini'
  
  /** Maximum tokens for response */
  maxTokens?: number
  
  /** Temperature for response generation */
  temperature?: number
  
  /** Additional options */
  options?: Record<string, any>
}

/**
 * Document processor interface
 * 
 * Each document type implements this interface to define
 * how it should be processed, validated, and enriched
 */
export interface DocumentProcessor<TData = any, TEnriched = TData> {
  /** Unique type identifier */
  type: DocumentType
  
  /** Human-readable name */
  name: string
  
  /** Description of what this processor does */
  description?: string
  
  /** Configuration for this processor */
  config?: DocumentProcessorConfig
  
  /**
   * Generate OCR prompt for this document type
   * Can be static string or dynamic function
   */
  getPrompt: (context?: ProcessingContext) => string
  
  /**
   * Parse raw OCR text into structured data
   * @param text Raw OCR output from vision API
   * @returns Structured document data
   */
  parse: (text: string, context?: ProcessingContext) => TData
  
  /**
   * Validate parsed data
   * @param data Parsed document data
   * @returns Validation result with errors/warnings
   */
  validate: (data: TData, context?: ProcessingContext) => ValidationResult | Promise<ValidationResult>
  
  /**
   * Enrich data with external APIs or calculations
   * @param data Validated document data
   * @returns Enriched data with additional fields
   */
  enrich?: (data: TData, context?: ProcessingContext) => Promise<TEnriched>
  
  /**
   * Format data for display
   * @param data Enriched document data
   * @returns Human-readable formatted data
   */
  format?: (data: TEnriched) => string
}

/**
 * Document processing result
 */
export interface DocumentProcessingResult<TData = any> {
  /** Whether processing was successful */
  success: boolean
  
  /** Document type */
  type: DocumentType
  
  /** Structured data extracted from document */
  data: TData
  
  /** Validation result */
  validation: ValidationResult
  
  /** Confidence score (0-1) */
  confidence: number
  
  /** Raw OCR text */
  rawText?: string
  
  /** Processing time in milliseconds */
  processingTimeMs: number
  
  /** Timestamp */
  processedAt: string
  
  /** Error message if failed */
  error?: string
  
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult<TData = any> {
  /** Total documents processed */
  total: number
  
  /** Successfully processed */
  successful: number
  
  /** Failed processing */
  failed: number
  
  /** Individual results */
  results: DocumentProcessingResult<TData>[]
  
  /** Summary statistics */
  statistics: {
    averageConfidence: number
    averageProcessingTime: number
    totalProcessingTime: number
  }
}

/**
 * Processor registry entry
 */
export interface ProcessorRegistryEntry<TData = any, TEnriched = TData> {
  processor: DocumentProcessor<TData, TEnriched>
  registered: Date
  version: string
}
