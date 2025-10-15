/**
 * Domain Types (Backward Compatibility)
 * 
 * Vehicle types have been moved to features/vehicles/domain/types.ts
 * This file re-exports them for backward compatibility with existing imports.
 * 
 * New code should import directly from:
 * @/features/vehicles/domain/types
 */

export {
  type Vehicle,
  type VehicleDisplayInfo,
  type ServiceRecord,
  type FuelRecord,
  type OdometerReading,
  getVehicleDisplayName,
  isValidVIN,
  parseVINInfo
} from '@/features/vehicles/domain/types'
