import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/vehicles/[vehicleId]
 * Get a specific vehicle by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .is('deleted_at', null)
      .single()

    if (error || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // TODO: Check if user has access to this vehicle (tenant_id match)

    return NextResponse.json({ vehicle })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/vehicles/[vehicleId]
 * Update a vehicle (partial update)
 * 
 * Body: Any vehicle fields to update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params

  try {
    const body = await request.json()

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Check if user has access to this vehicle

    // Update vehicle
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update(body)
      .eq('id', vehicleId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error updating vehicle:', error)
      return NextResponse.json(
        { error: 'Failed to update vehicle' },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ vehicle })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vehicles/[vehicleId]
 * Soft delete a vehicle (sets deleted_at)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Check if user has access to this vehicle

    // Soft delete
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error deleting vehicle:', error)
      return NextResponse.json(
        { error: 'Failed to delete vehicle' },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Vehicle deleted successfully',
        vehicle 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
