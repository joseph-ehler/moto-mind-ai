import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
/**
 * GET /api/users/[userId]/preferences
 * Get user preferences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      preferences: user.preferences || {}
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
 * PATCH /api/users/[userId]/preferences
 * Update user preferences (partial update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params

  try {
    const body = await request.json()
    const { preferences } = body

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current preferences
    const { data: currentUser } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single()

    // Merge with new preferences
    const updatedPreferences = {
      ...(currentUser?.preferences || {}),
      ...preferences
    }

    // Update
    const { data: user, error } = await supabase
      .from('users')
      .update({ preferences: updatedPreferences })
      .eq('id', userId)
      .select('preferences')
      .single()

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      preferences: user.preferences
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
