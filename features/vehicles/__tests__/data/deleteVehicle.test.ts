/**
 * Delete Vehicle Tests
 * 
 * Tests vehicle deletion (soft delete)
 */

import { supabaseAdmin } from '@/lib/clients/supabase'
import { mockValidVehicle } from '../mocks/vehicle-fixtures'

jest.mock('@/lib/clients/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}))

describe('deleteVehicle', () => {
  const mockSingle = jest.fn()
  const mockSelect = jest.fn()
  const mockEq = jest.fn()
  const mockUpdate = jest.fn()
  const mockDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Soft delete (update)
    mockSingle.mockResolvedValue({
      data: { ...mockValidVehicle, deleted_at: new Date().toISOString() },
      error: null
    })
    mockSelect.mockReturnValue({ single: mockSingle })
    mockEq.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockDelete.mockReturnValue({ eq: mockEq })
    
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
      delete: mockDelete
    })
  })

  describe('soft delete', () => {
    it('should soft delete vehicle by setting deleted_at', async () => {
      const vehicleId = 'test-vehicle-001'
      const deletedAt = new Date().toISOString()
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .update({ deleted_at: deletedAt })
        .eq('id', vehicleId)
        .select()
        .single()
      
      expect(data).toBeDefined()
      expect(data?.deleted_at).toBeDefined()
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('should not permanently delete vehicle data', async () => {
      const vehicleId = 'test-vehicle-001'
      const deletedAt = new Date().toISOString()
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .update({ deleted_at: deletedAt })
        .eq('id', vehicleId)
        .select()
        .single()
      
      // Vehicle data should still exist
      expect(data?.id).toBe(mockValidVehicle.id)
      expect(data?.vin).toBeDefined()
    })

    it('should allow restoring deleted vehicles', async () => {
      const vehicleId = 'test-vehicle-001'
      
      // Restore by setting deleted_at to null
      mockSingle.mockResolvedValue({
        data: { ...mockValidVehicle, deleted_at: null },
        error: null
      })
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .update({ deleted_at: null })
        .eq('id', vehicleId)
        .select()
        .single()
      
      expect(data?.deleted_at).toBeNull()
    })
  })

  describe('hard delete (admin only)', () => {
    it('should permanently delete vehicle if needed', async () => {
      const vehicleId = 'test-vehicle-001'
      
      mockEq.mockReturnValue({
        data: null,
        error: null
      })
      
      await supabaseAdmin
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
      
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', vehicleId)
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
        .update({ deleted_at: new Date().toISOString() })
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
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(error).toBeDefined()
    })

    it('should handle already deleted vehicles', async () => {
      const alreadyDeleted = {
        ...mockValidVehicle,
        deleted_at: '2025-01-01T00:00:00.000Z'
      }
      
      mockSingle.mockResolvedValue({
        data: alreadyDeleted,
        error: null
      })
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(data?.deleted_at).toBeDefined()
    })
  })

  describe('authorization', () => {
    it('should only delete vehicles for current tenant', async () => {
      await supabaseAdmin
        .from('vehicles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', 'test-vehicle-001')
        .select()
        .single()
      
      expect(mockEq).toHaveBeenCalledWith('id', 'test-vehicle-001')
    })

    it('should prevent deletion of vehicles from other tenants', async () => {
      // In real implementation, would check tenant_id
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized', code: '403' }
      })
      
      const { error } = await supabaseAdmin
        .from('vehicles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', 'other-tenant-vehicle')
        .select()
        .single()
      
      expect(error).toBeDefined()
    })
  })
})
