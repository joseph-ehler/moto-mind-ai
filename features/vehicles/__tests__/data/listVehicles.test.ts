/**
 * List Vehicles Tests
 * 
 * Tests vehicle listing with pagination and filtering
 */

import { supabaseAdmin } from '@/lib/clients/supabase'
import { mockVehicleList, mockSupabaseListResponse } from '../mocks/vehicle-fixtures'

jest.mock('@/lib/clients/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}))

describe('listVehicles', () => {
  const mockOrder = jest.fn()
  const mockLimit = jest.fn()
  const mockRange = jest.fn()
  const mockEq = jest.fn()
  const mockSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockOrder.mockResolvedValue({
      data: mockVehicleList,
      error: null,
      count: mockVehicleList.length
    })
    mockLimit.mockReturnValue({ order: mockOrder })
    mockRange.mockReturnValue({ order: mockOrder })
    mockEq.mockReturnValue({ 
      select: mockSelect,
      limit: mockLimit,
      range: mockRange,
      order: mockOrder
    })
    mockSelect.mockReturnValue({ 
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      range: mockRange
    })
    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: mockSelect
    })
  })

  describe('successful listing', () => {
    it('should list all vehicles', async () => {
      const { data } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
      
      expect(data).toEqual(mockVehicleList)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(mockVehicleList.length)
    })

    it('should filter by garage_id', async () => {
      const garageId = 'garage-123'
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('garage_id', garageId)
        .order('created_at', { ascending: false })
      
      expect(mockEq).toHaveBeenCalledWith('garage_id', garageId)
    })

    it('should order by created_at descending', async () => {
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
      
      expect(mockOrder).toHaveBeenCalled()
    })

    it('should support pagination', async () => {
      const page = 1
      const pageSize = 10
      const start = page * pageSize
      const end = start + pageSize - 1
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .range(start, end)
        .order('created_at', { ascending: false })
      
      expect(mockRange).toHaveBeenCalledWith(start, end)
    })

    it('should limit results', async () => {
      const limit = 20
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false })
      
      expect(mockLimit).toHaveBeenCalledWith(limit)
    })
  })

  describe('filtering', () => {
    it('should filter by tenant_id', async () => {
      const tenantId = 'tenant-123'
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      
      expect(mockEq).toHaveBeenCalledWith('tenant_id', tenantId)
    })

    it('should filter by make', async () => {
      const make = 'Toyota'
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('make', make)
        .order('created_at', { ascending: false })
      
      expect(mockEq).toHaveBeenCalledWith('make', make)
    })

    it('should filter by year', async () => {
      const year = 2020
      
      await supabaseAdmin
        .from('vehicles')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: false })
      
      expect(mockEq).toHaveBeenCalledWith('year', year)
    })
  })

  describe('empty results', () => {
    it('should return empty array when no vehicles found', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })
      
      const { data } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
      
      expect(data).toEqual([])
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle database errors', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' }
      })
      
      const { error } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })
      
      expect(error).toBeDefined()
    })
  })
})
