/**
 * Ultra God-Tier Wizard: Retry with Jitter
 * 
 * Exponential backoff with full jitter to prevent thundering herd.
 * 
 * Phase B-3: Data Source Registry (Production Hardening)
 */

import type { DataSourceDef } from './types'
import { classifyError } from './errors'

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export interface RetryContext {
  attempt: number
  maxRetries: number
  baseMs: number
  maxMs: number
  backoff: 'exponential' | 'linear' | 'fixed'
  onRetry?: (attempt: number, delayMs: number, error: Error) => void
}

// ============================================================================
// BACKOFF CALCULATION
// ============================================================================

/**
 * Calculate backoff delay with full jitter
 * 
 * Full jitter: random(0, min(cap, base * 2^attempt))
 * Prevents thundering herd problem
 */
function calculateBackoff(ctx: RetryContext): number {
  const { attempt, baseMs, maxMs, backoff } = ctx
  
  let delay: number
  
  switch (backoff) {
    case 'exponential':
      // Exponential: base * 2^attempt
      delay = baseMs * Math.pow(2, attempt)
      break
      
    case 'linear':
      // Linear: base * attempt
      delay = baseMs * (attempt + 1)
      break
      
    case 'fixed':
      // Fixed: always base
      delay = baseMs
      break
  }
  
  // Cap at maxMs
  delay = Math.min(delay, maxMs)
  
  // Add full jitter: random(0, delay)
  const jitter = Math.random() * delay
  
  return Math.floor(jitter)
}

/**
 * Sleep for ms
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// RETRY EXECUTOR
// ============================================================================

/**
 * Execute function with retry logic
 * 
 * Only retries if:
 * - Error is retryable (classified)
 * - Attempt < maxRetries
 * - For POST: idempotent flag is true or dedupeKey is set
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: {
    source: DataSourceDef
    isPost: boolean
    onRetry?: (attempt: number, delayMs: number, error: Error) => void
  }
): Promise<T> {
  const { source, isPost, onRetry } = config
  
  // Check if retries are allowed
  if (!source.retry || source.retry.retries === 0) {
    return fn()
  }
  
  // For POST requests, require idempotent flag or dedupeKey
  if (isPost) {
    const hasIdempotency = 
      (source as any).idempotent === true ||
      (source as any).dedupeKey !== undefined
    
    if (!hasIdempotency) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[DataSource] POST source "${source.name}" has retry config but no idempotent flag or dedupeKey. Retries disabled.`
        )
      }
      return fn()
    }
  }
  
  const ctx: RetryContext = {
    attempt: 0,
    maxRetries: source.retry.retries,
    baseMs: source.retry.baseMs,
    maxMs: source.retry.maxMs,
    backoff: source.retry.backoff,
    onRetry,
  }
  
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= ctx.maxRetries; attempt++) {
    try {
      // Execute function
      const result = await fn()
      return result
      
    } catch (error) {
      lastError = error as Error
      
      // Check if error is retryable
      const classified = classifyError(error)
      
      if (!classified.retryable) {
        // Non-retryable error, fail immediately
        throw error
      }
      
      // Check if we have more retries
      if (attempt >= ctx.maxRetries) {
        // Out of retries
        throw error
      }
      
      // Calculate backoff with jitter
      const delayMs = calculateBackoff({ ...ctx, attempt })
      
      // Emit retry event
      if (ctx.onRetry) {
        ctx.onRetry(attempt + 1, delayMs, lastError)
      }
      
      // Wait before retry
      await sleep(delayMs)
    }
  }
  
  // Should never reach here, but satisfy TypeScript
  throw lastError || new Error('Retry failed')
}

/**
 * Check if source is configured for retries
 */
export function hasRetryConfig(source: DataSourceDef): boolean {
  return source.retry !== undefined && source.retry.retries > 0
}

/**
 * Get effective retry count
 */
export function getRetryCount(source: DataSourceDef): number {
  return source.retry?.retries || 0
}
