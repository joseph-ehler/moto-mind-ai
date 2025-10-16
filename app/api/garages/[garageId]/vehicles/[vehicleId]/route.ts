import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * POST /api/garages/[garageId]/vehicles/[vehicleId]
 * Assign a vehicle to a garage
 */
export async function POST(
  request: NextRequest,
  { params }): { params: { garageId: string; vehicleId: string } }
) {
  const { garageId, vehicleId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify garage exists
    const { data: garage, error: garageError } = await supabase
      .from('garages')
      .select('id, name')
      .eq('id', garageId)
      .is('deleted_at', null)
      .single()

    if (garageError || !garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    // Assign vehicle to garage
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({ garage_id: garageId })
      .eq('id', vehicleId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error assigning vehicle to garage:', error)
      return NextResponse.json(
        { error: 'Failed to assign vehicle to garage' },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Vehicle assigned to ${garage.name}`,
      vehicle
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
 * DELETE /api/garages/[garageId]/vehicles/[vehicleId]
 * Remove a vehicle from a garage
 */
export async function DELETE(
  request: NextRequest,
  { params }): { params: { garageId: string; vehicleId: string } }
) {
  const { garageId, vehicleId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Remove vehicle from garage (set garage_id to null)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .update({ garage_id: null })
      .eq('id', vehicleId)
      .eq('garage_id', garageId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error removing vehicle from garage:', error)
      return NextResponse.json(
        { error: 'Failed to remove vehicle from garage' },
        { status: 500 }
      )
    }

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found in this garage' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle removed from garage',
      vehicle
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
