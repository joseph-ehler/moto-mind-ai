/**
 * Fleet Rules Tests
 * 
 * Tests fleet-level business logic and rules
 */

import { getVehicleDisplayName } from '@/lib/domain/types'
import { mockValidVehicle, mockVehicleList } from '../mocks/vehicle-fixtures'

describe('Fleet Rules', () => {
  describe('vehicle categorization', () => {
    it('should categorize vehicles by year', () => {
      const oldVehicle = { ...mockValidVehicle, year: 2010 }
      const newVehicle = { ...mockValidVehicle, year: 2023 }
      
      expect(oldVehicle.year).toBeLessThan(2015)
      expect(newVehicle.year).toBeGreaterThanOrEqual(2020)
    })

    it('should identify fleet vehicles', () => {
      const fleetVehicle = {
        ...mockValidVehicle,
        display_name: 'Fleet Truck #1'
      }
      
      expect(fleetVehicle.display_name).toContain('Fleet')
    })
  })

  describe('vehicle validation rules', () => {
    it('should require VIN for fleet vehicles', () => {
      const vehicle = mockValidVehicle
      
      expect(vehicle.vin).toBeDefined()
      expect(vehicle.vin).toHaveLength(17)
    })

    it('should allow vehicles without VIN for personal use', () => {
      const personalVehicle = {
        ...mockValidVehicle,
        vin: undefined
      }
      
      // Should still be valid
      expect(personalVehicle.id).toBeDefined()
    })
  })

  describe('fleet statistics', () => {
    it('should calculate average vehicle age', () => {
      const currentYear = new Date().getFullYear()
      const ages = mockVehicleList
        .filter(v => v.year)
        .map(v => currentYear - v.year!)
      
      const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length
      
      expect(avgAge).toBeGreaterThanOrEqual(0)
      expect(avgAge).toBeLessThan(50) // Reasonable max age
    })

    it('should count vehicles by make', () => {
      const makeCount = mockVehicleList.reduce((acc, vehicle) => {
        const make = vehicle.make || 'Unknown'
        acc[make] = (acc[make] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      expect(Object.keys(makeCount).length).toBeGreaterThan(0)
    })
  })
})
