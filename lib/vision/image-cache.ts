// Image Caching Layer for Vision API
// Prevents duplicate processing of identical images

import crypto from 'crypto'

export interface CachedResult {
  hash: string
  result: any
  model: string
  documentType: string
  timestamp: string
  hitCount: number
  cost: number
}

// In-memory cache (replace with Redis in production)
class ImageCache {
  private cache = new Map<string, CachedResult>()
  private maxSize = 1000 // Maximum cached results
  private ttl = 24 * 60 * 60 * 1000 // 24 hours TTL
  
  // Generate perceptual hash for image similarity detection
  generateImageHash(base64Image: string): string {
    // Simple content hash (in production, use perceptual hashing)
    return crypto.createHash('sha256').update(base64Image).digest('hex').substring(0, 16)
  }
  
  // Generate cache key including processing parameters
  generateCacheKey(imageHash: string, documentType: string, model: string): string {
    return `${imageHash}_${documentType}_${model}`
  }
  
  // Check if result exists in cache
  get(imageHash: string, documentType: string, model: string): CachedResult | null {
    const key = this.generateCacheKey(imageHash, documentType, model)
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    // Check TTL
    const age = Date.now() - new Date(cached.timestamp).getTime()
    if (age > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // Update hit count
    cached.hitCount++
    console.log(`🎯 Cache hit for ${documentType} (${cached.hitCount} hits)`)
    
    return cached
  }
  
  // Store result in cache
  set(
    imageHash: string, 
    documentType: string, 
    model: string, 
    result: any, 
    cost: number
  ): void {
    const key = this.generateCacheKey(imageHash, documentType, model)
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    
    const cachedResult: CachedResult = {
      hash: imageHash,
      result,
      model,
      documentType,
      timestamp: new Date().toISOString(),
      hitCount: 0,
      cost
    }
    
    this.cache.set(key, cachedResult)
    console.log(`💾 Cached result for ${documentType} with ${model}`)
  }
  
  // Get cache statistics
  getStats(): {
    size: number
    hitRate: number
    totalSavings: number
    topDocumentTypes: Array<{ type: string, hits: number }>
  } {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0)
    const totalRequests = entries.length + totalHits
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0
    
    const totalSavings = entries.reduce((sum, entry) => sum + (entry.cost * entry.hitCount), 0)
    
    // Group by document type
    const typeStats = entries.reduce((acc, entry) => {
      if (!acc[entry.documentType]) {
        acc[entry.documentType] = 0
      }
      acc[entry.documentType] += entry.hitCount
      return acc
    }, {} as Record<string, number>)
    
    const topDocumentTypes = Array.from(Object.entries(typeStats))
      .map(([type, hits]) => ({ type, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 5)
    
    return {
      size: this.cache.size,
      hitRate,
      totalSavings,
      topDocumentTypes
    }
  }
  
  // Clear expired entries
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    const entries = Array.from(this.cache.entries())
    for (const [key, cached] of entries) {
      const age = now - new Date(cached.timestamp).getTime()
      if (age > this.ttl) {
        this.cache.delete(key)
        removed++
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`)
    }
    
    return removed
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear()
    console.log('🗑️ Cache cleared')
  }
  
  // Get cache values for external access
  getCacheValues(): CachedResult[] {
    return Array.from(this.cache.values())
  }
}

// Global cache instance
export const imageCache = new ImageCache()

// Enhanced vision processing with caching
export async function processWithCache<T>(
  base64Image: string,
  documentType: string,
  model: 'gpt-4o' | 'gpt-4o-mini',
  processor: () => Promise<{ result: T, cost: number }>
): Promise<{ result: T, cost: number, fromCache: boolean }> {
  
  // Generate image hash
  const imageHash = imageCache.generateImageHash(base64Image)
  
  // Check cache first
  const cached = imageCache.get(imageHash, documentType, model)
  if (cached) {
    return {
      result: cached.result,
      cost: 0, // No cost for cached results
      fromCache: true
    }
  }
  
  // Process image
  console.log(`🔍 Processing new ${documentType} with ${model}`)
  const { result, cost } = await processor()
  
  // Cache the result
  imageCache.set(imageHash, documentType, model, result, cost)
  
  return {
    result,
    cost,
    fromCache: false
  }
}

// Duplicate detection for user feedback
export function detectDuplicate(base64Image: string): {
  isDuplicate: boolean
  originalTimestamp?: string
  documentType?: string
  savings?: number
} {
  const imageHash = imageCache.generateImageHash(base64Image)
  
  // Look for any cached result with this image hash
  const cachedValues = Array.from(imageCache.getCacheValues())
  for (const cached of cachedValues) {
    if (cached.hash === imageHash) {
      return {
        isDuplicate: true,
        originalTimestamp: cached.timestamp,
        documentType: cached.documentType,
        savings: cached.cost
      }
    }
  }
  
  return { isDuplicate: false }
}

// Cache warming for common document types
export async function warmCache(
  commonImages: Array<{ base64: string, type: string }>,
  processor: (image: string, type: string) => Promise<{ result: any, cost: number }>
): Promise<void> {
  console.log(`🔥 Warming cache with ${commonImages.length} common images`)
  
  for (const { base64, type } of commonImages) {
    const imageHash = imageCache.generateImageHash(base64)
    
    // Skip if already cached
    if (imageCache.get(imageHash, type, 'gpt-4o-mini')) {
      continue
    }
    
    try {
      const { result, cost } = await processor(base64, type)
      imageCache.set(imageHash, type, 'gpt-4o-mini', result, cost)
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Failed to warm cache for ${type}:`, error)
    }
  }
  
  console.log('✅ Cache warming completed')
}

// Periodic cleanup task
setInterval(() => {
  imageCache.cleanup()
}, 60 * 60 * 1000) // Every hour
