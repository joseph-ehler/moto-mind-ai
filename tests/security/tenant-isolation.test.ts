// Integration Tests: Tenant Isolation Security
// Verifies that RLS policies prevent cross-tenant data access

import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Test tenant IDs (use actual tenant IDs from your database)
const TENANT_A = '550e8400-e29b-41d4-a716-446655440000'
const TENANT_B = '550e8400-e29b-41d4-a716-446655440001' // Fake tenant for testing

describe('Tenant Isolation Security Tests', () => {
  let supabaseAdmin: any
  let supabaseTenantA: any
  let supabaseTenantB: any

  beforeAll(() => {
    // Admin client (bypasses RLS)
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Tenant A client (with RLS)
    supabaseTenantA = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: {
          'app.tenant_id': TENANT_A
        }
      }
    })

    // Tenant B client (with RLS) 
    supabaseTenantB = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: {
          'app.tenant_id': TENANT_B
        }
      }
    })
  })

  describe('vehicle_events tenant isolation', () => {
    test('admin can see all vehicle_events', async () => {
      const { data, error } = await supabaseAdmin
        .from('vehicle_events')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    test('tenant A can only see their vehicle_events', async () => {
      const { data, error } = await supabaseTenantA
        .from('vehicle_events')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      // All returned events should belong to tenant A
      data?.forEach(event => {
        expect(event.tenant_id).toBe(TENANT_A)
      })
    })

    test('tenant B cannot see tenant A vehicle_events', async () => {
      const { data, error } = await supabaseTenantB
        .from('vehicle_events')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      // Should return empty array or only tenant B events
      data?.forEach(event => {
        expect(event.tenant_id).not.toBe(TENANT_A)
      })
    })

    test('tenant cannot insert vehicle_events for other tenants', async () => {
      const { error } = await supabaseTenantA
        .from('vehicle_events')
        .insert({
          vehicle_id: 'test-vehicle-id',
          tenant_id: TENANT_B, // Try to insert for different tenant
          type: 'odometer',
          miles: 50000,
          date: new Date().toISOString()
        })

      // Should fail due to RLS policy
      expect(error).not.toBeNull()
      expect(error?.message).toContain('policy')
    })
  })

  describe('reminders tenant isolation', () => {
    test('admin can see all reminders', async () => {
      const { data, error } = await supabaseAdmin
        .from('reminders')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    test('tenant A can only see their reminders', async () => {
      const { data, error } = await supabaseTenantA
        .from('reminders')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      // All returned reminders should belong to tenant A
      data?.forEach(reminder => {
        expect(reminder.tenant_id).toBe(TENANT_A)
      })
    })

    test('tenant B cannot see tenant A reminders', async () => {
      const { data, error } = await supabaseTenantB
        .from('reminders')
        .select('*')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      
      // Should return empty array or only tenant B reminders
      data?.forEach(reminder => {
        expect(reminder.tenant_id).not.toBe(TENANT_A)
      })
    })

    test('tenant cannot insert reminders for other tenants', async () => {
      const { error } = await supabaseTenantA
        .from('reminders')
        .insert({
          vehicle_id: 'test-vehicle-id',
          tenant_id: TENANT_B, // Try to insert for different tenant
          title: 'Test reminder',
          status: 'open',
          due_date: new Date().toISOString()
        })

      // Should fail due to RLS policy
      expect(error).not.toBeNull()
      expect(error?.message).toContain('policy')
    })
  })

  describe('data integrity validation', () => {
    test('all vehicle_events have tenant_id', async () => {
      const { data, error } = await supabaseAdmin
        .from('vehicle_events')
        .select('id, tenant_id')
        .is('tenant_id', null)

      expect(error).toBeNull()
      expect(data).toEqual([]) // Should be empty - no null tenant_ids
    })

    test('all reminders have tenant_id', async () => {
      const { data, error } = await supabaseAdmin
        .from('reminders')
        .select('id, tenant_id')
        .is('tenant_id', null)

      expect(error).toBeNull()
      expect(data).toEqual([]) // Should be empty - no null tenant_ids
    })

    test('all vehicle_events have audit timestamps', async () => {
      const { data, error } = await supabaseAdmin
        .from('vehicle_events')
        .select('id, created_at, updated_at')
        .or('created_at.is.null,updated_at.is.null')

      expect(error).toBeNull()
      expect(data).toEqual([]) // Should be empty - no null timestamps
    })
  })

  describe('RLS policy verification', () => {
    test('RLS is enabled on vehicle_events', async () => {
      const { data, error } = await supabaseAdmin
        .rpc('check_rls_enabled', { table_name: 'vehicle_events' })

      expect(error).toBeNull()
      expect(data).toBe(true)
    })

    test('RLS is enabled on reminders', async () => {
      const { data, error } = await supabaseAdmin
        .rpc('check_rls_enabled', { table_name: 'reminders' })

      expect(error).toBeNull()
      expect(data).toBe(true)
    })
  })
})

// Helper function to create RLS check function in database
export const createRLSCheckFunction = async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = table_name;
      $$;
    `
  })
  
  if (error) {
    console.warn('Could not create RLS check function:', error.message)
  }
}
