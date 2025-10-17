/**
 * Redis Client (Production-Ready)
 * Persistent caching for geocoding, vision results, and more
 * 
 * Supports:
 * - Vercel KV (automatic on Vercel)
 * - Redis via ioredis (custom deployments)
 * - In-memory fallback (development)
 * 
 * Features:
 * - Connection pooling
 * - Auto-reconnect
 * - Graceful degradation (falls back to in-memory if unavailable)
 * - Type-safe cache operations
 */

import { env } from '@/lib/config/env'

// Check if we're using Upstash REST API (Vercel Marketplace integration or direct)
const isUpstash = typeof process !== 'undefined' && (
  process.env.UPSTASH_REDIS_REST_URL || 
  process.env.KV_REST_API_URL
)

// Lazy import based on environment
let kvClient: any = null
let redisClient: any = null
let isRedisAvailable = false

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiresAt: number }>()

/**
 * Initialize Redis connection
 */
async function initRedis() {
  // Priority 1: Upstash REST API (Vercel Marketplace or direct)
  if (isUpstash) {
    try {
      const { kv } = await import('@vercel/kv')
      kvClient = kv
      isRedisAvailable = true
      console.log('✅ Upstash (Redis) connected')
      return
    } catch (error) {
      console.warn('⚠️ Upstash initialization failed:', error)
    }
  }

  // Priority 2: Custom Redis (ioredis)
  if (!env.REDIS_URL) {
    console.log('ℹ️ No Redis configured - using in-memory cache')
    return
  }

  try {
    // Dynamically import ioredis
    const { default: IORedis } = await import('ioredis')

    redisClient = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError(err: Error) {
        console.warn('Redis connection error:', err.message)
        return true
      }
    })

    redisClient.on('connect', () => {
      console.log('✅ Redis connected')
      isRedisAvailable = true
    })

    redisClient.on('error', (err: Error) => {
      console.warn('⚠️ Redis error:', err.message)
      isRedisAvailable = false
    })

    redisClient.on('close', () => {
      console.log('ℹ️ Redis connection closed')
      isRedisAvailable = false
    })

    // Test connection
    await redisClient.ping()
    isRedisAvailable = true
  } catch (error) {
    console.warn('⚠️ Redis initialization failed, using in-memory cache:', error)
    isRedisAvailable = false
  }
}

// Initialize on module load (only on server)
if (typeof window === 'undefined') {
  initRedis()
}

/**
 * Get value from cache
 */
export async function cacheGet(key: string): Promise<string | null> {
  // Try Upstash REST API first
  if (isRedisAvailable && kvClient) {
    try {
      return await kvClient.get(key)
    } catch (error) {
      console.warn('Upstash GET failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Try ioredis
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.get(key)
    } catch (error) {
      console.warn('Redis GET failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Fallback to in-memory
  const cached = memoryCache.get(key)
  if (!cached) return null

  // Check expiration
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key)
    return null
  }

  return cached.value
}

/**
 * Set value in cache with TTL (seconds)
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number = 3600
): Promise<void> {
  // Try Vercel KV first
  if (isRedisAvailable && kvClient) {
    try {
      await kvClient.setex(key, ttlSeconds, value)
      return
    } catch (error) {
      console.warn('Vercel KV SET failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Try ioredis
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, value)
      return
    } catch (error) {
      console.warn('Redis SET failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Fallback to in-memory
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  })
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  // Try Vercel KV first
  if (isRedisAvailable && kvClient) {
    try {
      await kvClient.del(key)
      return
    } catch (error) {
      console.warn('Vercel KV DEL failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Try ioredis
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key)
      return
    } catch (error) {
      console.warn('Redis DEL failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Fallback to in-memory
  memoryCache.delete(key)
}

/**
 * Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  // Try Vercel KV first
  if (isRedisAvailable && kvClient) {
    try {
      const exists = await kvClient.exists(key)
      return exists === 1
    } catch (error) {
      console.warn('Vercel KV EXISTS failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Try ioredis
  if (isRedisAvailable && redisClient) {
    try {
      const exists = await redisClient.exists(key)
      return exists === 1
    } catch (error) {
      console.warn('Redis EXISTS failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Fallback to in-memory
  const cached = memoryCache.get(key)
  if (!cached) return false
  
  // Check expiration
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key)
    return false
  }
  
  return true
}

/**
 * Increment counter (for metrics)
 */
export async function cacheIncr(key: string): Promise<number> {
  // Try Vercel KV first
  if (isRedisAvailable && kvClient) {
    try {
      return await kvClient.incr(key)
    } catch (error) {
      console.warn('Vercel KV INCR failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Try ioredis
  if (isRedisAvailable && redisClient) {
    try {
      return await redisClient.incr(key)
    } catch (error) {
      console.warn('Redis INCR failed, falling back to memory:', error)
      isRedisAvailable = false
    }
  }

  // Fallback to in-memory
  const cached = memoryCache.get(key)
  const currentValue = cached ? parseInt(cached.value, 10) || 0 : 0
  const newValue = currentValue + 1
  
  memoryCache.set(key, {
    value: String(newValue),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  })
  
  return newValue
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  available: boolean
  type: 'redis' | 'memory'
  size: number
}> {
  if (isRedisAvailable && redisClient) {
    try {
      const info = await redisClient.info('stats')
      const dbsize = await redisClient.dbsize()
      return {
        available: true,
        type: 'redis',
        size: dbsize
      }
    } catch (error) {
      console.warn('Failed to get Redis stats:', error)
    }
  }

  return {
    available: false,
    type: 'memory',
    size: memoryCache.size
  }
}

/**
 * Clear all cache (use with caution!)
 */
export async function cacheClear(): Promise<void> {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.flushdb()
      console.log('🗑️ Redis cache cleared')
      return
    } catch (error) {
      console.warn('Redis FLUSHDB failed:', error)
    }
  }

  memoryCache.clear()
  console.log('🗑️ Memory cache cleared')
}

/**
 * Graceful shutdown
 */
export async function closeCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    console.log('Redis connection closed gracefully')
  }
}
