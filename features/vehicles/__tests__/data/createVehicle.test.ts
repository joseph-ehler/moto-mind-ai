/**
 * Create Vehicle Tests
 * 
 * Tests the createVehicle data layer function
 * Mocks Supabase database calls
 */

import { createVehicle, type CreateVehicleInput } from '@/features/vehicles/data/createVehicle'
import { supabaseAdmin } from '@/lib/clients/supabase'
import {
  mockValidVehicle,
  mockNHTSAResponse,
  createMockVehicle
} from '../mocks/vehicle-fixtures'

// Mock Supabase client
jest.mock('@/lib/clients/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}))

describe('createVehicle', () => {
  const mockTenantId = 'tenant-123'
  
  // Mock chain methods
  const mockSelect = jest.fn()
  const mockSingle = jest.fn()
  const mockInsert = jest.fn()

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default mock chain
    mockSingle.mockResolvedValue({
      data: mockValidVehicle,
      error: null
    })
    mockSelect.mockReturnValue({ single: mockSingle })
    mockInsert.mockReturnValue({ select: mockSelect })
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      insert: mockInsert
    })
  })

  describe('successful creation', () => {
    it('should create vehicle with all required fields', async () => {
      const input: CreateVehicleInput = {
        nickname: 'My Camry',
        make: 'Toyota',
        model: 'Camry',
        vin: '1HGBH41JXMN109186',
        garage_id: 'garage-001',
        enrichment: {
          year: 2020,
          trim: 'LE',
          body_class: 'Sedan'
        }
      }

      const result = await createVehicle(input, mockTenantId)

      expect(result).toBeDefined()
      expect(result.id).toBe(mockValidVehicle.id)
      expect(result.vehicle).toEqual(mockValidVehicle)
    })

    it('should create vehicle with minimal fields', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry'
      }

      const result = await createVehicle(input, mockTenantId)

      expect(result).toBeDefined()
      expect(supabaseAdmin.from).toHaveBeenCalledWith('vehicles')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should use current year if enrichment.year not provided', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.enrichment.year).toBe(new Date().getFullYear())
    })

    it('should generate label from year, make, and model', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Honda',
        model: 'Accord',
        enrichment: {
          year: 2021
        }
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.label).toBe('2021 Honda Accord')
    })

    it('should include tenant_id in vehicle data', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.tenant_id).toBe(mockTenantId)
    })

    it('should handle optional garage_id', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry',
        garage_id: 'garage-123'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.garage_id).toBe('garage-123')
    })

    it('should set garage_id to null if not provided', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.garage_id).toBeNull()
    })

    it('should handle enrichment data', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry',
        enrichment: {
          year: 2020,
          trim: 'XLE',
          body_class: 'Sedan',
          engine: { type: 'V6', displacement: '3.5L' },
          drivetrain: 'FWD',
          transmission: 'Automatic'
        }
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.enrichment).toMatchObject({
        year: 2020,
        trim: 'XLE',
        body_class: 'Sedan',
        engine: expect.any(Object),
        drivetrain: 'FWD',
        transmission: 'Automatic'
      })
    })

    it('should initialize smart_defaults to empty object if not provided', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.smart_defaults).toEqual({})
    })

    it('should include smart_defaults if provided', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry',
        smart_defaults: {
          fuel_type: 'gasoline',
          tank_capacity: 15.8
        }
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.smart_defaults).toEqual({
        fuel_type: 'gasoline',
        tank_capacity: 15.8
      })
    })
  })

  describe('hero image handling', () => {
    it('should create vehicle_images record when hero_image_url provided', async () => {
      const mockImageInsert = jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
      
      // Mock additional from call for vehicle_images
      ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return { insert: mockInsert }
        }
        if (table === 'vehicle_images') {
          return { insert: mockImageInsert }
        }
      })

      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry',
        hero_image_url: 'https://example.com/vehicle-photos/hero.jpg'
      }

      await createVehicle(input, mockTenantId)

      expect(supabaseAdmin.from).toHaveBeenCalledWith('vehicle_images')
      expect(mockImageInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: mockTenantId,
          vehicle_id: mockValidVehicle.id,
          public_url: input.hero_image_url,
          image_type: 'hero',
          is_primary: true
        })
      )
    })

    it('should not create vehicle_images record when hero_image_url not provided', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry'
      }

      await createVehicle(input, mockTenantId)

      // Should only call from once (for vehicles table)
      expect(supabaseAdmin.from).toHaveBeenCalledTimes(1)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('vehicles')
    })

    it('should not fail vehicle creation if image record creation fails', async () => {
      const mockImageInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Image creation failed' }
      })
      
      ;(supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'vehicles') {
          return { insert: mockInsert }
        }
        if (table === 'vehicle_images') {
          return { insert: mockImageInsert }
        }
      })

      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry',
        hero_image_url: 'https://example.com/vehicle-photos/hero.jpg'
      }

      // Should not throw
      const result = await createVehicle(input, mockTenantId)
      expect(result).toBeDefined()
      expect(result.id).toBe(mockValidVehicle.id)
    })
  })

  describe('error handling', () => {
    it('should throw error when database insert fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '23505' }
      })

      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry'
      }

      await expect(createVehicle(input, mockTenantId)).rejects.toThrow()
    })

    it('should handle duplicate VIN error', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint',
          code: '23505'
        }
      })

      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Toyota',
        model: 'Camry',
        vin: '1HGBH41JXMN109186'  // Duplicate VIN
      }

      await expect(createVehicle(input, mockTenantId)).rejects.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in nickname', async () => {
      const input: CreateVehicleInput = {
        nickname: "O'Reilly's Truck & Trailer",
        make: 'Ford',
        model: 'F-150'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.nickname).toBe("O'Reilly's Truck & Trailer")
    })

    it('should handle very long nickname', async () => {
      const longNickname = 'A'.repeat(200)
      const input: CreateVehicleInput = {
        nickname: longNickname,
        make: 'Toyota',
        model: 'Camry'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.nickname).toBe(longNickname)
    })

    it('should handle unicode characters in make/model', async () => {
      const input: CreateVehicleInput = {
        nickname: 'Test Vehicle',
        make: 'Citroën',
        model: 'C4 Cactus'
      }

      await createVehicle(input, mockTenantId)

      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.make).toBe('Citroën')
      expect(insertCall.model).toBe('C4 Cactus')
    })
  })
})
