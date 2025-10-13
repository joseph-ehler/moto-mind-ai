import React from 'react'

interface DataQualityPillProps {
  completeness: number // 0-100
  missingItems: string[]
  vehicleId: string
  onAddData?: (type: string) => void
}

export function DataQualityPill({ completeness, missingItems, vehicleId, onAddData }: DataQualityPillProps) {
  const getColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getIcon = (percentage: number) => {
    if (percentage >= 80) return '✅'
    if (percentage >= 50) return '⚠️'
    return '❌'
  }

  const nextAction = missingItems[0] // Show most important missing item

  return (
    <div className="flex items-center space-x-2">
      {/* Completeness Pill */}
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColor(completeness)}`}>
        <span className="mr-1">{getIcon(completeness)}</span>
        {completeness}% complete
      </div>

      {/* Next Action Chip */}
      {nextAction && completeness < 100 && (
        <button
          onClick={() => onAddData?.(nextAction)}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors"
        >
          <span className="mr-1">+</span>
          Add {nextAction}
        </button>
      )}
    </div>
  )
}

// Helper function to calculate data quality score
export function calculateDataQuality(vehicle: any, recentEvents: any[]): {
  completeness: number
  missingItems: string[]
} {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Check for recent data (last 30 days)
  const recentOdometer = recentEvents.find(e => 
    e.event_type === 'odometer_reading' && 
    new Date(e.created_at) > thirtyDaysAgo
  )
  
  const recentFuel = recentEvents.find(e => 
    e.event_type === 'fuel_purchase' && 
    new Date(e.created_at) > thirtyDaysAgo
  )
  
  const recentMaintenance = recentEvents.find(e => 
    e.event_type === 'maintenance' && 
    new Date(e.created_at) > thirtyDaysAgo
  )

  // Calculate completeness score
  let score = 0
  const missingItems: string[] = []

  // Core data (40% of score)
  if (recentOdometer) {
    score += 20
  } else {
    missingItems.push('odometer reading')
  }

  if (recentFuel) {
    score += 20
  } else {
    missingItems.push('fuel receipt')
  }

  // Vehicle profile completeness (30% of score)
  if (vehicle.make && vehicle.model && vehicle.vin) {
    score += 15
  } else {
    missingItems.push('vehicle details')
  }

  if (vehicle.baseline_fuel_mpg) {
    score += 15
  } else {
    missingItems.push('baseline MPG')
  }

  // Maintenance history (30% of score)
  if (recentMaintenance) {
    score += 30
  } else {
    missingItems.push('maintenance record')
  }

  return {
    completeness: Math.min(score, 100),
    missingItems: missingItems.slice(0, 3) // Show top 3 missing items
  }
}
