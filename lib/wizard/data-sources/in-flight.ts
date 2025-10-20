/**
 * Ultra God-Tier Wizard: In-Flight Deduplication
 * 
 * Coalesce concurrent requests to the same source+key into a single promise.
 * Prevents duplicate network calls and thundering herd.
 * 
 * Phase B-3: Data Source Registry (Production Hardening)
 */

// ============================================================================
// IN-FLIGHT REGISTRY
// ============================================================================

interface InFlightEntry<T> {
  promise: Promise<T>
  subscribers: number
  startedAt: number
}

export class InFlightRegistry {
  private registry: Map<string, InFlightEntry<any>> = new Map()
  
  /**
   * Execute function with deduplication
   * 
   * If the same key is already in-flight, return the existing promise.
   * Otherwise, execute the function and cache the promise.
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    onCoalesce?: () => void
  ): Promise<T> {
    // Check if already in-flight
    const existing = this.registry.get(key)
    
    if (existing) {
      // Coalesce to existing request
      existing.subscribers++
      
      if (onCoalesce) {
        onCoalesce()
      }
      
      if (process.env.NODE_ENV === 'development') {
        const ageMs = Date.now() - existing.startedAt
        console.log(
          `[DataSource] Coalescing request to "${key}" (in-flight for ${ageMs}ms, ${existing.subscribers} subscribers)`
        )
      }
      
      try {
        return await existing.promise
      } finally {
        // Decrement subscriber count
        existing.subscribers--
        
        // Clean up if no more subscribers
        if (existing.subscribers === 0) {
          this.registry.delete(key)
        }
      }
    }
    
    // Not in-flight, execute and cache promise
    const promise = fn()
    
    const entry: InFlightEntry<T> = {
      promise,
      subscribers: 1,
      startedAt: Date.now(),
    }
    
    this.registry.set(key, entry)
    
    try {
      const result = await promise
      return result
    } finally {
      // Decrement subscriber count
      entry.subscribers--
      
      // Clean up if no more subscribers
      if (entry.subscribers === 0) {
        this.registry.delete(key)
      }
    }
  }
  
  /**
   * Check if key is in-flight
   */
  isInFlight(key: string): boolean {
    return this.registry.has(key)
  }
  
  /**
   * Get in-flight keys (for debugging)
   */
  getInFlightKeys(): string[] {
    return Array.from(this.registry.keys())
  }
  
  /**
   * Get subscriber count for key
   */
  getSubscribers(key: string): number {
    return this.registry.get(key)?.subscribers || 0
  }
  
  /**
   * Clear all in-flight (for testing)
   */
  clear(): void {
    this.registry.clear()
  }
  
  /**
   * Get stats
   */
  getStats(): {
    inFlight: number
    totalSubscribers: number
    avgSubscribersPerRequest: number
  } {
    const entries = Array.from(this.registry.values())
    const inFlight = entries.length
    const totalSubscribers = entries.reduce((sum, e) => sum + e.subscribers, 0)
    const avgSubscribersPerRequest = inFlight > 0 ? totalSubscribers / inFlight : 0
    
    return {
      inFlight,
      totalSubscribers,
      avgSubscribersPerRequest,
    }
  }
}

// ============================================================================
// GLOBAL REGISTRY
// ============================================================================

export const globalInFlightRegistry = new InFlightRegistry()

/**
 * Generate in-flight key for request
 * 
 * Format: flowId:sourceName:cacheKey
 */
export function getInFlightKey(
  flowId: string,
  sourceName: string,
  cacheKey: string
): string {
  return `${flowId}:${sourceName}:${cacheKey}`
}
