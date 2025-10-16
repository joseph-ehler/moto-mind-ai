/**
 * Vehicles Feature - Public API
 * 
 * Comprehensive vehicle management system.
 * Handles vehicle lifecycle, maintenance tracking, and fleet management.
 * 
 * Architecture:
 * - domain/ - Types and business logic
 *   * Vehicle types and interfaces
 *   * VIN validation and parsing
 *   * Display name generation
 *   * Service, fuel, odometer records
 *   * Fleet rules and health scoring
 * 
 * - data/ - API calls and data management
 *   * CRUD operations for vehicles
 *   * VIN decoding service
 *   * Event tracking
 *   * Image uploads
 *   * Maintenance preferences
 * 
 * - hooks/ - React hooks for state management
 *   * useVehicles - Vehicle list management
 *   * useVehicleEvents - Event history
 *   * useOptimisticActions - Optimistic UI updates
 * 
 * - ui/ - 54 vehicle-related components
 *   * Vehicle lists and selectors
 *   * Onboarding flows
 *   * Detail views and dashboards
 *   * Fleet chat and conversations
 *   * Specs and documentation
 * 
 * - __tests__/ - 11 test files
 * 
 * Key Features:
 * - VIN-based vehicle identification
 * - Multi-source data integration
 * - Maintenance tracking
 * - Fleet chat and AI assistance
 * - Comprehensive specs database
 * - Event and document management
 */

// Domain exports (types and business logic)
export type {
  Vehicle,
  VehicleDisplayInfo,
  ServiceRecord,
  FuelRecord,
  OdometerReading,
} from './domain/types'

export {
  getVehicleDisplayName,
  isValidVIN,
  parseVINInfo,
} from './domain/types'

// Data layer
export { getVehicle, createVehicle } from './data'

// Hooks
export {
  useVehicles,
  useVehicleEvents,
  useOptimisticActions,
} from './hooks'

// UI Components
export * from './ui'
