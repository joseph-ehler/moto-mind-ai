/**
 * Cron Job: Ownership Resolution
 * Runs daily at 2am UTC to auto-resolve pending transfers
 * 
 * Schedule: 0 2 * * * (2am daily)
 * 
 * Tasks:
 * 1. Mark stale vehicles (60+ days inactive)
 * 2. Resolve pending transfers (7+ days no response)
 * 3. Expire reversible transfers (30+ days old)
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Verify cron secret to prevent unauthorized calls
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.warn('[CronJob] CRON_SECRET not configured')
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  const startTime = Date.now()
  
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  console.log('[CronJob/OwnershipResolution] Starting daily run...')
  
  try {
    const supabase = createServiceClient()
    const results = {
      staleVehicles: 0,
      resolvedTransfers: 0,
      expiredReversibility: 0,
      errors: [] as string[]
    }
    
    // Task 1: Mark stale vehicles
    try {
      const { data: staleCount, error: staleError } = await supabase
        .rpc('mark_stale_vehicles')
      
      if (staleError) {
        throw new Error(`mark_stale_vehicles failed: ${staleError.message}`)
      }
      
      results.staleVehicles = staleCount || 0
      console.log(`[CronJob] ✅ Marked ${results.staleVehicles} vehicles as stale`)
    } catch (error: any) {
      console.error('[CronJob] ❌ Error marking stale vehicles:', error)
      results.errors.push(error.message)
    }
    
    // Task 2: Resolve pending transfers
    try {
      const { data: resolvedCount, error: resolvedError } = await supabase
        .rpc('resolve_pending_transfers')
      
      if (resolvedError) {
        throw new Error(`resolve_pending_transfers failed: ${resolvedError.message}`)
      }
      
      results.resolvedTransfers = resolvedCount || 0
      console.log(`[CronJob] ✅ Resolved ${results.resolvedTransfers} pending transfers`)
    } catch (error: any) {
      console.error('[CronJob] ❌ Error resolving transfers:', error)
      results.errors.push(error.message)
    }
    
    // Task 3: Expire reversible transfers
    try {
      const { data: expiredCount, error: expiredError } = await supabase
        .rpc('expire_reversible_transfers')
      
      if (expiredError) {
        throw new Error(`expire_reversible_transfers failed: ${expiredError.message}`)
      }
      
      results.expiredReversibility = expiredCount || 0
      console.log(`[CronJob] ✅ Expired ${results.expiredReversibility} reversible transfers`)
    } catch (error: any) {
      console.error('[CronJob] ❌ Error expiring reversibility:', error)
      results.errors.push(error.message)
    }
    
    const duration = Date.now() - startTime
    
    console.log('[CronJob/OwnershipResolution] Completed:', {
      duration: `${duration}ms`,
      ...results
    })
    
    return NextResponse.json({
      success: true,
      duration,
      ...results
    })
    
  } catch (error: any) {
    console.error('[CronJob/OwnershipResolution] Fatal error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}
