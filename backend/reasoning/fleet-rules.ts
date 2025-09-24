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
  
  // Get vehicle baseline for comparison (from vehicles table)
  const baselineMpg = 12.5 // This should come from vehicle.baseline_fuel_mpg
  
  // Rule 1: Fuel Efficiency Decline (CRITICAL for smartphone demo)
  if (metrics.fuel_efficiency_mpg && baselineMpg) {
    const mpgDrop = baselineMpg - metrics.fuel_efficiency_mpg
    const percentDrop = (mpgDrop / baselineMpg) * 100
    
    if (percentDrop >= 15) {
      results.push({
        type: 'fuel_efficiency',
        severity: percentDrop >= 25 ? 'crit' : 'warn',
        hit: true,
        reason: `Fuel efficiency down ${percentDrop.toFixed(1)}% from baseline - significant decline detected`,
        evidence: {
          metric: 'fuel_efficiency_mpg',
          value: metrics.fuel_efficiency_mpg,
          threshold: baselineMpg * 0.85, // 15% drop threshold
          period: 'recent'
        }
      })
    }
  }
  
  // Rule 2: Maintenance Overdue (HIGH IMPACT)
  if (metrics.last_service_date) {
    const daysSinceService = Math.floor(
      (Date.now() - new Date(metrics.last_service_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceService >= 90) {
      results.push({
        type: 'maintenance_overdue',
        severity: daysSinceService >= 120 ? 'crit' : 'warn',
        hit: true,
        reason: `Maintenance overdue by ${daysSinceService} days - service interval exceeded`,
        evidence: {
          metric: 'days_since_service',
          value: daysSinceService,
          threshold: 90,
          period: 'current'
        }
      })
    }
  }
  
  // Rule 3: Harsh Events Pattern (BEHAVIOR INDICATOR)
  if (metrics.harsh_events && metrics.harsh_events >= 3) {
    results.push({
      type: 'harsh_events',
      severity: metrics.harsh_events >= 5 ? 'crit' : 'warn',
      hit: true,
      reason: `${metrics.harsh_events} harsh braking events - indicates brake wear and driving patterns`,
      evidence: {
        metric: 'harsh_events',
        value: metrics.harsh_events,
        threshold: 3,
        period: 'recent'
      }
    })
  }
  
  // Rule 4: Low Fuel Efficiency Absolute (BASELINE CHECK)
  if (metrics.fuel_efficiency_mpg && metrics.fuel_efficiency_mpg < 8) {
    results.push({
      type: 'fuel_efficiency',
      severity: 'warn',
      hit: true,
      reason: `Fuel efficiency ${metrics.fuel_efficiency_mpg} MPG below acceptable range`,
      evidence: {
        metric: 'fuel_efficiency_mpg',
        value: metrics.fuel_efficiency_mpg,
        threshold: 8,
        period: 'current'
      }
    })
  }
  
  // Rule 5: Data Quality Warning (SMARTPHONE SPECIFIC)
  if (metrics.data_completeness_pct < 60) {
    results.push({
      type: 'maintenance_overdue', // Use existing type
      severity: 'info',
      hit: true,
      reason: `Limited data available - add more photos for better insights`,
      evidence: {
        metric: 'data_completeness_pct',
        value: metrics.data_completeness_pct,
        threshold: 60,
        period: 'current'
      }
    })
  }
  
  // If no critical rules hit but we have some data, provide positive feedback
  if (results.length === 0 && metrics.data_completeness_pct >= 60) {
    results.push({
      type: 'fuel_efficiency',
      severity: 'info',
      hit: false,
      reason: 'Vehicle operating within normal parameters - no issues detected',
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
