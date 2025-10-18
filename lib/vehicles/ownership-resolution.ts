/**
 * Ownership Resolution System
 * Phase 2: Smart conflict resolution with auto-transfers
 * 
 * Key Features:
 * - Mileage-based proof (objective truth)
 * - Activity-based confidence scoring
 * - Auto-transfers for stale ownership
 * - Reversibility for safety
 * - Friendly notifications (not adversarial)
 */

import { createServiceClient } from '@/lib/supabase/service-client'
import type { CanonicalVehicle, UserVehicle } from './canonical-types'

// ============================================================================
// TYPES
// ============================================================================

export type ResolutionAction = 
  | 'allow'              // No conflict - first owner
  | 'auto_transfer'      // Instant transfer (stale or mileage proof)
  | 'notify_and_allow'   // Allow new owner, notify previous (7-day auto-resolve)
  | 'require_verification' // Need manual verification
  | 'escalate'           // Edge case - needs support

export type TransferReason =
  | 'first_owner'
  | 'account_deleted'
  | 'mileage_proof'
  | 'inactive_90_days'
  | 'inactive_60_days'
  | 'no_response_7_days'
  | 'manual_override'

export interface ResolutionResult {
  action: ResolutionAction
  reason: TransferReason | string
  message: string
  previousOwner?: {
    userId: string
    tenantId: string
    lastActivity: Date
    confidence: number
    status: string
  }
  requiresNotification: boolean
  reversibilityDays?: number
  autoResolveInDays?: number
}

export interface OwnershipCheckParams {
  vin: string
  newOwner: {
    userId: string
    tenantId: string
    currentMileage?: number
  }
}

// ============================================================================
// MAIN RESOLUTION LOGIC
// ============================================================================

/**
 * Resolve ownership conflict using intelligent rules
 * 
 * Rules (in priority order):
 * 1. No previous owner → Allow (first owner)
 * 2. Account deleted → Auto-transfer
 * 3. Mileage proof → Auto-transfer (objective truth!)
 * 4. 90+ days inactive → Auto-transfer with reversibility
 * 5. 60-90 days inactive → Notify and allow (auto-resolve in 7 days)
 * 6. < 60 days active → Require verification
 */
