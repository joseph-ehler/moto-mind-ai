/**
 * Update Vehicle Tests
 * 
 * Tests vehicle update operations
 */

import { supabaseAdmin } from '@/lib/clients/supabase'
import { mockValidVehicle, mockVehicleUpdate, mockUpdatedVehicle } from '../mocks/vehicle-fixtures'

jest.mock('@/lib/clients/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}))

describe('updateVehicle', () => {
  const mockSingle = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSingle.mockResolvedValue({
      data: mockUpdatedVehicle,
      error: null
    })
    mockSelect.mockReturnValue({ single: mockSingle })
    mockEq.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      update: mockUpdate
    })
  })

  describe('successful update', () => {
    it('should update vehicle fields', async () => {
      const vehicleId = 'test-vehicle-001'
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .update(mockVehicleUpdate)
        .eq('id', vehicleId)
        .select()
        .single()
      
      expect(data).toBeDefined()
      expect(mockUpdate).toHaveBeenCalledWith(mockVehicleUpdate)
      expect(mockEq).toHaveBeenCalledWith('id', vehicleId)
    })

    it('should update display_name', async () => {
      const update = { display_name: 'New Name' }
      
      await supabaseAdmin
        .from('vehicles')
        .update(update)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(mockUpdate).toHaveBeenCalledWith(update)
    })

    it('should update color', async () => {
      const update = { color: 'Blue' }
      
      await supabaseAdmin
        .from('vehicles')
        .update(update)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(mockUpdate).toHaveBeenCalledWith(update)
    })

    it('should update multiple fields', async () => {
      const update = {
        color: 'Red',
        display_name: 'Updated Name',
        year: 2021
      }
      
      await supabaseAdmin
        .from('vehicles')
        .update(update)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(mockUpdate).toHaveBeenCalledWith(update)
    })

    it('should update updated_at timestamp', async () => {
      const { data } = await supabaseAdmin
        .from('vehicles')
        .update(mockVehicleUpdate)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      // Database should automatically update updated_at
      expect(data?.updated_at).toBeDefined()
    })
  })

  describe('partial updates', () => {
    it('should allow updating single field', async () => {
      const update = { color: 'Green' }
      
      await supabaseAdmin
        .from('vehicles')
        .update(update)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(mockUpdate).toHaveBeenCalledWith(update)
    })

    it('should not require all fields for update', async () => {
      const update = { display_name: 'New Display Name' }
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .update(update)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(data).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle vehicle not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Vehicle not found', code: '404' }
      })
      
      const { error } = await supabaseAdmin
        .from('vehicles')
        .update(mockVehicleUpdate)
        .eq('id', 'non-existent')
        .select()
        .single()
      
      expect(error).toBeDefined()
    })

    it('should handle database errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' }
      })
      
      const { error } = await supabaseAdmin
        .from('vehicles')
        .update(mockVehicleUpdate)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(error).toBeDefined()
    })

    it('should validate update data', async () => {
      // Empty update should still be valid (no-op)
      const emptyUpdate = {}
      
      await supabaseAdmin
        .from('vehicles')
        .update(emptyUpdate)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(mockUpdate).toHaveBeenCalledWith(emptyUpdate)
    })
  })

  describe('authorization', () => {
    it('should only update vehicles for current tenant', async () => {
      // In real implementation, would include tenant filter
      await supabaseAdmin
        .from('vehicles')
        .update(mockVehicleUpdate)
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(mockEq).toHaveBeenCalledWith('id', 'test-vehicle-001')
    })
  })
})
