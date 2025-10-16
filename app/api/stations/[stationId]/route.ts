import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/stations/[stationId]
 * Get detailed station information with rich context
 * 
 * ELITE-TIER: Complete station intelligence
 * - All fuel-ups at this station
 * - Spending statistics
 * - Price trends
 * - Visit patterns
 * - Actionable insights
 */
export async function GET(
  request: NextRequest,
  { params }): { params: { stationId: string } }
) {
  const { stationId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Get tenant_id from auth context
    const tenantId = request.headers.get('x-tenant-id')

    // ELITE: Parse station ID (format: vendor_lat_lng)
    const [vendor, lat, lng] = stationId.split('_')

    if (!vendor) {
      return NextResponse.json(
        { error: 'Invalid station ID' },
        { status: 400 }
      )
    }

    // Fetch all events at this station
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
      .eq('type', 'fuel')
      .or(`vendor.ilike.%${decodeURIComponent(vendor)}%,display_vendor.ilike.%${decodeURIComponent(vendor)}%`)
      .order('date', { ascending: false })

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    // If coordinates provided, filter by location
    if (lat && lng) {
      const targetLat = parseFloat(lat)
      const targetLng = parseFloat(lng)
      
      query = query
        .gte('geocoded_lat', targetLat - 0.001)
        .lte('geocoded_lat', targetLat + 0.001)
        .gte('geocoded_lng', targetLng - 0.001)
        .lte('geocoded_lng', targetLng + 0.001)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching station events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch station details' },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      )
    }

    // ELITE: Calculate comprehensive statistics
    const stats = {
      total_visits: events.length,
      total_spent: events.reduce((sum, e) => sum + (e.total_amount || 0), 0),
      total_gallons: events.reduce((sum, e) => sum + (e.gallons || 0), 0),
      first_visit: events[events.length - 1]?.date,
      last_visit: events[0]?.date,
      vehicles_used: new Set(events.map(e => e.vehicle_id)).size
    }

    stats['avg_price_per_gallon'] = stats.total_gallons > 0 
      ? stats.total_spent / stats.total_gallons 
      : null

    stats['avg_spent_per_visit'] = stats.total_visits > 0
      ? stats.total_spent / stats.total_visits
      : null

    stats['avg_gallons_per_visit'] = stats.total_visits > 0
      ? stats.total_gallons / stats.total_visits
      : null

    // ELITE: Calculate visit frequency
    const visitFrequency = calculateVisitFrequency(events)
    
    // ELITE: Price trend analysis
    const priceTrend = analyzePriceTrend(events)
    
    // ELITE: Day of week analysis
    const dayPattern = analyzeDayPattern(events)

    // ELITE: Month pattern
    const monthPattern = analyzeMonthPattern(events)

    // ELITE: Vehicle breakdown
    const vehicleBreakdown = analyzeVehicleUsage(events)

    // Station details from most recent event
    const stationDetails = {
      id: stationId,
      name: events[0].display_vendor || events[0].vendor,
      address: events[0].geocoded_address || events[0].station_address,
      lat: events[0].geocoded_lat,
      lng: events[0].geocoded_lng
    }

    // ELITE: Generate actionable insights
    const insights = generateStationInsights(stats, priceTrend, visitFrequency, events)

    return NextResponse.json({
      data: {
        ...stationDetails,
        stats,
        events: events.slice(0, 20), // Most recent 20
        patterns: {
          visit_frequency: visitFrequency,
          price_trend: priceTrend,
          preferred_day: dayPattern,
          busiest_month: monthPattern,
          vehicle_usage: vehicleBreakdown
        },
        insights
      },
      meta: {
        total_events: events.length,
        events_shown: Math.min(events.length, 20),
        date_range: {
          first: stats.first_visit,
          last: stats.last_visit
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

// ELITE: Helper functions for deep analytics

function calculateVisitFrequency(events: any[]): { frequency: string; avg_days: number } {
  if (events.length < 2) {
    return { frequency: 'Insufficient data', avg_days: 0 }
  }

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let totalDays = 0
  for (let i = 1; i < sortedEvents.length; i++) {
    const days = (new Date(sortedEvents[i].date).getTime() - 
                  new Date(sortedEvents[i - 1].date).getTime()) / (1000 * 60 * 60 * 24)
    totalDays += days
  }

  const avgDays = totalDays / (sortedEvents.length - 1)

  let frequency = 'Occasional'
  if (avgDays < 7) frequency = 'Weekly'
  else if (avgDays < 14) frequency = 'Bi-weekly'
  else if (avgDays < 30) frequency = 'Monthly'

  return { frequency, avg_days: Math.round(avgDays) }
}

function analyzePriceTrend(events: any[]): any {
  const validEvents = events
    .filter(e => e.gallons && e.total_amount)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (validEvents.length < 2) {
    return { trend: 'Stable', change_percent: 0, prices: [] }
  }

  const prices = validEvents.map(e => ({
    date: e.date,
    price_per_gallon: e.total_amount / e.gallons
  }))

  const recentPrice = prices[prices.length - 1].price_per_gallon
  const oldPrice = prices[0].price_per_gallon
  const changePercent = ((recentPrice - oldPrice) / oldPrice) * 100

  let trend = 'Stable'
  if (changePercent > 5) trend = 'Increasing'
  else if (changePercent < -5) trend = 'Decreasing'

  return {
    trend,
    change_percent: Math.round(changePercent * 10) / 10,
    current_price: Math.round(recentPrice * 100) / 100,
    lowest_price: Math.min(...prices.map(p => p.price_per_gallon)),
    highest_price: Math.max(...prices.map(p => p.price_per_gallon)),
    prices: prices.slice(-10) // Last 10 prices
  }
}

function analyzeDayPattern(events: any[]): any {
  const dayCounts: Record<string, number> = {}
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  events.forEach(event => {
    const dayOfWeek = new Date(event.date).getDay()
    const dayName = days[dayOfWeek]
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1
  })

  const sortedDays = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([day, count]) => ({ day, count }))

  return {
    most_common: sortedDays[0]?.day || 'Unknown',
    breakdown: sortedDays
  }
}

function analyzeMonthPattern(events: any[]): any {
  const monthCounts: Record<string, number> = {}
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  events.forEach(event => {
    const month = new Date(event.date).getMonth()
    const monthName = months[month]
    monthCounts[monthName] = (monthCounts[monthName] || 0) + 1
  })

  const sortedMonths = Object.entries(monthCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([month, count]) => ({ month, count }))

  return {
    busiest: sortedMonths[0]?.month || 'Unknown',
    breakdown: sortedMonths
  }
}

function analyzeVehicleUsage(events: any[]): any[] {
  const vehicleMap = new Map()

  events.forEach(event => {
    if (!event.vehicles) return

    const vehicleId = event.vehicle_id
    if (!vehicleMap.has(vehicleId)) {
      vehicleMap.set(vehicleId, {
        vehicle: event.vehicles,
        visit_count: 0,
        total_spent: 0,
        total_gallons: 0
      })
    }

    const vehicle = vehicleMap.get(vehicleId)
    vehicle.visit_count++
    vehicle.total_spent += event.total_amount || 0
    vehicle.total_gallons += event.gallons || 0
  })

  return Array.from(vehicleMap.values())
    .sort((a, b) => b.visit_count - a.visit_count)
}

function generateStationInsights(stats: any, priceTrend: any, visitFrequency: any, events: any[]): string[] {
  const insights: string[] = []

  // Visit frequency insight
  if (visitFrequency.frequency === 'Weekly' || visitFrequency.frequency === 'Bi-weekly') {
    insights.push(`You visit this station ${visitFrequency.frequency.toLowerCase()} (every ${visitFrequency.avg_days} days)`)
  }

  // Price trend insight
  if (priceTrend.trend === 'Increasing') {
    insights.push(`Prices are increasing (+${priceTrend.change_percent}% from first visit)`)
  } else if (priceTrend.trend === 'Decreasing') {
    insights.push(`Prices are decreasing (${priceTrend.change_percent}% from first visit)`)
  }

  // Spending insight
  if (stats.total_visits >= 5) {
    insights.push(`You've spent $${Math.round(stats.total_spent)} here over ${stats.total_visits} visits`)
  }

  // Loyalty insight
  if (stats.total_visits >= 10) {
    insights.push(`This is one of your regular stations (${stats.total_visits} visits)`)
  }

  // Recent activity
  const daysSinceLastVisit = Math.floor(
    (Date.now() - new Date(stats.last_visit).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceLastVisit <= 7) {
    insights.push(`You were here ${daysSinceLastVisit} day${daysSinceLastVisit !== 1 ? 's' : ''} ago`)
  }

  return insights
}
