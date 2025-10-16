import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/garages/[garageId]/vehicles
 * List all vehicles in a garage
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

    // Get vehicles in this garage
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('garage_id', garageId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vehicles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      vehicles: vehicles || [],
      garage: {
        id: garage.id,
        name: garage.name
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
