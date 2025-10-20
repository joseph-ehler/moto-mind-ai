/**
 * Ultra God-Tier Wizard: Circuit Breaker
 * 
 * Prevents repeated calls to failing services.
 * 
 * States:
 * - CLOSED: Normal operation
 * - OPEN: Failing, reject immediately
 * - HALF_OPEN: Testing if service recovered
 * 
 * Phase B-3: Data Source Registry
 */

import type { CircuitBreakerState, CircuitBreakerConfig } from './types'

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export class CircuitBreaker {
  private state: CircuitBreakerState
  private config: CircuitBreakerConfig
  private successCount: number
  
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      timeoutMs: config.timeoutMs || 30000, // 30s
      successThreshold: config.successThreshold || 2,
    }
    
    this.state = {
      state: 'closed',
      failures: 0,
    }
    
    this.successCount = 0
  }
  
  /**
   * Check if request is allowed
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'open') {
      // Check if timeout has passed
      if (this.state.nextAttemptTime && Date.now() >= this.state.nextAttemptTime) {
        // Try half-open
        this.state.state = 'half-open'
        this.successCount = 0
      } else {
        // Still open, reject immediately
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  /**
   * Record success
   */
  private onSuccess(): void {
    if (this.state.state === 'half-open') {
      this.successCount++
      
      // Check if enough successes to close
      if (this.successCount >= this.config.successThreshold) {
        this.state = {
          state: 'closed',
          failures: 0,
        }
      }
    } else if (this.state.state === 'closed') {
      // Reset failure count on success
      this.state.failures = 0
    }
  }
  
  /**
   * Record failure
   */
  private onFailure(): void {
    const now = Date.now()
    
    this.state.failures++
    this.state.lastFailureTime = now
    
    if (this.state.state === 'half-open') {
      // Failed during half-open, go back to open
      this.state.state = 'open'
      this.state.nextAttemptTime = now + this.config.timeoutMs
    } else if (this.state.failures >= this.config.failureThreshold) {
      // Too many failures, open circuit
      this.state.state = 'open'
      this.state.nextAttemptTime = now + this.config.timeoutMs
    }
  }
  
  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state }
  }
  
  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = {
      state: 'closed',
      failures: 0,
    }
    this.successCount = 0
  }
  
  /**
   * Force open (for testing)
   */
  forceOpen(): void {
    this.state = {
      state: 'open',
      failures: this.config.failureThreshold,
      lastFailureTime: Date.now(),
      nextAttemptTime: Date.now() + this.config.timeoutMs,
    }
  }
}

// ============================================================================
// CIRCUIT BREAKER REGISTRY (per host)
// ============================================================================

const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * Get or create circuit breaker for host
 */
export function getCircuitBreaker(host: string): CircuitBreaker {
  if (!circuitBreakers.has(host)) {
    circuitBreakers.set(host, new CircuitBreaker())
  }
  return circuitBreakers.get(host)!
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.clear()
}
