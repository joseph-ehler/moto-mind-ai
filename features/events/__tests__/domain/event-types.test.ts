/**
 * Event Types Tests
 * 
 * Tests event type definitions and interfaces
 */

import { mockServiceEvent, mockFuelEvent, createMockEvent } from '../mocks/event-fixtures'

describe('Event Types', () => {
  describe('Event structure', () => {
    it('should have required fields', () => {
      const event = mockServiceEvent
      
      expect(event.id).toBeDefined()
      expect(event.vehicle_id).toBeDefined()
      expect(event.type).toBeDefined()
      expect(event.timestamp).toBeInstanceOf(Date)
    })

    it('should support optional fields', () => {
      const event = createMockEvent({
        mileage: 60000,
        cost: 100,
        notes: 'Major service'
      })
      
      expect(event.mileage).toBe(60000)
      expect(event.cost).toBe(100)
      expect(event.notes).toBe('Major service')
    })
  })

  describe('Event factory', () => {
    it('should create event with defaults', () => {
      const event = createMockEvent()
      
      expect(event.id).toBeDefined()
      expect(event.timestamp).toBeInstanceOf(Date)
    })

    it('should override defaults', () => {
      const event = createMockEvent({
        id: 'custom-1',
        type: 'fuel'
      })
      
      expect(event.id).toBe('custom-1')
      expect(event.type).toBe('fuel')
    })
  })

  describe('Event list operations', () => {
    it('should sort events by date', () => {
      const events = [mockFuelEvent, mockServiceEvent]
      const sorted = events.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )
      
      expect(sorted[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        sorted[1].timestamp.getTime()
      )
    })

    it('should filter events by type', () => {
      const events = [mockServiceEvent, mockFuelEvent]
      const serviceEvents = events.filter(e => e.type === 'service')
      
      expect(serviceEvents.length).toBe(1)
      expect(serviceEvents[0].type).toBe('service')
    })
  })
})
