/**
 * Enterprise Test Database Utilities
 * 
 * Provides clean database setup/teardown for integration tests
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export interface TestTenant {
  id: string
  name: string
}

export interface TestUser {
  email: string
  tenantId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
}

export interface TestVehicle {
  id: string
  tenantId: string
  year: number
  make: string
  model: string
  vin: string
}

export class TestDatabase {
  private supabase: SupabaseClient
  private createdTenants: string[] = []
  private createdUsers: string[] = []
  private createdVehicles: string[] = []
  private createdEvents: string[] = []

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        'Test database credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      )
    }

    this.supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  /**
   * Create a test tenant
   */
  async createTenant(overrides?: Partial<TestTenant>): Promise<TestTenant> {
    const tenant: TestTenant = {
      id: uuidv4(),
      name: `Test Tenant ${Date.now()}`,
      ...overrides,
    }

    const { error } = await this.supabase
      .from('tenants')
      .insert({
        id: tenant.id,
        name: tenant.name,
        is_active: true,
      })

    if (error) {
      throw new Error(`Failed to create test tenant: ${error.message}`)
    }

    this.createdTenants.push(tenant.id)
    return tenant
  }

  /**
   * Create a test user and link to tenant
   */
  async createUser(tenantId: string, overrides?: Partial<TestUser>): Promise<TestUser> {
    const user: TestUser = {
      email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      tenantId,
      role: 'owner',
      ...overrides,
    }

    const { error } = await this.supabase
      .from('user_tenants')
      .insert({
        user_id: user.email,
        tenant_id: user.tenantId,
        role: user.role,
      })

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`)
    }

    this.createdUsers.push(user.email)
    return user
  }

  /**
   * Create a test vehicle
   */
  async createVehicle(
    tenantId: string,
    overrides?: Partial<Omit<TestVehicle, 'id' | 'tenantId'>>
  ): Promise<TestVehicle> {
    const vehicle = {
      tenant_id: tenantId,
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      vin: `TEST${Date.now()}${Math.random().toString(36).slice(2, 11).toUpperCase()}`.slice(0, 17),
      ...overrides,
    }

    const { data, error } = await this.supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test vehicle: ${error.message}`)
    }

    this.createdVehicles.push(data.id)
    return {
      id: data.id,
      tenantId: data.tenant_id,
      year: data.year,
      make: data.make,
      model: data.model,
      vin: data.vin,
    }
  }

  /**
   * Create a test event
   */
  async createEvent(
    vehicleId: string,
    tenantId: string,
    overrides?: {
      type?: string
      date?: string
      miles?: number
      payload?: any
    }
  ): Promise<{ id: string }> {
    const event = {
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      type: 'fuel',
      date: new Date().toISOString().split('T')[0],
      miles: 10000,
      payload: { total_amount: 50 },
      ...overrides,
    }

    const { data, error } = await this.supabase
      .from('vehicle_events')
      .insert(event)
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create test event: ${error.message}`)
    }

    this.createdEvents.push(data.id)
    return { id: data.id }
  }

  /**
   * Clean up all test data
   * Call this in afterAll() or afterEach()
   */
  async cleanup(): Promise<void> {
    const errors: string[] = []

    // Delete in reverse order of creation (foreign key constraints)
    
    // 1. Events
    if (this.createdEvents.length > 0) {
      const { error } = await this.supabase
        .from('vehicle_events')
        .delete()
        .in('id', this.createdEvents)
      
      if (error) errors.push(`Events: ${error.message}`)
    }

    // 2. Vehicles
    if (this.createdVehicles.length > 0) {
      const { error } = await this.supabase
        .from('vehicles')
        .delete()
        .in('id', this.createdVehicles)
      
      if (error) errors.push(`Vehicles: ${error.message}`)
    }

    // 3. User-Tenant mappings
    if (this.createdUsers.length > 0) {
      const { error } = await this.supabase
        .from('user_tenants')
        .delete()
        .in('user_id', this.createdUsers)
      
      if (error) errors.push(`Users: ${error.message}`)
    }

    // 4. Tenants
    if (this.createdTenants.length > 0) {
      const { error } = await this.supabase
        .from('tenants')
        .delete()
        .in('id', this.createdTenants)
      
      if (error) errors.push(`Tenants: ${error.message}`)
    }

    // Reset tracking arrays
    this.createdEvents = []
    this.createdVehicles = []
    this.createdUsers = []
    this.createdTenants = []

    if (errors.length > 0) {
      console.warn('Cleanup errors:', errors)
      // Don't throw - cleanup should be best-effort
    }
  }

  /**
   * Get the Supabase client for direct queries
   */
  getClient(): SupabaseClient {
    return this.supabase
  }
}

/**
 * Create a mock NextAuth session for testing
 */
export function createMockSession(user: TestUser) {
  return {
    user: {
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    },
    expires: new Date(Date.now() + 86400000).toISOString(), // 24h from now
  }
}

/**
 * Wait for async operations (useful for event processing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
