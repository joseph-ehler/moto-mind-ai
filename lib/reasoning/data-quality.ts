// MotoMindAI: Data Quality Assessment
// Evaluates completeness and provides actionable recommendations

export interface DataQualityReport {
  completeness: number // 0-100 percentage
  latency: number // seconds since last update
  missingMetrics: string[]
  recommendations: string[]
  confidence: 'high' | 'medium' | 'low'
  sensorStatus: Record<string, boolean>
  lastUpdated: Date
}

export interface VehicleMetrics {
  vehicle_id: string
  miles_driven?: number
  fuel_efficiency_mpg?: number
  last_service_date?: string
  harsh_events?: number
  idle_minutes?: number
  data_completeness_pct: number
  source_latency_sec: number
  sensor_presence?: Record<string, boolean>
  metric_date: Date
  created_at: Date
}

export function calculateDataQuality(metrics: VehicleMetrics): DataQualityReport {
  const now = new Date()
  const lastUpdated = new Date(metrics.created_at)
  const latency = Math.round((now.getTime() - lastUpdated.getTime()) / 1000)
  
  // Parse sensor presence
  const sensorStatus = typeof metrics.sensor_presence === 'string' 
    ? JSON.parse(metrics.sensor_presence)
    : metrics.sensor_presence || {}
  
  // Identify missing critical metrics
  const missingMetrics: string[] = []
  const recommendations: string[] = []
  
  // Check for odometer data
  if (!sensorStatus.odometer || !metrics.miles_driven) {
    missingMetrics.push('odometer_reading')
    recommendations.push('Take a photo of your odometer to track mileage')
  }
  
  // Check for fuel data
  if (!sensorStatus.fuel || !metrics.fuel_efficiency_mpg) {
    missingMetrics.push('fuel_purchase')
    recommendations.push('Add a fuel receipt to calculate MPG trends')
  }
  
  // Check for maintenance data
  if (!sensorStatus.maintenance || !metrics.last_service_date) {
    missingMetrics.push('maintenance_record')
    recommendations.push('Log your last service date to track maintenance intervals')
  }
  
  // Check data freshness
  const daysSinceUpdate = latency / (24 * 60 * 60)
  if (daysSinceUpdate > 7) {
    missingMetrics.push('recent_data')
    recommendations.push('Add recent odometer reading - data is over a week old')
  }
  
  // Calculate completeness score
  const completeness = metrics.data_completeness_pct || 0
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low'
  if (completeness >= 75 && latency < 7 * 24 * 60 * 60) { // 7 days
    confidence = 'high'
  } else if (completeness >= 50 && latency < 14 * 24 * 60 * 60) { // 14 days
    confidence = 'medium'
  } else {
    confidence = 'low'
  }
  
  // Add specific recommendations based on missing data
  if (completeness < 50) {
    recommendations.unshift('Add more data to improve explanation accuracy')
  }
  
  if (missingMetrics.length === 0 && completeness >= 75) {
    recommendations.push('Great! Your data is complete and up-to-date')
  }
  
  return {
    completeness,
    latency,
    missingMetrics,
    recommendations: recommendations.slice(0, 3), // Limit to top 3 recommendations
    confidence,
    sensorStatus,
    lastUpdated
  }
}

// Helper to generate user-friendly data quality messages
export function getDataQualityMessage(report: DataQualityReport): string {
  if (report.completeness >= 80) {
    return `Excellent data quality (${report.completeness}%) - explanations will be highly accurate`
  } else if (report.completeness >= 60) {
    return `Good data quality (${report.completeness}%) - explanations are reliable with some gaps`
  } else if (report.completeness >= 40) {
    return `Fair data quality (${report.completeness}%) - add more data for better insights`
  } else {
    return `Limited data quality (${report.completeness}%) - explanations may be incomplete`
  }
}

// Helper to get next best action for improving data quality
export function getNextBestAction(report: DataQualityReport): string | null {
  if (report.recommendations.length === 0) {
    return null
  }
  
  // Prioritize by impact
  const priorityOrder = [
    'Take a photo of your odometer',
    'Add a fuel receipt',
    'Log your last service date',
    'Add recent odometer reading'
  ]
  
  for (const priority of priorityOrder) {
    const match = report.recommendations.find(rec => rec.includes(priority.toLowerCase()))
    if (match) {
      return match
    }
  }
  
  return report.recommendations[0]
}

// Helper to determine if data is sufficient for reliable explanations
export function isSufficientForExplanation(report: DataQualityReport): boolean {
  return report.completeness >= 30 && report.latency < 30 * 24 * 60 * 60 // 30 days
}

// Helper to get data quality color for UI
export function getDataQualityColor(completeness: number): string {
  if (completeness >= 80) return 'success'
  if (completeness >= 60) return 'warning'
  return 'error'
}
