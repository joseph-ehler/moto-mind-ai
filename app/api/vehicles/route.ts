import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'

/**
 * GET /api/vehicles
 * List all vehicles for the current user/tenant
 * 
 * Query params:
 * - limit: number of results (default 20)
 * - offset: pagination offset (default 0)
 * - garage_id: filter by garage
 * - search: search make/model/nickname
 * 
 * Auth: Required
 * Tenant: Required
 */
export const GET = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const garageId = searchParams.get('garage_id')
  const search = searchParams.get('search')

  try {
    // Create tenant-scoped Supabase client
    // RLS policies automatically enforced
    const supabase = createTenantClient(token, tenant.tenantId)

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
      console.error('[VEHICLES] Fetch error:', {
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLES_FETCH_FAILED',
            message: 'Failed to fetch vehicles'
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        vehicles: vehicles || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: count ? (offset + limit) < count : false
        }
      }
    })
  } catch (error) {
    console.error('[VEHICLES] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'VEHICLES_INTERNAL_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})

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
 * 
 * Auth: Required
 * Tenant: Required
 */
export const POST = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  try {
    const body = await request.json()
    const { year, make, model, trim, vin, nickname, garage_id } = body

    // Validation
    if (!year || !make || !model) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Year, make, and model are required',
            fields: ['year', 'make', 'model']
          }
        },
        { status: 400 }
      )
    }

    // Create tenant-scoped client
    const supabase = createTenantClient(token, tenant.tenantId)

    // Create vehicle
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: tenant.tenantId,
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
      console.error('[VEHICLES] Create error:', {
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLE_CREATE_FAILED',
            message: 'Failed to create vehicle'
          }
        },
        { status: 500 }
      )
    }

    console.log('[VEHICLES] Created:', {
      vehicleId: vehicle.id,
      tenantId: tenant.tenantId,
      userId: user.id,
    })

    return NextResponse.json(
      { 
        ok: true,
        data: { vehicle }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[VEHICLES] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'VEHICLE_INTERNAL_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})
