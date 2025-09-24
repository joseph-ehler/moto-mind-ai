// MotoMindAI: Fleet Rules Engine
// Deterministic rule evaluation for vehicle metrics

export interface RuleResult {
  type: 'brake_wear' | 'fuel_efficiency' | 'harsh_events' | 'idle_time' | 'maintenance_overdue'
  severity: 'info' | 'warn' | 'crit'
  hit: boolean
  reason: string
  evidence: {
    metric: string
    value: number | string
    threshold?: number | string
    period?: string
    sourceIds?: number[]
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
  
  // Critical brake wear rule
  if (metrics.brake_wear_pct && metrics.brake_wear_pct >= 85) {
    results.push({
      type: 'brake_wear',
      severity: 'crit',
      hit: true,
      reason: `Brake pad wear ${metrics.brake_wear_pct}% exceeds safety threshold`,
      evidence: {
        metric: 'brake_wear_pct',
        value: metrics.brake_wear_pct,
        threshold: 85,
        period: 'current'
      }
    })
  } else if (metrics.brake_wear_pct && metrics.brake_wear_pct >= 70) {
    results.push({
      type: 'brake_wear',
      severity: 'warn',
      hit: true,
      reason: `Brake pad wear ${metrics.brake_wear_pct}% approaching replacement threshold`,
      evidence: {
        metric: 'brake_wear_pct',
        value: metrics.brake_wear_pct,
        threshold: 70,
        period: 'current'
      }
    })
  }
  
  // Fuel efficiency rule
  if (metrics.fuel_efficiency_mpg && metrics.fuel_efficiency_mpg < 8) {
    results.push({
      type: 'fuel_efficiency',
      severity: 'warn',
      hit: true,
      reason: `Fuel efficiency ${metrics.fuel_efficiency_mpg} MPG is below fleet average`,
      evidence: {
        metric: 'fuel_efficiency_mpg',
        value: metrics.fuel_efficiency_mpg,
        threshold: 8,
        period: 'last_30_days'
      }
    })
  }
  
  // Harsh events rule
  if (metrics.harsh_events && metrics.harsh_events >= 3) {
    results.push({
      type: 'harsh_events',
      severity: metrics.harsh_events >= 5 ? 'crit' : 'warn',
      hit: true,
      reason: `${metrics.harsh_events} harsh events detected - driver behavior concern`,
      evidence: {
        metric: 'harsh_events',
        value: metrics.harsh_events,
        threshold: 3,
        period: 'last_7_days'
      }
    })
  }
  
  // Excessive idle time rule
  if (metrics.idle_minutes && metrics.idle_minutes >= 120) {
    results.push({
      type: 'idle_time',
      severity: 'warn',
      hit: true,
      reason: `Excessive idle time ${metrics.idle_minutes} minutes - fuel waste concern`,
      evidence: {
        metric: 'idle_minutes',
        value: metrics.idle_minutes,
        threshold: 120,
        period: 'daily'
      }
    })
  }
  
  // Maintenance overdue rule
  if (metrics.last_service_date) {
    const daysSinceService = Math.floor(
      (Date.now() - metrics.last_service_date.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceService >= 90) {
      results.push({
        type: 'maintenance_overdue',
        severity: daysSinceService >= 120 ? 'crit' : 'warn',
        hit: true,
        reason: `Maintenance overdue by ${daysSinceService} days`,
        evidence: {
          metric: 'days_since_service',
          value: daysSinceService,
          threshold: 90,
          period: 'current'
        }
      })
    }
  }
  
  // If no rules hit, add an info result
  if (results.length === 0) {
    results.push({
      type: 'brake_wear', // Default type for info
      severity: 'info',
      hit: false,
      reason: 'No critical issues detected - vehicle operating within normal parameters',
      evidence: {
        metric: 'overall_status',
        value: 'healthy',
        period: 'current'
      }
    })
  }
  
  return results
}

// Helper to get the most severe rule result
export function getMostSevereRule(results: RuleResult[]): RuleResult {
  const severityOrder = { crit: 3, warn: 2, info: 1 }
  
  return results.reduce((most, current) => {
    const currentSeverity = severityOrder[current.severity]
    const mostSeverity = severityOrder[most.severity]
    
    return currentSeverity > mostSeverity ? current : most
  })
}

// Helper to categorize vehicle status based on rules
export function getVehicleStatus(results: RuleResult[]): 'healthy' | 'warning' | 'flagged' {
  const hasCritical = results.some(r => r.severity === 'crit' && r.hit)
  const hasWarning = results.some(r => r.severity === 'warn' && r.hit)
  
  if (hasCritical) return 'flagged'
  if (hasWarning) return 'warning'
  return 'healthy'
}
