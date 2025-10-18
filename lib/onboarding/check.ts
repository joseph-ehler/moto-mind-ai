/**
 * Onboarding Check Helper
 * Determines if user needs onboarding and where to redirect
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function checkOnboardingStatus(userId: string): Promise<{
  needsOnboarding: boolean
  redirectTo: string
}> {
  try {
    // Check if user has onboarding record
    const { data: onboarding, error } = await supabase
      .from('user_onboarding')
      .select('completed_at, vehicle_added, dashboard_visited')
      .eq('user_id', userId)
      .single()

    if (error || !onboarding) {
      // No onboarding record = new user
      return {
        needsOnboarding: true,
        redirectTo: '/onboarding/welcome',
      }
    }

    // Check if completed
    if (onboarding.completed_at) {
      return {
        needsOnboarding: false,
        redirectTo: '/dashboard',
      }
    }

    // Check progress
    if (!onboarding.vehicle_added) {
      return {
        needsOnboarding: true,
        redirectTo: '/onboarding/vehicle',
      }
    }

    if (!onboarding.dashboard_visited) {
      return {
        needsOnboarding: true,
        redirectTo: '/onboarding/complete',
      }
    }

    // Fallback to dashboard
    return {
      needsOnboarding: false,
      redirectTo: '/dashboard',
    }
  } catch (error) {
    console.error('[Onboarding/Check] Error:', error)
    // Fail safe to onboarding
    return {
      needsOnboarding: true,
      redirectTo: '/onboarding/welcome',
    }
  }
}
