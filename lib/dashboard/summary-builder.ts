// Dashboard Snapshot Summary Builder
// Deterministic helper functions for dashboard data display

export function makeDashboardSummary(keyFacts: any): string {
  const parts: string[] = []
  
  // Odometer reading
  if (Number.isFinite(keyFacts?.odometer_miles)) {
    parts.push(`Odometer ${keyFacts.odometer_miles.toLocaleString()} mi`)
  }
  
  // Fuel level in eighths
  if (Number.isFinite(keyFacts?.fuel_level_eighths)) {
    const fuelMap = ['Empty', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞', 'Full']
    const fuelLevel = fuelMap[keyFacts.fuel_level_eighths] || '?'
    parts.push(`Fuel ~${fuelLevel}`)
  }
  
  // Warning lights
  if (Array.isArray(keyFacts?.warning_lights) && keyFacts.warning_lights.length > 0) {
    const lightNames = keyFacts.warning_lights.map(niceLampName).join(', ')
    parts.push(`Lamps: ${lightNames}`)
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Dashboard snapshot captured'
}

export function niceLampName(lampId: string): string {
  const lampMap: Record<string, string> = {
    check_engine: 'Check engine',
    oil_pressure: 'Oil',
    tpms: 'TPMS',
    battery: 'Battery',
    abs: 'ABS',
    airbag: 'Airbag',
    brake: 'Brake',
    coolant_temp: 'Coolant',
    other: 'Other'
  }
  
  return lampMap[lampId] || lampId
}

// Fuel level helpers
export function fuelEighthsToFraction(eighths: number | null): string {
  if (!Number.isFinite(eighths)) return 'Unknown'
  
  const fractions = ['Empty', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞', 'Full']
  return fractions[eighths as number] || 'Unknown'
}

export function fuelEighthsToPercent(eighths: number | null): number | null {
  if (!Number.isFinite(eighths)) return null
  return Math.round(((eighths as number) / 8) * 100)
}

// Validation helpers
export function shouldShowNeedsReview(validation: any): boolean {
  return validation?.rollup === 'needs_review'
}

export function getNeedsReviewReason(validation: any): string {
  if (!shouldShowNeedsReview(validation)) return ''
  
  const reasons = []
  if (validation.odometer_conf < 0.8) reasons.push('odometer unclear')
  if (validation.fuel_conf < 0.7) reasons.push('fuel unclear')
  if (validation.lights_conf < 0.75) reasons.push('lights unclear')
  
  return reasons.length > 0 ? reasons.join(', ') : 'needs review'
}
