// Vision Error Boundary - Handles Known Vision Processing Failure Modes
// Based on actual failure patterns, not hypothetical scenarios

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Clock, Zap, FileX, Upload } from 'lucide-react'

interface VisionErrorBoundaryProps {
  children: ReactNode
  onRetry?: () => void
  fallback?: ReactNode
}

interface VisionErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorCode: string | null
  retryCount: number
}

// Known vision processing error codes from actual system
const VISION_ERROR_CODES = {
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT',
  PARSE_FAILED: 'PARSE_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MODE_UNSUPPORTED: 'MODE_UNSUPPORTED',
  NO_FILE: 'NO_FILE',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE'
} as const

export class VisionErrorBoundary extends Component<VisionErrorBoundaryProps, VisionErrorBoundaryState> {
  private maxRetries = 3

  constructor(props: VisionErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorCode: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<VisionErrorBoundaryState> {
    // Extract error code from error message if present
    const errorCode = VisionErrorBoundary.extractErrorCode(error)
    
    return {
      hasError: true,
      error,
      errorCode
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring (without sensitive data)
    console.error('Vision processing error caught by boundary:', {
      error: error.message,
      errorCode: this.state.errorCode,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    })
  }

  private static extractErrorCode(error: Error): string | null {
    const message = error.message.toLowerCase()
    
    // Match against known error patterns
    if (message.includes('timeout')) return VISION_ERROR_CODES.UPSTREAM_TIMEOUT
    if (message.includes('rate limit') || message.includes('429')) return VISION_ERROR_CODES.RATE_LIMIT
    if (message.includes('parse') || message.includes('json')) return VISION_ERROR_CODES.PARSE_FAILED
    if (message.includes('validation')) return VISION_ERROR_CODES.VALIDATION_FAILED
    if (message.includes('mode') || message.includes('unsupported')) return VISION_ERROR_CODES.MODE_UNSUPPORTED
    if (message.includes('no file') || message.includes('no image')) return VISION_ERROR_CODES.NO_FILE
    if (message.includes('too large') || message.includes('payload')) return VISION_ERROR_CODES.PAYLOAD_TOO_LARGE
    
    return null
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorCode: null,
        retryCount: prevState.retryCount + 1
      }))
      
      // Call parent retry handler if provided
      this.props.onRetry?.()
    }
  }

  private renderErrorUI() {
    const { errorCode, retryCount } = this.state
    const canRetry = retryCount < this.maxRetries
    
    // Render specific error UI based on known failure modes
    switch (errorCode) {
      case VISION_ERROR_CODES.UPSTREAM_TIMEOUT:
        return this.renderTimeoutError(canRetry)
      
      case VISION_ERROR_CODES.RATE_LIMIT:
        return this.renderRateLimitError(canRetry)
      
      case VISION_ERROR_CODES.PARSE_FAILED:
        return this.renderParseError(canRetry)
      
      case VISION_ERROR_CODES.PAYLOAD_TOO_LARGE:
        return this.renderPayloadError()
      
      case VISION_ERROR_CODES.NO_FILE:
        return this.renderNoFileError()
      
      case VISION_ERROR_CODES.VALIDATION_FAILED:
        return this.renderValidationError(canRetry)
      
      case VISION_ERROR_CODES.MODE_UNSUPPORTED:
        return this.renderModeError()
      
      default:
        return this.renderGenericError(canRetry)
    }
  }

  private renderTimeoutError(canRetry: boolean) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Processing Timeout</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Vision processing took too long. This usually resolves itself.
            </p>
          </div>
        </div>
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="mt-3 bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again ({this.maxRetries - this.state.retryCount} attempts left)</span>
          </button>
        )}
      </div>
    )
  }

  private renderRateLimitError(canRetry: boolean) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Zap className="h-5 w-5 text-orange-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-800">Rate Limit Reached</h3>
            <p className="text-sm text-orange-700 mt-1">
              Too many requests. Please wait a moment before trying again.
            </p>
          </div>
        </div>
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="mt-3 bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm hover:bg-orange-200 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry in a moment</span>
          </button>
        )}
      </div>
    )
  }

  private renderParseError(canRetry: boolean) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FileX className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Processing Failed</h3>
            <p className="text-sm text-red-700 mt-1">
              Could not process the document. The image may be unclear or damaged.
            </p>
          </div>
        </div>
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="mt-3 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    )
  }

  private renderPayloadError() {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Upload className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">File Too Large</h3>
            <p className="text-sm text-red-700 mt-1">
              The image file is too large. Please use a smaller image (under 10MB).
            </p>
          </div>
        </div>
      </div>
    )
  }

  private renderNoFileError() {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <FileX className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-800">No File Selected</h3>
            <p className="text-sm text-gray-700 mt-1">
              Please select an image file to process.
            </p>
          </div>
        </div>
      </div>
    )
  }

  private renderValidationError(canRetry: boolean) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">Validation Failed</h3>
            <p className="text-sm text-yellow-700 mt-1">
              The document data could not be validated. Please check the image quality.
            </p>
          </div>
        </div>
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="mt-3 bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    )
  }

  private renderModeError() {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Processing Mode Not Supported</h3>
            <p className="text-sm text-red-700 mt-1">
              The requested processing mode is not available. Please try a different approach.
            </p>
          </div>
        </div>
      </div>
    )
  }

  private renderGenericError(canRetry: boolean) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
            <p className="text-sm text-red-700 mt-1">
              An unexpected error occurred while processing the document.
            </p>
          </div>
        </div>
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="mt-3 bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    )
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise render error UI
      return this.props.fallback || this.renderErrorUI()
    }

    return this.props.children
  }
}

// Hook for functional components to handle vision errors
export function useVisionErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  const retry = React.useCallback(() => {
    setError(null)
    setRetryCount(prev => prev + 1)
  }, [])

  const reset = React.useCallback(() => {
    setError(null)
    setRetryCount(0)
  }, [])

  return {
    error,
    retryCount,
    handleError,
    retry,
    reset
  }
}
