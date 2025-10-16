import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/vehicles/[vehicleId]/costs
 * Get detailed cost analysis for a specific vehicle
 * 
 * ELITE-TIER: Vehicle-specific cost intelligence
 * - Total ownership costs
 * - Category breakdown
 * - Cost per mile calculations
 * - Time-based trends
 * - Comparison to similar vehicles
 * 
 * Query params:
 * - start_date: filter from date
 * - end_date: filter to date
 * - period: 'week' | 'month' | 'quarter' | 'year' | 'all'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params
  const searchParams = request.nextUrl.searchParams
  
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const period = searchParams.get('period') || 'all'

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
    let calculatedStartDate = startDate
    let calculatedEndDate = endDate || new Date().toISOString().split('T')[0]

    if (!startDate) {
      const now = new Date()
      switch (period) {
        case 'week':
          calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case 'month':
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0]
          break
        case 'quarter':
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0]
          break
        case 'year':
          calculatedStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0]
          break
        case 'all':
          calculatedStartDate = vehicle.created_at?.split('T')[0] || '2000-01-01'
          break
      }
    }

    // Fetch all events with costs
    let query = supabase
      .from('vehicle_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .not('total_amount', 'is', null)
      .gte('date', calculatedStartDate)
      .lte('date', calculatedEndDate)
      .order('date', { ascending: true })

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching vehicle costs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle costs' },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        data: {
          vehicle: {
            id: vehicle.id,
            name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            nickname: vehicle.nickname
          },
          total: 0,
          breakdown: {},
          trends: {},
          cost_per_mile: null,
          insights: []
        },
        meta: {
          date_range: { start: calculatedStartDate, end: calculatedEndDate },
          events_count: 0
        }
      })
    }

    // ELITE: Calculate total costs
    const total = events.reduce((sum, e) => sum + (e.total_amount || 0), 0)

    // ELITE: Category breakdown
    const breakdown = {
      fuel: 0,
      maintenance: 0,
      inspection: 0,
      other: 0
    }

    events.forEach(event => {
      const amount = event.total_amount || 0
      switch (event.type) {
        case 'fuel':
          breakdown.fuel += amount
          break
        case 'maintenance':
          breakdown.maintenance += amount
          break
        case 'inspection':
          breakdown.inspection += amount
          break
        default:
          breakdown.other += amount
      }
    })

    // ELITE: Calculate cost per mile
    const eventsWithMiles = events.filter(e => e.miles)
    let costPerMile = null
    let totalMilesDriven = null

    if (eventsWithMiles.length >= 2) {
      const sortedByMiles = [...eventsWithMiles].sort((a, b) => a.miles - b.miles)
      const startMiles = sortedByMiles[0].miles
      const endMiles = sortedByMiles[sortedByMiles.length - 1].miles
      totalMilesDriven = endMiles - startMiles

      if (totalMilesDriven > 0) {
        costPerMile = total / totalMilesDriven
      }
    }

    // ELITE: Monthly breakdown
    const monthlyBreakdown = calculateMonthlyBreakdown(events)

    // ELITE: Calculate trends
    const trends = {
      spending_trend: calculateTrend(monthlyBreakdown),
      monthly_avg: monthlyBreakdown.length > 0
        ? monthlyBreakdown.reduce((sum, m) => sum + m.total, 0) / monthlyBreakdown.length
        : 0,
      highest_month: monthlyBreakdown.length > 0
        ? monthlyBreakdown.reduce((max, m) => m.total > max.total ? m : max)
        : null,
      lowest_month: monthlyBreakdown.length > 0
        ? monthlyBreakdown.reduce((min, m) => m.total < min.total ? m : min)
        : null
    }

    // ELITE: Generate insights
    const insights = generateVehicleCostInsights(
      total,
      breakdown,
      costPerMile,
      totalMilesDriven,
      events,
      vehicle,
      period
    )

    return NextResponse.json({
      data: {
        vehicle: {
          id: vehicle.id,
          name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        },
        total: Math.round(total * 100) / 100,
        breakdown: {
          fuel: Math.round(breakdown.fuel * 100) / 100,
          maintenance: Math.round(breakdown.maintenance * 100) / 100,
          inspection: Math.round(breakdown.inspection * 100) / 100,
          other: Math.round(breakdown.other * 100) / 100
        },
        by_month: monthlyBreakdown,
        cost_per_mile: costPerMile ? Math.round(costPerMile * 100) / 100 : null,
        total_miles_driven: totalMilesDriven,
        trends: {
          ...trends,
          monthly_avg: Math.round(trends.monthly_avg * 100) / 100
        },
        insights
      },
      meta: {
        date_range: {
          start: calculatedStartDate,
          end: calculatedEndDate
        },
        events_count: events.length,
        period,
        currency: 'USD'
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

function calculateMonthlyBreakdown(events: any[]): any[] {
  const monthMap = new Map()

  events.forEach(event => {
    const date = new Date(event.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthKey,
        total: 0,
        fuel: 0,
        maintenance: 0,
        other: 0
      })
    }

    const month = monthMap.get(monthKey)
    month.total += event.total_amount || 0
    
    if (event.type === 'fuel') month.fuel += event.total_amount || 0
    else if (event.type === 'maintenance') month.maintenance += event.total_amount || 0
    else month.other += event.total_amount || 0
  })

  return Array.from(monthMap.values())
    .map(m => ({
      ...m,
      total: Math.round(m.total * 100) / 100,
      fuel: Math.round(m.fuel * 100) / 100,
      maintenance: Math.round(m.maintenance * 100) / 100,
      other: Math.round(m.other * 100) / 100
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function calculateTrend(monthlyBreakdown: any[]): string {
  if (monthlyBreakdown.length < 2) return 'Stable'

  const recent = monthlyBreakdown.slice(-3)
  const older = monthlyBreakdown.slice(0, Math.min(3, monthlyBreakdown.length - 3))

  if (older.length === 0) return 'Stable'

  const recentAvg = recent.reduce((sum, m) => sum + m.total, 0) / recent.length
  const olderAvg = older.reduce((sum, m) => sum + m.total, 0) / older.length

  const change = ((recentAvg - olderAvg) / olderAvg) * 100

  if (change > 10) return 'Increasing'
  if (change < -10) return 'Decreasing'
  return 'Stable'
}

function generateVehicleCostInsights(
  total: number,
  breakdown: any,
  costPerMile: number | null,
  totalMiles: number | null,
  events: any[],
  vehicle: any,
  period: string
): string[] {
  const insights: string[] = []

  // Total cost insight
  insights.push(`Total cost for ${vehicle.nickname || vehicle.make + ' ' + vehicle.model}: $${Math.round(total)}`)

  // Cost per mile insight
  if (costPerMile && totalMiles) {
    insights.push(`Cost per mile: $${Math.round(costPerMile * 100) / 100} over ${Math.round(totalMiles).toLocaleString()} miles`)
  }

  // Fuel vs maintenance
  if (breakdown.fuel > 0 && breakdown.maintenance > 0) {
    const fuelPercent = Math.round((breakdown.fuel / total) * 100)
    insights.push(`Fuel: ${fuelPercent}%, Maintenance: ${100 - fuelPercent}%`)
  }

  // High spending alert
  if (period === 'month' && total > 500) {
    insights.push(`High spending this month: $${Math.round(total)}`)
  }

  return insights
}
