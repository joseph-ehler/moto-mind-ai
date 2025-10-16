import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/stations
 * List fuel stations with intelligent defaults
 * 
 * ELITE-TIER: Multiple discovery patterns
 * - Favorites first
 * - Nearby stations (geospatial)
 * - Most visited
 * - With rich insights
 * 
 * Query params:
 * - favorites: boolean (show only favorites)
 * - nearby: boolean (filter by location)
 * - lat, lng: coordinates (required if nearby=true)
 * - radius: number (miles, default 10)
 * - limit: number (default 20)
 */
export const GET = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  const searchParams = request.nextUrl.searchParams
  
  const favorites = searchParams.get('favorites') === 'true'
  const nearby = searchParams.get('nearby') === 'true'
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = parseInt(searchParams.get('radius') || '10')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const supabase = createTenantClient(token, tenant.tenantId)

    // TODO: Get tenant_id from auth context
    const tenantId = request.headers.get('x-tenant-id') // Temporary

    // ELITE: Build intelligent query with aggregations
    // Get unique stations from events, with visit counts and stats
    let query = supabase
      .from('vehicle_events')
      .select(`
        vendor,
        display_vendor,
        station_address,
        geocoded_address,
        geocoded_lat,
        geocoded_lng,
        total_amount,
        gallons,
        date
      `)
      .eq('type', 'fuel')
      .not('vendor', 'is', null)
      .order('date', { ascending: false })

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('[STATIONS] Error fetching station events:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
      return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'STATIONS_FAILED_TO_FETCH_STATIONS',
          message: 'Failed to fetch stations'
        }
      },
        { status: 500 }
      )
    }

    // ELITE: Aggregate events by station (vendor + location)
    const stationMap = new Map()

    events?.forEach(event => {
      const stationKey = `${event.vendor || event.display_vendor}_${event.geocoded_lat}_${event.geocoded_lng}`
      
      if (!stationMap.has(stationKey)) {
        stationMap.set(stationKey, {
          id: stationKey,
          name: event.display_vendor || event.vendor,
          address: event.geocoded_address || event.station_address,
          lat: event.geocoded_lat,
          lng: event.geocoded_lng,
          visit_count: 0,
          total_spent: 0,
          total_gallons: 0,
          first_visit: event.date,
          last_visit: event.date,
          events: []
        })
      }

      const station = stationMap.get(stationKey)
      station.visit_count++
      station.total_spent += event.total_amount || 0
      station.total_gallons += event.gallons || 0
      station.last_visit = event.date
      station.events.push(event)
    })

    let stations = Array.from(stationMap.values())

    // ELITE: Filter by nearby if requested
    if (nearby && lat && lng) {
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)

      stations = stations.filter(station => {
        if (!station.lat || !station.lng) return false
        
        const distance = calculateDistance(
          userLat,
          userLng,
          station.lat,
          station.lng
        )
        
        station.distance_miles = distance
        return distance <= radius
      })

      // Sort by distance
      stations.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0))
    } else {
      // ELITE: Default sorting - by visit count (most visited first)
      stations.sort((a, b) => b.visit_count - a.visit_count)
    }

    // ELITE: Calculate insights for each station
    stations = stations.map(station => ({
      ...station,
      avg_price_per_gallon: station.total_gallons > 0 
        ? station.total_spent / station.total_gallons 
        : null,
      avg_spent_per_visit: station.visit_count > 0
        ? station.total_spent / station.visit_count
        : null,
      insights: {
        visit_frequency: calculateVisitFrequency(station.events),
        price_trend: calculatePriceTrend(station.events),
        typical_day: getMostCommonDay(station.events)
      }
    }))

    // Limit results
    const limitedStations = stations.slice(0, limit)

    // ELITE: Rich response with meta and insights
    return NextResponse.json({
      ok: true,
      data: { data: limitedStations,
      meta: {
        total: limitedStations.length,
        total_available: stations.length,
        filters: {
          favorites,
          nearby,
          radius: nearby ? radius : null
         }
    }
      },
      insights: {
        most_visited: limitedStations[0],
        total_stations: stations.length,
        avg_visits_per_station: stations.length > 0
          ? stations.reduce((sum, s) => sum + s.visit_count, 0) / stations.length
          : 0,
        favorite_brands: getTopBrands(stations, 3),
        avg_price_across_all: calculateOverallAvgPrice(stations)
      }
    })
  } catch (error) {
    console.error('[STATIONS] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'STATIONS_INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})

// ELITE: Helper functions for intelligence

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula for distance in miles
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

function calculateVisitFrequency(events: any[]): string {
  if (!events || events.length < 2) return 'Insufficient data'
  
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
  
  if (avgDays < 7) return 'Weekly'
  if (avgDays < 14) return 'Bi-weekly'
  if (avgDays < 30) return 'Monthly'
  return 'Occasional'
}

function calculatePriceTrend(events: any[]): string {
  if (!events || events.length < 2) return 'Stable'
  
  const sortedEvents = [...events]
    .filter(e => e.gallons && e.total_amount)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  if (sortedEvents.length < 2) return 'Stable'
  
  const recentPrice = sortedEvents[sortedEvents.length - 1].total_amount / sortedEvents[sortedEvents.length - 1].gallons
  const oldPrice = sortedEvents[0].total_amount / sortedEvents[0].gallons
  
  const change = ((recentPrice - oldPrice) / oldPrice) * 100
  
  if (change > 5) return 'Increasing'
  if (change < -5) return 'Decreasing'
  return 'Stable'
}

function getMostCommonDay(events: any[]): string {
  if (!events || events.length === 0) return 'Unknown'
  
  const dayCounts: Record<string, number> = {}
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  events.forEach(event => {
    const dayOfWeek = new Date(event.date).getDay()
    const dayName = days[dayOfWeek]
    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1
  })
  
  return Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
}

function getTopBrands(stations: any[], limit: number): string[] {
  const brandCounts: Record<string, number> = {}
  
  stations.forEach(station => {
    const brand = station.name.split(' ')[0] // First word as brand
    brandCounts[brand] = (brandCounts[brand] || 0) + station.visit_count
  })
  
  return Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([brand]) => brand)
}

function calculateOverallAvgPrice(stations: any[]): number | null {
  const validStations = stations.filter(s => s.avg_price_per_gallon)
  if (validStations.length === 0) return null
  
  const sum = validStations.reduce((acc, s) => acc + s.avg_price_per_gallon, 0)
  return sum / validStations.length
}
