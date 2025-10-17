// Vision Error Handler - Centralized error handling for vision processing
// Handles known failure modes with appropriate recovery strategies

import { VisionErrorCodes } from './clients/openai'

export interface VisionError extends Error {
  code: string
  retryable: boolean
  userMessage: string
  technicalDetails?: any
}

export class VisionErrorHandler {
  /**
   * Creates a standardized vision error from any error
   */
  static createVisionError(error: any, context?: string): VisionError {
    const code = this.extractErrorCode(error)
    const retryable = this.isRetryableError(code)
    const userMessage = this.getUserMessage(code)
    
    const visionError = new Error(userMessage) as VisionError
    visionError.code = code
    visionError.retryable = retryable
    visionError.userMessage = userMessage
    visionError.technicalDetails = {
      originalError: error.message,
      context,
      timestamp: new Date().toISOString()
    }
    
    return visionError
  }

  /**
   * Extracts error code from error message or object
   */
  private static extractErrorCode(error: any): string {
    // Check if error already has a code
    if (error.code && Object.values(VisionErrorCodes).includes(error.code)) {
      return error.code
    }

    const message = (error.message || error.toString()).toLowerCase()
    
    // Match against known error patterns from actual system failures
    if (message.includes('timeout') || message.includes('timed out')) {
      return VisionErrorCodes.UPSTREAM_TIMEOUT
    }
    
    if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
      return VisionErrorCodes.RATE_LIMIT
    }
    
    if (message.includes('parse') || message.includes('json') || message.includes('invalid json')) {
      return VisionErrorCodes.PARSE_FAILED
    }
    
    if (message.includes('validation') || message.includes('invalid data')) {
      return VisionErrorCodes.VALIDATION_FAILED
    }
    
    if (message.includes('mode') || message.includes('unsupported') || message.includes('not supported')) {
      return VisionErrorCodes.MODE_UNSUPPORTED
    }
    
    if (message.includes('no file') || message.includes('no image') || message.includes('missing file')) {
      return VisionErrorCodes.NO_FILE
    }
    
    if (message.includes('too large') || message.includes('payload') || message.includes('file size')) {
      return VisionErrorCodes.PAYLOAD_TOO_LARGE
    }

    // OpenAI specific errors
    if (message.includes('api key') || message.includes('unauthorized')) {
      return 'API_KEY_INVALID'
    }

