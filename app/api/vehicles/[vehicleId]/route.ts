import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, validateResourceTenant, type AuthContext } from '@/lib/middleware'

/**
 * GET /api/vehicles/[vehicleId]
 * Get a specific vehicle by ID
 * 
 * Auth: Required
 * Tenant: Required
 */
export const GET = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext,
  params?: Record<string, string>
) => {
  const vehicleId = params?.vehicleId
  
  if (!vehicleId) {
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'MISSING_VEHICLE_ID',
          message: 'Vehicle ID is required'
        }
      },
      { status: 400 }
    )
  }

  try {
    const supabase = createTenantClient(token, tenant.tenantId)

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()

    if (error || !vehicle) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found'
          }
        },
        { status: 404 }
      )
    }

    // Validate tenant ownership (defense-in-depth)
    const validation = validateResourceTenant(vehicle.tenant_id, tenant.tenantId)
    if (!validation.ok) {
      console.warn('[VEHICLE] Tenant mismatch:', {
        vehicleId,
        vehicleTenant: vehicle.tenant_id,
        userTenant: tenant.tenantId,
        userId: user.id,
      })
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLE_ACCESS_DENIED',
            message: 'Access denied'
          }
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: { vehicle }
    })
  } catch (error) {
    console.error('[VEHICLE] Fetch error:', {
      vehicleId,
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'VEHICLE_FETCH_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})

/**
 * PATCH /api/vehicles/[vehicleId]
 * Update a vehicle (partial update)
 * 
 * Body: Any vehicle fields to update
 * 
 * Auth: Required
 * Tenant: Required
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext,
  params?: Record<string, string>
) => {
  const vehicleId = params?.vehicleId
  
  if (!vehicleId) {
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'MISSING_VEHICLE_ID',
          message: 'Vehicle ID is required'
        }
      },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const supabase = createTenantClient(token, tenant.tenantId)

    // Update vehicle (RLS automatically validates tenant)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(body)
      .eq('id', vehicleId)
      .select()
      .single()

    if (error) {
      console.error('[VEHICLE] Update error:', {
        vehicleId,
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLE_UPDATE_FAILED',
            message: 'Failed to update vehicle'
          }
        },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found or access denied'
          }
        },
        { status: 404 }
      )
    }

    console.log('[VEHICLE] Updated:', {
      vehicleId,
      tenantId: tenant.tenantId,
      userId: user.id,
    })

    return NextResponse.json({
      ok: true,
      data: { vehicle }
    })
  } catch (error) {
    console.error('[VEHICLE] Update unexpected error:', {
      vehicleId,
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'VEHICLE_UPDATE_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/vehicles/[vehicleId]
 * Soft delete a vehicle (sets deleted_at)
 * 
 * Auth: Required
 * Tenant: Required
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext,
  params?: Record<string, string>
) => {
  const vehicleId = params?.vehicleId
  
  if (!vehicleId) {
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'MISSING_VEHICLE_ID',
          message: 'Vehicle ID is required'
        }
      },
      { status: 400 }
    )
  }

  try {
    const supabase = createTenantClient(token, tenant.tenantId)

    // Soft delete (RLS automatically validates tenant)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('[VEHICLE] Delete error:', {
        vehicleId,
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLE_DELETE_FAILED',
            message: 'Failed to delete vehicle'
          }
        },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { 
          ok: false,
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found or access denied'
          }
        },
        { status: 404 }
      )
    }

    console.log('[VEHICLE] Deleted:', {
      vehicleId,
      tenantId: tenant.tenantId,
      userId: user.id,
    })

    return NextResponse.json(
      { 
        ok: true,
        data: {
          success: true,
          message: 'Vehicle deleted successfully',
          vehicle
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[VEHICLE] Delete unexpected error:', {
      vehicleId,
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'VEHICLE_DELETE_ERROR',
          message: 'Internal server error'
        }
      },
      { status: 500 }
    )
  }
})
