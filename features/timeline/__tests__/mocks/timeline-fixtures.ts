/**
 * Timeline Test Fixtures
 * 
 * Mock data for timeline tests
 */

import type { TimelineItem, TimelineFilter } from '@/types/timeline'

export const mockOdometerItem: TimelineItem = {
  id: 'timeline-1',
  vehicle_id: 'vehicle-123',
  type: 'odometer',
  timestamp: new Date('2025-01-15T10:00:00Z'),
  mileage: 50000,
  photo_url: 'https://example.com/odometer.jpg',
  thumbnail_url: 'https://example.com/odometer-thumb.jpg',
  extracted_data: {
    reading: 50000,
    confidence: 0.95,
    change_since_last: 500
  },
  created_at: new Date('2025-01-15T10:00:00Z'),
  updated_at: new Date('2025-01-15T10:00:00Z')
}

export const mockServiceItem: TimelineItem = {
  id: 'timeline-2',
  vehicle_id: 'vehicle-123',
  type: 'service',
  timestamp: new Date('2025-01-10T14:30:00Z'),
  mileage: 49500,
  photo_url: 'https://example.com/receipt.jpg',
  notes: 'Oil change and tire rotation',
  extracted_data: {
    service_type: 'oil_change',
    vendor_name: 'Quick Lube',
    cost: 49.99,
    parts_replaced: ['oil_filter', 'oil'],
    warranty: true
  },
  created_at: new Date('2025-01-10T14:30:00Z'),
  updated_at: new Date('2025-01-10T14:30:00Z')
}

export const mockFuelItem: TimelineItem = {
  id: 'timeline-3',
  vehicle_id: 'vehicle-123',
  type: 'fuel',
  timestamp: new Date('2025-01-12T08:15:00Z'),
  mileage: 49750,
  photo_url: 'https://example.com/fuel-receipt.jpg',
  extracted_data: {
    gallons: 12.5,
    cost: 45.00,
    price_per_gallon: 3.60,
    station_name: 'Shell',
    fuel_type: 'regular',
    mpg_calculated: 28.5
  },
  created_at: new Date('2025-01-12T08:15:00Z'),
  updated_at: new Date('2025-01-12T08:15:00Z')
}

export const mockDashboardWarningItem: TimelineItem = {
  id: 'timeline-4',
  vehicle_id: 'vehicle-123',
  type: 'dashboard_warning',
  timestamp: new Date('2025-01-08T16:45:00Z'),
  mileage: 49200,
  photo_url: 'https://example.com/check-engine.jpg',
  extracted_data: {
    warning_type: ['check_engine'],
    severity: 'medium',
    resolved: false,
    description: 'Check engine light appeared'
  },
  created_at: new Date('2025-01-08T16:45:00Z'),
  updated_at: new Date('2025-01-08T16:45:00Z')
}

export const mockTirePressureItem: TimelineItem = {
  id: 'timeline-5',
  vehicle_id: 'vehicle-123',
  type: 'tire_pressure',
  timestamp: new Date('2025-01-14T07:00:00Z'),
  mileage: 49900,
  extracted_data: {
    pressures: {
      front_left: 32,
      front_right: 33,
      rear_left: 31,
      rear_right: 32
    },
    recommended: 32,
    alerts: ['Front right slightly high']
  },
  created_at: new Date('2025-01-14T07:00:00Z'),
  updated_at: new Date('2025-01-14T07:00:00Z')
}

export const mockTimelineList: TimelineItem[] = [
  mockOdometerItem,
  mockServiceItem,
  mockFuelItem,
  mockDashboardWarningItem,
  mockTirePressureItem
]

export const mockTimelineFilters: Record<TimelineFilter, TimelineItem[]> = {
  'all': mockTimelineList,
  'odometer': [mockOdometerItem],
  'service': [mockServiceItem],
  'fuel': [mockFuelItem],
  'warnings': [mockDashboardWarningItem],
  'tires': [mockTirePressureItem],
  'damage': [],
  'documents': []
}

/**
 * Factory function to create custom timeline items
 */
export function createMockTimelineItem(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    ...mockOdometerItem,
    ...overrides,
    id: overrides.id || `timeline-${Date.now()}`,
    timestamp: overrides.timestamp || new Date(),
    created_at: overrides.created_at || new Date(),
    updated_at: overrides.updated_at || new Date()
  } as TimelineItem
}

/**
 * Create list of timeline items
 */
export function createMockTimelineList(count: number): TimelineItem[] {
  return Array.from({ length: count }, (_, i) => createMockTimelineItem({
    id: `timeline-${i}`,
    mileage: 50000 + (i * 100)
  }))
}