export async function resolveOwnership(
  params: OwnershipCheckParams
): Promise<ResolutionResult> {
  const supabase = createServiceClient()
  
  // Get canonical vehicle
  const { data: canonical } = await supabase
    .from('canonical_vehicles')
    .select('*')
    .eq('vin', params.vin)
    .single()
  
  if (!canonical) {
    // No conflict - first owner
    return {
      action: 'allow',
      reason: 'first_owner',
      message: 'No previous owner found',
      requiresNotification: false
    }
  }
  
  // Get active/stale instances from OTHER tenants
  const { data: previousInstances } = await supabase
    .from('user_vehicles')
    .select('*')
    .eq('canonical_vehicle_id', canonical.id)
    .neq('tenant_id', params.newOwner.tenantId)
    .in('status', ['active', 'stale', 'pending_verification'])
    .order('last_activity_at', { ascending: false })
  
  if (!previousInstances || previousInstances.length === 0) {
    // No cross-tenant conflict
    return {
      action: 'allow',
      reason: 'first_owner',
      message: 'No active instances from other tenants',
      requiresNotification: false
    }
  }
  
  // Use most recent instance as "previous owner"
  const previous = previousInstances[0]
  
  // Calculate days since activity
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(previous.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Calculate confidence
  const { data: confidenceData } = await supabase
    .rpc('calculate_ownership_confidence', {
      p_user_vehicle_id: previous.id
    })
  
  const confidence = confidenceData || 0
  
  // RULE 1: Account deleted = instant transfer
  // TODO: Check user account status when user table available
  
  // RULE 2: Mileage proof (OBJECTIVE TRUTH!) ⭐️
  if (
    params.newOwner.currentMileage &&
    previous.current_mileage &&
    params.newOwner.currentMileage > previous.current_mileage + 500
  ) {
    console.log('[OwnershipResolution] Mileage proof detected:', {
      previousMileage: previous.current_mileage,
      newMileage: params.newOwner.currentMileage,
      difference: params.newOwner.currentMileage - previous.current_mileage
    })
    
    return {
      action: 'auto_transfer',
      reason: 'mileage_proof',
      message: `Previous owner last logged ${previous.current_mileage} miles. You've logged ${params.newOwner.currentMileage} miles, proving you've been driving it.`,
      previousOwner: {
        userId: previous.user_id,
        tenantId: previous.tenant_id,
        lastActivity: new Date(previous.last_activity_at),
        confidence,
        status: previous.status
      },
      requiresNotification: true,
      reversibilityDays: 30
    }
  }
  
  // RULE 3: Very stale (90+ days) = instant transfer with reversibility
  if (daysSinceActivity >= 90 || confidence < 20) {
    return {
      action: 'auto_transfer',
      reason: 'inactive_90_days',
      message: `Previous owner hasn't used this vehicle in ${daysSinceActivity} days. Transferring ownership automatically.`,
      previousOwner: {
        userId: previous.user_id,
        tenantId: previous.tenant_id,
        lastActivity: new Date(previous.last_activity_at),
        confidence,
        status: previous.status
      },
      requiresNotification: true,
      reversibilityDays: 30
    }
  }
  
  // RULE 4: Moderately stale (60-90 days) = notify and allow
  if (daysSinceActivity >= 60 || confidence < 50) {
    return {
      action: 'notify_and_allow',
      reason: 'inactive_60_days',
      message: `Previous owner hasn't used this vehicle in ${daysSinceActivity} days. We've notified them - you'll have access immediately.`,
      previousOwner: {
        userId: previous.user_id,
        tenantId: previous.tenant_id,
        lastActivity: new Date(previous.last_activity_at),
        confidence,
        status: previous.status
      },
      requiresNotification: true,
      autoResolveInDays: 7
    }
  }
  
  // RULE 5: Active (< 60 days) = need verification
  if (daysSinceActivity < 60 || confidence >= 50) {
    return {
      action: 'require_verification',
      reason: 'active_owner',
      message: `Previous owner was active ${daysSinceActivity} days ago. We're checking with them to confirm the transfer.`,
      previousOwner: {
        userId: previous.user_id,
        tenantId: previous.tenant_id,
        lastActivity: new Date(previous.last_activity_at),
        confidence,
        status: previous.status
      },
      requiresNotification: true,
      autoResolveInDays: 7
    }
  }
  
  // Fallback - should never reach here
  return {
    action: 'escalate',
    reason: 'unknown',
    message: 'Unable to automatically resolve. Please contact support.',
    previousOwner: {
      userId: previous.user_id,
      tenantId: previous.tenant_id,
      lastActivity: new Date(previous.last_activity_at),
      confidence,
      status: previous.status
    },
    requiresNotification: true
  }
}

// ============================================================================
// TRANSFER EXECUTION
// ============================================================================

/**
 * Execute auto-transfer with proper history tracking
 */
export async function executeAutoTransfer(
  canonicalVehicleId: string,
  previousUserVehicleId: string,
  newOwner: {
    userId: string
    tenantId: string
  },
  reason: TransferReason,
  reversibilityDays?: number
): Promise<void> {
  const supabase = createServiceClient()
  
  // Update previous owner status
  await supabase
    .from('user_vehicles')
    .update({
      status: 'transferred',
      transferred_at: new Date().toISOString(),
      transfer_reason: reason,
      transfer_reversible_until: reversibilityDays
        ? new Date(Date.now() + reversibilityDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', previousUserVehicleId)
  
  // Record in ownership history
  await supabase
    .from('vehicle_ownership_history')
    .update({
      ended_at: new Date().toISOString(),
      transfer_type: reason === 'mileage_proof' ? 'mileage_proof' : 'auto_transfer'
    })
    .eq('user_vehicle_id', previousUserVehicleId)
    .is('ended_at', null)
  
  console.log('[OwnershipResolution] Auto-transfer executed:', {
    canonicalVehicleId,
    previousUserVehicleId,
    reason,
    reversibilityDays
  })
}

/**
 * Set up notify-and-allow (new owner gets access, previous owner notified)
 */
export async function setupNotifyAndAllow(
  previousUserVehicleId: string,
  autoResolveInDays: number
): Promise<void> {
  const supabase = createServiceClient()
  
  // Mark previous owner as pending verification
  await supabase
    .from('user_vehicles')
    .update({
      status: 'pending_verification',
      notification_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', previousUserVehicleId)
  
  console.log('[OwnershipResolution] Notify-and-allow setup:', {
    previousUserVehicleId,
    autoResolveInDays
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update last_activity_at when user interacts with vehicle
 */
export async function touchVehicleActivity(
  userVehicleId: string
): Promise<void> {
  const supabase = createServiceClient()
  
  await supabase
    .from('user_vehicles')
    .update({
      last_activity_at: new Date().toISOString()
    })
    .eq('id', userVehicleId)
}

/**
 * Recalculate and update confidence score
 */
export async function updateOwnershipConfidence(
  userVehicleId: string
): Promise<number> {
  const supabase = createServiceClient()
  
  const { data: confidence } = await supabase
    .rpc('calculate_ownership_confidence', {
      p_user_vehicle_id: userVehicleId
    })
  
  if (confidence !== null) {
    await supabase
      .from('user_vehicles')
      .update({
        ownership_confidence: confidence
      })
      .eq('id', userVehicleId)
  }
  
  return confidence || 0
}

/**
 * Check if vehicle is eligible for reclaim (reversible transfer)
 */
export async function canReclaimVehicle(
  userVehicleId: string
): Promise<boolean> {
  const supabase = createServiceClient()
  
  const { data: vehicle } = await supabase
    .from('user_vehicles')
    .select('transfer_reversible_until')
    .eq('id', userVehicleId)
    .single()
  
  if (!vehicle?.transfer_reversible_until) {
    return false
  }
  
  return new Date(vehicle.transfer_reversible_until) > new Date()
}

/**
 * Reclaim a transferred vehicle (within reversibility period)
 */
export async function reclaimVehicle(
  userVehicleId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient()
  
  // Check if still reversible
  const canReclaim = await canReclaimVehicle(userVehicleId)
  if (!canReclaim) {
    return {
      success: false,
      error: 'Reversibility period has expired'
    }
  }
  
  // Get vehicle details
  const { data: vehicle } = await supabase
    .from('user_vehicles')
    .select('*, canonical_vehicle_id')
    .eq('id', userVehicleId)
    .single()
  
  if (!vehicle || vehicle.user_id !== userId) {
    return {
      success: false,
      error: 'Not authorized to reclaim this vehicle'
    }
  }
  
  // Find the new owner's instance
  const { data: newOwnerInstance } = await supabase
    .from('user_vehicles')
    .select('id')
    .eq('canonical_vehicle_id', vehicle.canonical_vehicle_id)
    .eq('status', 'active')
    .neq('id', userVehicleId)
    .single()
  
  if (!newOwnerInstance) {
    return {
      success: false,
      error: 'No active instance found to reclaim from'
    }
  }
  
  // Revert transfer
  await supabase
    .from('user_vehicles')
    .update({
      status: 'active',
      transferred_at: null,
      transfer_reason: null,
      transfer_reversible_until: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userVehicleId)
  
  // Mark new owner as transferred
  await supabase
    .from('user_vehicles')
    .update({
      status: 'transferred',
      transferred_at: new Date().toISOString(),
      transfer_reason: 'reclaimed_by_previous_owner',
      updated_at: new Date().toISOString()
    })
    .eq('id', newOwnerInstance.id)
  
  return { success: true }
}
