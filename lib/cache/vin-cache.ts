/**
 * VIN Data Cache
 * In-memory cache with TTL support
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

interface CacheStats {
  size: number
  hits: number
  misses: number
  hitRate: number
  keys: string[]
}

export class VINCache {
  private static cache = new Map<string, CacheEntry<any>>()
  private static stats = {
    hits: 0,
    misses: 0
  }
  
  /**
   * Get from cache or fetch fresh data
   */
  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): Promise<T> {
    // Check cache
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      // Cache hit!
      this.stats.hits++
      cached.hits++
      console.log(`[Cache] HIT for ${key} (${cached.hits} total hits)`)
      return cached.data as T
    }
    
    // Cache miss - fetch fresh data
    this.stats.misses++
    console.log(`[Cache] MISS for ${key}`)
    
    try {
      const data = await fetcher()
      
      // Store in cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0
      })
      
      return data
    } catch (error) {
      // If fetch fails and we have stale cache, return it
      if (cached) {
        console.warn(`[Cache] Fetch failed, returning stale data for ${key}`)
        return cached.data as T
      }
      throw error
    }
  }
  
  /**
   * Get from cache without fetching
   */
  static get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }
    
    // Check if expired
    if (Date.now() - cached.timestamp >= cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }
  
  /**
   * Set cache value
   */
  static set<T>(key: string, value: T, ttl: number = 24 * 60 * 60 * 1000): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
      hits: 0
    })
  }
  
  /**
   * Delete specific key or clear all
   */
  static clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
      console.log(`[Cache] Cleared ${key}`)
    } else {
      this.cache.clear()
      console.log(`[Cache] Cleared all entries`)
    }
  }
  
  /**
   * Clean expired entries
   */
  static cleanExpired(): number {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`)
    }
    
    return cleaned
  }
  
  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      keys: Array.from(this.cache.keys())
    }
  }
  
  /**
   * Reset statistics
   */
  static resetStats(): void {
    this.stats = { hits: 0, misses: 0 }
  }
}

// Auto-clean expired entries every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    VINCache.cleanExpired()
  }, 60 * 60 * 1000)
}
