/**
 * Vehicle Display Name Tests
 * 
 * Tests the getVehicleDisplayName function from lib/domain/types.ts
 * This will eventually move to features/vehicles/domain/types.ts
 */

import { getVehicleDisplayName, type Vehicle } from '@/lib/domain/types'

describe('getVehicleDisplayName', () => {
  describe('with display_name set', () => {
    it('should return the display_name when provided', () => {
      const vehicle: Partial<Vehicle> = {
        display_name: 'My Custom Name',
        year: 2020,
        make: 'Toyota',
        model: 'Camry'
      }

      expect(getVehicleDisplayName(vehicle)).toBe('My Custom Name')
    })

    it('should prefer display_name over generated name', () => {
      const vehicle: Partial<Vehicle> = {
        display_name: 'Fleet Truck #1',
        year: 2021,
        make: 'Ford',
        model: 'F-150'
      }

      // Should return custom name, not "2021 Ford F-150"
      expect(getVehicleDisplayName(vehicle)).toBe('Fleet Truck #1')
    })
  })

  describe('without display_name', () => {
    it('should generate name from year, make, model', () => {
      const vehicle: Partial<Vehicle> = {
        year: 2020,
        make: 'Toyota',
        model: 'Camry'
      }

      expect(getVehicleDisplayName(vehicle)).toBe('2020 Toyota Camry')
    })

    it('should handle missing year', () => {
      const vehicle: Partial<Vehicle> = {
        make: 'Honda',
        model: 'Civic'
      }

      expect(getVehicleDisplayName(vehicle)).toBe('Honda Civic')
    })

    it('should handle missing make', () => {
      const vehicle: Partial<Vehicle> = {
        year: 2019,
        model: 'Unknown Model'
      }

      expect(getVehicleDisplayName(vehicle)).toBe('2019 Unknown Model')
    })

    it('should handle missing model', () => {
      const vehicle: Partial<Vehicle> = {
        year: 2020,
        make: 'Tesla'
      }

      expect(getVehicleDisplayName(vehicle)).toBe('2020 Tesla')
    })

    it('should handle only VIN provided', () => {
      const vehicle: Partial<Vehicle> = {
        vin: '1HGBH41JXMN109186'
      }

      // Should show VIN or "Unknown Vehicle"
      const result = getVehicleDisplayName(vehicle)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should handle completely empty vehicle', () => {
      const vehicle: Partial<Vehicle> = {}

      const result = getVehicleDisplayName(vehicle)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })

  describe('edge cases', () => {
    it('should handle very long display names', () => {
      const vehicle: Partial<Vehicle> = {
        display_name: 'A'.repeat(200)
      }

      const result = getVehicleDisplayName(vehicle)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle special characters in names', () => {
      const vehicle: Partial<Vehicle> = {
        year: 2020,
        make: "O'Reilly",
        model: 'Truck & Trailer'
      }

      const result = getVehicleDisplayName(vehicle)
      expect(result).toContain("O'Reilly")
      expect(result).toContain('&')
    })

    it('should trim whitespace from generated names', () => {
      const vehicle: Partial<Vehicle> = {
        year: 2020,
        make: '  Toyota  ',
        model: '  Camry  '
      }

      const result = getVehicleDisplayName(vehicle)
      expect(result).not.toMatch(/^\s/)  // No leading whitespace
      expect(result).not.toMatch(/\s$/)  // No trailing whitespace
      expect(result).not.toMatch(/\s{2,}/)  // No double spaces
    })
  })
})
