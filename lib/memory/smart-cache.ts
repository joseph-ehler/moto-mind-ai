/**
 * SMART CACHE MANAGER
 * 
 * Manages browser caching strategies for different content types.
 * Works with the service worker to provide optimal caching.
 * 
 * Features:
 * - Different strategies for different content (API, images, static)
 * - Cache size monitoring
 * - Automatic cleanup
 * - Manual cache control
 * - Cache warming (pre-cache critical resources)
 */

export type CacheStrategy = 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate'

export interface CacheConfig {
  name: string
  maxAge: number // milliseconds
  maxEntries?: number
  strategy: CacheStrategy
}

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  static: {
    name: 'motomind-static',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100,
    strategy: 'cache-first'
  },
  runtime: {
    name: 'motomind-runtime',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50,
    strategy: 'network-first'
  },
  images: {
    name: 'motomind-images',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200,
    strategy: 'cache-first'
  },
  api: {
    name: 'motomind-api',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100,
    strategy: 'network-first'
  },
  analytics: {
    name: 'motomind-analytics',
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 50,
    strategy: 'stale-while-revalidate'
  }
}

export class SmartCache {
  /**
   * Check if caches API is available
   */
  private isAvailable(): boolean {
    return typeof caches !== 'undefined'
  }

  /**
   * Cache a request
   */
  async cache(request: RequestInfo, cacheName: string = 'runtime'): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('[SmartCache] Caches API not available')
      return
    }

    const config = CACHE_CONFIGS[cacheName]
    if (!config) {
      console.warn(`[SmartCache] Unknown cache: ${cacheName}`)
      return
    }

    try {
      const cache = await caches.open(config.name)
      await cache.add(request)
      console.log('[SmartCache] Cached:', request)
    } catch (error) {
      console.error('[SmartCache] Failed to cache:', request, error)
    }
  }

  /**
   * Cache multiple URLs
   */
  async cacheMultiple(urls: string[], cacheName: string = 'runtime'): Promise<void> {
    if (!this.isAvailable()) return

    const config = CACHE_CONFIGS[cacheName]
    if (!config) return

    try {
      const cache = await caches.open(config.name)
      await cache.addAll(urls)
      console.log(`[SmartCache] Cached ${urls.length} URLs`)
    } catch (error) {
      console.error('[SmartCache] Failed to cache URLs:', error)
    }
  }

  /**
   * Get cached response
   */
  async get(request: RequestInfo): Promise<Response | undefined> {
    if (!this.isAvailable()) return undefined

    try {
      return await caches.match(request)
    } catch (error) {
      console.error('[SmartCache] Failed to get cached response:', error)
      return undefined
    }
  }

  /**
   * Delete cached response
   */
  async delete(request: RequestInfo, cacheName?: string): Promise<boolean> {
    if (!this.isAvailable()) return false

    try {
      if (cacheName) {
        const config = CACHE_CONFIGS[cacheName]
        if (!config) return false

        const cache = await caches.open(config.name)
        return await cache.delete(request)
      } else {
        // Delete from all caches
        const cacheNames = await caches.keys()
        const results = await Promise.all(
          cacheNames.map(async (name) => {
            const cache = await caches.open(name)
            return await cache.delete(request)
          })
        )
        return results.some(result => result)
      }
    } catch (error) {
      console.error('[SmartCache] Failed to delete cached response:', error)
      return false
    }
  }

  /**
   * Clear a specific cache
   */
  async clear(cacheName: string): Promise<boolean> {
    if (!this.isAvailable()) return false

    const config = CACHE_CONFIGS[cacheName]
    if (!config) return false

    try {
      return await caches.delete(config.name)
    } catch (error) {
      console.error(`[SmartCache] Failed to clear cache ${cacheName}:`, error)
      return false
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    if (!this.isAvailable()) return

    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('[SmartCache] Cleared all caches')
    } catch (error) {
      console.error('[SmartCache] Failed to clear all caches:', error)
    }
  }

  /**
   * Get cache size for a specific cache
   */
  async getCacheSize(cacheName: string): Promise<number> {
    if (!this.isAvailable()) return 0

    const config = CACHE_CONFIGS[cacheName]
    if (!config) return 0

    try {
      const cache = await caches.open(config.name)
      const keys = await cache.keys()

      let size = 0
      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          size += blob.size
        }
      }

      return size
    } catch (error) {
      console.error(`[SmartCache] Failed to get cache size for ${cacheName}:`, error)
      return 0
    }
  }

  /**
   * Get total cache size across all caches
   */
  async getTotalCacheSize(): Promise<number> {
    if (!this.isAvailable()) return 0

    try {
      const cacheNames = Object.keys(CACHE_CONFIGS)
      const sizes = await Promise.all(
        cacheNames.map(name => this.getCacheSize(name))
      )
      return sizes.reduce((total, size) => total + size, 0)
    } catch (error) {
      console.error('[SmartCache] Failed to get total cache size:', error)
      return 0
    }
  }

  /**
   * Get storage estimate (total available space)
   */
  async getStorageEstimate(): Promise<{
    usage: number
    quota: number
    percentage: number
  } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        const percentage = quota > 0 ? (usage / quota) * 100 : 0

        return { usage, quota, percentage }
      } catch (error) {
        console.error('[SmartCache] Failed to get storage estimate:', error)
        return null
      }
    }
    return null
  }

  /**
   * Check if storage is running low (> 80%)
   */
  async isStorageLow(): Promise<boolean> {
    const estimate = await this.getStorageEstimate()
    return estimate ? estimate.percentage > 80 : false
  }

  /**
   * Cleanup old cache entries
   */
  async cleanup(): Promise<{ cleaned: number; freed: number }> {
    if (!this.isAvailable()) return { cleaned: 0, freed: 0 }

    let cleaned = 0
    let freed = 0

    try {
      for (const [name, config] of Object.entries(CACHE_CONFIGS)) {
        const cache = await caches.open(config.name)
        const keys = await cache.keys()

        // Check each cached response
        for (const request of keys) {
          const response = await cache.match(request)
          if (!response) continue

          // Check if cache is expired
          const cachedTime = response.headers.get('sw-cache-time')
          if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime)
            if (age > config.maxAge) {
              const blob = await response.blob()
              freed += blob.size
              await cache.delete(request)
              cleaned++
            }
          }
        }

        // Check if cache is over size limit
        if (config.maxEntries) {
          const remainingKeys = await cache.keys()
          if (remainingKeys.length > config.maxEntries) {
            const toDelete = remainingKeys.length - config.maxEntries
            for (let i = 0; i < toDelete; i++) {
              const response = await cache.match(remainingKeys[i])
              if (response) {
                const blob = await response.blob()
                freed += blob.size
              }
              await cache.delete(remainingKeys[i])
              cleaned++
            }
          }
        }
      }

      console.log(`[SmartCache] Cleanup complete: ${cleaned} entries, ${this.formatBytes(freed)} freed`)
      return { cleaned, freed }
    } catch (error) {
      console.error('[SmartCache] Cleanup failed:', error)
      return { cleaned, freed }
    }
  }

  /**
   * Warm cache with critical resources
   */
  async warmCache(urls: string[]): Promise<void> {
    if (!this.isAvailable()) return

    console.log(`[SmartCache] Warming cache with ${urls.length} URLs...`)

    try {
      // Split URLs by type
      const imageUrls = urls.filter(url => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url))
      const staticUrls = urls.filter(url => /\.(js|css|woff2?)$/i.test(url))
      const otherUrls = urls.filter(url => !imageUrls.includes(url) && !staticUrls.includes(url))

      // Cache in parallel
      await Promise.all([
        this.cacheMultiple(imageUrls, 'images'),
        this.cacheMultiple(staticUrls, 'static'),
        this.cacheMultiple(otherUrls, 'runtime')
      ])

      console.log('[SmartCache] Cache warming complete')
    } catch (error) {
      console.error('[SmartCache] Cache warming failed:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    caches: Record<string, { entries: number; size: number }>
    totalSize: number
    totalEntries: number
    storage: { usage: number; quota: number; percentage: number } | null
  }> {
    if (!this.isAvailable()) {
      return {
        caches: {},
        totalSize: 0,
        totalEntries: 0,
        storage: null
      }
    }

    const cacheStats: Record<string, { entries: number; size: number }> = {}
    let totalSize = 0
    let totalEntries = 0

    try {
      for (const [name, config] of Object.entries(CACHE_CONFIGS)) {
        const cache = await caches.open(config.name)
        const keys = await cache.keys()

        let size = 0
        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            const blob = await response.blob()
            size += blob.size
          }
        }

        cacheStats[name] = {
          entries: keys.length,
          size
        }

        totalSize += size
        totalEntries += keys.length
      }

      const storage = await this.getStorageEstimate()

      return {
        caches: cacheStats,
        totalSize,
        totalEntries,
        storage
      }
    } catch (error) {
      console.error('[SmartCache] Failed to get stats:', error)
      return {
        caches: {},
        totalSize: 0,
        totalEntries: 0,
        storage: null
      }
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

export const smartCache = new SmartCache()

// ==========================================================================
// REACT HOOKS
// ==========================================================================

import { useState, useEffect, useCallback } from 'react'

export function useSmartCache() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof smartCache.getStats>>>({
    caches: {},
    totalSize: 0,
    totalEntries: 0,
    storage: null
  })

  const [isLow, setIsLow] = useState(false)

  const updateStats = useCallback(async () => {
    const newStats = await smartCache.getStats()
    setStats(newStats)

    const low = await smartCache.isStorageLow()
    setIsLow(low)
  }, [])

  useEffect(() => {
    updateStats()

    // Update every 30 seconds
    const interval = setInterval(updateStats, 30000)

    return () => clearInterval(interval)
  }, [updateStats])

  return {
    stats,
    isLow,
    cache: smartCache.cache.bind(smartCache),
    clear: smartCache.clear.bind(smartCache),
    clearAll: smartCache.clearAll.bind(smartCache),
    cleanup: smartCache.cleanup.bind(smartCache),
    warmCache: smartCache.warmCache.bind(smartCache),
    updateStats
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
