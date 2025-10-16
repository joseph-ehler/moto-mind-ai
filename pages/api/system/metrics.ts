// MotoMindAI: Prometheus Metrics Endpoint
// Production observability for monitoring and alerting

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import client from 'prom-client'

// Create registry
const register = new client.Registry()

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register })

// Custom metrics for MotoMindAI
export const explanationLatency = new client.Histogram({
  name: 'explanation_latency_seconds',
  help: 'Latency of explanation generation in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  labelNames: ['tenant_id', 'confidence']
})

export const explanationsTotal = new client.Counter({
  name: 'explanations_total',
  help: 'Total number of explanations generated',
  labelNames: ['tenant_id', 'vehicle_id', 'confidence', 'fallback_used']
})

export const circuitBreakerState = new client.Gauge({
  name: 'circuit_breaker_open',
  help: 'Circuit breaker state (1 = open, 0 = closed)',
  labelNames: ['scope', 'tenant_id']
})

export const apiErrors = new client.Counter({
  name: 'api_errors_total',
  help: 'Total API errors by endpoint and status',
  labelNames: ['endpoint', 'status_code', 'error_category']
})

export const databaseConnections = new client.Gauge({
  name: 'database_connections',
  help: 'Database connection pool status',
  labelNames: ['state'] // total, idle, waiting
})

export const usageTrackerBatch = new client.Gauge({
  name: 'usage_tracker_batch_size',
  help: 'Current usage tracker batch size'
})

export const ocrProcessing = new client.Histogram({
  name: 'ocr_processing_seconds',
  help: 'OCR processing time in seconds',
  buckets: [0.5, 1, 2, 5, 10, 30],
  labelNames: ['kind', 'confidence_range']
})

export const uploadSize = new client.Histogram({
  name: 'upload_size_bytes',
  help: 'Upload file size in bytes',
  buckets: [1024, 10240, 102400, 1048576, 10485760], // 1KB to 10MB
  labelNames: ['kind', 'mime_type']
})

export const manualEventsTotal = new client.Counter({
  name: 'manual_events_total',
  help: 'Total manual events created',
  labelNames: ['tenant_id', 'event_type', 'verified_by_user']
})

export const dataQualityScore = new client.Histogram({
  name: 'data_quality_score',
  help: 'Data quality completeness percentage',
  buckets: [0, 25, 50, 75, 90, 100],
  labelNames: ['tenant_id', 'vehicle_id']
})

// Register all metrics
register.registerMetric(explanationLatency)
register.registerMetric(explanationsTotal)
register.registerMetric(circuitBreakerState)
register.registerMetric(apiErrors)
register.registerMetric(databaseConnections)
register.registerMetric(usageTrackerBatch)
register.registerMetric(ocrProcessing)
register.registerMetric(uploadSize)
register.registerMetric(manualEventsTotal)
register.registerMetric(dataQualityScore)

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Update real-time metrics before serving
    await updateRealTimeMetrics()
    
    // Set content type for Prometheus
    res.setHeader('Content-Type', register.contentType)
    
    // Return metrics
    const metrics = await register.metrics()
    res.status(200).send(metrics)
  } catch (error) {
    console.error('Metrics endpoint error:', error)
    res.status(500).json({ error: 'Failed to generate metrics' })
  }
}

async function updateRealTimeMetrics() {
  try {
    // Update database connection metrics
    const { getPoolMetrics } = await import('../../../backend/database')
    const poolMetrics = getPoolMetrics()
    
    databaseConnections.set({ state: 'total' }, poolMetrics.totalCount)
    databaseConnections.set({ state: 'idle' }, poolMetrics.idleCount)
    databaseConnections.set({ state: 'waiting' }, poolMetrics.waitingCount)
    
    // Update usage tracker batch size
    const { usageTracker } = await import('../../../backend/usage-tracker')
    const batchStatus = usageTracker.getBatchStatus()
    usageTrackerBatch.set(batchStatus.batchSize)
    
    // Update circuit breaker states
    const { circuitBreaker } = await import('../../../backend/circuit-breaker')
    const circuitStatus = circuitBreaker.getStatus()
    
    // Global circuit breaker
    circuitBreakerState.set(
      { scope: 'global', tenant_id: 'all' },
      circuitStatus.global.state === 'open' ? 1 : 0
    )
    
    // Service-specific circuit breakers
    circuitBreakerState.set(
      { scope: 'openai', tenant_id: 'all' },
      circuitStatus.openai.state === 'open' ? 1 : 0
    )
    
    circuitBreakerState.set(
      { scope: 'supabase', tenant_id: 'all' },
      circuitStatus.supabase.state === 'open' ? 1 : 0
    )
  } catch (error) {
    console.error('Failed to update real-time metrics:', error)
  }
}
export function recordExplanationMetrics(
  tenantId: string,
  vehicleId: string,
  confidence: string,
  fallbackUsed: boolean,
  durationSeconds: number,
  dataQuality: number
) {
  // Record latency
  explanationLatency
    .labels({ tenant_id: tenantId, confidence })
    .observe(durationSeconds)
  
  // Record total count
  explanationsTotal
    .labels({ 
      tenant_id: tenantId, 
      vehicle_id: vehicleId, 
      confidence, 
      fallback_used: fallbackUsed.toString() 
    })
    .inc()
  
  // Record data quality
  dataQualityScore
    .labels({ tenant_id: tenantId, vehicle_id: vehicleId })
    .observe(dataQuality)
}

// Helper function to record API errors
export function recordApiError(
  endpoint: string,
  statusCode: number,
  errorCategory: string
) {
  apiErrors
    .labels({ 
      endpoint, 
      status_code: statusCode.toString(), 
      error_category: errorCategory 
    })
    .inc()
}

// Helper function to record OCR processing
export function recordOcrProcessing(
  kind: string,
  confidence: number,
  durationSeconds: number
) {
  const confidenceRange = confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low'
  
  ocrProcessing
    .labels({ kind, confidence_range: confidenceRange })
    .observe(durationSeconds)
}

// Helper function to record uploads
export function recordUpload(
  kind: string,
  mimeType: string,
  sizeBytes: number
) {
  uploadSize
    .labels({ kind, mime_type: mimeType })
    .observe(sizeBytes)
}

// Helper function to record manual events
export function recordManualEvent(
  tenantId: string,
  eventType: string,
  verifiedByUser: boolean
) {
  manualEventsTotal
    .labels({ 
      tenant_id: tenantId, 
      event_type: eventType, 
      verified_by_user: verifiedByUser.toString() 
    })
    .inc()
}


export default withTenantIsolation(handler)
