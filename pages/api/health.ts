// MotoMindAI: Health Check Endpoint
// System status for monitoring and load balancers

import type { NextApiRequest, NextApiResponse } from 'next'
import { getPoolMetrics } from '../../backend/database'
import { circuitBreaker } from '../../backend/circuit-breaker'
import { usageTracker } from '../../backend/usage-tracker'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: 'healthy' | 'unhealthy'
      connections: {
        total: number
        idle: number
        waiting: number
      }
    }
    circuitBreaker: {
      status: 'healthy' | 'degraded' | 'unhealthy'
      global: {
        isOpen: boolean
        failures: number
      }
      openTenants: string[]
    }
    usageTracker: {
      status: 'healthy' | 'degraded'
      batchSize: number
      maxBatchSize: number
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  const startTime = Date.now()
  
  try {
    // Database health
    const poolMetrics = getPoolMetrics()
    const dbHealthy = poolMetrics.waitingCount === 0 && poolMetrics.totalCount > 0
    
    // Circuit breaker health
    const circuitStatus = circuitBreaker.getStatus()
    const circuitHealthy = !circuitStatus.global.isOpen && circuitStatus.openTenants.length === 0
    const circuitDegraded = circuitStatus.openTenants.length > 0 && circuitStatus.openTenants.length < 5
    
    // Usage tracker health
    const usageStatus = usageTracker.getBatchStatus()
    const usageHealthy = usageStatus.batchSize < usageStatus.maxBatchSize * 0.8
    
    // Overall system status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (!dbHealthy || circuitStatus.global.isOpen) {
      overallStatus = 'unhealthy'
    } else if (!circuitHealthy || !usageHealthy) {
      overallStatus = 'degraded'
    }
    
    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          connections: {
            total: poolMetrics.totalCount,
            idle: poolMetrics.idleCount,
            waiting: poolMetrics.waitingCount
          }
        },
        circuitBreaker: {
          status: circuitStatus.global.isOpen ? 'unhealthy' : circuitDegraded ? 'degraded' : 'healthy',
          global: {
            isOpen: circuitStatus.global.isOpen,
            failures: circuitStatus.global.failures
          },
          openTenants: circuitStatus.openTenants
        },
        usageTracker: {
          status: usageHealthy ? 'healthy' : 'degraded',
          batchSize: usageStatus.batchSize,
          maxBatchSize: usageStatus.maxBatchSize
        }
      }
    }
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503
    
    // Add response time header
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`)
    
    res.status(statusCode).json(response)
  } catch (error) {
    console.error('Health check failed:', error)
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: process.uptime(),
      checks: {
        database: {
          status: 'unhealthy',
          connections: { total: 0, idle: 0, waiting: 0 }
        },
        circuitBreaker: {
          status: 'unhealthy',
          global: { isOpen: true, failures: 999 },
          openTenants: []
        },
        usageTracker: {
          status: 'degraded',
          batchSize: 0,
          maxBatchSize: 100
        }
      }
    })
  }
}
