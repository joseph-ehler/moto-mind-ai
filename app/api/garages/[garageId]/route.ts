import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/garages/[garageId]
 * Get a specific garage by ID with vehicle count
 */
export async function GET(
  request: NextRequest,
  { params }): { params: { garageId: string } }
) {
  const { garageId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: garage, error } = await supabase
      .from('garages')
      .select(`
        *,
        vehicles(
          id,
          make,
          model,
          year,
          nickname
        )
      `)
      .eq('id', garageId)
      .is('deleted_at', null)
      .single()

    if (error || !garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ garage })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/garages/[garageId]
 * Update a garage (partial update)
 */
export async function PATCH(
  request: NextRequest,
  { params }): { params: { garageId: string } }
) {
  const { garageId } = params

  try {
    const body = await request.json()
    const { name, description } = body

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description

    const { data: garage, error } = await supabase
      .from('garages')
      .update(updates)
      .eq('id', garageId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error updating garage:', error)
      return NextResponse.json(
        { error: 'Failed to update garage' },
        { status: 500 }
      )
    }

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ garage })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/garages/[garageId]
 * Soft delete a garage
 */
export async function DELETE(
  request: NextRequest,
  { params }): { params: { garageId: string } }
) {
  const { garageId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if garage has vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('garage_id', garageId)
      .is('deleted_at', null)
      .limit(1)

    if (vehicles && vehicles.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete garage with vehicles',
          message: 'Please remove or reassign all vehicles before deleting the garage'
        },
        { status: 400 }
      )
    }

    // Soft delete
    const { data: garage, error } = await supabase
      .from('garages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', garageId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Error deleting garage:', error)
      return NextResponse.json(
        { error: 'Failed to delete garage' },
        { status: 500 }
      )
    }

    if (!garage) {
      return NextResponse.json(
        { error: 'Garage not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Garage deleted successfully',
      garage
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
