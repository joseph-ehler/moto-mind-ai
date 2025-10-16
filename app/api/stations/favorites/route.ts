import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/stations/favorites
 * List user's favorite stations
 * 
 * ELITE-TIER: Favorites with rich context
 * - All favorited stations
 * - Visit counts and statistics
 * - Recent activity
 * - Actionable insights
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get favorite stations
    const { data: favorites, error: favError } = await supabase
      .from('favorite_stations')
      .select('*')
      .eq('user_id', userId)
      .order('favorited_at', { ascending: false })

    if (favError) {
      console.error('Error fetching favorites:', favError)
      return NextResponse.json(
        { error: 'Failed to fetch favorite stations' },
        { status: 500 }
      )
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          message: 'No favorite stations yet'
        }
      })
    }

    // ELITE: Enrich each favorite with visit statistics
    const enrichedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        // Get events for this station
        const [vendor, lat, lng] = favorite.station_id.split('_')
        
        let query = supabase
          .from('vehicle_events')
          .select('id, date, total_amount, gallons')
          .eq('type', 'fuel')
          .or(`vendor.ilike.%${vendor}%,display_vendor.ilike.%${vendor}%`)

        if (tenantId) {
          query = query.eq('tenant_id', tenantId)
        }

        if (lat && lng) {
          const targetLat = parseFloat(lat)
          const targetLng = parseFloat(lng)
          query = query
            .gte('geocoded_lat', targetLat - 0.001)
            .lte('geocoded_lat', targetLat + 0.001)
            .gte('geocoded_lng', targetLng - 0.001)
            .lte('geocoded_lng', targetLng + 0.001)
        }

        const { data: events } = await query

        const stats = {
          visit_count: events?.length || 0,
          total_spent: events?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0,
          total_gallons: events?.reduce((sum, e) => sum + (e.gallons || 0), 0) || 0,
          last_visit: events && events.length > 0 
            ? events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
            : null
        }

        stats['avg_price_per_gallon'] = stats.total_gallons > 0
          ? Math.round((stats.total_spent / stats.total_gallons) * 100) / 100
          : null

        // Days since last visit
        let daysSinceLastVisit = null
        if (stats.last_visit) {
          daysSinceLastVisit = Math.floor(
            (Date.now() - new Date(stats.last_visit).getTime()) / (1000 * 60 * 60 * 24)
          )
        }

        return {
          ...favorite,
          stats,
          insights: {
            days_since_last_visit: daysSinceLastVisit,
            is_regular: stats.visit_count >= 5,
            is_active: daysSinceLastVisit !== null && daysSinceLastVisit <= 30
          }
        }
      })
    )

    // Sort by most visited
    enrichedFavorites.sort((a, b) => b.stats.visit_count - a.stats.visit_count)

    return NextResponse.json({
      data: enrichedFavorites,
      meta: {
        total: enrichedFavorites.length,
        active_favorites: enrichedFavorites.filter(f => f.insights.is_active).length,
        regular_stations: enrichedFavorites.filter(f => f.insights.is_regular).length
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
