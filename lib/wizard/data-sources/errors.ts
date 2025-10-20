/**
 * Ultra God-Tier Wizard: Error Taxonomy
 * 
 * Stable error codes for consistent handling across UI/analytics.
 * 
 * Phase B-3: Data Source Registry (Production Hardening)
 */

// ============================================================================
// ERROR CODES (Stable Taxonomy)
// ============================================================================

export enum DataSourceErrorCode {
  // Network & Transport
  TIMEOUT = 'TIMEOUT',
  ABORTED = 'ABORTED',
  NETWORK = 'NETWORK',
  
  // Circuit Breaker
  CB_OPEN = 'CB_OPEN',
  
  // HTTP Status
  HTTP_4XX = '4XX',
  HTTP_5XX = '5XX',
  
  // Parsing & Validation
  PARSER = 'PARSER',
  VALIDATION = 'VALIDATION',
  
  // Privacy & Security
  PRIVACY_BLOCKED = 'PRIVACY_BLOCKED',
  SSRF_BLOCKED = 'SSRF_BLOCKED',
  HTTPS_REQUIRED = 'HTTPS_REQUIRED',
  
  // Configuration
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  INVALID_CONFIG = 'INVALID_CONFIG',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// ERROR MESSAGES (User-Friendly)
// ============================================================================

export const ERROR_MESSAGES: Record<DataSourceErrorCode, string> = {
  [DataSourceErrorCode.TIMEOUT]: 'Request timed out. Please try again.',
  [DataSourceErrorCode.ABORTED]: 'Request was cancelled.',
  [DataSourceErrorCode.NETWORK]: 'Network error. Check your connection.',
  [DataSourceErrorCode.CB_OPEN]: 'Service temporarily unavailable. Please wait.',
  [DataSourceErrorCode.HTTP_4XX]: 'Invalid request. Please check your input.',
  [DataSourceErrorCode.HTTP_5XX]: 'Server error. Please try again.',
  [DataSourceErrorCode.PARSER]: 'Invalid response format.',
  [DataSourceErrorCode.VALIDATION]: 'Response failed validation.',
  [DataSourceErrorCode.PRIVACY_BLOCKED]: 'Privacy policy violation.',
  [DataSourceErrorCode.SSRF_BLOCKED]: 'URL not allowed.',
  [DataSourceErrorCode.HTTPS_REQUIRED]: 'HTTPS required for security.',
  [DataSourceErrorCode.SOURCE_NOT_FOUND]: 'Data source not found.',
  [DataSourceErrorCode.INVALID_CONFIG]: 'Invalid data source configuration.',
  [DataSourceErrorCode.UNKNOWN]: 'An unexpected error occurred.',
}

// ============================================================================
// ERROR CLASSIFIER
// ============================================================================

/**
 * Classify error into stable taxonomy
 */
export function classifyError(error: unknown): {
  code: DataSourceErrorCode
  message: string
  retryable: boolean
} {
  if (!error) {
    return {
      code: DataSourceErrorCode.UNKNOWN,
      message: ERROR_MESSAGES[DataSourceErrorCode.UNKNOWN],
      retryable: false,
    }
  }
  
  const err = error as Error
  const message = err.message || String(error)
  
  // Check error message/name for patterns
  if (err.name === 'AbortError' || message.includes('abort')) {
    return {
      code: DataSourceErrorCode.ABORTED,
      message: ERROR_MESSAGES[DataSourceErrorCode.ABORTED],
      retryable: false,
    }
  }
  
  if (message === 'TIMEOUT' || message.includes('timeout')) {
    return {
      code: DataSourceErrorCode.TIMEOUT,
      message: ERROR_MESSAGES[DataSourceErrorCode.TIMEOUT],
      retryable: true,
    }
  }
  
  if (message === 'Circuit breaker is OPEN' || message.includes('CB_OPEN')) {
    return {
      code: DataSourceErrorCode.CB_OPEN,
      message: ERROR_MESSAGES[DataSourceErrorCode.CB_OPEN],
      retryable: false,
    }
  }
  
  if (message.includes('SSRF') || message.includes('not allowed')) {
    return {
      code: DataSourceErrorCode.SSRF_BLOCKED,
      message: ERROR_MESSAGES[DataSourceErrorCode.SSRF_BLOCKED],
      retryable: false,
    }
  }
  
  if (message.includes('HTTPS required')) {
    return {
      code: DataSourceErrorCode.HTTPS_REQUIRED,
      message: ERROR_MESSAGES[DataSourceErrorCode.HTTPS_REQUIRED],
      retryable: false,
    }
  }
  
  if (message.includes('privacy') || message.includes('Privacy')) {
    return {
      code: DataSourceErrorCode.PRIVACY_BLOCKED,
      message: ERROR_MESSAGES[DataSourceErrorCode.PRIVACY_BLOCKED],
      retryable: false,
    }
  }
  
  // HTTP status codes
  if (message.match(/HTTP 4\d\d/)) {
    return {
      code: DataSourceErrorCode.HTTP_4XX,
      message: ERROR_MESSAGES[DataSourceErrorCode.HTTP_4XX],
      retryable: false,
    }
  }
  
  if (message.match(/HTTP 5\d\d/)) {
    return {
      code: DataSourceErrorCode.HTTP_5XX,
      message: ERROR_MESSAGES[DataSourceErrorCode.HTTP_5XX],
      retryable: true,
    }
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('Network')) {
    return {
      code: DataSourceErrorCode.NETWORK,
      message: ERROR_MESSAGES[DataSourceErrorCode.NETWORK],
      retryable: true,
    }
  }
  
  // Parser errors
  if (message.includes('JSON') || message.includes('parse')) {
    return {
      code: DataSourceErrorCode.PARSER,
      message: ERROR_MESSAGES[DataSourceErrorCode.PARSER],
      retryable: false,
    }
  }
  
  // Default
  return {
    code: DataSourceErrorCode.UNKNOWN,
    message: ERROR_MESSAGES[DataSourceErrorCode.UNKNOWN],
    retryable: false,
  }
}

/**
 * Create typed error
 */
export class DataSourceError extends Error {
  constructor(
    public code: DataSourceErrorCode,
    message?: string,
    public details?: any
  ) {
    super(message || ERROR_MESSAGES[code])
    this.name = 'DataSourceError'
  }
}
