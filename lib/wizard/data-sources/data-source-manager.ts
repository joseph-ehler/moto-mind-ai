/**
 * Ultra God-Tier Wizard: Data Source Manager
 * 
 * Orchestrates declarative data fetching with:
 * - Template resolution
 * - Caching (LRU + TTL)
 * - Retry with backoff
 * - Circuit breakers
 * - Privacy enforcement
 * - Analytics
 * 
 * Phase B-3: Data Source Registry
 */

import type {
  DataSourceDef,
  EvalContext,
  FetchOptions,
  FetchResult,
  CacheMeta,
  DataSourceEvent,
} from './types'
import { resolveTemplate, resolveTemplateObject, applyMapResponse } from './template-resolver'
import { DataSourceCache, globalCache } from './cache'
import { getCircuitBreaker } from './circuit-breaker'
import { checkPrivacyViolations, allowlistHeaders, maskForLogs } from './privacy-enforcer'
import { evaluateExpression } from '../expression-engine'
import { DataSourceError, DataSourceErrorCode, classifyError } from './errors'
import { validateURL } from './url-validator'
import { executeWithRetry } from './retry'
import { globalInFlightRegistry, getInFlightKey } from './in-flight'
import { getDataSourceConfig } from './config'
import { validateResponse } from './response-validator'

// ============================================================================
// DATA SOURCE MANAGER
// ============================================================================

export class DataSourceManager {
  private sources: Map<string, Map<string, DataSourceDef>> = new Map()
  private cache: DataSourceCache
  private analyticsCallback?: (event: DataSourceEvent) => void
  private mocks: Map<string, any> = new Map()
  private config = getDataSourceConfig()
  private inFlight = globalInFlightRegistry
  
  constructor(cache?: DataSourceCache) {
    this.cache = cache || globalCache
  }
  
  /**
   * Register data sources for a flow
   */
  register(flowId: string, sources: Record<string, DataSourceDef>): void {
    const sourceMap = new Map<string, DataSourceDef>()
    
    for (const [name, config] of Object.entries(sources)) {
      sourceMap.set(name, { ...config, name })
    }
    
    this.sources.set(flowId, sourceMap)
  }
  
  /**
   * Set analytics callback
   */
  onAnalytics(callback: (event: DataSourceEvent) => void): void {
    this.analyticsCallback = callback
  }
  
  /**
   * Set mock for testing
   */
  setMock(flowId: string, sourceName: string, data: any | ((ctx: EvalContext) => any)): void {
    this.mocks.set(`${flowId}:${sourceName}`, data)
  }
  
  /**
   * Clear mock
   */
  clearMock(flowId: string, sourceName: string): void {
    this.mocks.delete(`${flowId}:${sourceName}`)
  }
  
