/**
 * Timeline Domain - Business Logic & Types
 * 
 * Pure business logic for timeline items.
 * No side effects, no API calls - just types and pure functions.
 */

// Types
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
} from './types'

// Business Logic Functions
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
} from './timeline-utils'
