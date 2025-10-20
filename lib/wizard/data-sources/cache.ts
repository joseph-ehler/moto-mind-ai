/**
 * Ultra God-Tier Wizard: Data Source Cache
 * 
 * LRU cache with TTL for data source responses.
 * 
 * Phase B-3: Data Source Registry
 */

import type { CacheMeta } from './types'

// ============================================================================
// CACHE ENTRY
// ============================================================================

interface CacheEntry {
  key: string
  value: any
  createdAt: number
  ttlMs: number
}

// ============================================================================
// LRU CACHE
// ============================================================================

export class DataSourceCache {
  private cache: Map<string, CacheEntry>
  private maxSize: number
  
  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }
  
  /**
   * Get value from cache
   * Returns undefined if not found or expired
   */
  get(key: string): any | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }
    
    // Check TTL
    const ageMs = Date.now() - entry.createdAt
    if (ageMs > entry.ttlMs) {
      // Expired
      this.cache.delete(key)
      return undefined
    }
    
    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, entry)
    
    return entry.value
  }
  
  /**
   * Set value in cache
   */
  set(key: string, value: any, ttlMs: number): void {
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest (first in map)
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    
    const entry: CacheEntry = {
      key,
      value,
      createdAt: Date.now(),
      ttlMs,
    }
    
    this.cache.set(key, entry)
  }
  
  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }
  
  /**
   * Get cache metadata
   */
  getMeta(key: string): CacheMeta | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    const ageMs = Date.now() - entry.createdAt
    
    // Check if expired
    if (ageMs > entry.ttlMs) {
      this.cache.delete(key)
      return null
    }
    
    return {
      key: entry.key,
      ageMs,
      ttlMs: entry.ttlMs,
      createdAt: entry.createdAt,
    }
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
  
  /**
   * Get all keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      const ageMs = now - entry.createdAt
      if (ageMs > entry.ttlMs) {
        this.cache.delete(key)
        removed++
      }
    }
    
    return removed
  }
}

// ============================================================================
// GLOBAL CACHE INSTANCE
// ============================================================================

export const globalCache = new DataSourceCache(100)
