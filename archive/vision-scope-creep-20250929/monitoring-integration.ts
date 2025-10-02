// Production Monitoring Integration
// Connects vision system metrics to observability platforms

export interface MonitoringConfig {
  provider: 'datadog' | 'newrelic' | 'prometheus' | 'custom'
  apiKey?: string
  endpoint?: string
  environment: 'development' | 'staging' | 'production'
  enableAlerts: boolean
  alertThresholds: {
    costSpike: number // Percentage increase that triggers alert
    accuracyDrop: number // Percentage decrease that triggers alert
    errorRate: number // Error rate percentage that triggers alert
    latency: number // Milliseconds that trigger latency alert
  }
}

export interface VisionMetrics {
  timestamp: string
  environment: string
  metrics: {
    // Cost metrics
    totalCost: number
    costPerDocument: number
    modelUsage: Record<string, number>
    
    // Performance metrics
    avgProcessingTime: number
    p95ProcessingTime: number
    requestsPerMinute: number
    
    // Quality metrics
    avgConfidence: number
    userCorrectionRate: number
    errorRate: number
    
    // System metrics
    cacheHitRate: number
    circuitBreakerState: string
    retryRate: number
  }
  tags: {
    documentType?: string
    model?: string
    variant?: string
  }
}

class MonitoringIntegration {
  private config: MonitoringConfig
  private metricsBuffer: VisionMetrics[] = []
  private lastFlush = Date.now()
  private flushInterval = 60000 // 1 minute
  
  constructor(config: MonitoringConfig) {
    this.config = config
    
    // Start periodic flushing
    setInterval(() => this.flushMetrics(), this.flushInterval)
  }
  
  // Record a vision processing event
  recordEvent(
    documentType: string,
    model: 'gpt-4o' | 'gpt-4o-mini',
    metrics: {
      cost: number
      processingTime: number
      confidence: number
      success: boolean
      cacheHit: boolean
      retryCount: number
      userCorrected?: boolean
    }
  ): void {
    const timestamp = new Date().toISOString()
    
    // Add to buffer
    this.metricsBuffer.push({
      timestamp,
      environment: this.config.environment,
      metrics: {
        totalCost: metrics.cost,
        costPerDocument: metrics.cost,
        modelUsage: { [model]: 1 },
        avgProcessingTime: metrics.processingTime,
        p95ProcessingTime: metrics.processingTime,
        requestsPerMinute: 1,
        avgConfidence: metrics.confidence,
        userCorrectionRate: metrics.userCorrected ? 1 : 0,
        errorRate: metrics.success ? 0 : 1,
        cacheHitRate: metrics.cacheHit ? 1 : 0,
        circuitBreakerState: 'closed', // Would be dynamic in real implementation
        retryRate: metrics.retryCount > 0 ? 1 : 0
      },
      tags: {
        documentType,
        model
      }
    })
    
    // Check for immediate alerts
    if (this.config.enableAlerts) {
      this.checkAlerts(metrics)
    }
  }
  
  // Check if metrics trigger alerts
  private checkAlerts(metrics: any): void {
    const alerts: string[] = []
    
    // Cost spike detection
    const recentCosts = this.metricsBuffer
      .filter(m => Date.now() - new Date(m.timestamp).getTime() < 300000) // Last 5 minutes
      .map(m => m.metrics.totalCost)
    
    if (recentCosts.length > 10) {
      const avgCost = recentCosts.reduce((sum, cost) => sum + cost, 0) / recentCosts.length
      const currentCost = metrics.cost
      
      if (currentCost > avgCost * (1 + this.config.alertThresholds.costSpike / 100)) {
        alerts.push(`Cost spike detected: $${currentCost.toFixed(4)} vs avg $${avgCost.toFixed(4)}`)
      }
    }
    
    // Accuracy drop detection
    if (metrics.confidence < (100 - this.config.alertThresholds.accuracyDrop)) {
      alerts.push(`Low confidence detected: ${metrics.confidence}%`)
    }
    
    // Latency alert
    if (metrics.processingTime > this.config.alertThresholds.latency) {
      alerts.push(`High latency detected: ${metrics.processingTime}ms`)
    }
    
    // Send alerts
    if (alerts.length > 0) {
      this.sendAlerts(alerts)
    }
  }
  
  // Send alerts to monitoring platform
  private async sendAlerts(alerts: string[]): Promise<void> {
    console.warn('🚨 Vision System Alerts:', alerts)
    
    // In production, integrate with your alerting system
    switch (this.config.provider) {
      case 'datadog':
        await this.sendDatadogAlert(alerts)
        break
      case 'newrelic':
        await this.sendNewRelicAlert(alerts)
        break
      case 'prometheus':
        await this.sendPrometheusAlert(alerts)
        break
      default:
        await this.sendCustomAlert(alerts)
    }
  }
  
