import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/costs/summary
 * Get comprehensive spending summary with analytics
 * 
 * ELITE-TIER: Multi-dimensional cost intelligence
 * - Total spending by period
 * - Category breakdown
 * - Trends and comparisons
 * - Spending predictions
 * - Actionable insights
 * 
 * Query params:
 * - period: 'week' | 'month' | 'quarter' | 'year' | 'all' (default: 'month')
 * - vehicles: comma-separated vehicle IDs or 'all' (default: 'all')
 * - start_date: custom start date
 * - end_date: custom end date
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const period = searchParams.get('period') || 'month'
  const vehiclesParam = searchParams.get('vehicles') || 'all'
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tenantId = request.headers.get('x-tenant-id')

    // Calculate date range based on period
    let calculatedStartDate = startDate
    let calculatedEndDate = endDate || new Date().toISOString().split('T')[0]

    if (!startDate) {
      const now = new Date()
      switch (period) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          calculatedStartDate = weekAgo.toISOString().split('T')[0]
          break
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          calculatedStartDate = monthAgo.toISOString().split('T')[0]
          break
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          calculatedStartDate = quarterAgo.toISOString().split('T')[0]
          break
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          calculatedStartDate = yearAgo.toISOString().split('T')[0]
          break
        case 'all':
          calculatedStartDate = '2000-01-01' // Far past date
          break
      }
    }

    // Build query
    let query = supabase
      .from('vehicle_events')
      .select(`
        *,
        vehicles:vehicle_id (
          id,
          make,
          model,
          year,
          nickname
        )
      `)
      .not('total_amount', 'is', null)
      .gte('date', calculatedStartDate)
      .lte('date', calculatedEndDate)
      .order('date', { ascending: true })

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    // Filter by vehicles if specified
    if (vehiclesParam !== 'all') {
      const vehicleIds = vehiclesParam.split(',')
      query = query.in('vehicle_id', vehicleIds)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching cost data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cost summary' },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        data: {
          period,
          total: 0,
          breakdown: {},
          trends: {},
          insights: []
        },
        meta: {
          date_range: { start: calculatedStartDate, end: calculatedEndDate },
          events_count: 0
        }
      })
    }

    // ELITE: Calculate total spending
    const total = events.reduce((sum, e) => sum + (e.total_amount || 0), 0)

    // ELITE: Category breakdown
    const breakdown = {
      fuel: 0,
      maintenance: 0,
      repairs: 0,
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

    // ELITE: Calculate trends
    const trends = calculateSpendingTrends(events, period)

    // ELITE: Vehicle breakdown
    const vehicleBreakdown = calculateVehicleBreakdown(events)

    // ELITE: Monthly breakdown (if period allows)
    const monthlyBreakdown = calculateMonthlyBreakdown(events)

    // ELITE: Generate predictions
    const predictions = generateSpendingPredictions(events, period)

    // ELITE: Generate actionable insights
    const insights = generateCostInsights(total, breakdown, trends, events, period)

    return NextResponse.json({
      data: {
        period,
        total: Math.round(total * 100) / 100,
        breakdown: {
          fuel: Math.round(breakdown.fuel * 100) / 100,
          maintenance: Math.round(breakdown.maintenance * 100) / 100,
          repairs: Math.round(breakdown.repairs * 100) / 100,
          inspection: Math.round(breakdown.inspection * 100) / 100,
          other: Math.round(breakdown.other * 100) / 100
        },
        by_vehicle: vehicleBreakdown,
        by_month: monthlyBreakdown,
        trends,
        predictions,
        insights
      },
      meta: {
        date_range: {
          start: calculatedStartDate,
          end: calculatedEndDate
        },
        events_count: events.length,
        vehicles_included: vehiclesParam,
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

// ELITE: Helper functions for intelligence

function calculateSpendingTrends(events: any[], period: string): any {
  if (events.length < 2) {
    return {
      daily_avg: 0,
      weekly_avg: 0,
      monthly_avg: 0,
      trend: 'Stable'
    }
  }

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const firstDate = new Date(sortedEvents[0].date)
  const lastDate = new Date(sortedEvents[sortedEvents.length - 1].date)
  const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))

  const total = events.reduce((sum, e) => sum + (e.total_amount || 0), 0)
  
  const dailyAvg = total / daysDiff
  const weeklyAvg = dailyAvg * 7
  const monthlyAvg = dailyAvg * 30

  // Calculate trend (first half vs second half)
  const midPoint = Math.floor(events.length / 2)
  const firstHalfTotal = sortedEvents.slice(0, midPoint).reduce((sum, e) => sum + (e.total_amount || 0), 0)
  const secondHalfTotal = sortedEvents.slice(midPoint).reduce((sum, e) => sum + (e.total_amount || 0), 0)
  
  const firstHalfAvg = firstHalfTotal / midPoint
  const secondHalfAvg = secondHalfTotal / (events.length - midPoint)
  
  const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

  let trend = 'Stable'
  if (changePercent > 10) trend = 'Increasing'
  else if (changePercent < -10) trend = 'Decreasing'

  return {
    daily_avg: Math.round(dailyAvg * 100) / 100,
    weekly_avg: Math.round(weeklyAvg * 100) / 100,
    monthly_avg: Math.round(monthlyAvg * 100) / 100,
    trend,
    change_percent: Math.round(changePercent * 10) / 10
  }
}

function calculateVehicleBreakdown(events: any[]): any[] {
  const vehicleMap = new Map()

  events.forEach(event => {
    if (!event.vehicles) return

    const vehicleId = event.vehicle_id
    if (!vehicleMap.has(vehicleId)) {
      vehicleMap.set(vehicleId, {
        vehicle: event.vehicles,
        total_spent: 0,
        event_count: 0,
        by_category: { fuel: 0, maintenance: 0, other: 0 }
      })
    }

    const vehicle = vehicleMap.get(vehicleId)
    vehicle.total_spent += event.total_amount || 0
    vehicle.event_count++
    
    if (event.type === 'fuel') vehicle.by_category.fuel += event.total_amount || 0
    else if (event.type === 'maintenance') vehicle.by_category.maintenance += event.total_amount || 0
    else vehicle.by_category.other += event.total_amount || 0
  })

  return Array.from(vehicleMap.values())
    .map(v => ({
      ...v,
      total_spent: Math.round(v.total_spent * 100) / 100,
      avg_per_event: Math.round((v.total_spent / v.event_count) * 100) / 100
    }))
    .sort((a, b) => b.total_spent - a.total_spent)
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
        other: 0,
        event_count: 0
      })
    }

    const month = monthMap.get(monthKey)
    month.total += event.total_amount || 0
    month.event_count++
    
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

