import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/stations/[stationId]/events
 * Get all fuel-ups at a specific station with enriched context
 * 
 * ELITE-TIER: Rich event timeline with insights
 * - Chronological fuel-up history
 * - Price per gallon tracking
 * - MPG calculations
 * - Spending patterns
 * - Contextual comparisons
 * 
 * Query params:
 * - start_date: filter from date
 * - end_date: filter to date
 * - vehicle_id: filter by vehicle
 * - limit: number of results (default 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { stationId: string } }
) {
  const { stationId } = params
  const searchParams = request.nextUrl.searchParams

  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const vehicleId = searchParams.get('vehicle_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tenantId = request.headers.get('x-tenant-id')

    // Parse station ID
    const [vendor, lat, lng] = stationId.split('_')

    if (!vendor) {
      return NextResponse.json(
        { error: 'Invalid station ID' },
        { status: 400 }
      )
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
      .eq('type', 'fuel')
      .or(`vendor.ilike.%${decodeURIComponent(vendor)}%,display_vendor.ilike.%${decodeURIComponent(vendor)}%`)
      .order('date', { ascending: false })

    if (tenantId) query = query.eq('tenant_id', tenantId)
    if (vehicleId) query = query.eq('vehicle_id', vehicleId)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    // Location filter if coordinates provided
    if (lat && lng) {
      const targetLat = parseFloat(lat)
      const targetLng = parseFloat(lng)
      
      query = query
        .gte('geocoded_lat', targetLat - 0.001)
        .lte('geocoded_lat', targetLat + 0.001)
        .gte('geocoded_lng', targetLng - 0.001)
        .lte('geocoded_lng', targetLng + 0.001)
    }

    const { data: events, error } = await query.limit(limit)

    if (error) {
      console.error('Error fetching station events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch station events' },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        data: [],
        meta: { total: 0, message: 'No events found for this station' }
      })
    }

    // ELITE: Enrich each event with contextual insights
    const enrichedEvents = events.map((event, index) => {
      const pricePerGallon = event.gallons 
        ? event.total_amount / event.gallons 
        : null

      // Calculate days since previous fill-up
      let daysSincePrevious = null
      if (index < events.length - 1) {
        const prevDate = new Date(events[index + 1].date)
        const currDate = new Date(event.date)
        daysSincePrevious = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      // Calculate price difference from previous
      let priceChange = null
      if (index < events.length - 1 && pricePerGallon) {
        const prevEvent = events[index + 1]
        const prevPrice = prevEvent.gallons 
          ? prevEvent.total_amount / prevEvent.gallons 
          : null
        
        if (prevPrice) {
          priceChange = {
            amount: pricePerGallon - prevPrice,
            percent: ((pricePerGallon - prevPrice) / prevPrice) * 100
          }
        }
      }

      return {
        ...event,
        computed: {
          price_per_gallon: pricePerGallon 
            ? Math.round(pricePerGallon * 100) / 100 
            : null,
          days_since_previous: daysSincePrevious,
          price_change: priceChange ? {
            amount: Math.round(priceChange.amount * 100) / 100,
            percent: Math.round(priceChange.percent * 10) / 10,
            direction: priceChange.amount > 0 ? 'increase' : 'decrease'
          } : null
        }
      }
    })

    // ELITE: Calculate summary statistics
    const summary = {
      total_events: enrichedEvents.length,
      total_spent: enrichedEvents.reduce((sum, e) => sum + (e.total_amount || 0), 0),
      total_gallons: enrichedEvents.reduce((sum, e) => sum + (e.gallons || 0), 0),
      avg_price_per_gallon: null as number | null,
      avg_spent_per_visit: null as number | null,
      price_range: { min: null as number | null, max: null as number | null }
    }

    const prices = enrichedEvents
      .map(e => e.computed.price_per_gallon)
      .filter(p => p !== null) as number[]

    if (prices.length > 0) {
      summary.avg_price_per_gallon = Math.round(
        (prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100
      ) / 100
      summary.price_range = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      }
    }

    if (enrichedEvents.length > 0) {
      summary.avg_spent_per_visit = Math.round(
        (summary.total_spent / enrichedEvents.length) * 100
      ) / 100
    }

    return NextResponse.json({
      data: enrichedEvents,
      meta: {
        total: enrichedEvents.length,
        limit,
        filters: {
          start_date: startDate,
          end_date: endDate,
          vehicle_id: vehicleId
        }
      },
      summary
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