  // Flush metrics to monitoring platform
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return
    
    const aggregatedMetrics = this.aggregateMetrics(this.metricsBuffer)
    
    try {
      switch (this.config.provider) {
        case 'datadog':
          await this.sendToDatadog(aggregatedMetrics)
          break
        case 'newrelic':
          await this.sendToNewRelic(aggregatedMetrics)
          break
        case 'prometheus':
          await this.sendToPrometheus(aggregatedMetrics)
          break
        default:
          await this.sendToCustomEndpoint(aggregatedMetrics)
      }
      
      // Clear buffer after successful send
      this.metricsBuffer = []
      this.lastFlush = Date.now()
      
    } catch (error) {
      console.error('Failed to flush metrics:', error)
      
      // Keep buffer but limit size to prevent memory issues
      if (this.metricsBuffer.length > 1000) {
        this.metricsBuffer = this.metricsBuffer.slice(-500)
      }
    }
  }
  
  // Aggregate metrics for efficient transmission
  private aggregateMetrics(metrics: VisionMetrics[]): any {
    const timeWindow = 60000 // 1 minute windows
    const windows = new Map<string, VisionMetrics[]>()
    
    // Group by time windows
    metrics.forEach(metric => {
      const windowStart = Math.floor(new Date(metric.timestamp).getTime() / timeWindow) * timeWindow
      const windowKey = windowStart.toString()
      
      if (!windows.has(windowKey)) {
        windows.set(windowKey, [])
      }
      windows.get(windowKey)!.push(metric)
    })
    
    // Aggregate each window
    const aggregated = Array.from(windows.entries()).map(([windowStart, windowMetrics]) => {
      const count = windowMetrics.length
      
      return {
        timestamp: new Date(parseInt(windowStart)).toISOString(),
        environment: this.config.environment,
        count,
        metrics: {
          totalCost: windowMetrics.reduce((sum, m) => sum + m.metrics.totalCost, 0),
          avgCostPerDocument: windowMetrics.reduce((sum, m) => sum + m.metrics.costPerDocument, 0) / count,
          avgProcessingTime: windowMetrics.reduce((sum, m) => sum + m.metrics.avgProcessingTime, 0) / count,
          p95ProcessingTime: this.calculatePercentile(windowMetrics.map(m => m.metrics.avgProcessingTime), 0.95),
          requestsPerMinute: count,
          avgConfidence: windowMetrics.reduce((sum, m) => sum + m.metrics.avgConfidence, 0) / count,
          userCorrectionRate: windowMetrics.reduce((sum, m) => sum + m.metrics.userCorrectionRate, 0) / count,
          errorRate: windowMetrics.reduce((sum, m) => sum + m.metrics.errorRate, 0) / count,
          cacheHitRate: windowMetrics.reduce((sum, m) => sum + m.metrics.cacheHitRate, 0) / count,
          retryRate: windowMetrics.reduce((sum, m) => sum + m.metrics.retryRate, 0) / count
        },
        tags: this.aggregateTags(windowMetrics)
      }
    })
    
    return aggregated
  }
  
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * percentile) - 1
    return sorted[index] || 0
  }
  
  private aggregateTags(metrics: VisionMetrics[]): Record<string, any> {
    const documentTypes = new Set(metrics.map(m => m.tags.documentType).filter(Boolean))
    const models = new Set(metrics.map(m => m.tags.model).filter(Boolean))
    
    return {
      documentTypes: Array.from(documentTypes),
      models: Array.from(models)
    }
  }
  
  // Platform-specific implementations
  private async sendToDatadog(metrics: any[]): Promise<void> {
    if (!this.config.apiKey) {
      console.warn('Datadog API key not configured')
      return
    }
    
    const payload = {
      series: metrics.flatMap(metric => [
        {
          metric: 'vision.cost.total',
          points: [[Math.floor(new Date(metric.timestamp).getTime() / 1000), metric.metrics.totalCost]],
          tags: [`env:${metric.environment}`, ...this.formatTags(metric.tags)]
        },
        {
          metric: 'vision.performance.processing_time',
          points: [[Math.floor(new Date(metric.timestamp).getTime() / 1000), metric.metrics.avgProcessingTime]],
          tags: [`env:${metric.environment}`, ...this.formatTags(metric.tags)]
        },
        {
          metric: 'vision.quality.confidence',
          points: [[Math.floor(new Date(metric.timestamp).getTime() / 1000), metric.metrics.avgConfidence]],
          tags: [`env:${metric.environment}`, ...this.formatTags(metric.tags)]
        }
      ])
    }
    
    // Would make actual HTTP request to Datadog API
    console.log('📊 Sending to Datadog:', payload.series.length, 'metrics')
  }
  
  private async sendToNewRelic(metrics: any[]): Promise<void> {
    // New Relic implementation
    console.log('📊 Sending to New Relic:', metrics.length, 'metric windows')
  }
  
  private async sendToPrometheus(metrics: any[]): Promise<void> {
    // Prometheus implementation
    console.log('📊 Sending to Prometheus:', metrics.length, 'metric windows')
  }
  
  private async sendToCustomEndpoint(metrics: any[]): Promise<void> {
    if (!this.config.endpoint) {
      console.warn('Custom endpoint not configured')
      return
    }
    
    // Custom endpoint implementation
    console.log('📊 Sending to custom endpoint:', metrics.length, 'metric windows')
  }
  
  private async sendDatadogAlert(alerts: string[]): Promise<void> {
    console.log('🚨 Datadog Alert:', alerts.join(', '))
  }
  
  private async sendNewRelicAlert(alerts: string[]): Promise<void> {
    console.log('🚨 New Relic Alert:', alerts.join(', '))
  }
  
  private async sendPrometheusAlert(alerts: string[]): Promise<void> {
    console.log('🚨 Prometheus Alert:', alerts.join(', '))
  }
  
  private async sendCustomAlert(alerts: string[]): Promise<void> {
    console.log('🚨 Custom Alert:', alerts.join(', '))
  }
  
  private formatTags(tags: Record<string, any>): string[] {
    return Object.entries(tags).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${key}:${v}`)
      }
      return [`${key}:${value}`]
    })
  }
  
  // Get current system health
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical'
    metrics: Record<string, number>
    alerts: string[]
  } {
    const recentMetrics = this.metricsBuffer.filter(
      m => Date.now() - new Date(m.timestamp).getTime() < 300000 // Last 5 minutes
    )
    
    if (recentMetrics.length === 0) {
      return {
        status: 'healthy',
        metrics: {},
        alerts: []
      }
    }
    
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.metrics.errorRate, 0) / recentMetrics.length
    const avgConfidence = recentMetrics.reduce((sum, m) => sum + m.metrics.avgConfidence, 0) / recentMetrics.length
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.metrics.avgProcessingTime, 0) / recentMetrics.length
    
    const alerts: string[] = []
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (avgErrorRate > this.config.alertThresholds.errorRate / 100) {
      alerts.push(`High error rate: ${(avgErrorRate * 100).toFixed(1)}%`)
      status = 'critical'
    }
    
    if (avgConfidence < (100 - this.config.alertThresholds.accuracyDrop)) {
      alerts.push(`Low confidence: ${avgConfidence.toFixed(1)}%`)
      status = status === 'critical' ? 'critical' : 'degraded'
    }
    
    if (avgLatency > this.config.alertThresholds.latency) {
      alerts.push(`High latency: ${avgLatency.toFixed(0)}ms`)
      status = status === 'critical' ? 'critical' : 'degraded'
    }
    
    return {
      status,
      metrics: {
        errorRate: avgErrorRate * 100,
        confidence: avgConfidence,
        latency: avgLatency,
        requestCount: recentMetrics.length
      },
      alerts
    }
  }
}

// Global monitoring instance
let monitoringInstance: MonitoringIntegration | null = null

export function initializeMonitoring(config: MonitoringConfig): MonitoringIntegration {
  monitoringInstance = new MonitoringIntegration(config)
  console.log(`📊 Monitoring initialized for ${config.provider} in ${config.environment}`)
  return monitoringInstance
}

export function getMonitoring(): MonitoringIntegration | null {
  return monitoringInstance
}

// Convenience function for recording vision events
export function recordVisionEvent(
  documentType: string,
  model: 'gpt-4o' | 'gpt-4o-mini',
  metrics: {
    cost: number
    processingTime: number
    confidence: number
    success: boolean
    cacheHit: boolean
    retryCount: number
    userCorrected?: boolean
  }
): void {
  if (monitoringInstance) {
    monitoringInstance.recordEvent(documentType, model, metrics)
  }
}

// Default configurations for different environments
export const MONITORING_CONFIGS = {
  development: {
    provider: 'custom' as const,
    environment: 'development' as const,
    enableAlerts: false,
    alertThresholds: {
      costSpike: 100, // 100% increase
      accuracyDrop: 20, // 20% drop
      errorRate: 50, // 50% error rate
      latency: 30000 // 30 seconds
    }
  },
  staging: {
    provider: 'custom' as const,
    environment: 'staging' as const,
    enableAlerts: true,
    alertThresholds: {
      costSpike: 50, // 50% increase
      accuracyDrop: 15, // 15% drop
      errorRate: 25, // 25% error rate
      latency: 15000 // 15 seconds
    }
  },
  production: {
    provider: 'datadog' as const,
    environment: 'production' as const,
    enableAlerts: true,
    alertThresholds: {
      costSpike: 25, // 25% increase
      accuracyDrop: 10, // 10% drop
      errorRate: 5, // 5% error rate
      latency: 10000 // 10 seconds
    }
  }
} as const
