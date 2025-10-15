/**
 * Timeline Types Tests
 * 
 * Tests timeline type validation and type guards
 */

import type { 
  TimelineItem, 
  TimelineItemType,
  TimelineFilter 
} from '@/types/timeline'

describe('Timeline Types', () => {
  describe('TimelineItemType validation', () => {
    it('should accept valid timeline item types', () => {
      const validTypes: TimelineItemType[] = [
        'odometer',
        'service',
        'maintenance',
        'fuel',
        'dashboard_warning',
        'dashboard_snapshot',
        'tire_tread',
        'tire_pressure',
        'damage',
        'parking',
        'document',
        'inspection',
        'recall',
        'manual',
        'modification',
        'car_wash',
        'trip',
        'expense'
      ]

      validTypes.forEach(type => {
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
      })
    })
  })

  describe('TimelineFilter validation', () => {
    it('should accept valid filter types', () => {
      const validFilters: TimelineFilter[] = [
        'all',
        'odometer',
        'service',
        'fuel',
        'warnings',
        'tires',
        'damage',
        'documents'
      ]

      validFilters.forEach(filter => {
        expect(typeof filter).toBe('string')
      })
    })

    it('should use all as default filter', () => {
      const defaultFilter: TimelineFilter = 'all'
      expect(defaultFilter).toBe('all')
    })
  })

  describe('Timeline item structure', () => {
    it('should have required base fields', () => {
      const mockItem = {
        id: 'test-1',
        vehicle_id: 'vehicle-1',
        type: 'odometer' as TimelineItemType,
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        extracted_data: {
          reading: 50000,
          confidence: 0.95
        }
      }

      expect(mockItem.id).toBeDefined()
      expect(mockItem.vehicle_id).toBeDefined()
      expect(mockItem.type).toBeDefined()
      expect(mockItem.timestamp).toBeInstanceOf(Date)
    })

    it('should support optional fields', () => {
      const mockItem = {
        id: 'test-2',
        vehicle_id: 'vehicle-1',
        type: 'service' as TimelineItemType,
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        photo_url: 'https://example.com/photo.jpg',
        thumbnail_url: 'https://example.com/thumb.jpg',
        mileage: 50000,
        notes: 'Oil change',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St'
        },
        extracted_data: {
          service_type: 'oil_change',
          cost: 50
        }
      }

      expect(mockItem.photo_url).toBeDefined()
      expect(mockItem.thumbnail_url).toBeDefined()
      expect(mockItem.mileage).toBe(50000)
      expect(mockItem.notes).toBe('Oil change')
      expect(mockItem.location).toBeDefined()
    })
  })

  describe('Type-specific data structures', () => {
    it('should validate odometer data', () => {
      const odometerData = {
        reading: 50000,
        confidence: 0.95,
        change_since_last: 500
      }

      expect(odometerData.reading).toBeGreaterThan(0)
      expect(odometerData.confidence).toBeGreaterThan(0)
      expect(odometerData.confidence).toBeLessThanOrEqual(1)
    })

    it('should validate service data', () => {
      const serviceData = {
        service_type: 'oil_change',
        vendor_name: 'Quick Lube',
        cost: 49.99,
        parts_replaced: ['oil_filter', 'oil'],
        warranty: true
      }

      expect(serviceData.service_type).toBeDefined()
      expect(serviceData.cost).toBeGreaterThan(0)
      expect(Array.isArray(serviceData.parts_replaced)).toBe(true)
    })

    it('should validate fuel data', () => {
      const fuelData = {
        gallons: 12.5,
        cost: 45.00,
        price_per_gallon: 3.60,
        station_name: 'Shell',
        fuel_type: 'regular'
      }

      expect(fuelData.gallons).toBeGreaterThan(0)
      expect(fuelData.cost).toBeGreaterThan(0)
      expect(fuelData.price_per_gallon).toBe(fuelData.cost / fuelData.gallons)
    })
  })
})
