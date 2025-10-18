/**
 * Onboarding Check Helper
 * Determines if user needs onboarding and where to redirect
 */

import { createServiceClient } from '@/lib/supabase/service-client'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkOnboardingStatus(userId: string): Promise<{
  needsOnboarding: boolean
  redirectTo: string
}> {
  try {
    // Create Supabase client
    const supabase = createServiceClient()
    
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
