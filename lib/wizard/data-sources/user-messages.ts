/**
 * Ultra God-Tier Wizard: User Messages
 * 
 * Standardized, user-friendly messages for data source errors.
 * Localizable and consistent across the app.
 * 
 * Phase B-3: Data Source Registry (Production Polish)
 */

import { DataSourceErrorCode } from './errors'

// ============================================================================
// USER-FRIENDLY MESSAGES
// ============================================================================

export const USER_MESSAGES: Record<DataSourceErrorCode, {
  title: string
  message: string
  action?: string
}> = {
  [DataSourceErrorCode.TIMEOUT]: {
    title: 'Request Timed Out',
    message: "The service didn't respond in time. This is usually temporary.",
    action: 'Try again',
  },
  
  [DataSourceErrorCode.ABORTED]: {
    title: 'Request Cancelled',
    message: 'The request was cancelled.',
    action: 'Continue',
  },
  
  [DataSourceErrorCode.NETWORK]: {
    title: 'Connection Issue',
    message: "Looks like there's a connection problem. Check your internet and try again.",
    action: 'Retry',
  },
  
  [DataSourceErrorCode.CB_OPEN]: {
    title: 'Service Temporarily Unavailable',
    message: "We're pausing requests for a moment to let the service recover.",
    action: 'Wait and retry',
  },
  
  [DataSourceErrorCode.HTTP_4XX]: {
    title: 'Invalid Request',
    message: 'There was a problem with your request. Please check your input.',
    action: 'Go back',
  },
  
  [DataSourceErrorCode.HTTP_5XX]: {
    title: 'Service Error',
    message: 'The service is experiencing issues. Please try again in a moment.',
    action: 'Try again',
  },
  
  [DataSourceErrorCode.PARSER]: {
    title: 'Invalid Response',
    message: 'We received an unexpected response format.',
    action: 'Contact support',
  },
  
  [DataSourceErrorCode.VALIDATION]: {
    title: 'Validation Failed',
    message: 'The response failed validation checks.',
    action: 'Contact support',
  },
  
  [DataSourceErrorCode.PRIVACY_BLOCKED]: {
    title: 'Privacy Policy Violation',
    message: 'This request was blocked due to privacy policies.',
    action: 'Contact support',
  },
  
  [DataSourceErrorCode.SSRF_BLOCKED]: {
    title: 'Blocked Request',
    message: 'This URL is not allowed for security reasons.',
    action: 'Contact support',
  },
  
  [DataSourceErrorCode.HTTPS_REQUIRED]: {
    title: 'Secure Connection Required',
    message: 'HTTPS is required for this request.',
    action: 'Contact support',
  },
  
  [DataSourceErrorCode.SOURCE_NOT_FOUND]: {
    title: 'Configuration Error',
    message: 'The requested data source was not found.',
    action: 'Contact support',
  },
  
  [DataSourceErrorCode.INVALID_CONFIG]: {
    title: 'Configuration Error',
    message: 'There is an error in the data source configuration.',
    action: 'Contact support',
  },
  
  [DataSourceErrorCode.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'Something unexpected happened. Please try again.',
    action: 'Try again',
  },
}

/**
 * Get user-friendly message for error code
 */
export function getUserMessage(code: DataSourceErrorCode): {
  title: string
  message: string
  action?: string
} {
  return USER_MESSAGES[code]
}

/**
 * Get localized message (future: i18n integration)
 */
export function getLocalizedMessage(
  code: DataSourceErrorCode,
  locale = 'en-US'
): {
  title: string
  message: string
  action?: string
} {
  // For now, just return English
  // Future: Load from i18n files based on locale
  return USER_MESSAGES[code]
}

// ============================================================================
// SAFE MODE BANNER MESSAGES
// ============================================================================

export const SAFE_MODE_MESSAGES = {
  nonRetryableFailure: {
    title: 'Some data could not be loaded',
    message: 'You can continue, but some information may be missing.',
    level: 'warning' as const,
  },
  
  partialFailure: {
    title: 'Partial data loaded',
    message: 'Some data sources failed, but you can still continue.',
    level: 'info' as const,
  },
  
  staleData: {
    title: 'Showing cached data',
    message: 'We could not refresh the data, but here is what we have.',
    level: 'info' as const,
  },
}

/**
 * Get safe mode banner message
 */
export function getSafeModeMessage(type: keyof typeof SAFE_MODE_MESSAGES) {
  return SAFE_MODE_MESSAGES[type]
}
