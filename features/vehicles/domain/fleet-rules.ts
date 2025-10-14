// MotoMindAI: Fleet Rules Engine
// Deterministic rule evaluation for vehicle metrics

export interface RuleResult {
  rule: string
  type: string
  triggered: boolean
  hit: boolean
  severity: 'info' | 'warning' | 'critical'
  message: string
  reason: string
  evidence: {
    metric: string
    value: any
    threshold?: any
    period?: string
    sourceIds: number[]
  }
}

export interface VehicleMetrics {
  vehicle_id: string
  brake_wear_pct?: number
  fuel_efficiency_mpg?: number
  harsh_events?: number
  idle_minutes?: number
  miles_driven?: number
  data_completeness_pct: number
  source_latency_sec: number
  metric_date: Date
  last_service_date?: Date
}

export function evaluateRules(metrics: VehicleMetrics): RuleResult[] {
  const results: RuleResult[] = []
  
  // Get vehicle baseline for comparison (from vehicles table)
  const baselineMpg = 12.5 // This should come from vehicle.baseline_fuel_mpg
  
  // Rule 1: Fuel Efficiency Decline (CRITICAL for smartphone demo)
  if (metrics.fuel_efficiency_mpg && baselineMpg) {
    const mpgDrop = baselineMpg - metrics.fuel_efficiency_mpg
    const percentDrop = (mpgDrop / baselineMpg) * 100
    
    if (percentDrop >= 15) {
      results.push({
        rule: 'fuel_efficiency_decline',
        type: 'fuel_efficiency',
        triggered: true,
        hit: true,
        severity: percentDrop >= 25 ? 'critical' : 'warning',
        message: `Fuel efficiency down ${percentDrop.toFixed(1)}% from baseline`,
        reason: `Fuel efficiency down ${percentDrop.toFixed(1)}% from baseline - significant decline detected`,
        evidence: {
          metric: 'fuel_efficiency_mpg',
          value: metrics.fuel_efficiency_mpg,
          threshold: baselineMpg,
          period: 'current',
          sourceIds: []
        }
      })
    }
  }
  
  // Rule 2: Brake Maintenance Due
  if (metrics.brake_wear_pct && metrics.brake_wear_pct >= 80) {
    results.push({
      rule: 'brake_maintenance_due',
      type: 'brake_maintenance',
      triggered: true,
      hit: true,
      severity: metrics.brake_wear_pct >= 90 ? 'critical' : 'warning',
      message: `Brake wear at ${metrics.brake_wear_pct}%`,
      reason: `Brake wear at ${metrics.brake_wear_pct}% - maintenance required soon`,
      evidence: {
        metric: 'brake_wear_pct',
        value: metrics.brake_wear_pct,
        threshold: 80,
        period: 'current',
        sourceIds: []
      }
    })
  }
  
  // Rule 3: Service Overdue
  if (metrics.last_service_date) {
    const daysSinceService = Math.floor(
      (Date.now() - new Date(metrics.last_service_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceService > 90) {
      results.push({
        rule: 'service_overdue',
        type: 'service_overdue',
        triggered: true,
        hit: true,
        severity: daysSinceService > 180 ? 'critical' : 'warning',
        message: `${daysSinceService} days since last service`,
        reason: `${daysSinceService} days since last service - maintenance overdue`,
        evidence: {
          metric: 'days_since_service',
          value: daysSinceService.toString(),
          period: 'current',
          sourceIds: []
        }
      })
    }
  }
  
  // Rule 4: Harsh Events Pattern
  if (metrics.harsh_events && metrics.harsh_events >= 5) {
    results.push({
      rule: 'harsh_driving_events',
      type: 'harsh_driving',
      triggered: true,
      hit: true,
      severity: metrics.harsh_events >= 10 ? 'critical' : 'warning',
      message: `${metrics.harsh_events} harsh events detected`,
      reason: `${metrics.harsh_events} harsh events detected - indicates aggressive driving patterns`,
      evidence: {
        metric: 'harsh_events',
        value: metrics.harsh_events,
        threshold: 5,
        period: 'daily',
        sourceIds: []
      }
    })
  }
  
  // Rule 5: Excessive Idling
  if (metrics.idle_minutes && metrics.idle_minutes >= 60) {
    results.push({
      rule: 'excessive_idling',
      type: 'excessive_idling',
      triggered: true,
      hit: true,
      severity: 'warning',
      message: `${metrics.idle_minutes} minutes of idling detected`,
      reason: `${metrics.idle_minutes} minutes of idling - wastes fuel and increases emissions`,
      evidence: {
        metric: 'idle_minutes',
        value: metrics.idle_minutes,
        threshold: 60,
        period: 'daily',
        sourceIds: []
      }
    })
  }
  
  // Rule 6: Data Quality Warning (SMARTPHONE SPECIFIC)
  if (metrics.data_completeness_pct < 60) {
    results.push({
      rule: 'data_quality_warning',
      type: 'data_quality',
      triggered: true,
      hit: true,
      severity: 'info',
      message: 'Limited data available',
      reason: `Limited data available - add more photos for better insights`,
      evidence: {
        metric: 'data_completeness_pct',
        value: metrics.data_completeness_pct,
        threshold: 60,
        period: 'current',
        sourceIds: []
      }
    })
  }
  
  // If no critical rules hit but we have some data, provide positive feedback
  if (results.length === 0 && metrics.data_completeness_pct >= 60) {
    results.push({
      rule: 'vehicle_healthy',
      type: 'fuel_efficiency',
      triggered: false,
      hit: false,
      severity: 'info',
      message: 'Vehicle operating normally',
      reason: 'Vehicle operating within normal parameters - no issues detected',
      evidence: {
        metric: 'overall_status',
        value: 'healthy',
        period: 'current',
        sourceIds: []
      }
    })
  }
  
  return results
}

// Helper to get the most severe rule result
export function getMostSevereRule(results: RuleResult[]): RuleResult {
  const severityOrder = { critical: 3, warning: 2, info: 1 }
  
  return results.reduce((most, current) => {
    const currentSeverity = severityOrder[current.severity]
    const mostSeverity = severityOrder[most.severity]
    
    return currentSeverity > mostSeverity ? current : most
  })
}

// Helper to categorize vehicle status based on rules
export function getVehicleStatus(results: RuleResult[]): 'healthy' | 'warning' | 'flagged' {
  const hasCritical = results.some(r => r.severity === 'critical' && r.hit)
  const hasWarning = results.some(r => r.severity === 'warning' && r.hit)
  
  if (hasCritical) return 'flagged'
  if (hasWarning) return 'warning'
  return 'healthy'
}
