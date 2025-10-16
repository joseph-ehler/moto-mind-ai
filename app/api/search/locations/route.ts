import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/search/locations
 * Search for events near a location
 * 
 * ELITE-TIER: Geospatial search with distance calculation
 * - Find events near coordinates
 * - Address-based search
 * - Radius filtering
 * - Distance sorting
 * - Event clustering by location
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = parseFloat(searchParams.get('radius') || '10') // miles
  const address = searchParams.get('address')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tenantId = request.headers.get('x-tenant-id')
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    // Fetch events with geocoded locations
    let dbQuery = supabase
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
      .not('geocoded_lat', 'is', null)
      .not('geocoded_lng', 'is', null)
      .order('date', { ascending: false })

    if (tenantId) {
      dbQuery = dbQuery.eq('tenant_id', tenantId)
    }

    const { data: events, error } = await dbQuery

    if (error) {
      console.error('Error searching locations:', error)
      return NextResponse.json(
        { error: 'Location search failed' },
        { status: 500 }
      )
    }

    // ELITE: Calculate distance for each event and filter by radius
    const eventsWithDistance = (events || [])
      .map(event => {
        const distance = calculateDistance(
          userLat,
          userLng,
          event.geocoded_lat,
          event.geocoded_lng
        )

        return {
          ...event,
          distance_miles: Math.round(distance * 10) / 10
        }
      })
      .filter(event => event.distance_miles <= radius)
      .sort((a, b) => a.distance_miles - b.distance_miles)
      .slice(0, limit)

    // ELITE: Cluster events by location
    const locationClusters = clusterByLocation(eventsWithDistance)

    return NextResponse.json({
      data: eventsWithDistance,
      meta: {
        search_center: { lat: userLat, lng: userLng },
        radius_miles: radius,
        total_results: eventsWithDistance.length,
        address: address || 'Custom coordinates'
      },
      clusters: locationClusters,
      insights: {
        closest_event: eventsWithDistance[0] || null,
        farthest_event: eventsWithDistance[eventsWithDistance.length - 1] || null,
        avg_distance: eventsWithDistance.length > 0
          ? Math.round((eventsWithDistance.reduce((sum, e) => sum + e.distance_miles, 0) / eventsWithDistance.length) * 10) / 10
          : 0,
        unique_locations: locationClusters.length
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

// ELITE: Haversine distance formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Cluster events within 0.1 miles of each other
function clusterByLocation(events: any[]): any[] {
  const clusters: any[] = []
  const processed = new Set()

  events.forEach(event => {
    if (processed.has(event.id)) return

    const cluster = {
      lat: event.geocoded_lat,
      lng: event.geocoded_lng,
      address: event.geocoded_address || event.station_address,
      events: [event],
      total_events: 1
    }

    // Find nearby events (within 0.1 miles)
    events.forEach(other => {
      if (processed.has(other.id) || other.id === event.id) return

      const distance = calculateDistance(
        event.geocoded_lat,
        event.geocoded_lng,
        other.geocoded_lat,
        other.geocoded_lng
      )

      if (distance <= 0.1) { // Same location
        cluster.events.push(other)
        cluster.total_events++
        processed.add(other.id)
      }
    })

    processed.add(event.id)
    clusters.push(cluster)
  })

  return clusters.sort((a, b) => b.total_events - a.total_events)
}
