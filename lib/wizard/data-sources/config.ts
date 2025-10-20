/**
 * Ultra God-Tier Wizard: Data Source Configuration
 * 
 * Centralized configuration for data source policies per environment.
 * 
 * Phase B-3: Data Source Registry (Production Polish)
 */

import type { URLValidationConfig } from './url-validator'

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

export type Environment = 'development' | 'staging' | 'production'

export function getCurrentEnvironment(): Environment {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Check for staging flag
    if (process.env.NEXT_PUBLIC_ENV === 'staging') {
      return 'staging'
    }
    return 'production'
  }
  return 'development'
}

// ============================================================================
// HOST ALLOWLIST POLICIES
// ============================================================================

const HOST_POLICIES: Record<Environment, URLValidationConfig> = {
  development: {
    allowRelative: true,
    requireHTTPS: false, // Allow HTTP in dev
    allowedHosts: [
      '^/api/', // All local API routes
      'http://localhost:.*',
      'http://127\\.0\\.0\\.1:.*',
      'https://.*', // Any HTTPS in dev (for testing)
    ],
    blockPrivateIPs: false, // Allow localhost in dev
    strictMode: false,
  },
  
  staging: {
    allowRelative: true,
    requireHTTPS: true,
    allowedHosts: [
      '^/api/', // Relative routes
      'https://.*\\.motomind-staging\\.com',
      'https://api-staging\\.motomind\\.com',
      'https://staging\\.vendor\\.com', // Example vendor
    ],
    blockPrivateIPs: true,
    strictMode: true,
  },
  
  production: {
    allowRelative: true,
    requireHTTPS: true,
    allowedHosts: [
      '^/api/', // Only our API routes
      'https://api\\.motomind\\.com',
      'https://.*\\.motomind\\.com', // Any motomind subdomain
      'https://api\\.vendor\\.com', // Approved vendors only
    ],
    blockPrivateIPs: true,
    strictMode: true,
  },
}

/**
 * Get URL validation policy for current environment
 */
export function getURLPolicy(): URLValidationConfig {
  const env = getCurrentEnvironment()
  return HOST_POLICIES[env]
}

/**
 * Get URL policy for specific environment (for testing)
 */
export function getURLPolicyForEnv(env: Environment): URLValidationConfig {
  return HOST_POLICIES[env]
}

// ============================================================================
// RETRY POLICIES
// ============================================================================

export interface RetryPolicy {
  maxRetries: number
  baseMs: number
  maxMs: number
  backoff: 'exponential' | 'linear' | 'fixed'
  maxAttempts: number // Global cap across all sources in a step
  maxStepBudgetMs: number // Total time budget for retries in a step
}

const RETRY_POLICIES: Record<Environment, RetryPolicy> = {
  development: {
    maxRetries: 2,
    baseMs: 100, // Fast retries in dev
    maxMs: 1000,
    backoff: 'exponential',
    maxAttempts: 5,
    maxStepBudgetMs: 10000, // 10s budget
  },
  
  staging: {
    maxRetries: 3,
    baseMs: 200,
    maxMs: 3000,
    backoff: 'exponential',
    maxAttempts: 6,
    maxStepBudgetMs: 8000, // 8s budget
  },
  
  production: {
    maxRetries: 3,
    baseMs: 400,
    maxMs: 3000,
    backoff: 'exponential',
    maxAttempts: 6,
    maxStepBudgetMs: 6000, // 6s budget
  },
}

/**
 * Get retry policy for current environment
 */
export function getRetryPolicy(): RetryPolicy {
  const env = getCurrentEnvironment()
  return RETRY_POLICIES[env]
}

// ============================================================================
// CACHE POLICIES
// ============================================================================

export interface CachePolicy {
  maxSizeEntries: number
  maxSizeBytes: number // Memory budget
  defaultTTLMs: number
  minTTLMs: number
  maxTTLMs: number
}

const CACHE_POLICIES: Record<Environment, CachePolicy> = {
  development: {
    maxSizeEntries: 50,
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    defaultTTLMs: 60000, // 1 min
    minTTLMs: 1000,
    maxTTLMs: 604800000, // 7 days
  },
  
  staging: {
    maxSizeEntries: 100,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    defaultTTLMs: 300000, // 5 min
    minTTLMs: 1000,
    maxTTLMs: 604800000, // 7 days
  },
  
  production: {
    maxSizeEntries: 200,
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    defaultTTLMs: 600000, // 10 min
    minTTLMs: 1000,
    maxTTLMs: 604800000, // 7 days
  },
}

/**
 * Get cache policy for current environment
 */
export function getCachePolicy(): CachePolicy {
  const env = getCurrentEnvironment()
  return CACHE_POLICIES[env]
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlags {
  enableSWR: boolean
  enableInFlightDedupe: boolean
  enableCircuitBreaker: boolean
  enableRetry: boolean
  enableResponseValidation: boolean
  enableDevInspector: boolean
}

const FEATURE_FLAGS: Record<Environment, FeatureFlags> = {
  development: {
    enableSWR: true,
    enableInFlightDedupe: true,
    enableCircuitBreaker: false, // Less noise in dev
    enableRetry: true,
    enableResponseValidation: true,
    enableDevInspector: true,
  },
  
  staging: {
    enableSWR: true,
    enableInFlightDedupe: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    enableResponseValidation: true,
    enableDevInspector: true,
  },
  
  production: {
    enableSWR: true,
    enableInFlightDedupe: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    enableResponseValidation: true,
    enableDevInspector: false, // Disable in prod
  },
}

/**
 * Get feature flags for current environment
 */
export function getFeatureFlags(): FeatureFlags {
  const env = getCurrentEnvironment()
  return FEATURE_FLAGS[env]
}

// ============================================================================
// UNIFIED CONFIG
// ============================================================================

export interface DataSourceConfig {
  env: Environment
  urlPolicy: URLValidationConfig
  retryPolicy: RetryPolicy
  cachePolicy: CachePolicy
  featureFlags: FeatureFlags
}

/**
 * Get complete data source configuration for current environment
 */
export function getDataSourceConfig(): DataSourceConfig {
  const env = getCurrentEnvironment()
  
  return {
    env,
    urlPolicy: getURLPolicy(),
    retryPolicy: getRetryPolicy(),
    cachePolicy: getCachePolicy(),
    featureFlags: getFeatureFlags(),
  }
}
