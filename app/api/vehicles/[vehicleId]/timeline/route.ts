import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/vehicles/[vehicleId]/timeline
 * Get rich timeline view of vehicle history
 * 
 * ELITE-TIER: Multi-perspective timeline intelligence
 * - Chronological event history
 * - Grouped views (by type, by month)
 * - Summary statistics
 * - Context-enriched events
 * - Actionable insights
 * 
 * Query params:
 * - view: 'chronological' | 'grouped' | 'summary' (default: 'chronological')
 * - group_by: 'type' | 'month' | 'location' (for grouped view)
 * - period: 'week' | 'month' | 'quarter' | 'year' | 'all'
 * - type: filter by event type
 * - limit: number of results (default 50)
 */
export async function GET(
  request: NextRequest,
  { params }): { params: { vehicleId: string } }
) {
  const { vehicleId } = params
  const searchParams = request.nextUrl.searchParams
  
  const view = searchParams.get('view') || 'chronological'
  const groupBy = searchParams.get('group_by') || 'month'
  const period = searchParams.get('period') || 'all'
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '50')

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

    // Fetch events
    let query = supabase
      .from('vehicle_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data: events, error } = await query.limit(limit)

    if (error) {
      console.error('Error fetching timeline:', error)
      return NextResponse.json(
        { error: 'Failed to fetch timeline' },
        { status: 500 }
      )
    }

    // ELITE: Build response based on view type
    let responseData: any = {}

    switch (view) {
      case 'grouped':
        responseData = buildGroupedTimeline(events || [], groupBy)
        break
      case 'summary':
        responseData = buildTimelineSummary(events || [], vehicle)
        break
      case 'chronological':
      default:
        responseData = buildChronologicalTimeline(events || [])
        break
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
        ...responseData
      },
      meta: {
        view,
        period,
        date_range: { start: startDate, end: endDate },
        total_events: events?.length || 0,
        filters: { type, group_by: view === 'grouped' ? groupBy : null }
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

// ELITE: Timeline view builders

function buildChronologicalTimeline(events: any[]): any {
  // Enrich each event with context
  const enrichedEvents = events.map((event, index) => {
    // Calculate days since previous event
    let daysSincePrevious = null
    if (index < events.length - 1) {
      const prevDate = new Date(events[index + 1].date)
      const currDate = new Date(event.date)
      daysSincePrevious = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    // Calculate miles since previous
    let milesSincePrevious = null
    if (index < events.length - 1 && event.miles && events[index + 1].miles) {
      milesSincePrevious = event.miles - events[index + 1].miles
    }

    return {
      ...event,
      context: {
        days_since_previous: daysSincePrevious,
        miles_since_previous: milesSincePrevious,
        relative_time: getRelativeTime(event.date)
      }
    }
  })

  return {
    timeline: enrichedEvents,
    summary: {
      total_events: enrichedEvents.length,
      event_types: getEventTypeCounts(enrichedEvents),
      date_range: {
        earliest: enrichedEvents[enrichedEvents.length - 1]?.date,
        latest: enrichedEvents[0]?.date
      }
    }
  }
}

function buildGroupedTimeline(events: any[], groupBy: string): any {
  const groups = new Map()

  events.forEach(event => {
    let groupKey: string

    switch (groupBy) {
      case 'type':
        groupKey = event.type || 'other'
        break
      case 'month':
        const date = new Date(event.date)
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'location':
        groupKey = event.geocoded_address || event.vendor || 'Unknown'
        break
      default:
        groupKey = 'all'
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        group: groupKey,
        events: [],
        count: 0,
        total_cost: 0
      })
    }

    const group = groups.get(groupKey)
    group.events.push(event)
    group.count++
    group.total_cost += event.total_amount || 0
  })

  const groupedData = Array.from(groups.values())
    .map(g => ({
      ...g,
      total_cost: Math.round(g.total_cost * 100) / 100,
      events: g.events.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }))
    .sort((a, b) => b.count - a.count)

  return {
    grouped_by: groupBy,
    groups: groupedData,
    summary: {
      total_groups: groupedData.length,
      total_events: events.length
    }
  }
}

function buildTimelineSummary(events: any[], vehicle: any): any {
  const summary = {
    vehicle_age_days: calculateVehicleAge(vehicle),
    total_events: events.length,
    event_breakdown: getEventTypeCounts(events),
    spending: {
      total: 0,
      by_category: {} as any
    },
    mileage: {
      first_recorded: null as number | null,
      last_recorded: null as number | null,
      total_driven: null as number | null
    },
    activity: {
      most_active_month: null as string | null,
      avg_events_per_month: 0,
      days_since_last_event: null as number | null
    }
  }

  // Calculate spending
  summary.spending.total = events.reduce((sum, e) => sum + (e.total_amount || 0), 0)
  
  const categorySpending: any = {}
  events.forEach(e => {
    const category = e.type || 'other'
    categorySpending[category] = (categorySpending[category] || 0) + (e.total_amount || 0)
  })
  summary.spending.by_category = categorySpending
  summary.spending.total = Math.round(summary.spending.total * 100) / 100

  // Calculate mileage
  const eventsWithMiles = events.filter(e => e.miles).sort((a, b) => a.miles - b.miles)
  if (eventsWithMiles.length > 0) {
    summary.mileage.first_recorded = eventsWithMiles[0].miles
    summary.mileage.last_recorded = eventsWithMiles[eventsWithMiles.length - 1].miles
    summary.mileage.total_driven = summary.mileage.last_recorded - summary.mileage.first_recorded
  }

  // Calculate activity
  const monthCounts = new Map()
  events.forEach(e => {
    const date = new Date(e.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1)
  })

  if (monthCounts.size > 0) {
    const mostActive = Array.from(monthCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]
    summary.activity.most_active_month = mostActive[0]
    summary.activity.avg_events_per_month = Math.round(events.length / monthCounts.size * 10) / 10
  }

  if (events.length > 0) {
    const lastEventDate = new Date(events[0].date)
    summary.activity.days_since_last_event = Math.floor(
      (Date.now() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  return { summary }
}

// ELITE: Helper functions

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

function getEventTypeCounts(events: any[]): Record<string, number> {
  const counts: Record<string, number> = {}
  events.forEach(e => {
    const type = e.type || 'other'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}

function calculateVehicleAge(vehicle: any): number {
  if (!vehicle.created_at) return 0
  const createdDate = new Date(vehicle.created_at)
  return Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
}
