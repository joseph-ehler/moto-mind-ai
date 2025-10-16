/**
 * Timeline Domain Types
 * 
 * Re-exports comprehensive timeline types from global types.
 * Timeline is the central organizing principle for vehicle data.
 */

// Re-export all timeline types from global types
export type {
  TimelineItemType,
  TimelineItemBase,
  TimelineItem,
  TimelineFilter,
  TimelineConfig,
  
  // Type-specific data interfaces
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
} from '../../../types/timeline'

/**
 * Timeline query options
 */
export interface TimelineQueryOptions {
  vehicle_id: string
  filter?: TimelineFilter
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
  sortOrder?: 'newest' | 'oldest'
}

/**
 * Timeline list response
 */
export interface TimelineListResponse {
  items: TimelineItem[]
  total: number
  hasMore: boolean
}

/**
 * Timeline item creation input
 */
export interface CreateTimelineItemInput {
  vehicle_id: string
  type: TimelineItemType
  timestamp: Date
  photo_url?: string
  mileage?: number
  notes?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  extracted_data?: any
}

/**
 * Timeline item update input
 */
export interface UpdateTimelineItemInput {
  timestamp?: Date
  mileage?: number
  notes?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  extracted_data?: any
}

/**
 * Timeline statistics
 */
export interface TimelineStats {
  totalItems: number
  itemsByType: Record<TimelineItemType, number>
  dateRange: {
    earliest: Date
    latest: Date
  }
  totalMileage?: number
}
