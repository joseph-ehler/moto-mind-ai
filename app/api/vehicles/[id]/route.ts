/**
 * /api/vehicles/[id] - Individual Vehicle API
 * 
 * Handles single vehicle operations:
 * - GET: Fetch vehicle details
 * - PATCH: Update vehicle
 * - DELETE: Delete vehicle (soft delete)
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
// GET /api/vehicles/[id] - Get vehicle details
// ============================================================================

/**
 * Fetch a single vehicle by ID
 * RLS ensures user can only access vehicles in their tenant
 */
export const GET = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext,
  params?: Record<string, string>
) => {
  try {
    const id = params?.id

    if (!id) {
      return errorResponse('MISSING_ID', 'Vehicle ID is required', 400)
    }

    // Create tenant-scoped client
    const supabase = createTenantClient(token, tenant.tenantId)

    // Fetch vehicle (RLS auto-filters by tenant_id)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(
          'VEHICLE_NOT_FOUND',
          'Vehicle not found or access denied',
          404
        )
      }

      console.error('[VEHICLE] Fetch error:', {
        vehicleId: id,
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })

      return errorResponse(
        'VEHICLE_FETCH_FAILED',
        'Failed to fetch vehicle',
        500
      )
    }

    return successResponse({ vehicle })

  } catch (error) {
    console.error('[VEHICLE] Unexpected error:', {
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

// ============================================================================
// PATCH /api/vehicles/[id] - Update vehicle
// ============================================================================

/**
 * Update a vehicle's details
 * RLS ensures user can only update vehicles in their tenant
 * 
 * Body: Partial vehicle fields to update
 */
export const PATCH = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext,
  params?: Record<string, string>
) => {
  try {
    const id = params?.id

    if (!id) {
      return errorResponse('MISSING_ID', 'Vehicle ID is required', 400)
    }

    // Parse request body
    const body = await request.json()
    
    // Remove fields that shouldn't be updated directly
    const { id: _, tenant_id: __, created_at: ___, ...updates } = body

    // Validate at least one field to update
    if (Object.keys(updates).length === 0) {
      return errorResponse(
        'NO_UPDATES',
        'No valid fields to update',
        400
      )
    }

    // Validate year if provided
    if (updates.year) {
      const currentYear = new Date().getFullYear()
      if (updates.year < 1900 || updates.year > currentYear + 1) {
        return errorResponse(
          'VALIDATION_ERROR',
          `Year must be between 1900 and ${currentYear + 1}`,
          400
        )
      }
    }

    // Create tenant-scoped client
    const supabase = createTenantClient(token, tenant.tenantId)

    // Update vehicle (RLS auto-filters by tenant_id)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(
          'VEHICLE_NOT_FOUND',
          'Vehicle not found or access denied',
          404
        )
      }

      console.error('[VEHICLE] Update error:', {
        vehicleId: id,
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })

      // Check for unique constraint violation
      if (error.code === '23505') {
        return errorResponse(
          'VEHICLE_DUPLICATE',
          'A vehicle with this VIN already exists',
          409
        )
      }

      return errorResponse(
        'VEHICLE_UPDATE_FAILED',
        'Failed to update vehicle',
        500
      )
    }

    console.log('[VEHICLE] Updated:', {
      vehicleId: id,
      tenantId: tenant.tenantId,
      userId: user.id,
      fields: Object.keys(updates)
    })

    return successResponse({ vehicle })

  } catch (error) {
    console.error('[VEHICLE] Unexpected error:', {
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

// ============================================================================
// DELETE /api/vehicles/[id] - Delete vehicle
// ============================================================================

/**
 * Delete a vehicle (soft delete)
 * Sets deleted_at timestamp instead of hard delete
 * RLS ensures user can only delete vehicles in their tenant
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext,
  params?: Record<string, string>
) => {
  try {
    const id = params?.id

    if (!id) {
      return errorResponse('MISSING_ID', 'Vehicle ID is required', 400)
    }

    // Create tenant-scoped client
    const supabase = createTenantClient(token, tenant.tenantId)

    // Check if vehicle has events (warn user)
    const { count: eventCount } = await supabase
      .from('vehicle_events')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', id)

    // Soft delete vehicle (RLS auto-filters by tenant_id)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(
          'VEHICLE_NOT_FOUND',
          'Vehicle not found or access denied',
          404
        )
      }

      console.error('[VEHICLE] Delete error:', {
        vehicleId: id,
        tenantId: tenant.tenantId,
        userId: user.id,
        error: error.message,
      })

      return errorResponse(
        'VEHICLE_DELETE_FAILED',
        'Failed to delete vehicle',
        500
      )
    }

    console.log('[VEHICLE] Deleted:', {
      vehicleId: id,
      tenantId: tenant.tenantId,
      userId: user.id,
      hadEvents: (eventCount || 0) > 0
    })

    return successResponse({
      vehicle,
      message: 'Vehicle deleted successfully',
      eventCount: eventCount || 0
    })

  } catch (error) {
    console.error('[VEHICLE] Unexpected error:', {
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
