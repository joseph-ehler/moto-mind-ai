// Vehicle Health & Priority Computation
// Action-first approach: single health score + next action

export type DueItem = {
  kind: 'maintenance' | 'registration' | 'recall' | 'inspection'
  label: string
  etaMiles?: number
  etaDays?: number
  severity: 'overdue' | 'soon' | 'info'
}

export type VehicleAlerts = {
  overdueMaint?: boolean
  dueSoonMaint?: boolean
  recallOpen?: boolean
  regExpiresSoon?: boolean
  regExpired?: boolean
  researchMissing?: boolean
}

export type ResearchStatus = 'verified' | 'partial' | 'attention' | 'pending'

// Health scoring weights (adjust to taste)
const HEALTH_SIGNALS = {
  overdueMaint: { weight: 0.40, penalty: 1.00 },
  dueSoonMaint: { weight: 0.25, penalty: 0.50 },
  recallOpen: { weight: 0.30, penalty: 0.90 },
  regExpiresSoon: { weight: 0.25, penalty: 0.70 },
  regExpired: { weight: 0.35, penalty: 1.00 },
  researchMissing: { weight: 0.10, penalty: 0.30 },
} as const

export function computeHealthScore(alerts: VehicleAlerts): number {
  let score = 100
  
  for (const [key, active] of Object.entries(alerts)) {
    if (active && key in HEALTH_SIGNALS) {
      const signal = HEALTH_SIGNALS[key as keyof typeof HEALTH_SIGNALS]
      score -= Math.round(signal.weight * signal.penalty * 100)
    }
  }
  
  return Math.max(0, Math.min(100, score))
}

export function getHealthColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 85) return 'green'
  if (score >= 70) return 'yellow'
  return 'red'
}

export function getHealthEmoji(score: number): string {
  if (score >= 85) return '🟢'
  if (score >= 70) return '🟡'
  return '🔴'
}

// Pick the most important next action
export function pickNextAction(dueItems: DueItem[]): DueItem | null {
  if (dueItems.length === 0) return null
  
  const severityRank = { overdue: 0, soon: 1, info: 2 }
  
  return dueItems
    .sort((a, b) => {
      // Sort by severity first
      const severityDiff = severityRank[a.severity] - severityRank[b.severity]
      if (severityDiff !== 0) return severityDiff
      
      // Then by miles (closer first)
      const milesDiff = (a.etaMiles ?? Infinity) - (b.etaMiles ?? Infinity)
      if (milesDiff !== 0) return milesDiff
      
      // Then by days (sooner first)
      return (a.etaDays ?? Infinity) - (b.etaDays ?? Infinity)
    })[0]
}

// Generate priority reason text
export function getPriorityReason(alerts: VehicleAlerts, nextAction: DueItem | null): string {
  if (alerts.overdueMaint) return 'Maintenance overdue'
  if (alerts.recallOpen) return 'Open recall needs attention'
  if (alerts.regExpired) return 'Registration expired'
  if (nextAction) {
    if (nextAction.severity === 'overdue') {
      return `${nextAction.label} overdue`
    }
    if (nextAction.etaMiles && nextAction.etaMiles <= 1000) {
      return `${nextAction.label} due in ${nextAction.etaMiles} mi`
    }
    if (nextAction.etaDays && nextAction.etaDays <= 30) {
      return `${nextAction.label} due in ${nextAction.etaDays} days`
    }
  }
  return 'All up to date'
}

// Mock data generator for development
export function generateMockAlerts(vehicle: any): VehicleAlerts {
  // Generate realistic alerts based on vehicle age and mileage
  const currentYear = new Date().getFullYear()
  const vehicleAge = currentYear - (vehicle.enrichment?.year || currentYear)
  const estimatedMileage = vehicleAge * 12000 // Rough estimate
  
  return {
    overdueMaint: estimatedMileage > 60000 && Math.random() > 0.7,
    dueSoonMaint: Math.random() > 0.6,
    recallOpen: Math.random() > 0.8,
    regExpiresSoon: Math.random() > 0.9,
    regExpired: false,
    researchMissing: !vehicle.enrichment || Object.keys(vehicle.enrichment).length < 3,
  }
}

export function generateMockDueItems(alerts: VehicleAlerts): DueItem[] {
  const items: DueItem[] = []
  
  if (alerts.overdueMaint) {
    items.push({
      kind: 'maintenance',
      label: 'Oil change',
      severity: 'overdue',
      etaMiles: -200
    })
  }
  
  if (alerts.dueSoonMaint) {
    items.push({
      kind: 'maintenance',
      label: 'Tire rotation',
      severity: 'soon',
      etaMiles: 800
    })
  }
  
  if (alerts.recallOpen) {
    items.push({
      kind: 'recall',
      label: 'Airbag recall #23V-123',
      severity: 'soon',
      etaDays: 45
    })
  }
  
  if (alerts.regExpiresSoon) {
    items.push({
      kind: 'registration',
      label: 'Registration renewal',
      severity: 'soon',
      etaDays: 14
    })
  }
  
  return items
}
