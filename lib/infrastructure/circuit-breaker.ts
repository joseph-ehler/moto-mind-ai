// Backend Circuit Breaker
// Resilience patterns for external service calls

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailure: number | null
  nextAttempt: number | null
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig
  private state: CircuitBreakerState
  private name: string

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 300000 // 5 minutes
    }
    
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailure: null,
      nextAttempt: null
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      if (Date.now() < (this.state.nextAttempt || 0)) {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Next attempt at ${new Date(this.state.nextAttempt!)}`)
      }
      
      // Transition to half-open
      this.state.state = 'half-open'
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.state.failures = 0
    this.state.lastFailure = null
    this.state.nextAttempt = null
    
    if (this.state.state === 'half-open') {
      this.state.state = 'closed'
    }
  }

  private onFailure() {
    this.state.failures++
    this.state.lastFailure = Date.now()

    if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'open'
      this.state.nextAttempt = Date.now() + this.config.recoveryTimeout
    }
  }

  getState(): CircuitBreakerState & { name: string } {
    return {
      ...this.state,
      name: this.name
    }
  }

  reset() {
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailure: null,
      nextAttempt: null
    }
  }
}

// Global circuit breakers for common services
const circuitBreakers = new Map<string, CircuitBreaker>()

export function getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, config))
  }
  return circuitBreakers.get(name)!
}

export function getAllCircuitBreakerStates() {
  return Array.from(circuitBreakers.values()).map(cb => cb.getState())
}

// Predefined circuit breakers for common services
export const openaiCircuitBreaker = getCircuitBreaker('openai', {
  failureThreshold: 3,
  recoveryTimeout: 30000 // 30 seconds
})

export const supabaseCircuitBreaker = getCircuitBreaker('supabase', {
  failureThreshold: 5,
  recoveryTimeout: 10000 // 10 seconds
})

export const externalApiCircuitBreaker = getCircuitBreaker('external-api', {
  failureThreshold: 3,
  recoveryTimeout: 60000 // 1 minute
})

// Circuit breaker manager (for metrics endpoint compatibility)
export const circuitBreaker = {
  getStatus() {
    const states = getAllCircuitBreakerStates()
    return {
      global: states.find(s => s.name === 'global') || { state: 'closed', failures: 0 },
      openai: states.find(s => s.name === 'openai') || { state: 'closed', failures: 0 },
      supabase: states.find(s => s.name === 'supabase') || { state: 'closed', failures: 0 },
      external: states.find(s => s.name === 'external-api') || { state: 'closed', failures: 0 }
    }
  },
  
  getAllStates() {
    return getAllCircuitBreakerStates()
  }
}
