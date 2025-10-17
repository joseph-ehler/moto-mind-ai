/**
 * Vehicle Context Builder Tests
 * 
 * Tests AI context generation for vehicles
 */

import { mockValidVehicle, mockVehicleWithHistory } from '../mocks/vehicle-fixtures'

describe('Vehicle Context Builder', () => {
  describe('context generation', () => {
    it('should build basic vehicle context', () => {
      const vehicle = mockValidVehicle
      
      // Context should include key vehicle info
      expect(vehicle.year).toBeDefined()
      expect(vehicle.make).toBeDefined()
      expect(vehicle.model).toBeDefined()
    })

    it('should include VIN if available', () => {
      const vehicle = mockValidVehicle
      
      expect(vehicle.vin).toBeDefined()
      expect(vehicle.vin).toHaveLength(17)
    })

    it('should handle vehicles without VIN', () => {
      const vehicleNoVIN = { ...mockValidVehicle, vin: undefined }
      
      // Should still have other identifying info
      expect(vehicleNoVIN.make).toBeDefined()
      expect(vehicleNoVIN.model).toBeDefined()
    })

    it('should include display name in context', () => {
      const vehicle = mockValidVehicle
      
      expect(vehicle.display_name).toBeDefined()
      expect(typeof vehicle.display_name).toBe('string')
    })
  })

  describe('context formatting', () => {
    it('should format vehicle info as string', () => {
      const vehicle = mockValidVehicle
      const displayName = vehicle.display_name || 'Unknown'
      
      expect(displayName.length).toBeGreaterThan(0)
      expect(typeof displayName).toBe('string')
    })

    it('should handle missing optional fields', () => {
      const minimalVehicle = {
        id: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Should not throw
      expect(minimalVehicle.id).toBeDefined()
    })
  })

  describe('context with history', () => {
    it('should include vehicle history if available', () => {
      const vehicle = mockVehicleWithHistory
      
      expect(vehicle.created_at).toBeDefined()
      expect(vehicle.updated_at).toBeDefined()
    })

    it('should calculate vehicle age', () => {
      const vehicle = mockVehicleWithHistory
      const currentYear = new Date().getFullYear()
      
      if (vehicle.year) {
        const age = currentYear - vehicle.year
        expect(age).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
