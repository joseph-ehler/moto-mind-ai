// MotoMindAI: Tenant Isolation Test Suite
// Prevents cross-tenant data leaks - CRITICAL for production

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { withTenantTransaction } from '../../backend/database'
import { v4 as uuidv4 } from 'uuid'

describe('Tenant Isolation - CRITICAL SECURITY TESTS', () => {
  let tenant1Id: string
  let tenant2Id: string
  let user1Id: string
  let user2Id: string
  
  beforeEach(async () => {
    // Create test tenants
    tenant1Id = uuidv4()
    tenant2Id = uuidv4()
    user1Id = uuidv4()
    user2Id = uuidv4()
    
    // Set up test data
    await setupTestTenants()
  })
  
  afterEach(async () => {
    await cleanupTestTenants()
  })
  
  test('CRITICAL: prevents cross-tenant data access', async () => {
    // Create vehicle in tenant1
    const vehicle1 = await withTenantTransaction(
      { tenantId: tenant1Id, userId: user1Id },
      async (client) => {
        const result = await client.query(`
          INSERT INTO vehicles (tenant_id, label, make, model)
          VALUES ($1, 'Test Vehicle 1', 'Ford', 'F-150')
          RETURNING *
        `, [tenant1Id])
        return result.rows[0]
      }
    )
    
    // Verify tenant2 CANNOT see tenant1's vehicle
    const tenant2Vehicles = await withTenantTransaction(
      { tenantId: tenant2Id, userId: user2Id },
      async (client) => {
        const result = await client.query('SELECT * FROM vehicles')
        return result.rows
      }
    )
    
    expect(tenant2Vehicles).toHaveLength(0)
    expect(tenant2Vehicles).not.toContainEqual(
      expect.objectContaining({ id: vehicle1.id })
    )
  })
  
  test('CRITICAL: prevents cross-tenant writes via WITH CHECK', async () => {
    // Attempt to insert vehicle with wrong tenant_id should FAIL
    await expect(
      withTenantTransaction(
        { tenantId: tenant1Id, userId: user1Id },
        async (client) => {
          await client.query(`
            INSERT INTO vehicles (tenant_id, label, make, model)
            VALUES ($1, 'Malicious Vehicle', 'Toyota', 'Camry')
          `, [tenant2Id]) // Wrong tenant ID - should be blocked by WITH CHECK
        }
      )
    ).rejects.toThrow()
  })
  
  test('CRITICAL: maintains isolation during concurrent access', async () => {
    // Simulate concurrent access from different tenants
    const promises = [
      withTenantTransaction(
        { tenantId: tenant1Id, userId: user1Id },
        async (client) => {
          await client.query(`
            INSERT INTO vehicles (tenant_id, label, make, model)
            VALUES ($1, 'Concurrent Vehicle 1', 'Honda', 'Civic')
          `, [tenant1Id])
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const result = await client.query('SELECT COUNT(*) FROM vehicles')
          return parseInt(result.rows[0].count)
        }
      ),
      
      withTenantTransaction(
        { tenantId: tenant2Id, userId: user2Id },
        async (client) => {
          await client.query(`
            INSERT INTO vehicles (tenant_id, label, make, model)
            VALUES ($1, 'Concurrent Vehicle 2', 'Nissan', 'Altima')
          `, [tenant2Id])
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const result = await client.query('SELECT COUNT(*) FROM vehicles')
          return parseInt(result.rows[0].count)
        }
      )
    ]
    
    const results = await Promise.all(promises)
    
    // Each tenant should only see their own vehicle (count = 1)
    expect(results[0]).toBe(1)
    expect(results[1]).toBe(1)
  })
  
  test('CRITICAL: maintains isolation during transaction failures', async () => {
    // Create vehicle in tenant1
    await withTenantTransaction(
      { tenantId: tenant1Id, userId: user1Id },
      async (client) => {
        await client.query(`
          INSERT INTO vehicles (tenant_id, label, make, model)
          VALUES ($1, 'Safe Vehicle', 'Ford', 'Explorer')
        `, [tenant1Id])
      }
    )
    
    // Simulate failure in tenant2 transaction
    try {
      await withTenantTransaction(
        { tenantId: tenant2Id, userId: user2Id },
        async (client) => {
          await client.query(`
            INSERT INTO vehicles (tenant_id, label, make, model)
            VALUES ($1, 'Failing Vehicle', 'Chevrolet', 'Tahoe')
          `, [tenant2Id])
          
          // Simulate failure
          throw new Error('Simulated transaction failure')
        }
      )
    } catch (error) {
      // Expected to fail
    }
    
    // Verify tenant1 data is still intact and isolated
    const tenant1Vehicles = await withTenantTransaction(
      { tenantId: tenant1Id, userId: user1Id },
      async (client) => {
        const result = await client.query('SELECT * FROM vehicles')
        return result.rows
      }
    )
    
    expect(tenant1Vehicles).toHaveLength(1)
    expect(tenant1Vehicles[0].label).toBe('Safe Vehicle')
    
    // Verify tenant2 has no data (transaction rolled back)
    const tenant2Vehicles = await withTenantTransaction(
      { tenantId: tenant2Id, userId: user2Id },
      async (client) => {
        const result = await client.query('SELECT * FROM vehicles')
        return result.rows
      }
    )
    
    expect(tenant2Vehicles).toHaveLength(0)
  })
  
  test('CRITICAL: explanation isolation', async () => {
    // Create explanation in tenant1
    const explanation1 = await withTenantTransaction(
      { tenantId: tenant1Id, userId: user1Id },
      async (client) => {
        const result = await client.query(`
          INSERT INTO explanations (tenant_id, vehicle_id, question, reasoning, confidence, created_by)
          VALUES ($1, $2, 'Why flagged?', '{"answer": "Test"}', 'high', $3)
          RETURNING *
        `, [tenant1Id, uuidv4(), user1Id])
        return result.rows[0]
      }
    )
    
    // Verify tenant2 cannot access tenant1's explanations
    const tenant2Explanations = await withTenantTransaction(
      { tenantId: tenant2Id, userId: user2Id },
      async (client) => {
        const result = await client.query('SELECT * FROM explanations')
        return result.rows
      }
    )
    
    expect(tenant2Explanations).toHaveLength(0)
    expect(tenant2Explanations).not.toContainEqual(
      expect.objectContaining({ id: explanation1.id })
    )
  })
  
  async function setupTestTenants() {
    // Implementation would create test tenant records
    // This is a placeholder for the actual setup logic
  }
  
  async function cleanupTestTenants() {
    // Implementation would clean up test data
    // This is a placeholder for the actual cleanup logic
  }
})

// Export for CI/CD pipeline
export { }