    if (message.includes('quota') || message.includes('billing')) {
      return 'QUOTA_EXCEEDED'
    }

    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR'
    }
    
    return 'PROCESSING_ERROR'
  }

  /**
   * Determines if an error is retryable based on error code
   */
  private static isRetryableError(code: string): boolean {
    const retryableErrors = [
      VisionErrorCodes.UPSTREAM_TIMEOUT,
      VisionErrorCodes.RATE_LIMIT,
      VisionErrorCodes.PARSE_FAILED,
      VisionErrorCodes.VALIDATION_FAILED,
      'NETWORK_ERROR',
      'PROCESSING_ERROR'
    ]
    
    return retryableErrors.includes(code)
  }

  /**
   * Gets user-friendly error message based on error code
   */
  private static getUserMessage(code: string): string {
    const messages: Record<string, string> = {
      [VisionErrorCodes.UPSTREAM_TIMEOUT]: 'Vision processing timed out. Please try again.',
      [VisionErrorCodes.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
      [VisionErrorCodes.PARSE_FAILED]: 'Could not process the document. Please try a clearer image.',
      [VisionErrorCodes.VALIDATION_FAILED]: 'Document validation failed. Please check the image quality.',
      [VisionErrorCodes.MODE_UNSUPPORTED]: 'Processing mode not supported.',
      [VisionErrorCodes.NO_FILE]: 'No image file provided.',
      [VisionErrorCodes.PAYLOAD_TOO_LARGE]: 'Image file is too large. Please use a smaller image.',
      'API_KEY_INVALID': 'Vision service configuration error. Please contact support.',
      'QUOTA_EXCEEDED': 'Vision service quota exceeded. Please try again later.',
      'NETWORK_ERROR': 'Network connection error. Please check your connection and try again.',
      'PROCESSING_ERROR': 'Document processing failed. Please try again.'
    }
    
    return messages[code] || 'An unexpected error occurred. Please try again.'
  }

  /**
   * Handles vision processing errors with appropriate recovery strategy
   */
  static async handleVisionError(
    error: any, 
    context: string,
    retryFn?: () => Promise<any>,
    maxRetries: number = 3,
    currentRetry: number = 0
  ): Promise<any> {
    const visionError = this.createVisionError(error, context)
    
    // Log error for monitoring
    console.error('Vision processing error:', {
      code: visionError.code,
      context,
      retryable: visionError.retryable,
      currentRetry,
      maxRetries,
      timestamp: new Date().toISOString()
    })

    // If error is retryable and we haven't exceeded max retries
    if (visionError.retryable && retryFn && currentRetry < maxRetries) {
      // Calculate backoff delay
      const backoffMs = this.calculateBackoff(currentRetry, visionError.code)
      
      console.log(`Retrying vision processing in ${backoffMs}ms (attempt ${currentRetry + 1}/${maxRetries})`)
      
      // Wait for backoff period
      await this.sleep(backoffMs)
      
      try {
        return await retryFn()
      } catch (retryError) {
        // Recursive retry with incremented counter
        return this.handleVisionError(retryError, context, retryFn, maxRetries, currentRetry + 1)
      }
    }
    
    // No more retries or non-retryable error - throw the vision error
    throw visionError
  }

  /**
   * Calculates backoff delay based on retry attempt and error type
   */
  private static calculateBackoff(attempt: number, errorCode: string): number {
    // Different backoff strategies for different error types
    switch (errorCode) {
      case VisionErrorCodes.RATE_LIMIT:
        // Longer backoff for rate limits
        return Math.min(5000 * Math.pow(2, attempt), 30000)
      
      case VisionErrorCodes.UPSTREAM_TIMEOUT:
        // Medium backoff for timeouts
        return Math.min(2000 * Math.pow(2, attempt), 15000)
      
      default:
        // Standard exponential backoff
        return Math.min(1000 * Math.pow(2, attempt), 10000)
    }
  }

  /**
   * Sleep utility for backoff delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Checks if an error indicates a permanent failure (non-retryable)
   */
  static isPermanentFailure(error: VisionError): boolean {
    const permanentErrors = [
      VisionErrorCodes.NO_FILE,
      VisionErrorCodes.PAYLOAD_TOO_LARGE,
      VisionErrorCodes.MODE_UNSUPPORTED,
      'API_KEY_INVALID'
    ]
    
    return permanentErrors.includes(error.code)
  }

  /**
   * Gets recovery suggestions for different error types
   */
  static getRecoverySuggestions(error: VisionError): string[] {
    const suggestions: Record<string, string[]> = {
      [VisionErrorCodes.PARSE_FAILED]: [
        'Try a clearer, higher-quality image',
        'Ensure the document is well-lit and in focus',
        'Check that all text is clearly visible'
      ],
      [VisionErrorCodes.PAYLOAD_TOO_LARGE]: [
        'Compress the image to reduce file size',
        'Use a smaller image resolution',
        'Try a different image format (JPEG instead of PNG)'
      ],
      [VisionErrorCodes.NO_FILE]: [
        'Select an image file to upload',
        'Ensure the file is a valid image format'
      ],
      [VisionErrorCodes.VALIDATION_FAILED]: [
        'Check that the image contains the expected document type',
        'Ensure all required information is visible',
        'Try a different angle or better lighting'
      ]
    }
    
    return suggestions[error.code] || ['Try again with a different image']
  }
}
