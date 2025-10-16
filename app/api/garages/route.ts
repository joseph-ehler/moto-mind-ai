import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
import { z } from 'zod'

const createGarageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  tenant_id: z.string().uuid().optional() // TODO: Get from auth
})

/**
 * GET /api/garages
 * List all garages for the current user/tenant
 * 
 * Query params:
 * - limit: number of results (default 20)
 * - offset: pagination offset (default 0)
 * - search: search by name
 */
export const GET = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const search = searchParams.get('search')

  try {
    const supabase = createTenantClient(token, tenant.tenantId)

    // TODO: Get tenant_id from auth context

    let query = supabase
      .from('garages')
      .select(`
        *,
        vehicle_count:vehicles(count)
      `, { count: 'exact' })
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: garages, error, count } = await query

    if (error) {
      console.error('[GARAGES] Error fetching garages:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
      return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'GARAGES_FAILED_TO_FETCH_GARAGES',
          message: 'Failed to fetch garages'
        }
      },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: { garages: garages || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? (offset + limit) < count : false
       }
    }
    })
  } catch (error) {
    console.error('[GARAGES] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'GARAGES_INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})

/**
 * POST /api/garages
 * Create a new garage
 * 
 * Body:
 * - name: garage name (required)
 * - description: garage description (optional)
 */
export const POST = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  try {
    const body = await request.json()
    const garageData = createGarageSchema.parse(body)

    const supabase = createTenantClient(token, tenant.tenantId)

    // TODO: Get tenant_id from auth context
    const tenantId = body.tenant_id

    if (!tenantId) {
      return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'GARAGES_UNAUTHORIZED_-_NO_TENANT_CONTEXT',
          message: 'Unauthorized - no tenant context'
        }
      },
        { status: 401 }
      )
    }

    // Create garage
    const { data: garage, error } = await supabase
      .from('garages')
      .insert({
        tenant_id: tenantId,
        name: garageData.name,
        description: garageData.description || null
      })
      .select()
      .single()

    if (error) {
      console.error('[GARAGES] Error creating garage:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
      return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'GARAGES_FAILED_TO_CREATE_GARAGE',
          message: 'Failed to create garage'
        }
      },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: { garage  }
    },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[GARAGES] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'GARAGES_INTERNAL_SERVER_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})
