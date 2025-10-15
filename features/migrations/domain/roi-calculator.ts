/**
 * ROI Calculator Domain Logic
 * 
 * Pure functions for calculating return on investment metrics.
 * No dependencies, fully testable.
 */

export interface ROIInput {
  timeTraditional: number // minutes
  timeActual: number // minutes
  hourlyRate: number // dollars per hour
  aiCost: number // dollars
}

export interface ROIResult {
  timeSaved: number // minutes
  timeSavedHours: number // hours
  timeSavedPercent: number // percentage
  costTraditional: number // dollars
  costActual: number // dollars
  costSaved: number // dollars
  costSavedPercent: number // percentage
  timeROI: number // ratio (time saved / time spent)
  costROI: number // ratio (cost saved / ai cost)
  overallROI: number // ratio (total value / total cost)
}

/**
 * Calculate comprehensive ROI metrics
 */
export function calculateROI(input: ROIInput): ROIResult {
  const { timeTraditional, timeActual, hourlyRate, aiCost } = input
  
  // Time metrics
  const timeSaved = timeTraditional - timeActual
  const timeSavedHours = timeSaved / 60
  const timeSavedPercent = (timeSaved / timeTraditional) * 100
  
  // Cost metrics
  const costTraditional = (timeTraditional / 60) * hourlyRate
  const costActual = (timeActual / 60) * hourlyRate + aiCost
  const costSaved = costTraditional - costActual
  const costSavedPercent = (costSaved / costTraditional) * 100
  
  // ROI ratios
  const timeROI = timeSaved / timeActual
  const costROI = costSaved / aiCost
  const totalValue = costSaved + (timeSavedHours * hourlyRate) // Value of time + cost
  const totalCost = aiCost
  const overallROI = totalValue / totalCost
  
  return {
    timeSaved: Math.round(timeSaved * 10) / 10,
    timeSavedHours: Math.round(timeSavedHours * 10) / 10,
    timeSavedPercent: Math.round(timeSavedPercent * 10) / 10,
    costTraditional: Math.round(costTraditional * 100) / 100,
    costActual: Math.round(costActual * 100) / 100,
    costSaved: Math.round(costSaved * 100) / 100,
    costSavedPercent: Math.round(costSavedPercent * 10) / 10,
    timeROI: Math.round(timeROI * 10) / 10,
    costROI: Math.round(costROI),
    overallROI: Math.round(overallROI)
  }
}

/**
 * Format minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  
  if (hours === 0) {
    return `${mins} min`
  } else if (mins === 0) {
    return `${hours} hr`
  } else {
    return `${hours} hr ${mins} min`
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Format ROI ratio
 */
export function formatROI(roi: number): string {
  if (roi >= 1000) {
    return `${(roi / 1000).toFixed(1)}k:1`
  }
  return `${roi}:1`
}

/**
 * Calculate projected savings for remaining migrations
 */
export function projectSavings(
  avgTimeSaved: number,
  avgCostSaved: number,
  remainingMigrations: number
): {
  projectedTimeSaved: number // hours
  projectedCostSaved: number // dollars
  projectedValue: string
} {
  const totalTimeSaved = avgTimeSaved * remainingMigrations
  const totalCostSaved = avgCostSaved * remainingMigrations
  
  return {
    projectedTimeSaved: Math.round((totalTimeSaved / 60) * 10) / 10,
    projectedCostSaved: Math.round(totalCostSaved * 100) / 100,
    projectedValue: formatCurrency(totalCostSaved)
  }
}

/**
 * Determine ROI category for display
 */
export function getROICategory(roi: number): {
  category: 'excellent' | 'good' | 'moderate' | 'poor'
  color: string
  description: string
} {
  if (roi >= 10000) {
    return {
      category: 'excellent',
      color: 'emerald',
      description: 'Exceptional ROI'
    }
  } else if (roi >= 1000) {
    return {
      category: 'excellent',
      color: 'green',
      description: 'Excellent ROI'
    }
  } else if (roi >= 100) {
    return {
      category: 'good',
      color: 'blue',
      description: 'Good ROI'
    }
  } else if (roi >= 10) {
    return {
      category: 'moderate',
      color: 'yellow',
      description: 'Moderate ROI'
    }
  } else {
    return {
      category: 'poor',
      color: 'red',
      description: 'Low ROI'
    }
  }
}
