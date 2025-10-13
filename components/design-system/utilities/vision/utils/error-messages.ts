/**
 * Error Messages Utility
 * 
 * Smart, actionable error messages for vision system
 * Maps error codes to user-friendly guidance
 */

import type { CaptureType } from '../types'

export interface ErrorGuidance {
  title: string
  message: string
  suggestions: string[]
  canRetry: boolean
  severity: 'error' | 'warning' | 'info'
}

/**
 * Common error patterns and their guidance
 */
const ERROR_PATTERNS: Record<string, ErrorGuidance> = {
  // Camera errors
  'NotAllowedError': {
    title: 'Camera Access Denied',
    message: 'Camera permission is required to scan',
    suggestions: [
      'Go to Settings → Privacy → Camera',
      'Enable camera access for this browser',
      'Or use "Upload Photo" instead'
    ],
    canRetry: false,
    severity: 'error'
  },
  
  'NotFoundError': {
    title: 'No Camera Found',
    message: 'Could not find a camera on this device',
    suggestions: [
      'Check if your camera is connected',
      'Try a different browser',
      'Use "Upload Photo" instead'
    ],
    canRetry: true,
    severity: 'error'
  },
  
  'NotReadableError': {
    title: 'Camera In Use',
    message: 'Camera is being used by another app',
    suggestions: [
      'Close other apps using the camera',
      'Restart your browser',
      'Use "Upload Photo" instead'
    ],
    canRetry: true,
    severity: 'warning'
  },
  
  // Processing errors
  'vin_not_found': {
    title: 'VIN Not Detected',
    message: 'Could not find a VIN number in the image',
    suggestions: [
      'Get closer to the VIN plate',
      'Clean the VIN plate if dirty',
      'Use better lighting',
      'Make sure VIN is in frame'
    ],
    canRetry: true,
    severity: 'warning'
  },
  
  'vin_unclear': {
    title: 'VIN Not Clear',
    message: 'VIN number is too blurry to read',
    suggestions: [
      'Hold camera steady',
      'Move closer to VIN plate',
      'Clean camera lens',
      'Use better lighting'
    ],
    canRetry: true,
    severity: 'warning'
  },
  
  'odometer_not_visible': {
    title: 'Odometer Not Visible',
    message: 'Could not see the odometer display',
    suggestions: [
      'Turn on the ignition',
      'Center odometer in the frame',
      'Avoid glare on display',
      'Get closer to dashboard'
    ],
    canRetry: true,
    severity: 'warning'
  },
  
  'document_blurry': {
    title: 'Document Too Blurry',
    message: 'Text in document is not clear enough',
    suggestions: [
      'Hold camera steady',
      'Place document on flat surface',
      'Use better lighting',
      'Clean camera lens'
    ],
    canRetry: true,
    severity: 'warning'
  },
  
  'poor_lighting': {
    title: 'Poor Lighting',
    message: 'Image is too dark or too bright',
    suggestions: [
      'Move to better lit area',
      'Avoid direct sunlight',
      'Turn on room lights',
      'Avoid shadows on document'
    ],
    canRetry: true,
    severity: 'warning'
  },
  
  // Network errors
  'network_error': {
    title: 'Network Error',
    message: 'Could not connect to processing service',
    suggestions: [
      'Check your internet connection',
      'Try again in a moment',
      'Switch to a better network'
    ],
    canRetry: true,
    severity: 'error'
  },
  
  'timeout': {
    title: 'Processing Timeout',
    message: 'Processing took too long',
    suggestions: [
      'Try again with a clearer image',
      'Check your internet connection',
      'Try a different photo'
    ],
    canRetry: true,
    severity: 'warning'
  }
}

/**
 * Default error guidance for unknown errors
 */
const DEFAULT_ERROR: ErrorGuidance = {
  title: 'Something Went Wrong',
  message: 'An unexpected error occurred',
  suggestions: [
    'Try again',
    'Use a different photo',
    'Contact support if problem persists'
  ],
  canRetry: true,
  severity: 'error'
}

/**
 * Get error guidance based on error message/code
 */
export function getErrorGuidance(
  error: string | Error,
  captureType?: CaptureType
): ErrorGuidance {
  const errorString = error instanceof Error ? error.message : error
  
  // Check for exact pattern matches
  for (const [pattern, guidance] of Object.entries(ERROR_PATTERNS)) {
    if (errorString.includes(pattern) || errorString.toLowerCase().includes(pattern.toLowerCase())) {
      return guidance
    }
  }
  
  // Check for capture type specific patterns
  if (captureType) {
    const typeSpecificError = inferErrorFromType(errorString, captureType)
    if (typeSpecificError) {
      return typeSpecificError
    }
  }
  
  // Return default
  return {
    ...DEFAULT_ERROR,
    message: errorString || DEFAULT_ERROR.message
  }
}

/**
 * Infer error guidance based on capture type
 */
function inferErrorFromType(
  error: string,
  captureType: CaptureType
): ErrorGuidance | null {
  const lowerError = error.toLowerCase()
  
  // VIN specific
  if (captureType === 'vin') {
    if (lowerError.includes('not found') || lowerError.includes('no vin')) {
      return ERROR_PATTERNS.vin_not_found
    }
    if (lowerError.includes('blur') || lowerError.includes('unclear')) {
      return ERROR_PATTERNS.vin_unclear
    }
  }
  
  // Odometer specific
  if (captureType === 'odometer') {
    if (lowerError.includes('not visible') || lowerError.includes('not found')) {
      return ERROR_PATTERNS.odometer_not_visible
    }
  }
  
  // Document specific
  if (captureType === 'document' || captureType === 'receipt') {
    if (lowerError.includes('blur')) {
      return ERROR_PATTERNS.document_blurry
    }
  }
  
  // Common issues
  if (lowerError.includes('light') || lowerError.includes('dark') || lowerError.includes('bright')) {
    return ERROR_PATTERNS.poor_lighting
  }
  
  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return ERROR_PATTERNS.network_error
  }
  
  if (lowerError.includes('timeout') || lowerError.includes('too long')) {
    return ERROR_PATTERNS.timeout
  }
  
  return null
}

/**
 * Format error for display
 */
export function formatErrorMessage(guidance: ErrorGuidance): string {
  const parts = [guidance.message]
  
  if (guidance.suggestions.length > 0) {
    parts.push('\n\nSuggestions:')
    guidance.suggestions.forEach((suggestion, i) => {
      parts.push(`${i + 1}. ${suggestion}`)
    })
  }
  
  return parts.join('\n')
}
