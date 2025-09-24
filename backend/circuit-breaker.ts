// MotoMindAI: Tiered Circuit Breaker System
// Multi-level protection: tenant-specific + global with smart recovery

interface CircuitState {
  failures: number
  lastFailure: number
  isOpen: boolean
  halfOpenAttempts: number
}

export type ErrorType = 'rate_limit' | 'server_error' | 'data_error'
export type OperationType = 'api' | 'data'

export class TieredCircuitBreaker {
  private tenantCircuits = new Map<string, CircuitState>()
  private globalCircuit: CircuitState = { 
    failures: 0, 
    lastFailure: 0, 
    isOpen: false, 
    halfOpenAttempts: 0 
  }
  
  // Different thresholds for different failure types
  private readonly thresholds = {
    tenant: {
      rate_limit: { failures: 2, timeout: 60000 }, // 1 minute for rate limits
      server_error: { failures: 3, timeout: 300000 }, // 5 minutes for server errors
      data_error: { failures: 5, timeout: 180000 } // 3 minutes for data issues
    },
    global: {
      server_error: { failures: 10, timeout: 600000 }, // 10 minutes for global issues
      rate_limit: { failures: 5, timeout: 300000 } // 5 minutes for global rate limits
    }
  }
  
  async checkCircuit(tenantId: string, operationType: OperationType = 'api'): Promise<{
    allowed: boolean
    reason?: string
    retryAfter?: number
  }> {
    const now = Date.now()
    
    // Check global circuit first
    if (this.globalCircuit.isOpen) {
      const globalTimeout = this.thresholds.global.server_error.timeout
      if (now - this.globalCircuit.lastFailure > globalTimeout) {
        // Reset global circuit
        this.globalCircuit.isOpen = false
        this.globalCircuit.failures = 0
        this.globalCircuit.halfOpenAttempts = 0
        console.log('Global circuit breaker reset - system recovered')
      } else {
        return {
          allowed: false,
          reason: 'Global API circuit breaker open - system-wide issues detected',
          retryAfter: globalTimeout - (now - this.globalCircuit.lastFailure)
        }
      }
    }
    
    // Check tenant-specific circuit
    const tenantCircuit = this.tenantCircuits.get(tenantId)
    if (tenantCircuit?.isOpen) {
      const timeout = operationType === 'data' 
        ? this.thresholds.tenant.data_error.timeout
        : this.thresholds.tenant.server_error.timeout
        
      if (now - tenantCircuit.lastFailure > timeout) {
        // Reset tenant circuit
        tenantCircuit.isOpen = false
        tenantCircuit.failures = 0
        tenantCircuit.halfOpenAttempts = 0
        console.log(`Tenant circuit breaker reset for ${tenantId}`)
      } else {
        return {
          allowed: false,
          reason: `Tenant circuit breaker open - ${operationType} issues detected`,
          retryAfter: timeout - (now - tenantCircuit.lastFailure)
        }
      }
    }
    
    return { allowed: true }
  }
  
  recordFailure(tenantId: string, errorType: ErrorType): void {
    const now = Date.now()
    
    // Record tenant failure
    const tenantCircuit = this.tenantCircuits.get(tenantId) || {
      failures: 0, 
      lastFailure: 0, 
      isOpen: false, 
      halfOpenAttempts: 0
    }
    
    tenantCircuit.failures += 1
    tenantCircuit.lastFailure = now
    
    const threshold = this.thresholds.tenant[errorType]
    if (tenantCircuit.failures >= threshold.failures) {
      tenantCircuit.isOpen = true
      console.warn(`🚨 Tenant circuit breaker opened for ${tenantId}: ${errorType}`)
    }
    
    this.tenantCircuits.set(tenantId, tenantCircuit)
    
    // Record global failure for system-wide issues
    if (errorType === 'server_error') {
      this.globalCircuit.failures += 1
      this.globalCircuit.lastFailure = now
      
      if (this.globalCircuit.failures >= this.thresholds.global.server_error.failures) {
        this.globalCircuit.isOpen = true
        console.error('🚨 GLOBAL circuit breaker opened - system-wide API issues detected')
      }
    }
  }
  
  recordSuccess(tenantId: string): void {
    // Reset tenant circuit on success
    const tenantCircuit = this.tenantCircuits.get(tenantId)
    if (tenantCircuit) {
      tenantCircuit.failures = Math.max(0, tenantCircuit.failures - 1)
      tenantCircuit.halfOpenAttempts = 0
      
      // Fully reset if circuit was open and now successful
      if (tenantCircuit.isOpen && tenantCircuit.failures === 0) {
        tenantCircuit.isOpen = false
        console.log(`✅ Tenant circuit breaker recovered for ${tenantId}`)
      }
    }
    
    // Gradually recover global circuit
    if (this.globalCircuit.failures > 0) {
      this.globalCircuit.failures = Math.max(0, this.globalCircuit.failures - 1)
      
      if (this.globalCircuit.isOpen && this.globalCircuit.failures === 0) {
        this.globalCircuit.isOpen = false
        console.log('✅ Global circuit breaker recovered - system healthy')
      }
    }
  }
  
  // Get circuit status for monitoring
  getStatus(tenantId?: string) {
    if (tenantId) {
      const tenantCircuit = this.tenantCircuits.get(tenantId)
      return {
        tenant: tenantCircuit || { failures: 0, isOpen: false },
        global: { 
          failures: this.globalCircuit.failures, 
          isOpen: this.globalCircuit.isOpen 
        }
      }
    }
    
    return {
      global: { 
        failures: this.globalCircuit.failures, 
        isOpen: this.globalCircuit.isOpen 
      },
      tenantCount: this.tenantCircuits.size,
      openTenants: Array.from(this.tenantCircuits.entries())
        .filter(([_, circuit]) => circuit.isOpen)
        .map(([tenantId, _]) => tenantId)
    }
  }
}

// Global singleton instance
export const circuitBreaker = new TieredCircuitBreaker()