  /**
   * Fetch data from source
   */
  async fetch(
    flowId: string,
    sourceName: string,
    context: EvalContext,
    options: FetchOptions = {}
  ): Promise<FetchResult> {
    const startTime = Date.now()
    const traceId = options.traceId || crypto.randomUUID()
    
    // Get source definition
    const source = this.getSource(flowId, sourceName)
    if (!source) {
      return this.errorResult(
        sourceName,
        'SOURCE_NOT_FOUND',
        `Data source "${sourceName}" not found`,
        startTime
      )
    }
    
    // Check for mock
    const mockKey = `${flowId}:${sourceName}`
    if (this.mocks.has(mockKey)) {
      const mockData = this.mocks.get(mockKey)
      const data = typeof mockData === 'function' ? mockData(context) : mockData
      
      return {
        success: true,
        data,
        meta: {
          durationMs: Date.now() - startTime,
          attempt: 1,
          cacheHit: false,
          source: sourceName,
        },
      }
    }
    
    // Emit start event
    this.emitAnalytics({
      type: 'ds_start',
      flowId,
      source: sourceName,
      traceId,
    })
    
    try {
      // Check cache (unless force)
      if (!options.force && source.cache) {
        const cacheKey = this.getCacheKey(flowId, sourceName, source, context)
        const cached = this.cache.get(cacheKey)
        
        if (cached !== undefined) {
          const meta = this.cache.getMeta(cacheKey)!
          
          this.emitAnalytics({
            type: 'ds_cache_hit',
            flowId,
            source: sourceName,
            key: cacheKey,
            ageMs: meta.ageMs,
          })
          
          // Apply mapResponse if needed
          if (source.mapResponse) {
            applyMapResponse(source.mapResponse, context, cached)
          }
          
          return {
            success: true,
            data: cached,
            meta: {
              durationMs: Date.now() - startTime,
              attempt: 1,
              cacheHit: true,
              source: sourceName,
            },
          }
        }
      }
      
      // Execute based on type
      let data: any
      
      switch (source.type) {
        case 'http.get':
        case 'http.post':
          data = await this.fetchHttp(flowId, source, context, options)
          break
          
        case 'computed':
          data = await this.fetchComputed(source, context)
          break
          
        case 'chain':
          data = await this.fetchChain(flowId, source, context, options)
          break
          
        default:
          throw new Error(`Unsupported source type: ${source.type}`)
      }
      
      // Store in cache
      if (source.cache && !options.force) {
        const cacheKey = this.getCacheKey(flowId, sourceName, source, context)
        this.cache.set(cacheKey, data, source.cache.ttlMs)
      }
      
      // Apply mapResponse
      if (source.mapResponse) {
        applyMapResponse(source.mapResponse, context, data)
      }
      
      // Emit success
      const durationMs = Date.now() - startTime
      this.emitAnalytics({
        type: 'ds_success',
        flowId,
        source: sourceName,
        durationMs,
        status: 200,
      })
      
      return {
        success: true,
        data,
        meta: {
          durationMs,
          attempt: 1,
          cacheHit: false,
          source: sourceName,
        },
      }
      
    } catch (error) {
      const durationMs = Date.now() - startTime
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      
      this.emitAnalytics({
        type: 'ds_fail',
        flowId,
        source: sourceName,
        durationMs,
        code,
      })
      
      return this.errorResult(
        sourceName,
        code,
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      )
    }
  }
  
  /**
   * Prefetch multiple sources
   */
  async prefetch(
    flowId: string,
    sourceNames: string[],
    context: EvalContext,
    options: FetchOptions = {}
  ): Promise<FetchResult[]> {
    return Promise.all(
      sourceNames.map(name =>
        this.fetch(flowId, name, context, { ...options, silent: true })
      )
    )
  }
  
  /**
   * Get cache metadata
   */
  getCacheInfo(flowId: string, sourceName: string, key: string): CacheMeta | null {
    return this.cache.getMeta(key)
  }
  
  // ========================================================================
  // FETCH IMPLEMENTATIONS
  // ========================================================================
  
  private async fetchHttp(
    flowId: string,
    source: DataSourceDef,
    context: EvalContext,
    options: FetchOptions
  ): Promise<any> {
    if (!source.url) {
      throw new DataSourceError(DataSourceErrorCode.INVALID_CONFIG, 'URL required for HTTP source')
    }
    
    // Resolve URL template
    const url = resolveTemplate(source.url, context)
    
    // VALIDATE URL (SSRF protection)
    validateURL(url, this.config.urlPolicy)
    
    // Get circuit breaker for host
    const hostname = new URL(url, 'http://localhost').hostname
    const breaker = getCircuitBreaker(hostname)
    
    // Resolve headers
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Trace-Id': options.traceId || crypto.randomUUID(),
    }
    
    // Add idempotency key for POST with retry
    if (source.type === 'http.post' && (source as any).dedupeKey) {
      const idempotencyKey = resolveTemplate((source as any).dedupeKey, context)
      headers['Idempotency-Key'] = idempotencyKey
    }
    
    if (source.headers) {
      const resolved = resolveTemplateObject(source.headers, context)
      headers = { ...headers, ...allowlistHeaders(resolved) }
    }
    
