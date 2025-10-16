import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/vehicles/[vehicleId]/insights
 * Get comprehensive intelligence and insights for a vehicle
 * 
 * ELITE-TIER: Predictive analytics and actionable intelligence
 * - Fuel economy trends
 * - Maintenance predictions
 * - Cost optimization suggestions
 * - Anomaly detection
 * - Performance analysis
 * - Actionable recommendations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Fetch all events for analysis
    const { data: events, error: eventsError } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: true })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle insights' },
        { status: 500 }
      )
    }

    const allEvents = events || []

    // ELITE: Generate comprehensive insights
    const insights = {
      fuel_economy: generateFuelEconomyInsights(allEvents),
      maintenance: generateMaintenanceInsights(allEvents, vehicle),
      cost_optimization: generateCostInsights(allEvents),
      anomalies: detectAnomalies(allEvents),
      performance: analyzePerformance(allEvents),
      recommendations: generateRecommendations(allEvents, vehicle)
    }

    // Calculate health score
    const healthScore = calculateVehicleHealth(allEvents, vehicle)

    return NextResponse.json({
      data: {
        vehicle: {
          id: vehicle.id,
          name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        },
        health_score: healthScore,
        insights,
        summary: {
          total_events: allEvents.length,
          total_spent: allEvents.reduce((sum, e) => sum + (e.total_amount || 0), 0),
          date_range: {
            first: allEvents[0]?.date,
            last: allEvents[allEvents.length - 1]?.date
          }
        }
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ELITE: Fuel Economy Insights
function generateFuelEconomyInsights(events: any[]): any {
  const fuelEvents = events.filter(e => e.type === 'fuel' && e.gallons && e.miles)

  if (fuelEvents.length < 2) {
    return {
      status: 'insufficient_data',
      message: 'Need at least 2 fuel events to calculate MPG',
      mpg_trend: null,
      avg_mpg: null,
      best_mpg: null,
      worst_mpg: null
    }
  }

  const mpgData: number[] = []
  
  for (let i = 1; i < fuelEvents.length; i++) {
    const current = fuelEvents[i]
    const previous = fuelEvents[i - 1]
    
    const milesDriven = current.miles - previous.miles
    const gallonsUsed = previous.gallons // Gallons from previous fill-up
    
    if (milesDriven > 0 && gallonsUsed > 0) {
      const mpg = milesDriven / gallonsUsed
      if (mpg > 0 && mpg < 100) { // Sanity check
        mpgData.push(mpg)
      }
    }
  }

  if (mpgData.length === 0) {
    return {
      status: 'calculation_error',
      message: 'Unable to calculate MPG from available data'
    }
  }

  const avgMpg = mpgData.reduce((sum, mpg) => sum + mpg, 0) / mpgData.length
  const bestMpg = Math.max(...mpgData)
  const worstMpg = Math.min(...mpgData)

  // Calculate trend
  const recentMpg = mpgData.slice(-3).reduce((sum, mpg) => sum + mpg, 0) / Math.min(3, mpgData.length)
  const olderMpg = mpgData.slice(0, 3).reduce((sum, mpg) => sum + mpg, 0) / Math.min(3, mpgData.length)
  const trendPercent = ((recentMpg - olderMpg) / olderMpg) * 100

  let trend = 'stable'
  if (trendPercent > 5) trend = 'improving'
  else if (trendPercent < -5) trend = 'declining'

  return {
    status: 'available',
    avg_mpg: Math.round(avgMpg * 10) / 10,
    best_mpg: Math.round(bestMpg * 10) / 10,
    worst_mpg: Math.round(worstMpg * 10) / 10,
    recent_mpg: Math.round(recentMpg * 10) / 10,
    mpg_trend: trend,
    trend_percent: Math.round(trendPercent * 10) / 10,
    total_calculations: mpgData.length,
    insight: trend === 'improving' 
      ? `Fuel economy is improving (+${Math.round(trendPercent)}%)`
      : trend === 'declining'
      ? `Fuel economy is declining (${Math.round(trendPercent)}%)`
      : 'Fuel economy is stable'
  }
}

// ELITE: Maintenance Insights & Predictions
function generateMaintenanceInsights(events: any[], vehicle: any): any {
  const maintenanceEvents = events.filter(e => e.type === 'maintenance')
  const now = new Date()

  // Get current mileage
  const eventsWithMiles = events.filter(e => e.miles).sort((a, b) => b.miles - a.miles)
  const currentMiles = eventsWithMiles[0]?.miles || 0

  // Common maintenance intervals
  const maintenanceSchedule = [
    {
      type: 'oil_change',
      interval_miles: 5000,
      interval_days: 180,
      keywords: ['oil', 'oil change', 'lube']
    },
    {
      type: 'tire_rotation',
      interval_miles: 7500,
      interval_days: 365,
      keywords: ['tire', 'rotation', 'tires']
    },
    {
      type: 'air_filter',
      interval_miles: 15000,
      interval_days: 365,
      keywords: ['air filter', 'filter']
    },
    {
      type: 'inspection',
      interval_miles: 12000,
      interval_days: 365,
      keywords: ['inspection', 'state inspection']
    }
  ]

  const predictions: any[] = []

  maintenanceSchedule.forEach(schedule => {
    // Find last maintenance of this type
    const lastMaintenance = maintenanceEvents
      .filter(e => {
        const notes = (e.notes || '').toLowerCase()
        return schedule.keywords.some(keyword => notes.includes(keyword))
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    if (lastMaintenance) {
      const daysSince = Math.floor((now.getTime() - new Date(lastMaintenance.date).getTime()) / (1000 * 60 * 60 * 24))
      const milesSince = currentMiles - (lastMaintenance.miles || 0)

      const daysUntilDue = schedule.interval_days - daysSince
      const milesUntilDue = schedule.interval_miles - milesSince

      const isDue = daysUntilDue <= 0 || milesUntilDue <= 0
      const isUpcoming = daysUntilDue <= 30 || milesUntilDue <= 500

      predictions.push({
        type: schedule.type,
        last_performed: lastMaintenance.date,
        miles_since: milesSince,
        days_since: daysSince,
        miles_until_due: Math.max(0, milesUntilDue),
        days_until_due: Math.max(0, daysUntilDue),
        status: isDue ? 'overdue' : isUpcoming ? 'upcoming' : 'ok',
        priority: isDue ? 'high' : isUpcoming ? 'medium' : 'low'
      })
    } else {
      // Never performed - suggest based on mileage
      predictions.push({
        type: schedule.type,
        last_performed: null,
        status: 'unknown',
        priority: 'medium',
        recommendation: `No ${schedule.type.replace('_', ' ')} record found. Consider scheduling soon.`
      })
    }
  })

  return {
    total_maintenance_events: maintenanceEvents.length,
    predictions: predictions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, unknown: 3 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    }),
    overdue_count: predictions.filter(p => p.status === 'overdue').length,
    upcoming_count: predictions.filter(p => p.status === 'upcoming').length
  }
}

// ELITE: Cost Optimization Insights
function generateCostInsights(events: any[]): any {
  const fuelEvents = events.filter(e => e.type === 'fuel' && e.total_amount)
  
  if (fuelEvents.length === 0) {
    return { status: 'no_data' }
  }

  // Analyze price per gallon trends
  const pricesPerGallon = fuelEvents
    .filter(e => e.gallons && e.total_amount)
    .map(e => ({
      date: e.date,
      price: e.total_amount / e.gallons,
      station: e.display_vendor || e.vendor
    }))

  if (pricesPerGallon.length === 0) {
    return { status: 'insufficient_data' }
  }

  const avgPrice = pricesPerGallon.reduce((sum, p) => sum + p.price, 0) / pricesPerGallon.length
  const minPrice = Math.min(...pricesPerGallon.map(p => p.price))
  const maxPrice = Math.max(...pricesPerGallon.map(p => p.price))

  // Find best/worst stations
  const stationPrices = new Map()
  pricesPerGallon.forEach(p => {
    if (!p.station) return
    if (!stationPrices.has(p.station)) {
      stationPrices.set(p.station, [])
    }
    stationPrices.get(p.station).push(p.price)
  })

  const stationAvgs = Array.from(stationPrices.entries())
    .map(([station, prices]) => ({
      station,
      avg_price: prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length,
      visit_count: prices.length
    }))
    .filter(s => s.visit_count >= 2) // Only stations visited multiple times
    .sort((a, b) => a.avg_price - b.avg_price)

  const bestStation = stationAvgs[0]
  const worstStation = stationAvgs[stationAvgs.length - 1]

  // Calculate potential savings
  let potentialSavings = 0
  if (bestStation && worstStation) {
    const priceDiff = worstStation.avg_price - bestStation.avg_price
    const recentGallons = fuelEvents.slice(-10).reduce((sum, e) => sum + (e.gallons || 0), 0)
    potentialSavings = priceDiff * recentGallons
  }

  return {
    status: 'available',
    avg_price_per_gallon: Math.round(avgPrice * 100) / 100,
    min_price: Math.round(minPrice * 100) / 100,
    max_price: Math.round(maxPrice * 100) / 100,
    price_variance: Math.round((maxPrice - minPrice) * 100) / 100,
    best_station: bestStation,
    worst_station: worstStation,
    potential_monthly_savings: Math.round(potentialSavings * 100) / 100,
    recommendation: bestStation 
      ? `Fill up at ${bestStation.station} to save ~$${Math.round(potentialSavings)}/month`
      : 'Visit different stations to find the best prices'
  }
}

// ELITE: Anomaly Detection
function detectAnomalies(events: any[]): any[] {
  const anomalies: any[] = []

  // Check for unusually high costs
  const costs = events.filter(e => e.total_amount).map(e => e.total_amount)
  if (costs.length > 0) {
    const avgCost = costs.reduce((sum, c) => sum + c, 0) / costs.length
    const stdDev = Math.sqrt(costs.reduce((sum, c) => sum + Math.pow(c - avgCost, 2), 0) / costs.length)
    
    events.forEach(e => {
      if (e.total_amount > avgCost + (2 * stdDev)) {
        anomalies.push({
          type: 'high_cost',
          event_id: e.id,
          date: e.date,
          amount: e.total_amount,
          avg_amount: Math.round(avgCost),
          severity: 'medium',
          message: `Unusually high cost: $${e.total_amount} (avg: $${Math.round(avgCost)})`
        })
      }
    })
  }

  // Check for frequent maintenance (potential issues)
  const maintenanceEvents = events.filter(e => e.type === 'maintenance')
  const recentMaintenance = maintenanceEvents.filter(e => {
    const daysSince = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 30
  })

  if (recentMaintenance.length >= 3) {
    anomalies.push({
      type: 'frequent_maintenance',
      count: recentMaintenance.length,
      severity: 'high',
      message: `${recentMaintenance.length} maintenance events in the last 30 days - potential issue`
    })
  }

  return anomalies
}

// ELITE: Performance Analysis
function analyzePerformance(events: any[]): any {
  const last30Days = events.filter(e => {
    const daysSince = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 30
  })

  const last90Days = events.filter(e => {
    const daysSince = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 90
  })

  return {
    activity: {
      last_30_days: last30Days.length,
      last_90_days: last90Days.length,
      trend: last30Days.length > (last90Days.length / 3) ? 'active' : 'low'
    },
    spending: {
      last_30_days: Math.round(last30Days.reduce((sum, e) => sum + (e.total_amount || 0), 0)),
      last_90_days: Math.round(last90Days.reduce((sum, e) => sum + (e.total_amount || 0), 0))
    }
  }
}

// ELITE: Actionable Recommendations
function generateRecommendations(events: any[], vehicle: any): string[] {
  const recommendations: string[] = []
  
  // Fuel economy recommendation
  const fuelEvents = events.filter(e => e.type === 'fuel')
  if (fuelEvents.length >= 5) {
    recommendations.push('Track your fuel economy consistently to identify trends')
  }

  // Maintenance recommendation
  const maintenanceEvents = events.filter(e => e.type === 'maintenance')
  if (maintenanceEvents.length === 0) {
    recommendations.push('Start logging maintenance to track vehicle health')
  }

  // Cost tracking
  const recentEvents = events.filter(e => {
    const daysSince = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 30
  })
  
  if (recentEvents.length === 0) {
    recommendations.push('Log events regularly to get better insights')
  }

  return recommendations
}

// ELITE: Vehicle Health Score (0-100)
function calculateVehicleHealth(events: any[], vehicle: any): number {
  let score = 100

  // Deduct for overdue maintenance
  const maintenanceEvents = events.filter(e => e.type === 'maintenance')
  if (maintenanceEvents.length === 0) {
    score -= 20
  }

  // Deduct for declining fuel economy
  const fuelInsights = generateFuelEconomyInsights(events)
  if (fuelInsights.mpg_trend === 'declining') {
    score -= 15
  }

  // Deduct for frequent issues
  const recentMaintenance = events.filter(e => {
    const daysSince = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 60 && e.type === 'maintenance'
  })
  
  if (recentMaintenance.length >= 4) {
    score -= 10
  }

  return Math.max(0, Math.min(100, score))
}
