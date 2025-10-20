/**
 * Ultra God-Tier Wizard: URL Validator
 * 
 * SSRF protection + HTTPS enforcement + host allowlist.
 * 
 * Phase B-3: Data Source Registry (Production Hardening)
 */

import { DataSourceError, DataSourceErrorCode } from './errors'

// ============================================================================
// URL VALIDATION CONFIG
// ============================================================================

export interface URLValidationConfig {
  // Allow relative URLs (e.g., /api/...)
  allowRelative?: boolean
  
  // Require HTTPS for absolute URLs
  requireHTTPS?: boolean
  
  // Allowed hosts (regex patterns)
  allowedHosts?: string[]
  
  // Blocked private IP ranges
  blockPrivateIPs?: boolean
  
  // Strict mode (enforce all rules)
  strictMode?: boolean
}

const DEFAULT_CONFIG: URLValidationConfig = {
  allowRelative: true,
  requireHTTPS: true,
  allowedHosts: [
    '^/api/', // Relative API routes
    'https://api\\.motomind\\.com',
    'https://.*\\.motomind\\.com', // Any motomind subdomain
  ],
  blockPrivateIPs: true,
  strictMode: process.env.NODE_ENV === 'production',
}

// ============================================================================
// PRIVATE IP DETECTION
// ============================================================================

const PRIVATE_IP_PATTERNS = [
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  /^127\./,                   // 127.0.0.0/8 (localhost)
  /^169\.254\./,              // 169.254.0.0/16 (link-local)
  /^::1$/,                    // IPv6 localhost
  /^fc00:/,                   // IPv6 private
  /^fe80:/,                   // IPv6 link-local
]

function isPrivateIP(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(hostname))
}

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * Validate URL against security policies
 * 
 * Throws DataSourceError if validation fails
 */
export function validateURL(
  url: string,
  config: URLValidationConfig = DEFAULT_CONFIG
): void {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  
  // Check for empty
  if (!url || url.trim() === '') {
    throw new DataSourceError(
      DataSourceErrorCode.INVALID_CONFIG,
      'URL cannot be empty'
    )
  }
  
  // Relative URLs
  if (url.startsWith('/')) {
    if (!cfg.allowRelative) {
      throw new DataSourceError(
        DataSourceErrorCode.SSRF_BLOCKED,
        'Relative URLs not allowed'
      )
    }
    
    // Check against relative URL patterns
    if (cfg.strictMode && cfg.allowedHosts) {
      const relativePatterns = cfg.allowedHosts.filter(p => p.startsWith('^/'))
      
      if (relativePatterns.length > 0) {
        const allowed = relativePatterns.some(pattern => {
          const regex = new RegExp(pattern)
          return regex.test(url)
        })
        
        if (!allowed) {
          throw new DataSourceError(
            DataSourceErrorCode.SSRF_BLOCKED,
            `URL not in allowlist: ${url}`
          )
        }
      }
    }
    
    return // Relative URL is valid
  }
  
  // Parse absolute URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (err) {
    throw new DataSourceError(
      DataSourceErrorCode.INVALID_CONFIG,
      `Invalid URL: ${url}`
    )
  }
  
  // HTTPS enforcement
  if (cfg.requireHTTPS && parsed.protocol !== 'https:') {
    if (cfg.strictMode) {
      throw new DataSourceError(
        DataSourceErrorCode.HTTPS_REQUIRED,
        `HTTPS required, got: ${parsed.protocol}`
      )
    } else {
      console.warn(`[DataSource] HTTPS recommended, got: ${parsed.protocol}`)
    }
  }
  
  // Block private IPs (SSRF protection)
  if (cfg.blockPrivateIPs && isPrivateIP(parsed.hostname)) {
    throw new DataSourceError(
      DataSourceErrorCode.SSRF_BLOCKED,
      `Private IP addresses not allowed: ${parsed.hostname}`
    )
  }
  
  // Host allowlist
  if (cfg.strictMode && cfg.allowedHosts && cfg.allowedHosts.length > 0) {
    const absolutePatterns = cfg.allowedHosts.filter(p => !p.startsWith('^/'))
    
    if (absolutePatterns.length > 0) {
      const allowed = absolutePatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern)
          return regex.test(url)
        } catch {
          // Invalid regex, skip
          return false
        }
      })
      
      if (!allowed) {
        throw new DataSourceError(
          DataSourceErrorCode.SSRF_BLOCKED,
          `Host not in allowlist: ${parsed.hostname}`
        )
      }
    }
  }
}

/**
 * Check if URL is safe (non-throwing version)
 */
export function isURLSafe(
  url: string,
  config?: URLValidationConfig
): boolean {
  try {
    validateURL(url, config)
    return true
  } catch {
    return false
  }
}

/**
 * Get allowed hosts for display/debugging
 */
export function getAllowedHosts(config?: URLValidationConfig): string[] {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  return cfg.allowedHosts || []
}