function generateSpendingPredictions(events: any[], period: string): any {
  if (events.length < 3) {
    return {
      next_month: null,
      confidence: 'low',
      message: 'Insufficient data for predictions'
    }
  }

  const monthlyBreakdown = calculateMonthlyBreakdown(events)
  if (monthlyBreakdown.length === 0) {
    return { next_month: null, confidence: 'low' }
  }

  const avgMonthly = monthlyBreakdown.reduce((sum, m) => sum + m.total, 0) / monthlyBreakdown.length

  // Simple prediction: average of last 3 months
  const recent = monthlyBreakdown.slice(-3)
  const recentAvg = recent.reduce((sum, m) => sum + m.total, 0) / recent.length

  return {
    next_month: Math.round(recentAvg * 100) / 100,
    next_quarter: Math.round(recentAvg * 3 * 100) / 100,
    annual: Math.round(avgMonthly * 12 * 100) / 100,
    confidence: monthlyBreakdown.length >= 6 ? 'high' : monthlyBreakdown.length >= 3 ? 'medium' : 'low'
  }
}

function generateCostInsights(
  total: number,
  breakdown: any,
  trends: any,
  events: any[],
  period: string
): string[] {
  const insights: string[] = []

  // Total spending insight
  insights.push(`Total spending: $${Math.round(total)} this ${period}`)

  // Category insights
  const highestCategory = Object.entries(breakdown)
    .sort((a: any, b: any) => b[1] - a[1])[0]
  
  if (highestCategory && highestCategory[1] > 0) {
    const percent = Math.round((highestCategory[1] / total) * 100)
    insights.push(`${highestCategory[0]}: $${Math.round(highestCategory[1])} (${percent}% of total)`)
  }

  // Trend insights
  if (trends.trend === 'Increasing') {
    insights.push(`Spending is trending up (+${trends.change_percent}%)`)
  } else if (trends.trend === 'Decreasing') {
    insights.push(`Spending is trending down (${trends.change_percent}%)`)
  }

  // Average insights
  if (period === 'month' || period === 'week') {
    insights.push(`Daily average: $${trends.daily_avg}`)
  }

  return insights
}
