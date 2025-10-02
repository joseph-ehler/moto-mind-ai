// Vision Processing Metrics - Production Monitoring
// Tracks real-world performance to validate 95% accuracy claim

interface VisionMetrics {
  // Processing metrics
  total_requests: number
  successful_requests: number
  failed_requests: number
  
  // Performance metrics
  avg_processing_time_ms: number
  p95_processing_time_ms: number
  p99_processing_time_ms: number
  
  // Accuracy metrics (when ground truth available)
  accuracy_samples: number
  field_accuracies: {
    odometer: { correct: number; total: number }
    fuel_level: { correct: number; total: number }
    warning_lights: { correct: number; total: number }
    service_description: { correct: number; total: number }
    vendor_name: { correct: number; total: number }
    total_amount: { correct: number; total: number }
  }
  
  // Error tracking
  error_counts: Record<string, number>
  retry_success_rate: number
  
  // Confidence calibration
  confidence_buckets: {
    [key: string]: { predicted_accuracy: number; actual_accuracy: number; sample_count: number }
  }
  
  // Document type breakdown
  document_type_stats: {
    [key: string]: {
      requests: number
      success_rate: number
      avg_confidence: number
    }
  }
}

export class VisionMetricsCollector {
  private metrics: VisionMetrics
  private processingTimes: number[] = []
  private maxStoredTimes = 1000 // Keep last 1000 processing times for percentiles

  constructor() {
    this.metrics = this.initializeMetrics()
  }

  private initializeMetrics(): VisionMetrics {
    return {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      avg_processing_time_ms: 0,
      p95_processing_time_ms: 0,
      p99_processing_time_ms: 0,
      accuracy_samples: 0,
      field_accuracies: {
        odometer: { correct: 0, total: 0 },
        fuel_level: { correct: 0, total: 0 },
        warning_lights: { correct: 0, total: 0 },
        service_description: { correct: 0, total: 0 },
        vendor_name: { correct: 0, total: 0 },
        total_amount: { correct: 0, total: 0 }
      },
      error_counts: {},
      retry_success_rate: 0,
      confidence_buckets: {},
      document_type_stats: {}
    }
  }

  /**
   * Record a vision processing request
   */
  recordRequest(data: {
    document_type: string
    processing_time_ms: number
    success: boolean
    confidence?: number
    error_code?: string
    retry_attempt?: number
  }) {
    this.metrics.total_requests++
    
    if (data.success) {
      this.metrics.successful_requests++
    } else {
      this.metrics.failed_requests++
      
      // Track error codes
      if (data.error_code) {
        this.metrics.error_counts[data.error_code] = 
          (this.metrics.error_counts[data.error_code] || 0) + 1
      }
    }

    // Track processing times
    this.processingTimes.push(data.processing_time_ms)
    if (this.processingTimes.length > this.maxStoredTimes) {
      this.processingTimes.shift()
    }
    this.updateProcessingTimeMetrics()

    // Track document type stats
    if (!this.metrics.document_type_stats[data.document_type]) {
      this.metrics.document_type_stats[data.document_type] = {
        requests: 0,
        success_rate: 0,
        avg_confidence: 0
      }
    }
    
    const typeStats = this.metrics.document_type_stats[data.document_type]
    typeStats.requests++
    
    if (data.success) {
      const successCount = typeStats.requests * typeStats.success_rate + 1
      typeStats.success_rate = successCount / typeStats.requests
      
      if (data.confidence) {
        const totalConfidence = (typeStats.requests - 1) * typeStats.avg_confidence + data.confidence
        typeStats.avg_confidence = totalConfidence / typeStats.requests
      }
    } else {
      const successCount = typeStats.requests * typeStats.success_rate
      typeStats.success_rate = successCount / typeStats.requests
    }

    // Track confidence calibration
    if (data.success && data.confidence) {
      this.recordConfidence(data.confidence)
    }

    // Log metrics periodically
    if (this.metrics.total_requests % 100 === 0) {
      this.logMetricsSummary()
    }
  }

  /**
   * Record accuracy measurement when ground truth is available
   */
  recordAccuracy(data: {
    document_type: string
    field_accuracies: {
      odometer?: boolean
      fuel_level?: boolean
      warning_lights?: boolean
      service_description?: boolean
      vendor_name?: boolean
      total_amount?: boolean
    }
    predicted_confidence: number
  }) {
    this.metrics.accuracy_samples++

    // Update field accuracies
    Object.entries(data.field_accuracies).forEach(([field, isCorrect]) => {
      if (field in this.metrics.field_accuracies) {
        const fieldStats = this.metrics.field_accuracies[field as keyof typeof this.metrics.field_accuracies]
        fieldStats.total++
        if (isCorrect) {
          fieldStats.correct++
        }
      }
    })

    // Update confidence calibration
    const correctFields = Object.values(data.field_accuracies).filter(Boolean).length
    const totalFields = Object.keys(data.field_accuracies).length
    const actualAccuracy = totalFields > 0 ? correctFields / totalFields : 0
    
    this.updateConfidenceCalibration(data.predicted_confidence, actualAccuracy)
  }

