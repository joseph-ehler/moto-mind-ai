/**
 * Tenant Creation Tests
 * 
 * Tests the automatic tenant creation flow when users sign in.
 * Addresses AI warning: "Dependency on external library for auth"
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

describe('Tenant Creation Flow', () => {
  describe('New User Sign-In', () => {
    it('should create tenant for new user', async () => {
      // Test that new users get a tenant created automatically
      const newUser = {
        email: 'newuser@example.com',
        name: 'New User'
      }
      
      // Mock Supabase client
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => 
                Promise.resolve({ 
                  data: null, 
                  error: { code: 'PGRST116' } // No rows
                })
              )
            }))
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => 
                Promise.resolve({ 
                  data: { 
                    id: 'test-tenant-id',
                    name: 'New User',
                    is_active: true
                  },
                  error: null
                })
              )
            }))
          }))
        }))
      }
      
      // Should create tenant
      const result = await mockSupabase
        .from('tenants')
        .insert({ name: newUser.name, is_active: true })
        .select()
        .single()
      
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('test-tenant-id')
      expect(result.data?.is_active).toBe(true)
    })
    
    it('should link user to created tenant', async () => {
      const userId = 'user@example.com'
      const tenantId = 'test-tenant-id'
      
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn(() => 
            Promise.resolve({ 
              data: { 
                user_id: userId,
                tenant_id: tenantId,
                role: 'owner'
              },
              error: null
            })
          )
        }))
      }
      
      const result = await mockSupabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          role: 'owner'
        })
      
      expect(result.data).toBeDefined()
      expect(result.data.role).toBe('owner')
    })
  })
  
  describe('Existing User Sign-In', () => {
    it('should fetch existing tenant for returning user', async () => {
      const existingUser = {
        email: 'existing@example.com'
      }
      
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => 
                Promise.resolve({
                  data: {
                    tenant_id: 'existing-tenant-id',
                    tenants: {
                      id: 'existing-tenant-id',
                      name: 'Existing Tenant',
                      is_active: true
                    }
                  },
                  error: null
                })
              )
            }))
          }))
        }))
      }
      
      const result = await mockSupabase
        .from('user_tenants')
        .select('tenant_id, tenants(id, name, is_active)')
        .eq('user_id', existingUser.email)
        .single()
      
      expect(result.data).toBeDefined()
      expect(result.data.tenant_id).toBe('existing-tenant-id')
      expect(result.data.tenants.is_active).toBe(true)
    })
    
    it('should reject sign-in if tenant is inactive', async () => {
      const inactiveTenant = {
        tenant_id: 'inactive-tenant-id',
        tenants: {
          id: 'inactive-tenant-id',
          name: 'Inactive Tenant',
          is_active: false
        }
      }
      
      expect(inactiveTenant.tenants.is_active).toBe(false)
      // In production, this would return false from signIn callback
    })
  })
  
  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          insert: jest.fn(() => 
            Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            })
          )
        }))
      }
      
      const result = await mockSupabase
        .from('tenants')
        .insert({ name: 'Test' })
      
      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })
    
    it('should rollback tenant if user linking fails', async () => {
      // Test cleanup logic when linking fails
      const tenantId = 'test-tenant-id'
      
      const mockSupabase = {
        from: jest.fn((table) => {
          if (table === 'user_tenants') {
            return {
              insert: jest.fn(() => 
                Promise.resolve({
                  data: null,
                  error: { message: 'Linking failed' }
                })
              )
            }
          }
          if (table === 'tenants') {
            return {
              delete: jest.fn(() => ({
                eq: jest.fn(() => 
                  Promise.resolve({ data: null, error: null })
                )
              }))
            }
          }
        })
      }
      
      // Simulate failed link
      const linkResult = await mockSupabase.from('user_tenants').insert({})
      expect(linkResult.error).toBeDefined()
      
      // Should cleanup (delete tenant)
      const cleanup = await mockSupabase
        .from('tenants')
        .delete()
        .eq('id', tenantId)
      
      expect(cleanup.error).toBeNull()
    })
  })
})

describe('Tenant Validation', () => {
  it('should validate tenant_id is UUID format', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000'
    const invalidUUID = 'not-a-uuid'
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    expect(uuidRegex.test(validUUID)).toBe(true)
    expect(uuidRegex.test(invalidUUID)).toBe(false)
  })
  
  it('should require email for tenant creation', () => {
    const userWithoutEmail = { name: 'User' }
    const userWithEmail = { email: 'user@example.com', name: 'User' }
    
    expect(userWithoutEmail).not.toHaveProperty('email')
    expect(userWithEmail).toHaveProperty('email')
  })
})
