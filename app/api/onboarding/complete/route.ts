/**
 * API: Complete Onboarding
 * POST /api/onboarding/complete
 * 
 * Marks onboarding as complete (dashboard visited)
 */

import { NextResponse } from 'next/server'
import { requireUserServer } from '@/lib/auth/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { user } = await requireUserServer()
    
    // Create Supabase client
    const supabase = createServiceClient()

    // Update onboarding progress to dashboard (triggers auto-completion)
    const { error } = await supabase.rpc('update_onboarding_progress', {
      p_user_id: user.id,
      p_step: 'dashboard',
      p_flags: JSON.stringify({ dashboard_visited: true }),
    })

    if (error) {
      console.error('[Onboarding/Complete] Failed to update progress:', error)
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed',
    })
  } catch (error: any) {
    console.error('[Onboarding/Complete] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
