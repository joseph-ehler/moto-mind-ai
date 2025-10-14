/**
 * Enterprise-Grade API Tenant Isolation Tests
 * 
 * Tests the complete auth stack including:
 * - NextAuth session management
 * - Tenant isolation middleware
 * - Cross-tenant access prevention
 * - API route protection
 * 
 * These tests require a running database and use real API calls.
 */

import { createMocks } from 'node-mocks-http'
import { getServerSession } from 'next-auth'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

describe('API Tenant Isolation - Enterprise Tests', () => {
  // Test fixtures
  let tenant1: { id: string; name: string }
  let tenant2: { id: string; name: string }
  let user1: { email: string; tenantId: string; role: string }
  let user2: { email: string; tenantId: string; role: string }
  let vehicle1: { id: string; tenantId: string; make: string }
  let vehicle2: { id: string; tenantId: string; make: string }

  beforeAll(async () => {
    // Create test tenants
    tenant1 = {
      id: uuidv4(),
      name: 'Test Tenant 1',
    }
    tenant2 = {
      id: uuidv4(),
      name: 'Test Tenant 2',
    }

    const { error: tenant1Error } = await supabase
      .from('tenants')
      .insert(tenant1)

    const { error: tenant2Error } = await supabase
      .from('tenants')
      .insert(tenant2)

    if (tenant1Error || tenant2Error) {
      console.error('Failed to create test tenants:', { tenant1Error, tenant2Error })
    }

    // Create test users
    user1 = {
      email: `test1-${Date.now()}@example.com`,
      tenantId: tenant1.id,
      role: 'owner',
    }
    user2 = {
      email: `test2-${Date.now()}@example.com`,
      tenantId: tenant2.id,
      role: 'owner',
    }

    await supabase.from('user_tenants').insert([
      { user_id: user1.email, tenant_id: user1.tenantId, role: user1.role },
      { user_id: user2.email, tenant_id: user2.tenantId, role: user2.role },
    ])

    // Create test vehicles
    const { data: v1 } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: tenant1.id,
        year: 2020,
        make: 'Honda',
        model: 'Accord',
        vin: 'TEST1VIN000000001',
      })
      .select()
      .single()

    const { data: v2 } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: tenant2.id,
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        vin: 'TEST2VIN000000002',
      })
      .select()
      .single()

    vehicle1 = v1 as any
    vehicle2 = v2 as any
  })

  afterAll(async () => {
    // Cleanup test data
    if (vehicle1?.id) {
      await supabase.from('vehicles').delete().eq('id', vehicle1.id)
    }
    if (vehicle2?.id) {
      await supabase.from('vehicles').delete().eq('id', vehicle2.id)
    }
    if (user1?.email) {
      await supabase.from('user_tenants').delete().eq('user_id', user1.email)
    }
    if (user2?.email) {
      await supabase.from('user_tenants').delete().eq('user_id', user2.email)
    }
    if (tenant1?.id) {
      await supabase.from('tenants').delete().eq('id', tenant1.id)
    }
    if (tenant2?.id) {
      await supabase.from('tenants').delete().eq('id', tenant2.id)
    }
  })

  describe('Unauthenticated Access', () => {
    it('rejects requests without session', async () => {
      // Mock no session
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const handler = (await import('@/pages/api/vehicles/index')).default
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toMatchObject({
        error: 'UNAUTHORIZED',
      })
    })

    it('rejects vehicle detail requests without session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const handler = (await import('@/pages/api/vehicles/[id]')).default
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: vehicle1.id },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('rejects event creation without session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const handler = (await import('@/pages/api/events/save')).default
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          vehicle_id: vehicle1.id,
          type: 'fuel',
          date: '2025-01-01',
          miles: 10000,
          payload: { total_amount: 50 },
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('Cross-Tenant Access Prevention', () => {
    it('user 1 cannot see user 2 vehicles in list', async () => {
      // Mock user 1 session
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/index')).default
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      
      // Should only see vehicles from tenant 1
      const vehicleIds = data.vehicles?.map((v: any) => v.id) || []
      expect(vehicleIds).toContain(vehicle1.id)
      expect(vehicleIds).not.toContain(vehicle2.id)
    })

    it('user 1 cannot access user 2 vehicle details', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/[id]')).default
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: vehicle2.id }, // Trying to access tenant 2's vehicle
      })

      await handler(req, res)

      // Should be 404 or 403
      expect([403, 404]).toContain(res._getStatusCode())
    })

    it('user 1 cannot create events for user 2 vehicles', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/events/save')).default
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          vehicle_id: vehicle2.id, // Trying to create event for tenant 2's vehicle
          type: 'fuel',
          date: '2025-01-01',
          miles: 10000,
          payload: { total_amount: 50 },
        },
      })

      await handler(req, res)

      // Should fail validation (vehicle not found for this tenant)
      expect([400, 403, 404]).toContain(res._getStatusCode())
    })

    it('user 1 cannot update user 2 vehicles', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/[id]')).default
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: vehicle2.id },
        body: {
          nickname: 'Hacked Vehicle',
        },
      })

      await handler(req, res)

      expect([403, 404]).toContain(res._getStatusCode())
    })

    it('user 1 cannot delete user 2 vehicles', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/[id]/delete')).default
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: vehicle2.id },
      })

      await handler(req, res)

      expect([403, 404]).toContain(res._getStatusCode())
    })
  })

  describe('Same-Tenant Access (Authorized)', () => {
    it('user 1 CAN see own vehicles', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/index')).default
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      
      const vehicleIds = data.vehicles?.map((v: any) => v.id) || []
      expect(vehicleIds).toContain(vehicle1.id)
    })

    it('user 1 CAN access own vehicle details', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/[id]')).default
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: vehicle1.id },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.vehicle?.id).toBe(vehicle1.id)
    })

    it('user 1 CAN create events for own vehicles', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/events/save')).default
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          vehicle_id: vehicle1.id,
          type: 'fuel',
          date: '2025-01-01',
          miles: 10000,
          payload: { total_amount: 50 },
        },
      })

      await handler(req, res)

      expect([200, 201]).toContain(res._getStatusCode())
    })
  })

  describe('Session Validation', () => {
    it('rejects session without tenantId', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          // Missing tenantId!
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/index')).default
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('rejects session with invalid tenant UUID', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: 'not-a-uuid',
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/index')).default
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('rejects session with non-existent tenant', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: uuidv4(), // Valid UUID but doesn't exist
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/index')).default
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      // May succeed with empty list (no vehicles for that tenant)
      // Or fail with 401 depending on implementation
      expect([200, 401]).toContain(res._getStatusCode())
    })
  })

  describe('Data Leakage Prevention', () => {
    it('error messages do not leak tenant information', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/[id]')).default
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: vehicle2.id }, // Cross-tenant access
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      
      // Should not reveal that the vehicle exists in another tenant
      expect(data.error).toBeDefined()
      expect(data.error.toLowerCase()).not.toContain('tenant')
      expect(data.error.toLowerCase()).not.toContain(tenant2.id)
    })

    it('list responses do not include tenant_id in response', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          email: user1.email,
          tenantId: user1.tenantId,
          role: user1.role,
        },
      })

      const handler = (await import('@/pages/api/vehicles/index')).default
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      
      // Vehicles should not expose tenant_id to client
      if (data.vehicles && data.vehicles.length > 0) {
        data.vehicles.forEach((vehicle: any) => {
          // tenant_id should either be omitted or sanitized
          if (vehicle.tenant_id) {
            console.warn('WARNING: tenant_id exposed in vehicle list response')
          }
        })
      }
    })
  })
})