    // Resolve request body
    let body: any
    if (source.type === 'http.post' && source.mapRequest) {
      body = JSON.stringify(resolveTemplateObject(source.mapRequest, context))
    }
    
    // Execute with circuit breaker AND retry
    return await executeWithRetry(
      async () => {
        return await breaker.execute(async () => {
          const timeoutMs = source.timeoutMs || 10000
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), timeoutMs)
          
          // Support abort signal from options
          if (options.signal) {
            options.signal.addEventListener('abort', () => controller.abort())
          }
          
          try {
            const response = await fetch(url, {
              method: source.type === 'http.get' ? 'GET' : 'POST',
              headers,
              body,
              signal: controller.signal,
            })
            
            clearTimeout(timeout)
            
            if (!response.ok) {
              const errorCode = response.status >= 500 
                ? DataSourceErrorCode.HTTP_5XX 
                : DataSourceErrorCode.HTTP_4XX
              throw new DataSourceError(errorCode, `HTTP ${response.status}`)
            }
            
            let data = await response.json()
            
            // Validate response if schema provided (runtime only)
            if ((source as any).responseSchema) {
              data = validateResponse(data, (source as any).responseSchema, source.name)
            }
            
            return data
            
          } catch (error) {
            clearTimeout(timeout)
            
            if (error instanceof Error && error.name === 'AbortError') {
              throw new DataSourceError(DataSourceErrorCode.ABORTED, 'Request aborted')
            }
            
            throw error
          }
        })
      },
      {
        source,
        isPost: source.type === 'http.post',
        onRetry: (attempt, delayMs) => {
          this.emitAnalytics({
            type: 'ds_retry',
            flowId,
            source: source.name,
            attempt,
            delayMs,
          })
        }
      }
    )
  }
  
  private async fetchComputed(
    source: DataSourceDef,
    context: EvalContext
  ): Promise<any> {
    if (!source.compute) {
      throw new Error('compute expression required for computed source')
    }
    
    // Evaluate expression
    const result = evaluateExpression(source.compute, context)
    
    if (!result.success) {
      throw new Error(`Compute failed: ${result.error}`)
    }
    
    return result.value
  }
  
  private async fetchChain(
    flowId: string,
    source: DataSourceDef,
    context: EvalContext,
    options: FetchOptions
  ): Promise<any[]> {
    if (!source.steps || source.steps.length === 0) {
      throw new Error('steps required for chain source')
    }
    
    const results: any[] = []
    
    for (const stepName of source.steps) {
      const result = await this.fetch(flowId, stepName, context, options)
      
      if (!result.success) {
        throw new Error(`Chain step "${stepName}" failed: ${result.error?.message}`)
      }
      
      results.push(result.data)
    }
    
    return results
  }
  
  // ========================================================================
  // HELPERS
  // ========================================================================
  
  private getSource(flowId: string, sourceName: string): DataSourceDef | null {
    const flowSources = this.sources.get(flowId)
    if (!flowSources) return null
    
    return flowSources.get(sourceName) || null
  }
  
  private getCacheKey(
    flowId: string,
    sourceName: string,
    source: DataSourceDef,
    context: EvalContext
  ): string {
    if (source.cache?.key) {
      // Use custom key template
      return resolveTemplate(source.cache.key, context)
    }
    
    // Default: hash request
    return `${flowId}:${sourceName}`
  }
  
  private errorResult(
    source: string,
    code: string,
    message: string,
    startTime: number
  ): FetchResult {
    return {
      success: false,
      error: {
        code,
        message,
      },
      meta: {
        durationMs: Date.now() - startTime,
        attempt: 1,
        cacheHit: false,
        source,
      },
    }
  }
  
  private emitAnalytics(event: DataSourceEvent): void {
    if (this.analyticsCallback) {
      this.analyticsCallback(event)
    }
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

export const globalDataSourceManager = new DataSourceManager()
