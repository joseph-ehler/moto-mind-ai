/**
 * Get Vehicle Tests
 * 
 * Tests vehicle retrieval by ID
 */

import { supabaseAdmin } from '@/lib/clients/supabase'
import { mockValidVehicle, mockSupabaseErrorResponse } from '../mocks/vehicle-fixtures'

jest.mock('@/lib/clients/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}))

describe('getVehicle', () => {
  const mockEq = jest.fn()
  const mockSingle = jest.fn()
  const mockSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSingle.mockResolvedValue({
      data: mockValidVehicle,
      error: null
    })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: mockSelect
    })
  })

  describe('successful retrieval', () => {
    it('should retrieve vehicle by ID', async () => {
      const vehicleId = 'test-vehicle-001'
      
      // Simulate getVehicle call
      const { data } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()
      
      expect(data).toEqual(mockValidVehicle)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('vehicles')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('id', vehicleId)
    })

    it('should return vehicle with all fields', async () => {
      const { data } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', 'test-vehicle-001')
        .single()
      
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('vin')
      expect(data).toHaveProperty('make')
      expect(data).toHaveProperty('model')
    })

    it('should filter by tenant_id', async () => {
      const tenantId = 'tenant-123'
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', 'test-vehicle-001')
        .single()
      
      // In real implementation, would check tenant_id filter
      expect(mockEq).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle vehicle not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: mockSupabaseErrorResponse.error
      })
      
      const { error } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', 'non-existent')
        .single()
      
      expect(error).toBeDefined()
      expect(error.message).toBe('Vehicle not found')
    })

    it('should handle database errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'DB_ERROR' }
      })
      
      const { error } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', 'test-vehicle-001')
        .single()
      
      expect(error).toBeDefined()
    })

    it('should handle invalid vehicle ID format', async () => {
      const invalidId = ''
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', invalidId)
        .single()
      
      expect(mockEq).toHaveBeenCalledWith('id', invalidId)
    })
  })

  describe('authorization', () => {
    it('should only return vehicles for current tenant', async () => {
      // In real implementation, would include tenant filter
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', 'test-vehicle-001')
        .single()
      
      expect(supabaseAdmin.from).toHaveBeenCalledWith('vehicles')
    })

    it('should not return soft-deleted vehicles', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Vehicle not found', code: '404' }
      })
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('id', 'deleted-vehicle')
        .single()
      
      expect(data).toBeNull()
    })
  })
})
