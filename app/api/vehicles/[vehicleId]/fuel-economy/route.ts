import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/vehicles/[vehicleId]/fuel-economy
 * Get detailed fuel economy analysis and trends
 * 
 * ELITE-TIER: MPG tracking and optimization
 * - MPG over time
 * - Trend analysis
 * - Best/worst performance
 * - Seasonal patterns
 * - Driving behavior insights
 * - EPA comparison (if available)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params
  const searchParams = request.nextUrl.searchParams
  
  const period = searchParams.get('period') || 'all' // week, month, quarter, year, all

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

    // Calculate date range
    let startDate = vehicle.created_at?.split('T')[0] || '2000-01-01'
    const endDate = new Date().toISOString().split('T')[0]

    if (period !== 'all') {
      const now = new Date()
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0]
          break
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0]
          break
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0]
          break
      }
    }

    // Fetch fuel events
    const { data: fuelEvents, error } = await supabase
      .from('vehicle_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('type', 'fuel')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching fuel events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch fuel economy data' },
        { status: 500 }
      )
    }

    if (!fuelEvents || fuelEvents.length < 2) {
      return NextResponse.json({
        data: {
          vehicle: {
            id: vehicle.id,
            name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          },
          status: 'insufficient_data',
          message: 'Need at least 2 fuel events to calculate MPG',
          mpg_history: [],
          statistics: null
        }
      })
    }

    // ELITE: Calculate MPG for each fill-up
    const mpgHistory: any[] = []

    for (let i = 1; i < fuelEvents.length; i++) {
      const current = fuelEvents[i]
      const previous = fuelEvents[i - 1]

      if (!current.miles || !previous.miles || !previous.gallons) continue

      const milesDriven = current.miles - previous.miles
      const gallonsUsed = previous.gallons

      if (milesDriven > 0 && gallonsUsed > 0 && milesDriven < 1000) { // Sanity check
        const mpg = milesDriven / gallonsUsed

        if (mpg > 0 && mpg < 100) { // Reasonable MPG range
          mpgHistory.push({
            date: previous.date,
            mpg: Math.round(mpg * 10) / 10,
            miles_driven: milesDriven,
            gallons_used: Math.round(gallonsUsed * 10) / 10,
            cost: previous.total_amount,
            cost_per_mile: previous.total_amount ? Math.round((previous.total_amount / milesDriven) * 100) / 100 : null,
            station: previous.display_vendor || previous.vendor
          })
        }
      }
    }

    if (mpgHistory.length === 0) {
      return NextResponse.json({
        data: {
          vehicle: {
            id: vehicle.id,
            name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          },
          status: 'calculation_error',
          message: 'Unable to calculate MPG from available data',
          mpg_history: [],
          statistics: null
        }
      })
    }

    // ELITE: Calculate statistics
    const mpgValues = mpgHistory.map(h => h.mpg)
    const avgMpg = mpgValues.reduce((sum, mpg) => sum + mpg, 0) / mpgValues.length
    const bestMpg = Math.max(...mpgValues)
    const worstMpg = Math.min(...mpgValues)
    const medianMpg = calculateMedian(mpgValues)

    // Standard deviation
    const variance = mpgValues.reduce((sum, mpg) => sum + Math.pow(mpg - avgMpg, 2), 0) / mpgValues.length
    const stdDev = Math.sqrt(variance)

    // Calculate trend
    const recentMpg = mpgHistory.slice(-5).map(h => h.mpg)
    const olderMpg = mpgHistory.slice(0, Math.min(5, mpgHistory.length - 5)).map(h => h.mpg)

    const recentAvg = recentMpg.reduce((sum, mpg) => sum + mpg, 0) / recentMpg.length
    const olderAvg = olderMpg.length > 0 
      ? olderMpg.reduce((sum, mpg) => sum + mpg, 0) / olderMpg.length 
      : recentAvg

    const trendPercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

    let trend = 'stable'
    if (trendPercent > 5) trend = 'improving'
    else if (trendPercent < -5) trend = 'declining'

    // Monthly breakdown
    const monthlyData = calculateMonthlyAverages(mpgHistory)

    // Seasonal patterns (if enough data)
    const seasonalPattern = calculateSeasonalPattern(mpgHistory)

    // Best/worst performers
    const bestFillup = mpgHistory.reduce((max, h) => h.mpg > max.mpg ? h : max, mpgHistory[0])
    const worstFillup = mpgHistory.reduce((min, h) => h.mpg < min.mpg ? h : min, mpgHistory[0])

    // ELITE: Generate insights
    const insights: string[] = []

    if (trend === 'improving') {
      insights.push(`Fuel economy is improving (+${Math.round(trendPercent)}% recently)`)
    } else if (trend === 'declining') {
      insights.push(`Fuel economy is declining (${Math.round(trendPercent)}% recently)`)
    } else {
      insights.push('Fuel economy is consistent')
    }

    if (stdDev > 5) {
      insights.push('High variability in fuel economy - consider consistent driving habits')
    }

    if (bestMpg - worstMpg > 15) {
      insights.push(`Wide MPG range (${Math.round(worstMpg)}-${Math.round(bestMpg)}) - driving conditions vary significantly`)
    }

    return NextResponse.json({
      data: {
        vehicle: {
          id: vehicle.id,
          name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        },
        status: 'available',
        statistics: {
          avg_mpg: Math.round(avgMpg * 10) / 10,
          median_mpg: Math.round(medianMpg * 10) / 10,
          best_mpg: Math.round(bestMpg * 10) / 10,
          worst_mpg: Math.round(worstMpg * 10) / 10,
          std_deviation: Math.round(stdDev * 10) / 10,
          trend,
          trend_percent: Math.round(trendPercent * 10) / 10,
          recent_avg: Math.round(recentAvg * 10) / 10,
          total_calculations: mpgHistory.length
        },
        mpg_history: mpgHistory,
        monthly_averages: monthlyData,
        seasonal_pattern: seasonalPattern,
        best_fillup: bestFillup,
        worst_fillup: worstFillup,
        insights
      },
      meta: {
        period,
        date_range: { start: startDate, end: endDate },
        total_fillups: mpgHistory.length
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

// Helper functions
function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function calculateMonthlyAverages(mpgHistory: any[]): any[] {
  const monthMap = new Map()

  mpgHistory.forEach(h => {
    const date = new Date(h.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { month: monthKey, mpg_values: [], total_miles: 0, total_gallons: 0 })
    }

    const month = monthMap.get(monthKey)
    month.mpg_values.push(h.mpg)
    month.total_miles += h.miles_driven
    month.total_gallons += h.gallons_used
  })

  return Array.from(monthMap.values())
    .map(m => ({
      month: m.month,
      avg_mpg: Math.round((m.mpg_values.reduce((sum: number, mpg: number) => sum + mpg, 0) / m.mpg_values.length) * 10) / 10,
      total_miles: m.total_miles,
      total_gallons: Math.round(m.total_gallons * 10) / 10,
      fillup_count: m.mpg_values.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function calculateSeasonalPattern(mpgHistory: any[]): any {
  if (mpgHistory.length < 12) {
    return { status: 'insufficient_data', message: 'Need at least 12 months of data' }
  }

  const seasons = {
    winter: [] as number[], // Dec, Jan, Feb
    spring: [] as number[], // Mar, Apr, May
    summer: [] as number[], // Jun, Jul, Aug
    fall: [] as number[]    // Sep, Oct, Nov
  }

  mpgHistory.forEach(h => {
    const month = new Date(h.date).getMonth()
    if (month === 11 || month === 0 || month === 1) seasons.winter.push(h.mpg)
    else if (month >= 2 && month <= 4) seasons.spring.push(h.mpg)
    else if (month >= 5 && month <= 7) seasons.summer.push(h.mpg)
    else seasons.fall.push(h.mpg)
  })

  const seasonalAvgs = {
    winter: seasons.winter.length > 0 
      ? Math.round((seasons.winter.reduce((sum, mpg) => sum + mpg, 0) / seasons.winter.length) * 10) / 10 
      : null,
    spring: seasons.spring.length > 0 
      ? Math.round((seasons.spring.reduce((sum, mpg) => sum + mpg, 0) / seasons.spring.length) * 10) / 10 
      : null,
    summer: seasons.summer.length > 0 
      ? Math.round((seasons.summer.reduce((sum, mpg) => sum + mpg, 0) / seasons.summer.length) * 10) / 10 
      : null,
    fall: seasons.fall.length > 0 
      ? Math.round((seasons.fall.reduce((sum, mpg) => sum + mpg, 0) / seasons.fall.length) * 10) / 10 
      : null
  }

  return {
    status: 'available',
    averages: seasonalAvgs,
    best_season: Object.entries(seasonalAvgs)
      .filter(([_, mpg]) => mpg !== null)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || null
  }
}
