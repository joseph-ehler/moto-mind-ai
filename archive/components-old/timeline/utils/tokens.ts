// Timeline Event Display Tokens
// Centralized color schemes, sizing, and spacing constants

// CONSTANTS
export const LABEL_SPACING = 'mb-2'

// COLOR SCHEMES
export function getFinancialColor(): string {
  return 'bg-green-100 text-green-800 border-green-200'
}

export function getMeasurementColor(): string {
  return 'bg-blue-100 text-blue-800 border-blue-200'
}

export function getIdColor(): string {
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getStatusColor(status?: string): string {
  if (!status) return 'bg-purple-100 text-purple-800 border-purple-200'
  
  const normalizedStatus = status.toLowerCase()
  
  // Positive statuses
  if (['pass', 'passed', 'success', 'approved', 'complete', 'good', 'normal'].includes(normalizedStatus)) {
    return getPositiveStatusColor()
  }
  
  // Warning statuses  
  if (['warning', 'caution', 'minor', 'medium'].includes(normalizedStatus)) {
    return getWarningStatusColor()
  }
  
  // Critical/negative statuses
  if (['fail', 'failed', 'error', 'critical', 'severe', 'major', 'emergency'].includes(normalizedStatus)) {
    return getCriticalStatusColor()
  }
  
  // Default purple for unknown statuses
  return 'bg-purple-100 text-purple-800 border-purple-200'
}

export function getQualityColor(): string {
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

export function getPositiveStatusColor(): string {
  return 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

export function getWarningStatusColor(): string {
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

export function getCriticalStatusColor(): string {
  return 'bg-red-100 text-red-800 border-red-200'
}

export function getNeutralStatusColor(): string {
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

// SIZING
export function getBlockSize(size: 'small' | 'medium' | 'large'): string {
  switch (size) {
    case 'small':
      return 'px-2 py-1 text-xs font-medium border'
    case 'medium':
      return 'px-3 py-1.5 text-sm font-semibold border'
    case 'large':
      return 'px-4 py-2 text-base font-bold border'
    default:
      return 'px-3 py-1.5 text-sm font-semibold border'
  }
}
