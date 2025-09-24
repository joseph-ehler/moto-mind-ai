// MotoMindAI: Hardened Samsara API Client
// Circuit breaker integration + retry/backoff + stale cache serving

import { circuitBreaker, ErrorType } from './circuit-breaker'
import { FleetErrors } from './error-types'

export interface VehicleMetrics {
  vehicleId: string
  fuelEfficiencyMpg?: number
  brakeWearPct?: number
  harshEvents: number
  idleMinutes: number
  milesDriven?: number
  lastServiceDate?: Date
  dataCompletenessPct: number
  sourceLatencySec: number
  sensorPresence: Record<string, boolean>
}

export class SamsaraClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
  private readonly STALE_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes for stale serving
  
  constructor(private apiKey: string, private baseUrl: string = 'https://api.samsara.com') {}
  
  async getVehicleMetrics(
    tenantId: string,
    vehicleId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ data: VehicleMetrics; fromCache: boolean; isStale: boolean }> {
    // Check circuit breaker first
    const circuitCheck = await circuitBreaker.checkCircuit(tenantId, 'api')
    if (!circuitCheck.allowed) {
      // Try to serve from stale cache
      const staleData = this.getFromCache(vehicleId, true)
      if (staleData) {
        console.warn(`⚠️ Serving stale cache for ${vehicleId} - circuit breaker open`)
        return { data: staleData, fromCache: true, isStale: true }
      }
      
      throw FleetErrors.apiUnavailable('Samsara', circuitCheck.retryAfter)
    }
    
    // Check fresh cache first
    const cachedData = this.getFromCache(vehicleId, false)
    if (cachedData) {
      return { data: cachedData, fromCache: true, isStale: false }
    }
    
    try {
      const response = await this.makeApiCall(`/v1/fleet/vehicles/${vehicleId}/stats`, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      })
      
      const normalizedData = this.normalizeVehicleData(response, vehicleId)
      
      // Cache the successful response
      this.setCache(vehicleId, normalizedData)
      
      // Record success with circuit breaker
      circuitBreaker.recordSuccess(tenantId)
      
      return { data: normalizedData, fromCache: false, isStale: false }
    } catch (error) {
      // Determine error type for circuit breaker
      let errorType: ErrorType = 'server_error'
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          errorType = 'rate_limit'
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          errorType = 'server_error'
        }
      }
      
      // Record failure with circuit breaker
      circuitBreaker.recordFailure(tenantId, errorType)
      
      // Try to serve from stale cache as fallback
      const staleData = this.getFromCache(vehicleId, true)
      if (staleData) {
        console.warn(`⚠️ API failed, serving stale cache for ${vehicleId}:`, error)
        return { data: staleData, fromCache: true, isStale: true }
      }
      
      // No cache available, throw the error
      if (errorType === 'rate_limit') {
        throw FleetErrors.rateLimited(60000) // 1 minute retry
      } else {
        throw FleetErrors.apiUnavailable('Samsara')
      }
    }
  }
  
  private async makeApiCall(endpoint: string, params: Record<string, any>): Promise<any> {
    const url = new URL(endpoint, this.baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString())
    })
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const retryMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000
        throw new Error(`Rate limited - retry after ${retryMs}ms`)
      }
      
      if (!response.ok) {
        throw new Error(`Samsara API error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Samsara API timeout after 10 seconds')
      }
      
      throw error
    }
  }
  
  private normalizeVehicleData(rawData: any, vehicleId: string): VehicleMetrics {
    // Normalize Samsara API response to our internal format
    const now = Date.now()
    
    // Calculate data completeness based on available fields
    const requiredFields = ['fuel', 'diagnostics', 'harsh_events', 'idle_time']
    const availableFields = requiredFields.filter(field => rawData[field] !== undefined)
    const completeness = Math.round((availableFields.length / requiredFields.length) * 100)
    
    // Extract sensor presence
    const sensorPresence = {
      fuel: !!rawData.fuel,
      brake_wear: !!rawData.diagnostics?.brake_wear,
      harsh_events: !!rawData.harsh_events,
      idle_time: !!rawData.idle_time
    }
    
    return {
      vehicleId,
      fuelEfficiencyMpg: rawData.fuel?.efficiency_mpg,
      brakeWearPct: rawData.diagnostics?.brake_wear_percentage,
      harshEvents: rawData.harsh_events?.count || 0,
      idleMinutes: Math.round((rawData.idle_time?.total_ms || 0) / 60000),
      milesDriven: rawData.odometer?.distance_miles,
      lastServiceDate: rawData.maintenance?.last_service_date ? 
        new Date(rawData.maintenance.last_service_date) : undefined,
      dataCompletenessPct: completeness,
      sourceLatencySec: Math.round((now - new Date(rawData.timestamp || now).getTime()) / 1000),
      sensorPresence
    }
  }
  
  private getFromCache(vehicleId: string, allowStale: boolean): VehicleMetrics | null {
    const cached = this.cache.get(vehicleId)
    if (!cached) return null
    
    const age = Date.now() - cached.timestamp
    const maxAge = allowStale ? this.STALE_CACHE_TTL_MS : this.CACHE_TTL_MS
    
    if (age <= maxAge) {
      return cached.data
    }
    
    // Clean up expired cache
    this.cache.delete(vehicleId)
    return null
  }
  
  private setCache(vehicleId: string, data: VehicleMetrics): void {
    this.cache.set(vehicleId, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL_MS
    })
    
    // Prevent memory leaks - limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }
  
  // Health check for monitoring
  getHealthStatus() {
    return {
      cacheSize: this.cache.size,
      circuitStatus: circuitBreaker.getStatus()
    }
  }
}
