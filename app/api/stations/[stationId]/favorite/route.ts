import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * POST /api/stations/[stationId]/favorite
 * Mark a station as favorite
 * 
 * ELITE-TIER: Idempotent favorite operation
 * - Upsert pattern (safe to call multiple times)
 * - Tracks when favorited
 * - No errors if already favorited
 */
export async function POST(
  request: NextRequest,
  { params }): { params: { stationId: string } }
) {
  const { stationId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Get userId and tenantId from auth context
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')

    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse station ID to get station details
    const [vendor, lat, lng] = stationId.split('_')

    if (!vendor) {
      return NextResponse.json(
        { error: 'Invalid station ID' },
        { status: 400 }
      )
    }

    // ELITE: Upsert pattern (idempotent)
    const { data, error } = await supabase
      .from('favorite_stations')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        station_id: stationId,
        station_name: decodeURIComponent(vendor),
        station_lat: lat ? parseFloat(lat) : null,
        station_lng: lng ? parseFloat(lng) : null,
        favorited_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,station_id',
        ignoreDuplicates: false // Update favorited_at even if exists
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding favorite:', error)
      return NextResponse.json(
        { error: 'Failed to add favorite station' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      message: 'Station added to favorites'
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
 * DELETE /api/stations/[stationId]/favorite
 * Remove station from favorites
 * 
 * ELITE-TIER: Safe delete operation
 * - No error if not favorited
 * - Returns success either way
 */
export async function DELETE(
  request: NextRequest,
  { params }): { params: { stationId: string } }
) {
  const { stationId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('favorite_stations')
      .delete()
      .eq('user_id', userId)
      .eq('station_id', stationId)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json(
        { error: 'Failed to remove favorite station' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Station removed from favorites'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
