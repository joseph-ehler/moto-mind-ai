/**
 * Canonical Vehicle Service
 * Handles multi-tenant vehicle tracking with shared VIN data
 */

import { createClient } from '@supabase/supabase-js'
import type {
  CanonicalVehicle,
  UserVehicle,
  VehicleOwnershipHistory,
  SharedVehicleAccess,
  CreateCanonicalVehicleInput,
  CreateUserVehicleInput,
  UpdateUserVehicleInput,
  CreateOwnershipHistoryInput,
  CloseOwnershipHistoryInput,
  ShareVehicleInput,
  DuplicateVehicleDetection,
  VehicleHistoryPreview
} from './canonical-types'

// Lazy initialization
let supabase: ReturnType<typeof createClient>

function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false }
      }
    )
  }
  return supabase
}

// ===================================================
// Canonical Vehicle Operations
// ===================================================

/**
 * Get or create canonical vehicle
 * Idempotent - safe to call multiple times with same VIN
 */
export async function getOrCreateCanonicalVehicle(
  input: CreateCanonicalVehicleInput
): Promise<CanonicalVehicle> {
  const db = getSupabase()
  
  console.log('[Canonical] Getting or creating canonical vehicle:', input.vin)
  
  // Try to get existing
  const { data: existing } = await db
    .from('canonical_vehicles')
    .select('*')
    .eq('vin', input.vin)
    .single()
  
  if (existing) {
    console.log('[Canonical] Found existing canonical vehicle:', existing.id)
    
    // Update last_active_at
    await db
      .from('canonical_vehicles')
      .update({
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    
    return mapCanonicalVehicle(existing)
  }
  
  // Create new
  console.log('[Canonical] Creating new canonical vehicle')
  const { data: created, error } = await db
    .from('canonical_vehicles')
    .insert({
      vin: input.vin,
      year: input.year,
      make: input.make,
      model: input.model,
      trim: input.trim,
      display_name: input.displayName || `${input.year} ${input.make} ${input.model}`,
      body_type: input.bodyType,
      engine: input.engine,
      transmission: input.transmission,
      drive_type: input.driveType,
      fuel_type: input.fuelType,
      extended_specs: input.extendedSpecs,
      raw_vin_data: input.rawVinData,
      total_owners: 1
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Canonical] Error creating canonical vehicle:', error)
    throw new Error(`Failed to create canonical vehicle: ${error.message}`)
  }
  
  console.log('[Canonical] Created canonical vehicle:', created.id)
  return mapCanonicalVehicle(created)
}

/**
 * Get canonical vehicle by VIN
 */
export async function getCanonicalVehicleByVIN(vin: string): Promise<CanonicalVehicle | null> {
  const db = getSupabase()
  
  const { data, error } = await db
    .from('canonical_vehicles')
    .select('*')
    .eq('vin', vin)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return mapCanonicalVehicle(data)
}

/**
 * Get canonical vehicle by ID
 */
export async function getCanonicalVehicleById(id: string): Promise<CanonicalVehicle | null> {
  const db = getSupabase()
  
  const { data, error } = await db
    .from('canonical_vehicles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return mapCanonicalVehicle(data)
}

/**
 * Increment owner count for canonical vehicle
 */
export async function incrementCanonicalVehicleOwners(canonicalVehicleId: string): Promise<void> {
  const db = getSupabase()
  
  console.log('[Canonical] Incrementing owner count:', canonicalVehicleId)
  
  await db.rpc('increment_canonical_vehicle_owners', {
    p_canonical_vehicle_id: canonicalVehicleId
  })
}

/**
 * Update aggregated data for canonical vehicle
 */
export async function updateCanonicalVehicleAggregates(canonicalVehicleId: string): Promise<void> {
  const db = getSupabase()
  
  console.log('[Canonical] Updating aggregates:', canonicalVehicleId)
  
  await db.rpc('update_canonical_vehicle_aggregates', {
    p_canonical_vehicle_id: canonicalVehicleId
  })
}

// ===================================================
// User Vehicle Operations
// ===================================================

/**
 * Create user vehicle instance
 */
export async function createUserVehicle(input: CreateUserVehicleInput): Promise<UserVehicle> {
  const db = getSupabase()
  
  console.log('[Canonical] Creating user vehicle:', input)
  
  const { data, error } = await db
    .from('user_vehicles')
    .insert({
      canonical_vehicle_id: input.canonicalVehicleId,
      tenant_id: input.tenantId,
      user_id: input.userId,
      nickname: input.nickname,
      color: input.color,
      license_plate: input.licensePlate,
      purchase_date: input.purchaseDate?.toISOString().split('T')[0],
      purchase_price: input.purchasePrice,
      current_mileage: input.currentMileage,
      share_maintenance_history: input.shareMaintenanceHistory ?? false,
      share_cost_data: input.shareCostData ?? false,
      share_usage_patterns: input.shareUsagePatterns ?? false,
      status: 'active'
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Canonical] Error creating user vehicle:', error)
    throw new Error(`Failed to create user vehicle: ${error.message}`)
  }
  
  console.log('[Canonical] Created user vehicle:', data.id)
  return mapUserVehicle(data)
}

/**
 * Get user vehicle by ID
 */
export async function getUserVehicleById(id: string): Promise<UserVehicle | null> {
  const db = getSupabase()
  
  const { data, error } = await db
    .from('user_vehicles')
    .select(`
      *,
      canonical_vehicle:canonical_vehicles(*)
    `)
    .eq('id', id)
    .single()
  
  if (error || !data) {
    return null
  }
  
  const vehicle = mapUserVehicle(data)
  if (data.canonical_vehicle) {
    vehicle.canonicalVehicle = mapCanonicalVehicle(data.canonical_vehicle)
  }
  
  return vehicle
}

/**
 * Get user vehicles for tenant
 */
export async function getUserVehiclesForTenant(tenantId: string): Promise<UserVehicle[]> {
  const db = getSupabase()
  
  const { data, error } = await db
    .from('user_vehicles')
    .select(`
      *,
      canonical_vehicle:canonical_vehicles(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (error || !data) {
    return []
  }
  
  return data.map(v => {
    const vehicle = mapUserVehicle(v)
    if (v.canonical_vehicle) {
      vehicle.canonicalVehicle = mapCanonicalVehicle(v.canonical_vehicle)
    }
    return vehicle
  })
}

/**
 * Update user vehicle
 */
export async function updateUserVehicle(
  id: string,
  input: UpdateUserVehicleInput
): Promise<UserVehicle> {
  const db = getSupabase()
  
  console.log('[Canonical] Updating user vehicle:', id, input)
  
  const updateData: Record<string, any> = {}
  
  if (input.nickname !== undefined) updateData.nickname = input.nickname
  if (input.color !== undefined) updateData.color = input.color
  if (input.licensePlate !== undefined) updateData.license_plate = input.licensePlate
  if (input.currentMileage !== undefined) updateData.current_mileage = input.currentMileage
  if (input.purchaseDate !== undefined) {
    updateData.purchase_date = input.purchaseDate.toISOString().split('T')[0]
  }
  if (input.purchasePrice !== undefined) updateData.purchase_price = input.purchasePrice
  if (input.shareMaintenanceHistory !== undefined) {
    updateData.share_maintenance_history = input.shareMaintenanceHistory
  }
  if (input.shareCostData !== undefined) updateData.share_cost_data = input.shareCostData
  if (input.shareUsagePatterns !== undefined) {
    updateData.share_usage_patterns = input.shareUsagePatterns
  }
  if (input.status !== undefined) updateData.status = input.status
  if (input.ownershipEndDate !== undefined) {
    updateData.ownership_end_date = input.ownershipEndDate.toISOString()
  }
  
  const { data, error } = await db
    .from('user_vehicles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('[Canonical] Error updating user vehicle:', error)
    throw new Error(`Failed to update user vehicle: ${error.message}`)
  }
  
  return mapUserVehicle(data)
}

/**
 * Check for duplicate vehicle in tenant
 */
export async function checkDuplicateVehicle(
  canonicalVehicleId: string,
  tenantId: string
): Promise<DuplicateVehicleDetection> {
  const db = getSupabase()
  
  console.log('[Canonical] Checking for duplicate:', { canonicalVehicleId, tenantId })
  
  const { data: existing } = await db
    .from('user_vehicles')
    .select(`
      *,
      canonical_vehicle:canonical_vehicles(*)
    `)
    .eq('canonical_vehicle_id', canonicalVehicleId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single()
  
  if (!existing) {
    return {
      isDuplicate: false
    }
  }
  
  const vehicle = mapUserVehicle(existing)
  if (existing.canonical_vehicle) {
    vehicle.canonicalVehicle = mapCanonicalVehicle(existing.canonical_vehicle)
  }
  
  return {
    isDuplicate: true,
    existingVehicle: vehicle,
    canonicalVehicle: vehicle.canonicalVehicle,
    message: 'This vehicle is already in your garage.',
    suggestedAction: 'view_existing'
  }
}

// ===================================================
// Ownership History Operations
// ===================================================

/**
 * Create ownership history record
 */
export async function createOwnershipHistory(
  input: CreateOwnershipHistoryInput
): Promise<VehicleOwnershipHistory> {
  const db = getSupabase()
  
  console.log('[Canonical] Creating ownership history:', input)
  
  const { data, error } = await db
    .from('vehicle_ownership_history')
    .insert({
      canonical_vehicle_id: input.canonicalVehicleId,
      tenant_id: input.tenantId,
      user_id: input.userId,
      user_vehicle_id: input.userVehicleId,
      started_at: input.startedAt?.toISOString() || new Date().toISOString(),
      starting_mileage: input.startingMileage,
      transfer_type: input.transferType
    })
    .select()
    .single()
  
  if (error) {
    console.error('[Canonical] Error creating ownership history:', error)
    throw new Error(`Failed to create ownership history: ${error.message}`)
  }
  
  return mapOwnershipHistory(data)
}

/**
 * Close ownership history (mark vehicle as sold/transferred)
 */
export async function closeOwnershipHistory(
  input: CloseOwnershipHistoryInput
): Promise<void> {
  const db = getSupabase()
  
  console.log('[Canonical] Closing ownership history:', input)
  
  const { error } = await db
    .from('vehicle_ownership_history')
    .update({
      ended_at: input.endedAt?.toISOString() || new Date().toISOString(),
      ending_mileage: input.endingMileage,
      transfer_type: input.transferType,
      transfer_price: input.transferPrice,
      transfer_to_tenant_id: input.transferToTenantId,
      transfer_notes: input.transferNotes
    })
    .eq('canonical_vehicle_id', input.canonicalVehicleId)
    .eq('tenant_id', input.tenantId)
    .is('ended_at', null)
  
  if (error) {
    console.error('[Canonical] Error closing ownership history:', error)
    throw new Error(`Failed to close ownership history: ${error.message}`)
  }
}

/**
 * Get ownership history for canonical vehicle
 */
export async function getOwnershipHistory(
  canonicalVehicleId: string
): Promise<VehicleOwnershipHistory[]> {
  const db = getSupabase()
  
  const { data, error } = await db
    .from('vehicle_ownership_history')
    .select('*')
    .eq('canonical_vehicle_id', canonicalVehicleId)
    .order('started_at', { ascending: false })
  
  if (error || !data) {
    return []
  }
  
  return data.map(mapOwnershipHistory)
}

/**
 * Get vehicle history preview (for new buyers)
 */
export async function getVehicleHistoryPreview(
  canonicalVehicleId: string
): Promise<VehicleHistoryPreview | null> {
  const db = getSupabase()
  
  const { data: canonical } = await db
    .from('canonical_vehicles')
    .select('*')
    .eq('id', canonicalVehicleId)
    .single()
  
  if (!canonical) {
    return null
  }
  
  const { data: history } = await db
    .from('vehicle_ownership_history')
    .select('*')
    .eq('canonical_vehicle_id', canonicalVehicleId)
  
  // Count shared maintenance records (future)
  const hasSharedHistory = false // TODO: Check maintenance_records
  const anonymizedMaintenanceCount = 0 // TODO: Count from maintenance_records
  
  return {
    canonicalVehicleId: canonical.id,
    vin: canonical.vin,
    totalOwners: canonical.total_owners || 1,
    hasSharedHistory,
    anonymizedMaintenanceCount,
    avgAnnualCost: canonical.avg_annual_cost,
    avgMpg: canonical.avg_mpg_city && canonical.avg_mpg_highway ? {
      city: canonical.avg_mpg_city,
      highway: canonical.avg_mpg_highway
    } : undefined,
    commonIssues: canonical.common_issues || [],
    lastKnownMileage: history?.[0]?.ending_mileage
  }
}

// ===================================================
// Mappers (DB → Domain)
// ===================================================

function mapCanonicalVehicle(data: any): CanonicalVehicle {
  return {
    id: data.id,
    vin: data.vin,
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim,
    displayName: data.display_name,
    bodyType: data.body_type,
    engine: data.engine,
    transmission: data.transmission,
    driveType: data.drive_type,
    fuelType: data.fuel_type,
    extendedSpecs: data.extended_specs,
    totalOwners: data.total_owners || 1,
    firstRegisteredAt: new Date(data.first_registered_at),
    lastActiveAt: new Date(data.last_active_at),
    avgAnnualCost: data.avg_annual_cost,
    avgMpgCity: data.avg_mpg_city,
    avgMpgHighway: data.avg_mpg_highway,
    commonIssues: data.common_issues || [],
    rawVinData: data.raw_vin_data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

function mapUserVehicle(data: any): UserVehicle {
  return {
    id: data.id,
    canonicalVehicleId: data.canonical_vehicle_id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    nickname: data.nickname,
    color: data.color,
    licensePlate: data.license_plate,
    purchaseDate: data.purchase_date ? new Date(data.purchase_date) : undefined,
    purchasePrice: data.purchase_price,
    currentMileage: data.current_mileage,
    shareMaintenanceHistory: data.share_maintenance_history ?? false,
    shareCostData: data.share_cost_data ?? false,
    shareUsagePatterns: data.share_usage_patterns ?? false,
    status: data.status,
    ownershipStartDate: new Date(data.ownership_start_date),
    ownershipEndDate: data.ownership_end_date ? new Date(data.ownership_end_date) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  }
}

function mapOwnershipHistory(data: any): VehicleOwnershipHistory {
  return {
    id: data.id,
    canonicalVehicleId: data.canonical_vehicle_id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    userVehicleId: data.user_vehicle_id,
    startedAt: new Date(data.started_at),
    endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
    startingMileage: data.starting_mileage,
    endingMileage: data.ending_mileage,
    transferType: data.transfer_type,
    transferPrice: data.transfer_price,
    transferToTenantId: data.transfer_to_tenant_id,
    transferNotes: data.transfer_notes,
    createdAt: new Date(data.created_at)
  }
}
