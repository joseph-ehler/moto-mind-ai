/**
 * /api/vehicles - Vehicle Management API
 * 
 * Handles vehicle CRUD operations with:
 * - Automatic tenant isolation via RLS
 * - JWT authentication via NextAuth
 * - Pagination support
 * - Search/filter capabilities
 * - Structured error responses
 * 
 * Auth: Required
 * Tenant: Auto-filtered by RLS
 */

import { NextRequest } from 'next/server'
import {
  withAuth,
  createTenantClient,
  errorResponse,
  successResponse,
  type AuthContext
} from '@/lib/middleware/auth'

// ============================================================================
// GET /api/vehicles - List vehicles
// ============================================================================

/**
 * List all vehicles for the authenticated user's tenant
 * 
 * Query params:
 * - limit: number (default 20)
 * - offset: number (default 0)
 * - garage_id: string (optional)
 * - search: string (optional - searches make/model/nickname)
 * - sort: string (default 'created_at')
 * - order: 'asc' | 'desc' (default 'desc')
 */
export const GET = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const garageId = searchParams.get('garage_id')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    // Create tenant-scoped client (RLS auto-filters by tenant_id)
    const supabase = createTenantClient(token, tenant.tenantId)

    // Build query
    let query = supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (garageId) {
      query = query.eq('garage_id', garageId)
    }

    if (search) {
      query = query.or(
        `make.ilike.%${search}%,model.ilike.%${search}%,nickname.ilike.%${search}%`
      )
    }

    // Execute query
    const { data: vehicles, error, count } = await query

    if (error) {
      console.error('[VEHICLES] List error:', {
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })
      
      return errorResponse(
        'VEHICLES_FETCH_FAILED',
        'Failed to fetch vehicles',
        500
      )
    }

    // Return paginated response
    return successResponse({
      vehicles: vehicles || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: count ? (offset + limit) < count : false
      }
    })

  } catch (error) {
    console.error('[VEHICLES] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    
    return errorResponse(
      'VEHICLES_INTERNAL_ERROR',
      'Internal server error',
      500
    )
  }
})

// ============================================================================
// POST /api/vehicles - Create vehicle
// ============================================================================

/**
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
 * - notes: string (optional)
 */
export const POST = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  try {
    // Parse request body
    const body = await request.json()
    const { year, make, model, trim, vin, nickname, garage_id, notes } = body

    // Validation
    if (!year || !make || !model) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Year, make, and model are required',
        400
      )
    }

    // Validate year
    const currentYear = new Date().getFullYear()
    if (year < 1900 || year > currentYear + 1) {
      return errorResponse(
        'VALIDATION_ERROR',
        `Year must be between 1900 and ${currentYear + 1}`,
        400
      )
    }

    // Create tenant-scoped client
    const supabase = createTenantClient(token, tenant.tenantId)

    // Insert vehicle (tenant_id auto-set by RLS or explicit)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: tenant.tenantId, // Explicit for clarity
        year,
        make,
        model,
        trim: trim || null,
        vin: vin || null,
        nickname: nickname || null,
        garage_id: garage_id || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('[VEHICLES] Create error:', {
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })
      
      // Check for unique constraint violation (VIN duplicate)
      if (error.code === '23505') {
        return errorResponse(
          'VEHICLE_DUPLICATE',
          'A vehicle with this VIN already exists',
          409
        )
      }
      
      return errorResponse(
        'VEHICLE_CREATE_FAILED',
        'Failed to create vehicle',
        500
      )
    }

    console.log('[VEHICLES] Created:', {
      vehicleId: vehicle.id,
      tenantId: tenant.tenantId,
      userId: user.id,
    })

    return successResponse({ vehicle }, 201)

  } catch (error) {
    console.error('[VEHICLES] Unexpected error:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    
    return errorResponse(
      'VEHICLE_INTERNAL_ERROR',
      'Internal server error',
      500
    )
  }
})
