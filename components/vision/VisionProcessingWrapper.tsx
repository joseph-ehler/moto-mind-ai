// Vision Processing Wrapper - Handles Vision API Integration with Error Boundaries
// Wraps vision processing calls with proper error handling and graceful degradation

import React, { useState, useCallback } from 'react'
import { VisionErrorBoundary } from './VisionErrorBoundary'
import { AlertTriangle, Upload, CheckCircle } from 'lucide-react'

interface VisionProcessingWrapperProps {
  children: React.ReactNode
  onProcessingStart?: () => void
  onProcessingComplete?: (result: any) => void
  onProcessingError?: (error: Error) => void
  fallbackComponent?: React.ReactNode
}

interface ProcessingState {
  isProcessing: boolean
  hasError: boolean
  error: Error | null
  result: any | null
}

export function VisionProcessingWrapper({
  children,
  onProcessingStart,
  onProcessingComplete,
  onProcessingError,
  fallbackComponent
}: VisionProcessingWrapperProps) {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    hasError: false,
    error: null,
    result: null
  })

  const handleProcessingStart = useCallback(() => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      hasError: false,
      error: null
    }))
    onProcessingStart?.()
  }, [onProcessingStart])

  const handleProcessingComplete = useCallback((result: any) => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
      result
    }))
    onProcessingComplete?.(result)
  }, [onProcessingComplete])

  const handleProcessingError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
      hasError: true,
      error
    }))
    onProcessingError?.(error)
  }, [onProcessingError])

  const handleRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      error: null
    }))
  }, [])

  // Provide processing context to children
  const processingContext = {
    isProcessing: state.isProcessing,
    hasError: state.hasError,
    error: state.error,
    result: state.result,
    startProcessing: handleProcessingStart,
    completeProcessing: handleProcessingComplete,
    errorProcessing: handleProcessingError
  }

  return (
    <VisionErrorBoundary onRetry={handleRetry} fallback={fallbackComponent}>
      <VisionProcessingContext.Provider value={processingContext}>
        {children}
      </VisionProcessingContext.Provider>
    </VisionErrorBoundary>
  )
}

// Context for vision processing state
const VisionProcessingContext = React.createContext<{
  isProcessing: boolean
  hasError: boolean
  error: Error | null
  result: any | null
  startProcessing: () => void
  completeProcessing: (result: any) => void
  errorProcessing: (error: Error) => void
} | null>(null)

// Hook to use vision processing context
export function useVisionProcessing() {
  const context = React.useContext(VisionProcessingContext)
  if (!context) {
    throw new Error('useVisionProcessing must be used within VisionProcessingWrapper')
  }
  return context
}

// Processing status indicator component
export function VisionProcessingStatus() {
  const { isProcessing, hasError, error } = useVisionProcessing()

  if (isProcessing) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">Processing document...</span>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">Processing failed</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-green-600">
      <CheckCircle className="h-4 w-4" />
      <span className="text-sm">Ready to process</span>
    </div>
  )
}

// Graceful degradation component for when vision processing fails
export function VisionFallback({ 
  onManualEntry, 
  documentType 
}: { 
  onManualEntry?: () => void
  documentType?: string 
}) {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Vision Processing Unavailable</h3>
      <p className="mt-1 text-sm text-gray-500">
        Automatic document processing is temporarily unavailable.
      </p>
      {onManualEntry && (
        <div className="mt-4">
          <button
            onClick={onManualEntry}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Enter {documentType || 'Data'} Manually
          </button>
        </div>
      )}
    </div>
  )
}

// Higher-order component to wrap any component with vision error handling
export function withVisionErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <VisionErrorBoundary fallback={fallbackComponent}>
        <Component {...props} />
      </VisionErrorBoundary>
    )
  }
}