  /**
   * Record retry attempt outcome
   */
  recordRetry(success: boolean) {
    // Simple exponential moving average for retry success rate
    const alpha = 0.1
    if (this.metrics.retry_success_rate === 0) {
      this.metrics.retry_success_rate = success ? 1 : 0
    } else {
      this.metrics.retry_success_rate = 
        alpha * (success ? 1 : 0) + (1 - alpha) * this.metrics.retry_success_rate
    }
  }

  private updateProcessingTimeMetrics() {
    if (this.processingTimes.length === 0) return

    // Calculate average
    const sum = this.processingTimes.reduce((a, b) => a + b, 0)
    this.metrics.avg_processing_time_ms = sum / this.processingTimes.length

    // Calculate percentiles
    const sorted = [...this.processingTimes].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)
    
    this.metrics.p95_processing_time_ms = sorted[p95Index] || 0
    this.metrics.p99_processing_time_ms = sorted[p99Index] || 0
  }

  private recordConfidence(confidence: number) {
    // Bucket confidence scores for calibration analysis
    const bucket = Math.floor(confidence * 10) / 10 // 0.1 bucket size
    const bucketKey = bucket.toFixed(1)
    
    if (!this.metrics.confidence_buckets[bucketKey]) {
      this.metrics.confidence_buckets[bucketKey] = {
        predicted_accuracy: bucket,
        actual_accuracy: 0,
        sample_count: 0
      }
    }
    
    this.metrics.confidence_buckets[bucketKey].sample_count++
  }

  private updateConfidenceCalibration(predictedConfidence: number, actualAccuracy: number) {
    const bucket = Math.floor(predictedConfidence * 10) / 10
    const bucketKey = bucket.toFixed(1)
    
    if (this.metrics.confidence_buckets[bucketKey]) {
      const bucketData = this.metrics.confidence_buckets[bucketKey]
      const totalAccuracy = bucketData.actual_accuracy * (bucketData.sample_count - 1) + actualAccuracy
      bucketData.actual_accuracy = totalAccuracy / bucketData.sample_count
    }
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): VisionMetrics & {
    success_rate: number
    overall_accuracy: number
    confidence_calibration_error: number
  } {
    const successRate = this.metrics.total_requests > 0 
      ? this.metrics.successful_requests / this.metrics.total_requests 
      : 0

    // Calculate overall accuracy from field accuracies
    const fieldAccuracies = Object.values(this.metrics.field_accuracies)
    const totalCorrect = fieldAccuracies.reduce((sum, field) => sum + field.correct, 0)
    const totalSamples = fieldAccuracies.reduce((sum, field) => sum + field.total, 0)
    const overallAccuracy = totalSamples > 0 ? totalCorrect / totalSamples : 0

    // Calculate confidence calibration error
    const calibrationError = this.calculateCalibrationError()

    return {
      ...this.metrics,
      success_rate: successRate,
      overall_accuracy: overallAccuracy,
      confidence_calibration_error: calibrationError
    }
  }

  private calculateCalibrationError(): number {
    const buckets = Object.values(this.metrics.confidence_buckets)
    if (buckets.length === 0) return 0

    const totalSamples = buckets.reduce((sum, bucket) => sum + bucket.sample_count, 0)
    if (totalSamples === 0) return 0

    // Weighted average of |predicted - actual| across confidence buckets
    const weightedError = buckets.reduce((sum, bucket) => {
      const weight = bucket.sample_count / totalSamples
      const error = Math.abs(bucket.predicted_accuracy - bucket.actual_accuracy)
      return sum + weight * error
    }, 0)

    return weightedError
  }

  /**
   * Log metrics summary for monitoring
   */
  private logMetricsSummary() {
    const metrics = this.getMetrics()
    
    console.log('📊 Vision Processing Metrics Summary:', {
      total_requests: metrics.total_requests,
      success_rate: `${(metrics.success_rate * 100).toFixed(1)}%`,
      overall_accuracy: `${(metrics.overall_accuracy * 100).toFixed(1)}%`,
      avg_processing_time: `${metrics.avg_processing_time_ms.toFixed(0)}ms`,
      p95_processing_time: `${metrics.p95_processing_time_ms.toFixed(0)}ms`,
      top_errors: Object.entries(metrics.error_counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([code, count]) => `${code}: ${count}`),
      confidence_calibration_error: metrics.confidence_calibration_error.toFixed(3),
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): string {
    return JSON.stringify(this.getMetrics(), null, 2)
  }

  /**
   * Reset metrics (for testing or periodic resets)
   */
  reset() {
    this.metrics = this.initializeMetrics()
    this.processingTimes = []
  }
}

// Global metrics collector instance
export const visionMetrics = new VisionMetricsCollector()
