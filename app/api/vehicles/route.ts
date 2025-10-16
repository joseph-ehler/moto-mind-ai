import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/vehicles
 * List all vehicles for the current user/tenant
 * 
 * Query params:
 * - limit: number of results (default 20)
 * - offset: pagination offset (default 0)
 * - garage_id: filter by garage
 * - search: search make/model/nickname
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const garageId = searchParams.get('garage_id')
  const search = searchParams.get('search')

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Get tenant_id from auth context
    // For now, this would need to be passed or extracted from session

    let query = supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (garageId) {
      query = query.eq('garage_id', garageId)
    }

    if (search) {
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,nickname.ilike.%${search}%`)
    }

    const { data: vehicles, error, count } = await query

    if (error) {
      console.error('Error fetching vehicles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      vehicles: vehicles || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? (offset + limit) < count : false
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

/**
 * POST /api/vehicles
 * Create a new vehicle
 * 
 * Body:
 * - year: number (required)
 * - make: string (required)
 * - model: string (required)
 * - trim: string (optional)
 * - vin: string (optional)
 * - nickname: string (optional)
 * - garage_id: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, make, model, trim, vin, nickname, garage_id } = body

    // Validation
    if (!year || !make || !model) {
      return NextResponse.json(
        { error: 'Year, make, and model are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Get tenant_id from auth context
    const tenantId = body.tenant_id // Temporary

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - no tenant context' },
        { status: 401 }
      )
    }

    // Create vehicle
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: tenantId,
        year,
        make,
        model,
        trim: trim || null,
        vin: vin || null,
        nickname: nickname || null,
        garage_id: garage_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating vehicle:', error)
      return NextResponse.json(
        { error: 'Failed to create vehicle' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { vehicle },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
