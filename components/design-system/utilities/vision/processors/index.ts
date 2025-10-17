/**
 * Document Processors
 * 
 * Exports all document processors and provides auto-registration
 */

export { vinProcessor } from './vin-processor'
export { licensePlateProcessor } from './license-plate-processor'
export { driversLicenseProcessor } from './drivers-license-processor'
export { insuranceProcessor } from './insurance-processor'
export { odometerProcessor } from './odometer-processor'

export type { VINData, EnrichedVINData } from './vin-processor'
export type { LicensePlateData } from './license-plate-processor'
export type { DriversLicenseData, EnrichedDriversLicenseData } from './drivers-license-processor'
export type { InsuranceCardData, EnrichedInsuranceData } from './insurance-processor'
export type { OdometerData, EnrichedOdometerData } from './odometer-processor'

import { vinProcessor } from './vin-processor'
import { licensePlateProcessor } from './license-plate-processor'
import { driversLicenseProcessor } from './drivers-license-processor'
import { insuranceProcessor } from './insurance-processor'
import { odometerProcessor } from './odometer-processor'
import { getProcessorRegistry } from '../services/ProcessorRegistry'

/**
 * Register all processors
 * Call this once during app initialization
 */
export function registerAllProcessors(): void {
  const registry = getProcessorRegistry()
  
  // Register processors
  registry.register(vinProcessor, '1.0.0')
  registry.register(licensePlateProcessor, '1.0.0')
  registry.register(driversLicenseProcessor, '1.0.0')
  registry.register(insuranceProcessor, '1.0.0')
  registry.register(odometerProcessor, '1.0.0')
  
  console.log('[Processors] All processors registered:', registry.getTypes())
}

/**
 * Auto-register processors on import (optional)
 * Comment out if you prefer manual registration
 */
if (typeof window !== 'undefined') {
  registerAllProcessors()
}
