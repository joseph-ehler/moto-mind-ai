import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const search = searchParams.get('search')

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
      console.error('Error fetching garages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch garages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      garages: garages || [],
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
 * POST /api/garages
 * Create a new garage
 * 
 * Body:
 * - name: garage name (required)
 * - description: garage description (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const garageData = createGarageSchema.parse(body)

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Get tenant_id from auth context
    const tenantId = body.tenant_id

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - no tenant context' },
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
      console.error('Error creating garage:', error)
      return NextResponse.json(
        { error: 'Failed to create garage' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { garage },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
