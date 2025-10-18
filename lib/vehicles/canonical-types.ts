/**
 * Canonical Vehicle System Types
 * Multi-tenant vehicle tracking with shared VIN data
 */

// ===================================================
// Canonical Vehicle (One per VIN)
// ===================================================

export interface CanonicalVehicle {
  id: string
  vin: string
  
  // VIN decode data (shared)
  year: number
  make: string
  model: string
  trim?: string
  displayName: string
  
  // Vehicle specs
  bodyType?: string
  engine?: string
  transmission?: string
  driveType?: string
  fuelType?: string
  
  // Extended specs (flexible)
  extendedSpecs?: Record<string, any>
  
  // Aggregated data
  totalOwners: number
  firstRegisteredAt: Date
  lastActiveAt: Date
  
  // Crowdsourced data (anonymized)
  avgAnnualCost?: number
  avgMpgCity?: number
  avgMpgHighway?: number
  commonIssues?: CommonIssue[]
  
  // Raw data
  rawVinData?: Record<string, any>
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface CommonIssue {
  issue: string
  occurrences: number
  avgMileage?: number
  avgCost?: number
}

// ===================================================
// User Vehicle Instance (Per Tenant)
// ===================================================

export interface UserVehicle {
  id: string
  
  // Link to canonical
  canonicalVehicleId: string
  
  // Ownership
  tenantId: string
  userId: string
  
  // Customization
  nickname?: string
  color?: string
  licensePlate?: string
  
  // Ownership details
  purchaseDate?: Date
  purchasePrice?: number
  currentMileage?: number
  
  // Privacy settings
  shareMaintenanceHistory: boolean
  shareCostData: boolean
  shareUsagePatterns: boolean
  
  // Status
  status: VehicleStatus
  ownershipStartDate: Date
  ownershipEndDate?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Populated relations
  canonicalVehicle?: CanonicalVehicle
  sharedWith?: SharedVehicleAccess[]
}

export type VehicleStatus = 'active' | 'sold' | 'totaled' | 'inactive'

// ===================================================
// Vehicle Ownership History
// ===================================================

export interface VehicleOwnershipHistory {
  id: string
  canonicalVehicleId: string
  
  // Ownership
  tenantId: string
  userId: string
  userVehicleId?: string
  
  // Timeline
  startedAt: Date
  endedAt?: Date
  
  // Mileage
  startingMileage?: number
  endingMileage?: number
  
  // Transfer details
  transferType?: TransferType
  transferPrice?: number
  transferToTenantId?: string
  transferNotes?: string
  
  // Metadata
  createdAt: Date
}

export type TransferType = 'purchase' | 'sale' | 'lease_end' | 'gift' | 'trade_in' | 'unknown'

// ===================================================
// Shared Vehicle Access
// ===================================================

export interface SharedVehicleAccess {
  id: string
  userVehicleId: string
  
  // Sharing details
  sharedWithUserId: string
  sharedByUserId: string
  
  // Access level
  accessLevel: AccessLevel
  
  // Permissions
  canViewMaintenance: boolean
  canAddMaintenance: boolean
  canViewCosts: boolean
  canEditVehicle: boolean
  canDelete: boolean
  
  // Status
  status: ShareStatus
  expiresAt?: Date
  
  // Invitation
  invitationToken?: string
  invitationAcceptedAt?: Date
  
  // Metadata
  createdAt: Date
  revokedAt?: Date
  revokedByUserId?: string
  
  // Populated
  userVehicle?: UserVehicle
  sharedWithUser?: { id: string; name?: string; email?: string }
  sharedByUser?: { id: string; name?: string; email?: string }
}

export type AccessLevel = 'view' | 'edit' | 'full'
export type ShareStatus = 'active' | 'revoked' | 'expired'

// ===================================================
// Service DTOs
// ===================================================

/**
 * Create canonical vehicle input
 */
export interface CreateCanonicalVehicleInput {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  displayName?: string
  bodyType?: string
  engine?: string
  transmission?: string
  driveType?: string
  fuelType?: string
  extendedSpecs?: Record<string, any>
  rawVinData?: Record<string, any>
}

/**
 * Create user vehicle input
 */
export interface CreateUserVehicleInput {
  canonicalVehicleId: string
  tenantId: string
  userId: string
  nickname?: string
  color?: string
  licensePlate?: string
  purchaseDate?: Date
  purchasePrice?: number
  currentMileage?: number
  shareMaintenanceHistory?: boolean
  shareCostData?: boolean
  shareUsagePatterns?: boolean
}

/**
 * Update user vehicle input
 */
export interface UpdateUserVehicleInput {
  nickname?: string
  color?: string
  licensePlate?: string
  currentMileage?: number
  purchaseDate?: Date
  purchasePrice?: number
  shareMaintenanceHistory?: boolean
  shareCostData?: boolean
  shareUsagePatterns?: boolean
  status?: VehicleStatus
  ownershipEndDate?: Date
}

/**
 * Create ownership history input
 */
export interface CreateOwnershipHistoryInput {
  canonicalVehicleId: string
  tenantId: string
  userId: string
  userVehicleId?: string
  startedAt?: Date
  startingMileage?: number
  transferType?: TransferType
}

/**
 * Close ownership history input
 */
export interface CloseOwnershipHistoryInput {
  canonicalVehicleId: string
  tenantId: string
  endedAt?: Date
  endingMileage?: number
  transferType?: TransferType
  transferPrice?: number
  transferToTenantId?: string
  transferNotes?: string
}

/**
 * Share vehicle input
 */
export interface ShareVehicleInput {
  userVehicleId: string
  sharedWithUserId: string
  sharedByUserId: string
  accessLevel?: AccessLevel
  canViewMaintenance?: boolean
  canAddMaintenance?: boolean
  canViewCosts?: boolean
  canEditVehicle?: boolean
  canDelete?: boolean
  expiresAt?: Date
}

/**
 * Accept vehicle share input
 */
export interface AcceptVehicleShareInput {
  invitationToken: string
  userId: string
}

/**
 * Revoke vehicle share input
 */
export interface RevokeVehicleShareInput {
  shareId: string
  revokedByUserId: string
}

// ===================================================
// Query Results
// ===================================================

/**
 * Duplicate vehicle detection result
 */
export interface DuplicateVehicleDetection {
  isDuplicate: boolean
  existingVehicle?: UserVehicle
  canonicalVehicle?: CanonicalVehicle
  message?: string
  suggestedAction?: 'request_access' | 'create_duplicate' | 'view_existing'
}

/**
 * Vehicle history preview
 */
export interface VehicleHistoryPreview {
  canonicalVehicleId: string
  vin: string
  totalOwners: number
  hasSharedHistory: boolean
  anonymizedMaintenanceCount?: number
  avgAnnualCost?: number
  avgMpg?: {
    city: number
    highway: number
  }
  commonIssues?: CommonIssue[]
  lastKnownMileage?: number
}

/**
 * Full vehicle with relations
 */
export interface VehicleWithRelations extends UserVehicle {
  canonicalVehicle: CanonicalVehicle
  ownershipHistory: VehicleOwnershipHistory[]
  sharedWith: SharedVehicleAccess[]
}
