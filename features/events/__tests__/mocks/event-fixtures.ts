/**
 * Event Test Fixtures
 * 
 * Mock data for event tests
 */

export interface Event {
  id: string
  vehicle_id: string
  type: string
  timestamp: Date
  mileage?: number
  cost?: number
  notes?: string
}

export const mockServiceEvent: Event = {
  id: 'event-1',
  vehicle_id: 'vehicle-123',
  type: 'service',
  timestamp: new Date('2025-01-15T10:00:00Z'),
  mileage: 50000,
  cost: 49.99,
  notes: 'Oil change'
}

export const mockFuelEvent: Event = {
  id: 'event-2',
  vehicle_id: 'vehicle-123',
  type: 'fuel',
  timestamp: new Date('2025-01-12T08:00:00Z'),
  mileage: 49750,
  cost: 45.00,
  notes: 'Fill up'
}

export const mockEventList: Event[] = [
  mockServiceEvent,
  mockFuelEvent
]

export function createMockEvent(overrides: Partial<Event> = {}): Event {
  return {
    ...mockServiceEvent,
    ...overrides,
    id: overrides.id || `event-${Date.now()}`,
    timestamp: overrides.timestamp || new Date()
  }
}
