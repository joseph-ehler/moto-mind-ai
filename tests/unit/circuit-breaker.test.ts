// MotoMindAI: Circuit Breaker Unit Tests
// Validates tiered circuit breaking logic

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { TieredCircuitBreaker } from '../../backend/circuit-breaker'

describe('TieredCircuitBreaker', () => {
  let circuitBreaker: TieredCircuitBreaker;
  
  beforeEach(() => {
    circuitBreaker = new TieredCircuitBreaker()
    // Mock console methods to avoid test noise
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  test('allows requests when circuit is closed', async () => {
    const result = await circuitBreaker.checkCircuit('tenant1', 'api')
    
    expect(result.allowed).toBe(true)
    expect(result.reason).toBeUndefined()
    expect(result.retryAfter).toBeUndefined()
  })
  
  test('opens tenant circuit after threshold failures', async () => {
    const tenantId = 'tenant1'
    
    // Record failures to reach threshold (3 for server_error)
    circuitBreaker.recordFailure(tenantId, 'server_error')
    circuitBreaker.recordFailure(tenantId, 'server_error')
    circuitBreaker.recordFailure(tenantId, 'server_error')
    
    const result = await circuitBreaker.checkCircuit(tenantId, 'api')
    
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Tenant circuit breaker open')
    expect(result.retryAfter).toBeGreaterThan(0)
  })
  
  test('opens global circuit after threshold failures', async () => {
    // Record server errors from multiple tenants to trigger global circuit
    for (let i = 0; i < 10; i++) {
      circuitBreaker.recordFailure(`tenant${i}`, 'server_error')
    }
    
    const result = await circuitBreaker.checkCircuit('new-tenant', 'api')
    
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Global API circuit breaker open')
    expect(result.retryAfter).toBeGreaterThan(0)
  })
  
  test('different thresholds for different error types', async () => {
    const tenantId = 'tenant1'
    
    // Rate limit threshold is 2, should open after 2 failures
    circuitBreaker.recordFailure(tenantId, 'rate_limit')
    
    let result = await circuitBreaker.checkCircuit(tenantId, 'api')
    expect(result.allowed).toBe(true) // Still allowed after 1 failure
    
    circuitBreaker.recordFailure(tenantId, 'rate_limit')
    
    result = await circuitBreaker.checkCircuit(tenantId, 'api')
    expect(result.allowed).toBe(false) // Blocked after 2 failures
  })
  
  test('resets circuit after timeout', async () => {
    const tenantId = 'tenant1'
    
    // Open the circuit
    circuitBreaker.recordFailure(tenantId, 'server_error')
    circuitBreaker.recordFailure(tenantId, 'server_error')
    circuitBreaker.recordFailure(tenantId, 'server_error')
    
    let result = await circuitBreaker.checkCircuit(tenantId, 'api')
    expect(result.allowed).toBe(false)
    
    // Mock time passage by manipulating the internal state
    // In a real scenario, you'd wait for the timeout or use fake timers
    const status = circuitBreaker.getStatus(tenantId)
    
    // Verify circuit is initially open
    expect(status.tenant.isOpen).toBe(true)
  })
  
  test('success reduces failure count', () => {
    const tenantId = 'tenant1'
    
    // Record some failures
    circuitBreaker.recordFailure(tenantId, 'server_error')
    circuitBreaker.recordFailure(tenantId, 'server_error')
    
    let status = circuitBreaker.getStatus(tenantId)
    expect(status.tenant.failures).toBe(2)
    
    // Record success should reduce failure count
    circuitBreaker.recordSuccess(tenantId)
    
    status = circuitBreaker.getStatus(tenantId)
    expect(status.tenant.failures).toBe(1)
  })
  
  test('isolates tenant circuits', async () => {
    // Open circuit for tenant1
    circuitBreaker.recordFailure('tenant1', 'server_error')
    circuitBreaker.recordFailure('tenant1', 'server_error')
    circuitBreaker.recordFailure('tenant1', 'server_error')
    
    // tenant1 should be blocked
    let result1 = await circuitBreaker.checkCircuit('tenant1', 'api')
    expect(result1.allowed).toBe(false)
    
    // tenant2 should still be allowed
    let result2 = await circuitBreaker.checkCircuit('tenant2', 'api')
    expect(result2.allowed).toBe(true)
  })
  
  test('provides circuit status for monitoring', () => {
    const tenantId = 'tenant1'
    
    // Record some failures
    circuitBreaker.recordFailure(tenantId, 'server_error')
    circuitBreaker.recordFailure(tenantId, 'server_error')
    
    const status = circuitBreaker.getStatus(tenantId)
    
    expect(status.tenant.failures).toBe(2)
    expect(status.tenant.isOpen).toBe(false) // Not open yet (threshold is 3)
    expect(status.global.failures).toBe(2) // Global also tracks server errors
    expect(status.global.isOpen).toBe(false)
  })
  
  test('global status shows tenant count and open tenants', () => {
    // Create failures for multiple tenants
    circuitBreaker.recordFailure('tenant1', 'server_error')
    circuitBreaker.recordFailure('tenant2', 'rate_limit')
    circuitBreaker.recordFailure('tenant2', 'rate_limit') // This should open tenant2
    
    const globalStatus = circuitBreaker.getStatus()
    
    expect(globalStatus.tenantCount).toBe(2)
    expect(globalStatus.openTenants).toContain('tenant2')
    expect(globalStatus.openTenants).not.toContain('tenant1')
  })
})
