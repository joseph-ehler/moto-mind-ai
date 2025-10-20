/**
 * Smart Caching Configuration - GOD TIER Edition
 * 
 * Different data has different volatility
 * Cache stable data longer, volatile data shorter
 */

import { CacheStrategy } from './types'

/**
 * Cache TTL strategies based on data volatility
 */
export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  // Very stable - cache for 1 year
  vinDecode: {
    ttl: 365 * 24 * 60 * 60 * 1000,  // 1 year
    reason: 'VIN specs never change - immutable data'
  },
  
  // Stable - cache for 90 days
  epaModels: {
    ttl: 90 * 24 * 60 * 60 * 1000,   // 90 days
    reason: 'EPA model list rarely changes mid-year'
  },
  
  // Moderately stable - cache for 60 days
  epaVehicleData: {
    ttl: 60 * 24 * 60 * 60 * 1000,   // 60 days
    reason: 'EPA vehicle data stable unless revision occurs'
  },
  
  // Less stable - cache for 30 days
  epaOptions: {
    ttl: 30 * 24 * 60 * 60 * 1000,   // 30 days
    reason: 'EPA options may change with new model year data'
  },
  
  // Volatile - cache for 7 days
  fuelPrices: {
    ttl: 7 * 24 * 60 * 60 * 1000,    // 7 days
    reason: 'Gas prices fluctuate weekly'
  }
}

/**
 * Cache key builders
 */
export function buildCacheKey(type: string, ...parts: (string | number)[]): string {
  return `${type}:${parts.join(':')}`
}

/**
 * Get TTL for cache type
 */
export function getCacheTTL(type: keyof typeof CACHE_STRATEGIES): number {
  return CACHE_STRATEGIES[type]?.ttl || 30 * 24 * 60 * 60 * 1000 // default 30 days
}

/**
 * Cache version for invalidation
 * Increment when EPA data structure changes
 */
export const CACHE_VERSION = 'v2'
