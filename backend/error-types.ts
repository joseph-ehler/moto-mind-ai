// MotoMindAI: Standardized Error Categories
// User-friendly error classification with clear guidance

export enum ErrorCategory {
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  API_UNAVAILABLE = 'API_UNAVAILABLE', 
  RATE_LIMITED = 'RATE_LIMITED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export interface StandardError {
  category: ErrorCategory
  message: string
  userMessage: string
  suggestion?: string
  retryAfter?: number
  context?: Record<string, any>
}

export class FleetError extends Error {
  constructor(
    public readonly category: ErrorCategory,
    public readonly userMessage: string,
    public readonly suggestion?: string,
    public readonly retryAfter?: number,
    public readonly context?: Record<string, any>
  ) {
    super(userMessage)
    this.name = 'FleetError'
  }
  
  toJSON(): StandardError {
    return {
      category: this.category,
      message: this.message,
      userMessage: this.userMessage,
      suggestion: this.suggestion,
      retryAfter: this.retryAfter,
      context: this.context
    }
  }
}

// Error factory functions for common scenarios
export const FleetErrors = {
  insufficientData: (vehicleLabel: string, missingMetrics: string[]) => 
    new FleetError(
      ErrorCategory.INSUFFICIENT_DATA,
      `${vehicleLabel} has insufficient data for analysis`,
      `Add recent data for: ${missingMetrics.join(', ')}`,
      undefined,
      { vehicleLabel, missingMetrics }
    ),
    
  apiUnavailable: (provider: string, retryAfter?: number) =>
    new FleetError(
      ErrorCategory.API_UNAVAILABLE,
      `${provider} API is currently unavailable`,
      retryAfter 
        ? `Service will retry automatically in ${Math.ceil(retryAfter / 1000)} seconds`
        : 'Please try again later',
      retryAfter,
      { provider }
    ),
    
  rateLimited: (retryAfter: number) =>
    new FleetError(
      ErrorCategory.RATE_LIMITED,
      'Request quota exceeded',
      `Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again`,
      retryAfter
    ),
    
  systemError: (operation: string) =>
    new FleetError(
      ErrorCategory.SYSTEM_ERROR,
      `System error during ${operation}`,
      'Our team has been notified. Please try again in a few minutes.'
    ),
    
  validationError: (field: string, reason: string) =>
    new FleetError(
      ErrorCategory.VALIDATION_ERROR,
      `Validation failed for ${field}: ${reason}`,
      `Please check the ${field} and try again`
    ),
    
  permissionDenied: (action: string) =>
    new FleetError(
      ErrorCategory.PERMISSION_DENIED,
      `Permission denied for ${action}`,
      'Contact your fleet administrator for access'
    )
}

// Error response handler for API routes
export function getErrorStatusCode(category: ErrorCategory): number {
  switch (category) {
    case ErrorCategory.INSUFFICIENT_DATA:
    case ErrorCategory.VALIDATION_ERROR:
      return 400
    case ErrorCategory.PERMISSION_DENIED:
      return 403
    case ErrorCategory.RATE_LIMITED:
      return 429
    case ErrorCategory.API_UNAVAILABLE:
      return 503
    case ErrorCategory.SYSTEM_ERROR:
    default:
      return 500
  }
}
