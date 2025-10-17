/**
 * Timeline Feature - Public API
 * 
 * Central organizing principle for all vehicle data.
 * Every interaction (photos, readings, receipts) becomes a timeline item.
 * 
 * Architecture:
 * - domain/ - Types and pure business logic
 *   * Comprehensive timeline types (18 item types!)
 *   * Type-specific data interfaces
 *   * Sorting, filtering, grouping functions
 *   * Mileage calculations
 * 
 * - data/ - API calls and data management (placeholder)
 *   * Timeline CRUD operations
 *   * Photo uploads and management
 *   * Analytics queries
 *   * Data enrichment (weather, location)
 *   * Real-time subscriptions
 * 
 * - hooks/ - React hooks for state management
 *   * useTimeline, useTimelineItem
 *   * Photo capture workflows
 *   * Filter and sort state
 * 
 * - ui/ - 48 timeline-related components
 *   * Timeline views and displays
 *   * Item cards for each type
 *   * Photo galleries
 *   * Filters and controls
 * 
 * - __tests__/ - Tests and mocks
 * 
 * Key Features:
 * - Multi-type support (18 item types!)
 * - Vision-first approach (photos + AI extraction)
 * - Rich metadata (weather, location, EXIF)
 * - Time-based organization
 * - Advanced filtering and grouping
 * - Photo management
 * - Real-time updates
 */

// Domain exports (types and business logic)
export type {
  TimelineItemType,
  TimelineItemBase,
  TimelineItem,
  TimelineFilter,
  TimelineConfig,
  TimelineQueryOptions,
  TimelineListResponse,
  CreateTimelineItemInput,
  UpdateTimelineItemInput,
  TimelineStats,
  
  // Type-specific data
  OdometerData,
  ServiceData,
  FuelData,
  DashboardWarningData,
  TireTreadData,
  TirePressureData,
  DamageData,
  ParkingData,
  InspectionData,
  RecallData,
  ModificationData,
  CarWashData,
  TripData,
  ExpenseData,
} from './domain'

export {
  sortTimelineItems,
  filterTimelineByType,
  filterTimelineByDateRange,
  groupTimelineByDate,
  groupTimelineByMonth,
  countItemsByType,
  getTimelineDateRange,
  calculateTotalMileage,
  findTimelineItem,
  getRelatedTimelineItems,
  hasPhoto,
  hasLocation,
  getTimelineTypeLabel,
} from './domain'

// Data layer (future)
// export { getTimeline, getTimelineItem, createTimelineItem } from './data'
// export { getTimelineStats, getMileageHistory, getServiceHistory } from './data'

// Hooks (already exist)
export * from './hooks'

// UI Components (already exist - 48 components!)
export * from './ui'
