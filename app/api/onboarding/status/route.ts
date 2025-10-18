/**
 * API: Check Onboarding Status
 * GET /api/onboarding/status
 * 
 * Returns whether user needs onboarding and where to redirect
 */

import { NextResponse } from 'next/server'
import { requireUserServer } from '@/lib/auth/server'
import { checkOnboardingStatus } from '@/lib/onboarding/check'

export async function GET(request: Request) {
  try {
    console.log('[Onboarding/Status] Checking authentication...')
    
    // Authenticate user
    const { user } = await requireUserServer()
    console.log('[Onboarding/Status] User authenticated:', user.id)

    // Check onboarding status
    console.log('[Onboarding/Status] Checking onboarding for user:', user.id)
    const status = await checkOnboardingStatus(user.id)
    console.log('[Onboarding/Status] Result:', status)

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('[Onboarding/Status] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
