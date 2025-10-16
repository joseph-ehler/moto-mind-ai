/**
 * API URL Builder
 * 
 * Elite-tier URL management:
 * - Environment-aware (dev, staging, production)
 * - Rebrand-proof (no hardcoded URLs)
 * - Server/client compatible
 * - Testing-friendly
 * 
 * Usage:
 * ```ts
 * import { apiUrl } from '@/lib/utils/api-url'
 * 
 * // Client-side
 * const url = apiUrl('/api/vehicles')
 * 
 * // Testing
 * const url = apiUrl('/api/vehicles', { baseUrl: 'http://localhost:3005' })
 * 
 * // Server-side (absolute URL needed)
 * const url = apiUrl('/api/vehicles', { absolute: true })
 * ```
 */

interface ApiUrlOptions {
  /**
   * Base URL override (primarily for testing)
   */
  baseUrl?: string

  /**
   * Force absolute URL (includes protocol + domain)
   * Useful for server-side API calls, webhooks, emails
   */
  absolute?: boolean

  /**
   * Query parameters to append
   */
  params?: Record<string, string | number | boolean | undefined | null>
}

/**
 * Get the base API URL based on environment
 */
export function getApiBaseUrl(): string {
  // Browser: Use relative URLs (most efficient)
  if (typeof window !== 'undefined') {
    return ''
  }

  // Server: Use environment variable or fallback
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Vercel automatic URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local development fallback
  return 'http://localhost:3005'
}

/**
 * Build an API URL with proper environment handling
 * 
 * @example
 * ```ts
 * // Client-side (relative)
 * apiUrl('/api/vehicles') // '/api/vehicles'
 * 
 * // Server-side (absolute)
 * apiUrl('/api/vehicles', { absolute: true }) // 'https://motomind.app/api/vehicles'
 * 
 * // Testing (override)
 * apiUrl('/api/vehicles', { baseUrl: 'http://localhost:3000' })
 * 
 * // With params
 * apiUrl('/api/vehicles', { params: { limit: 10, sort: 'name' } })
 * // '/api/vehicles?limit=10&sort=name'
 * ```
 */
export function apiUrl(
  path: string,
  options: ApiUrlOptions = {}
): string {
  const { baseUrl, absolute = false, params } = options

  // Determine base URL
  let base = ''
  
  if (baseUrl) {
    // Explicit override (testing)
    base = baseUrl
  } else if (absolute || typeof window === 'undefined') {
    // Server-side or explicit absolute request
    base = getApiBaseUrl()
  }
  // else: browser + relative (base = '')

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  // Build URL
  let url = base + normalizedPath

  // Add query parameters
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  return url
}

/**
 * Build a full absolute URL (always includes protocol + domain)
 * Useful for: webhooks, emails, external integrations
 */
export function absoluteApiUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  return apiUrl(path, { absolute: true, params })
}

/**
 * Get the base URL for the current environment
 * (without trailing slash)
 */
export function getBaseUrl(): string {
  return getApiBaseUrl().replace(/\/$/, '')
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if we're in test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}
