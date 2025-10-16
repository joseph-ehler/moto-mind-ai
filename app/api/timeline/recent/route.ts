import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/timeline/recent
 * Get recent activity across all vehicles
 * 
 * ELITE-TIER: Cross-vehicle timeline intelligence
 * - Recent events from all vehicles
 * - Multi-vehicle activity feed
 * - Quick overview of latest activity
 * - Contextual insights
 * 
 * Query params:
 * - limit: number of results (default 20)
 * - days: number of days to look back (default 30)
 * - type: filter by event type
 * - vehicles: comma-separated vehicle IDs or 'all'
 */
export const GET = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  const searchParams = request.nextUrl.searchParams
  
  const limit = parseInt(searchParams.get('limit') || '20')
  const days = parseInt(searchParams.get('days') || '30')
  const type = searchParams.get('type')
  const vehiclesParam = searchParams.get('vehicles') || 'all'

  try {
    const supabase = createTenantClient(token, tenant.tenantId)

    const tenantId = request.headers.get('x-tenant-id')

    // Calculate start date
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

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
      .gte('date', startDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (vehiclesParam !== 'all') {
      const vehicleIds = vehiclesParam.split(',')
      query = query.in('vehicle_id', vehicleIds)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('[TIMELINE] Error fetching recent timeline:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
      return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'TIMELINE_FAILED_TO_FETCH_RECENT_ACTIVITY',
          message: 'Failed to fetch recent activity'
        }
      },
        { status: 500 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          events: [],
          summary: {
            total: 0,
            message: `No activity in the last ${days} days`
          },
          meta: {
            days,
            limit,
            date_range: { start: startDate, end: new Date().toISOString().split('T')[0] }
          }
        }
      })
    }

    // ELITE: Enrich events with context
    const enrichedEvents = events.map((event, index) => {
      const vehicleName = event.vehicles?.nickname || 
        `${event.vehicles?.year} ${event.vehicles?.make} ${event.vehicles?.model}`

      // Calculate relative time
      const eventDate = new Date(event.date)
      const daysAgo = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let relativeTime = ''
      if (daysAgo === 0) relativeTime = 'Today'
      else if (daysAgo === 1) relativeTime = 'Yesterday'
      else if (daysAgo < 7) relativeTime = `${daysAgo} days ago`
      else relativeTime = `${Math.floor(daysAgo / 7)} weeks ago`

      return {
        ...event,
        vehicle_name: vehicleName,
        relative_time: relativeTime,
        days_ago: daysAgo
      }
    })

    // ELITE: Calculate summary
    const summary = {
      total: enrichedEvents.length,
      by_type: {} as Record<string, number>,
      by_vehicle: {} as Record<string, number>,
      total_spent: 0,
      most_recent: enrichedEvents[0]?.date,
      oldest_shown: enrichedEvents[enrichedEvents.length - 1]?.date
    }

    enrichedEvents.forEach(e => {
      // Count by type
      const type = e.type || 'other'
      summary.by_type[type] = (summary.by_type[type] || 0) + 1

      // Count by vehicle
      summary.by_vehicle[e.vehicle_name] = (summary.by_vehicle[e.vehicle_name] || 0) + 1

      // Sum spending
      summary.total_spent += e.total_amount || 0
    })

    summary.total_spent = Math.round(summary.total_spent * 100) / 100

    // ELITE: Generate insights
    const insights: string[] = []
    
    if (enrichedEvents.length > 0) {
      insights.push(`${enrichedEvents.length} events in the last ${days} days`)
    }

    const mostActiveVehicle = Object.entries(summary.by_vehicle)
      .sort((a, b) => b[1] - a[1])[0]
    
    if (mostActiveVehicle) {
      insights.push(`Most active: ${mostActiveVehicle[0]} (${mostActiveVehicle[1]} events)`)
    }

    if (summary.total_spent > 0) {
      insights.push(`Total spent: ${summary.total_spent}`)
    }

    return NextResponse.json({
      ok: true,
      data: { data: {
        events: enrichedEvents,
        summary,
        insights
       }
    },
      meta: {
        days,
        limit,
        total_shown: enrichedEvents.length,
        date_range: {
          start: startDate,
          end: new Date().toISOString().split('T')[0]
        },
        filters: {
          type,
          vehicles: vehiclesParam
        }
      }
    })
  } catch (error) {
    console.error('[TIMELINE] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'TIMELINE_INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})
