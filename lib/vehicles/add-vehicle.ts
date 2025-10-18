/**
 * Add Vehicle Flow
 * Integrates VIN decoder with canonical vehicle system
 */

import { decodeVIN } from '../vin/decoder'
import {
  getOrCreateCanonicalVehicle,
  createUserVehicle,
  createOwnershipHistory,
  checkDuplicateVehicle,
  incrementCanonicalVehicleOwners,
  getVehicleHistoryPreview
} from './canonical-service'
import type {
  CreateUserVehicleInput,
  DuplicateVehicleDetection,
  UserVehicle,
  VehicleHistoryPreview
} from './canonical-types'
import type { VINDecodeResult } from '../vin/types'

// ===================================================
// Add Vehicle Flow
// ===================================================

export interface AddVehicleInput {
  vin: string
  tenantId: string
  userId: string
  
  // Optional user customization
  nickname?: string
  color?: string
  licensePlate?: string
  purchaseDate?: Date
  purchasePrice?: number
  currentMileage?: number
  
  // Privacy settings
  shareMaintenanceHistory?: boolean
  shareCostData?: boolean
  shareUsagePatterns?: boolean
}

export interface AddVehicleResult {
  userVehicle: UserVehicle
  vinData: VINDecodeResult
  duplicate?: DuplicateVehicleDetection
  historyPreview?: VehicleHistoryPreview
  isNewCanonicalVehicle: boolean
}

/**
 * Add vehicle via VIN
 * Main entry point for adding vehicles
 */
export async function addVehicleByVIN(input: AddVehicleInput): Promise<AddVehicleResult> {
  console.log('[AddVehicle] Starting add vehicle flow:', input.vin)
  
  try {
    // Step 1: Decode VIN (uses cache if available)
    console.log('[AddVehicle] Step 1: Decoding VIN...')
    const vinData = await decodeVIN(input.vin)
    
    // Step 2: Get or create canonical vehicle
    console.log('[AddVehicle] Step 2: Get/create canonical vehicle...')
    const canonical = await getOrCreateCanonicalVehicle({
      vin: input.vin,
      year: vinData.vehicle.year,
      make: vinData.vehicle.make,
      model: vinData.vehicle.model,
      trim: vinData.vehicle.trim,
      displayName: vinData.vehicle.displayName,
      bodyType: vinData.specs?.bodyType,
      engine: vinData.specs?.engine,
      transmission: vinData.specs?.transmission,
      driveType: vinData.specs?.driveType,
      fuelType: vinData.specs?.fuelType,
      extendedSpecs: vinData.extendedSpecs,
      rawVinData: vinData as any
    })
    
    const isNewCanonicalVehicle = canonical.totalOwners === 1
    
    // Step 3: Check for duplicates in this tenant
    console.log('[AddVehicle] Step 3: Checking for duplicates...')
    const duplicate = await checkDuplicateVehicle(canonical.id, input.tenantId)
    
    if (duplicate.isDuplicate) {
      console.log('[AddVehicle] Duplicate detected!')
      return {
        userVehicle: duplicate.existingVehicle!,
        vinData,
        duplicate,
        isNewCanonicalVehicle
      }
    }
    
    // Step 4: Get history preview (if not first owner)
    console.log('[AddVehicle] Step 4: Getting history preview...')
    let historyPreview: VehicleHistoryPreview | undefined
    if (!isNewCanonicalVehicle) {
      const preview = await getVehicleHistoryPreview(canonical.id)
      if (preview) {
        historyPreview = preview
      }
    }
    
    // Step 5: Create user vehicle instance
    console.log('[AddVehicle] Step 5: Creating user vehicle...')
    const userVehicle = await createUserVehicle({
      canonicalVehicleId: canonical.id,
      tenantId: input.tenantId,
      userId: input.userId,
      nickname: input.nickname,
      color: input.color,
      licensePlate: input.licensePlate,
      purchaseDate: input.purchaseDate,
      purchasePrice: input.purchasePrice,
      currentMileage: input.currentMileage,
      shareMaintenanceHistory: input.shareMaintenanceHistory ?? false,
      shareCostData: input.shareCostData ?? false,
      shareUsagePatterns: input.shareUsagePatterns ?? false
    })
    
    // Step 6: Create ownership history record
    console.log('[AddVehicle] Step 6: Creating ownership history...')
    await createOwnershipHistory({
      canonicalVehicleId: canonical.id,
      tenantId: input.tenantId,
      userId: input.userId,
      userVehicleId: userVehicle.id,
      startedAt: new Date(),
      startingMileage: input.currentMileage,
      transferType: 'purchase'
    })
    
    // Step 7: Increment owner count (if not first)
    if (!isNewCanonicalVehicle) {
      console.log('[AddVehicle] Step 7: Incrementing owner count...')
      await incrementCanonicalVehicleOwners(canonical.id)
    }
    
    console.log('[AddVehicle] ✅ Vehicle added successfully!')
    
    return {
      userVehicle,
      vinData,
      historyPreview,
      isNewCanonicalVehicle
    }
    
  } catch (error) {
    console.error('[AddVehicle] Error adding vehicle:', error)
    throw error
  }
}

/**
 * Add vehicle manually (no VIN)
 * For vehicles without VINs or when VIN decode fails
 */
export async function addVehicleManually(input: {
  year: number
  make: string
  model: string
  tenantId: string
  userId: string
  nickname?: string
  color?: string
  licensePlate?: string
  purchaseDate?: Date
  purchasePrice?: number
  currentMileage?: number
}): Promise<UserVehicle> {
  console.log('[AddVehicle] Adding vehicle manually (no VIN)')
  
  // For manual entry, we create a canonical vehicle with a placeholder VIN
  // Format: MANUAL-{timestamp}-{random}
  const placeholderVIN = `MANUAL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
  
  const canonical = await getOrCreateCanonicalVehicle({
    vin: placeholderVIN,
    year: input.year,
    make: input.make,
    model: input.model,
    displayName: `${input.year} ${input.make} ${input.model}`
  })
  
  const userVehicle = await createUserVehicle({
    canonicalVehicleId: canonical.id,
    tenantId: input.tenantId,
    userId: input.userId,
    nickname: input.nickname,
    color: input.color,
    licensePlate: input.licensePlate,
    purchaseDate: input.purchaseDate,
    purchasePrice: input.purchasePrice,
    currentMileage: input.currentMileage
  })
  
  await createOwnershipHistory({
    canonicalVehicleId: canonical.id,
    tenantId: input.tenantId,
    userId: input.userId,
    userVehicleId: userVehicle.id,
    startingMileage: input.currentMileage
  })
  
  console.log('[AddVehicle] ✅ Manual vehicle added successfully!')
  
  return userVehicle
}
