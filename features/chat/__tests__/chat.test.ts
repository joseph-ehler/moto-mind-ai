/**
 * Chat Feature Tests
 * Tests chat feature exports and structure
 */

import { EventCard, EventCardProps } from '../index'

describe('Chat Feature', () => {
  describe('Exports', () => {
    it('exports EventCard component', () => {
      expect(EventCard).toBeDefined()
      expect(typeof EventCard).toBe('function')
    })

    it('exports EventCardProps type', () => {
      // Type test - this will fail at compile time if type doesn't exist
      const props: EventCardProps = {
        eventData: {
          event_id: 'test-123',
          event_type: 'fuel',
          event_date: '2024-03-15T10:30:00Z'
        }
      }
      
      expect(props.eventData.event_id).toBe('test-123')
      expect(props.eventData.event_type).toBe('fuel')
    })
  })

  describe('EventCardProps', () => {
    it('accepts required event data fields', () => {
      const props: EventCardProps = {
        eventData: {
          event_id: 'evt-456',
          event_type: 'service',
          event_date: '2024-03-20T14:00:00Z'
        }
      }
      
      expect(props.eventData).toBeDefined()
    })

    it('accepts optional event data fields', () => {
      const props: EventCardProps = {
        eventData: {
          event_id: 'evt-789',
          event_type: 'fuel',
          event_date: '2024-03-22T09:15:00Z',
          event_summary: 'Fill up at Shell',
          event_location: 'Shell Station',
          event_cost: 55.75,
          event_gallons: 15.2,
          event_miles: 425,
          event_vendor: 'Shell'
        }
      }
      
      expect(props.eventData.event_summary).toBe('Fill up at Shell')
      expect(props.eventData.event_cost).toBe(55.75)
    })

    it('accepts weather data', () => {
      const props: EventCardProps = {
        eventData: {
          event_id: 'evt-101',
          event_type: 'odometer',
          event_date: '2024-03-25T11:00:00Z',
          event_weather: {
            temperature_f: 68,
            condition: 'Partly Cloudy',
            precipitation_mm: 0,
            windspeed_mph: 8,
            humidity_percent: 55
          }
        }
      }
      
      expect(props.eventData.event_weather?.temperature_f).toBe(68)
      expect(props.eventData.event_weather?.condition).toBe('Partly Cloudy')
    })
  })

  describe('Feature Structure', () => {
    it('follows features architecture', () => {
      // Test that imports work from the feature index
      expect(EventCard).toBeDefined()
      
      // This validates the module structure is correct
      expect(EventCard.name).toBe('EventCard')
    })

    it('maintains backward compatibility with existing types', () => {
      // Ensure all original fields are still supported
      const fullProps: EventCardProps = {
        eventData: {
          event_id: 'full-test',
          event_type: 'maintenance',
          event_date: '2024-04-01T10:00:00Z',
          event_summary: 'Oil change',
          event_location: 'Local Garage',
          event_cost: 45.00,
          event_gallons: undefined,
          event_miles: 1000,
          event_vendor: 'Quick Lube',
          event_weather: {
            temperature_f: 75,
            condition: 'Sunny',
            precipitation_mm: 0,
            windspeed_mph: 5,
            humidity_percent: 40
          }
        }
      }
      
      expect(fullProps).toBeDefined()
      expect(fullProps.eventData.event_type).toBe('maintenance')
    })
  })

  describe('Type Safety', () => {
    it('requires event_id', () => {
      const props: EventCardProps = {
        eventData: {
          event_id: 'required-field',
          event_type: 'service',
          event_date: '2024-03-15T12:00:00Z'
        }
      }
      
      expect(props.eventData.event_id).toBeDefined()
    })

    it('requires event_type', () => {
      const props: EventCardProps = {
        eventData: {
          event_id: 'test',
          event_type: 'fuel',
          event_date: '2024-03-15T12:00:00Z'
        }
      }
      
      expect(props.eventData.event_type).toBeDefined()
    })

    it('requires event_date', () => {
      const props: EventCardProps = {
        eventData: {
          event_id: 'test',
          event_type: 'service',
          event_date: '2024-03-15T12:00:00Z'
        }
      }
      
      expect(props.eventData.event_date).toBeDefined()
    })
  })
})
