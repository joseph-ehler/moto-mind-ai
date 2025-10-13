/**
 * PERFORMANCE METRICS
 * 
 * Track performance metrics for optimization
 * 
 * Features:
 * - Page load times
 * - API latency
 * - Component render times
 * - Cache hit rates
 * - Offline queue size
 * - Memory usage
 */

import { logger } from './logger'

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percent'
  timestamp: string
  tags?: Record<string, string>
}

class MetricsCollector {
  private metrics: PerformanceMetric[] = []
  private isProduction: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  /**
   * Record a metric
   */
  record(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    tags?: Record<string, string>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    }

    this.metrics.push(metric)

    // Send to backend in production
    if (this.isProduction) {
      this.sendMetric(metric)
    } else {
      console.log('[Metric]', metric)
    }
  }

  /**
   * Send metric to backend
   */
  private async sendMetric(metric: PerformanceMetric) {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      // Silently fail (don't want metrics to break app)
      console.error('Failed to send metric:', error)
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = []
  }

  // ==========================================================================
  // PAGE PERFORMANCE
  // ==========================================================================

  /**
   * Track page load time
   */
  trackPageLoad() {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (perfData) {
        this.record('page_load_time', perfData.loadEventEnd - perfData.fetchStart, 'ms')
        this.record('dom_content_loaded', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms')
        this.record('first_byte', perfData.responseStart - perfData.fetchStart, 'ms')
      }
    })
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.record('lcp', lastEntry.renderTime || lastEntry.loadTime, 'ms', { vital: 'lcp' })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.record('fid', (entry as any).processingStart - entry.startTime, 'ms', { vital: 'fid' })
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.record('cls', clsValue, 'count', { vital: 'cls' })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.warn('Web Vitals not supported:', error)
    }
  }

  // ==========================================================================
  // API PERFORMANCE
  // ==========================================================================

  /**
   * Track API call latency
   */
  trackAPILatency(endpoint: string, duration: number, status: number) {
    this.record('api_latency', duration, 'ms', {
      endpoint,
      status: status.toString()
    })
  }

  /**
   * Track API error rate
   */
  trackAPIError(endpoint: string, error: string) {
    this.record('api_error', 1, 'count', {
      endpoint,
      error
    })
  }

  // ==========================================================================
  // COMPONENT PERFORMANCE
  // ==========================================================================

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, duration: number) {
    this.record('component_render', duration, 'ms', {
      component: componentName
    })
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.record(name, duration, 'ms', tags)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.record(name, duration, 'ms', { ...tags, error: 'true' })
      throw error
    }
  }

  // ==========================================================================
  // CACHE PERFORMANCE
  // ==========================================================================

  /**
   * Track cache hit rate
   */
  trackCacheHit(cacheName: string) {
    this.record('cache_hit', 1, 'count', { cache: cacheName })
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(cacheName: string) {
    this.record('cache_miss', 1, 'count', { cache: cacheName })
  }

  /**
   * Track cache size
   */
  trackCacheSize(cacheName: string, size: number) {
    this.record('cache_size', size, 'bytes', { cache: cacheName })
  }

  // ==========================================================================
  // OFFLINE QUEUE
  // ==========================================================================

  /**
   * Track offline queue size
   */
  trackQueueSize(queueType: 'photos' | 'events', size: number) {
    this.record('queue_size', size, 'count', { queue: queueType })
  }

  /**
   * Track sync success
   */
  trackSyncSuccess(queueType: 'photos' | 'events', count: number) {
    this.record('sync_success', count, 'count', { queue: queueType })
  }

  /**
   * Track sync failure
   */
  trackSyncFailure(queueType: 'photos' | 'events', error: string) {
    this.record('sync_failure', 1, 'count', { queue: queueType, error })
  }

  // ==========================================================================
  // MEMORY USAGE
  // ==========================================================================

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if (typeof performance === 'undefined' || !(performance as any).memory) return

    const memory = (performance as any).memory
    this.record('memory_used', memory.usedJSHeapSize, 'bytes')
    this.record('memory_total', memory.totalJSHeapSize, 'bytes')
    this.record('memory_limit', memory.jsHeapSizeLimit, 'bytes')
  }

  // ==========================================================================
  // SERVICE WORKER
  // ==========================================================================

  /**
   * Track service worker install
   */
  trackSWInstall() {
    this.record('sw_install', 1, 'count')
  }

  /**
   * Track service worker activation
   */
  trackSWActivation() {
    this.record('sw_activation', 1, 'count')
  }

  /**
   * Track service worker update
   */
  trackSWUpdate() {
    this.record('sw_update', 1, 'count')
  }

  // ==========================================================================
  // FEATURE USAGE
  // ==========================================================================

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureId: string, enabled: boolean) {
    this.record('feature_usage', enabled ? 1 : 0, 'count', {
      feature: featureId,
      status: enabled ? 'enabled' : 'disabled'
    })
  }

  /**
   * Track feature adoption (first use)
   */
  trackFeatureAdoption(featureId: string) {
    this.record('feature_adoption', 1, 'count', { feature: featureId })
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

export const metrics = new MetricsCollector()

// ==========================================================================
// AUTO-TRACK WEB VITALS
// ==========================================================================

if (typeof window !== 'undefined') {
  // Track page load
  metrics.trackPageLoad()

  // Track Web Vitals
  metrics.trackWebVitals()

  // Track memory every 30 seconds
  setInterval(() => {
    metrics.trackMemoryUsage()
  }, 30000)
}

// ==========================================================================
// REACT HOOKS
// ==========================================================================

import { useEffect } from 'react'

/**
 * Hook to track component mount/render time
 */
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      metrics.trackComponentRender(componentName, duration)
    }
  }, [componentName])
}

/**
 * Hook to track API calls
 */
export function useAPITracking() {
  return {
    trackCall: (endpoint: string, duration: number, status: number) => {
      metrics.trackAPILatency(endpoint, duration, status)
      logger.trackAPICall(endpoint, 'GET', duration, status)
    },
    trackError: (endpoint: string, error: string) => {
      metrics.trackAPIError(endpoint, error)
    }
  }
}
