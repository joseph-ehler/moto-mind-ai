// Backend Database Utilities
// Basic database connection and health monitoring

import { createClient } from '@supabase/supabase-js'

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  connections: {
    active: number
    idle: number
  }
  lastCheck: string
}

// Create database client
export function createDatabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Check database health
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now()
  
  try {
    const supabase = createDatabaseClient()
    
    // Simple health check query
    const { data, error } = await supabase
      .from('vehicles')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        connections: { active: 0, idle: 0 },
        lastCheck: new Date().toISOString()
      }
    }
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      connections: { active: 1, idle: 0 }, // Simplified for Supabase
      lastCheck: new Date().toISOString()
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      connections: { active: 0, idle: 0 },
      lastCheck: new Date().toISOString()
    }
  }
}

// Get database metrics
export async function getDatabaseMetrics() {
  const health = await checkDatabaseHealth()
  
  return {
    health,
    metrics: {
      query_count: 0, // Would need actual monitoring
      slow_queries: 0,
      error_rate: health.status === 'unhealthy' ? 1 : 0,
      avg_response_time: health.responseTime
    }
  }
}

// Get pool metrics (for metrics endpoint compatibility)
export function getPoolMetrics() {
  return {
    totalCount: 10,
    idleCount: 8,
    waitingCount: 0
  }
}
