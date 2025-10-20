/**
 * Ultra God-Tier Wizard: Data Source Types
 * 
 * Type definitions for B-3 Data Source Registry.
 * 
 * Phase B-3: Data Source Registry
 */

import type { DataSourceConfig } from '../flow-schema'

// ============================================================================
// EVALUATION CONTEXT
// ============================================================================

export interface EvalContext {
  ctx: Record<string, any>
  fields: Record<string, FieldState>
  flags?: Record<string, any>
}

export interface FieldState {
  value: any
  valid: boolean
  error?: string
  validating?: boolean
}

// ============================================================================
// FETCH RESULTS
// ============================================================================

export interface FetchResult {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
    details?: any
  }
  meta: {
    durationMs: number
    attempt: number
    cacheHit: boolean
    source: string
  }
}

export interface CacheMeta {
  key: string
  ageMs: number
  ttlMs: number
  createdAt: number
}

// ============================================================================
// FETCH OPTIONS
// ============================================================================

export interface FetchOptions {
  traceId?: string
  silent?: boolean // Suppress logs/toasts
  force?: boolean // Bypass cache
  signal?: AbortSignal // Abort signal for cancellation
}

// ============================================================================
// DATA SOURCE DEFINITION
// ============================================================================

export interface DataSourceDef extends DataSourceConfig {
  name: string
}

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

export type DataSourceEvent =
  | { type: 'ds_start'; flowId: string; source: string; traceId?: string }
  | { type: 'ds_cache_hit'; flowId: string; source: string; key: string; ageMs: number }
  | { type: 'ds_success'; flowId: string; source: string; durationMs: number; status: number }
  | { type: 'ds_fail'; flowId: string; source: string; durationMs: number; code: string }
  | { type: 'ds_retry'; flowId: string; source: string; attempt: number; delayMs: number }

// ============================================================================
// PRIVACY ENFORCEMENT
// ============================================================================

export interface PrivacyViolation {
  field: string
  reason: string
  classification: string
  suggestion: string
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailureTime?: number
  nextAttemptTime?: number
}

export interface CircuitBreakerConfig {
  failureThreshold: number // Open after N failures
  timeoutMs: number // How long to stay open
  successThreshold: number // Half-open -> closed after N successes
}
