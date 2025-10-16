import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/events
 * Search/list events across all vehicles (GLOBAL)
 * 
 * Query params:
 * - vehicle_id: filter by vehicle
 * - type: filter by event type (fuel, maintenance, etc.)
 * - start_date: filter by date range
 * - end_date: filter by date range
 * - search: search vendor, notes, etc.
 * - limit: number of results (default 20)
 * - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const vehicleId = searchParams.get('vehicle_id')
  const type = searchParams.get('type')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Get tenant_id from auth context and filter by it

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
      `, { count: 'exact' })
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    if (search) {
      query = query.or(`vendor.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const { data: events, error, count } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      events: events || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? (offset + limit) < count : false
      },
      filters: {
        vehicle_id: vehicleId,
        type,
        start_date: startDate,
        end_date: endDate,
        search
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
