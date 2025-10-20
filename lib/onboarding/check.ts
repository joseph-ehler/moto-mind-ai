/**
 * Onboarding Check Helper
 * Smart onboarding detection with multiple checks:
 * 1. Checks if user already has vehicles (skip onboarding)
 * 2. Handles abandoned sessions (>24h)
 * 3. Routes to VIN flow (not manual entry)
 * 4. Provides gentle prompts instead of forcing flow
 */

import { createServiceClient } from '@/lib/supabase/service-client'

export async function checkOnboardingStatus(userId: string): Promise<{
  needsOnboarding: boolean
  redirectTo: string
}> {
  try {
    const supabase = createServiceClient()
    
    // 1. FIRST CHECK: Does user already have vehicles?
    // They might have added via API, other routes, or skipped onboarding
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('user_vehicles')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (!vehiclesError && vehicles && vehicles.length > 0) {
      // User has vehicles → skip onboarding, go to dashboard
      console.log('[Onboarding/Check] User has vehicles, skipping onboarding')
      return {
        needsOnboarding: false,
        redirectTo: '/dashboard',
      }
    }
    
    // 2. Check onboarding record
    const { data: onboarding, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !onboarding) {
      // New user → start onboarding
      console.log('[Onboarding/Check] New user, starting onboarding')
      return {
        needsOnboarding: true,
        redirectTo: '/onboarding/welcome',
      }
    }

    // 3. Check if completed
    if (onboarding.completed_at) {
      return {
        needsOnboarding: false,
        redirectTo: '/dashboard',
      }
    }

    // 4. Check for abandoned session (>24 hours old)
    if (onboarding.started_at) {
      const hoursSinceStart = 
        (Date.now() - new Date(onboarding.started_at).getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceStart > 24) {
        // Old abandoned session → let them explore dashboard
        // Show gentle prompt instead of forcing onboarding
        console.log('[Onboarding/Check] Abandoned session (>24h), showing dashboard with prompt')
        return {
          needsOnboarding: false,
          redirectTo: '/dashboard?showOnboardingPrompt=true',
        }
      }
    }

    // 5. Resume onboarding where they left off
    if (!onboarding.vehicle_added) {
      // ✅ CRITICAL FIX: Route to VIN flow, not manual entry!
      console.log('[Onboarding/Check] Resuming onboarding at VIN step')
      return {
        needsOnboarding: true,
        redirectTo: '/onboarding/vin',  // ✅ VIN-first (not /vehicle)
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
