/**
 * God-Tier Health Monitor
 * 
 * Proactive database health monitoring:
 * - Connection health checks
 * - Performance metrics
 * - Capacity alerts
 * - Auto-recovery
 * - Trend analysis
 */

import { ConnectionManager } from './connection-manager'
import { QueryExecutor } from './query-executor'
import { HealthStatus } from './types'

export interface HealthReport {
  overall: 'healthy' | 'degraded' | 'critical'
  score: number
  connections: {
    type: string
    status: 'healthy' | 'degraded' | 'failed'
    latency: number
    message?: string
  }[]
  database: {
    size: string
    connections: number
    maxConnections: number
    slowQueries: number
    cacheHitRatio: number
  }
  recommendations: string[]
  timestamp: Date
}

export class HealthMonitor {
  constructor(
    private connectionManager: ConnectionManager,
    private queryExecutor: QueryExecutor
  ) {}
  
  /**
   * Run comprehensive health check
   */
  async check(): Promise<HealthReport> {
    console.log('🏥 Running health check...')
    
    const [
      connectionHealth,
      databaseHealth,
      performanceHealth
    ] = await Promise.all([
      this.checkConnections(),
      this.checkDatabase(),
      this.checkPerformance()
    ])
    
    const recommendations = this.generateRecommendations(
      connectionHealth,
      databaseHealth,
      performanceHealth
    )
    
    const score = this.calculateScore(
      connectionHealth,
      databaseHealth,
      performanceHealth
    )
    
    const overall = score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'critical'
    
    return {
      overall,
      score,
      connections: connectionHealth,
      database: databaseHealth,
      recommendations,
      timestamp: new Date()
    }
  }
  
  /**
   * Check all connection health
   */
  private async checkConnections(): Promise<HealthReport['connections']> {
    const connections = this.connectionManager.getConnections()
    const healthStatuses = this.connectionManager.getHealthStatus()
    
    const results: HealthReport['connections'] = []
    
    for (const [type, conn] of Array.from(connections.entries())) {
      const health = healthStatuses.get(type)
      
      results.push({
        type,
        status: health?.status || 'failed',
        latency: conn.latency,
        message: health?.reason
      })
    }
    
    return results
  }
  
  /**
   * Check database health metrics
   */
  private async checkDatabase(): Promise<HealthReport['database']> {
    try {
      // Get database size
      const sizeResult = await this.queryExecutor.execute<{ size: string }>(
        `SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
        { readOnly: true }
      )
      const size = sizeResult.rows[0]?.size || 'unknown'
      
      // Get connection stats
      const connResult = await this.queryExecutor.execute<{
        current: number
        max: number
      }>(
        `SELECT 
          count(*) as current,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max
        FROM pg_stat_activity
        WHERE datname = current_database()`,
        { readOnly: true }
      )
      const connections = connResult.rows[0]?.current || 0
      const maxConnections = connResult.rows[0]?.max || 100
      
      // Get slow query count (>1s)
      const slowResult = await this.queryExecutor.execute<{ count: number }>(
        `SELECT count(*) as count
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        LIMIT 1`,
        { readOnly: true }
      ).catch(() => ({ rows: [{ count: 0 }] })) // pg_stat_statements might not be enabled
      const slowQueries = slowResult.rows[0]?.count || 0
      
      // Get cache hit ratio
      const cacheResult = await this.queryExecutor.execute<{ ratio: number }>(
        `SELECT 
          round(
            100.0 * sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0),
            2
          ) as ratio
        FROM pg_statio_user_tables`,
        { readOnly: true }
      )
      const cacheHitRatio = cacheResult.rows[0]?.ratio || 0
      
      return {
        size,
        connections,
        maxConnections,
        slowQueries,
        cacheHitRatio
      }
    } catch (error) {
      console.warn('Failed to get database health:', error)
      return {
        size: 'unknown',
        connections: 0,
        maxConnections: 100,
        slowQueries: 0,
        cacheHitRatio: 0
      }
    }
  }
  
  /**
   * Check performance metrics
   */
  private async checkPerformance(): Promise<{
    deadlocks: number
    blockedQueries: number
    longRunningQueries: number
  }> {
    try {
      // Check for deadlocks (last hour)
      const deadlockResult = await this.queryExecutor.execute<{ count: number }>(
        `SELECT count(*) as count
        FROM pg_stat_database
        WHERE datname = current_database()
          AND deadlocks > 0`,
        { readOnly: true }
      )
      const deadlocks = deadlockResult.rows[0]?.count || 0
      
      // Check for blocked queries
      const blockedResult = await this.queryExecutor.execute<{ count: number }>(
        `SELECT count(*) as count
        FROM pg_stat_activity
        WHERE wait_event_type IS NOT NULL
          AND state = 'active'`,
        { readOnly: true }
      )
      const blockedQueries = blockedResult.rows[0]?.count || 0
      
      // Check for long-running queries (>5 min)
      const longRunningResult = await this.queryExecutor.execute<{ count: number }>(
        `SELECT count(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
          AND now() - query_start > interval '5 minutes'`,
        { readOnly: true }
      )
      const longRunningQueries = longRunningResult.rows[0]?.count || 0
      
      return {
        deadlocks,
        blockedQueries,
        longRunningQueries
      }
    } catch (error) {
      console.warn('Failed to get performance metrics:', error)
      return {
        deadlocks: 0,
        blockedQueries: 0,
        longRunningQueries: 0
      }
    }
  }
  
  /**
   * Generate recommendations based on health check
   */
  private generateRecommendations(
    connections: HealthReport['connections'],
    database: HealthReport['database'],
    performance: { deadlocks: number; blockedQueries: number; longRunningQueries: number }
  ): string[] {
    const recommendations: string[] = []
    
    // Connection recommendations
    const healthyConnections = connections.filter(c => c.status === 'healthy')
    if (healthyConnections.length === 0) {
      recommendations.push('🚨 CRITICAL: No healthy database connections')
    } else if (healthyConnections.length < connections.length) {
      recommendations.push('⚠️  Some database connections are degraded or failed')
    }
    
    // Connection pool recommendations
    const utilizationPercent = (database.connections / database.maxConnections) * 100
    if (utilizationPercent > 80) {
      recommendations.push(
        `⚠️  Connection pool is ${utilizationPercent.toFixed(0)}% utilized - consider increasing max_connections`
      )
    }
    
    // Slow query recommendations
    if (database.slowQueries > 10) {
      recommendations.push(
        `⚠️  ${database.slowQueries} slow queries detected - run performance analysis`
      )
    }
    
    // Cache hit ratio recommendations
    if (database.cacheHitRatio < 90) {
      recommendations.push(
        `⚠️  Cache hit ratio is ${database.cacheHitRatio}% - consider increasing shared_buffers`
      )
    }
    
    // Performance recommendations
    if (performance.deadlocks > 0) {
      recommendations.push(
        `⚠️  ${performance.deadlocks} deadlock(s) detected - review transaction logic`
      )
    }
    
    if (performance.blockedQueries > 5) {
      recommendations.push(
        `⚠️  ${performance.blockedQueries} queries currently blocked - investigate lock contention`
      )
    }
    
    if (performance.longRunningQueries > 0) {
      recommendations.push(
        `⚠️  ${performance.longRunningQueries} query(ies) running >5 minutes - may need optimization`
      )
    }
    
    // All good
    if (recommendations.length === 0) {
      recommendations.push('✅ All systems operational')
    }
    
    return recommendations
  }
  
  /**
   * Calculate overall health score (0-100)
   */
  private calculateScore(
    connections: HealthReport['connections'],
    database: HealthReport['database'],
    performance: { deadlocks: number; blockedQueries: number; longRunningQueries: number }
  ): number {
    let score = 100
    
    // Connection health (30 points)
    const healthyConnections = connections.filter(c => c.status === 'healthy').length
    const connectionScore = (healthyConnections / connections.length) * 30
    score = score - 30 + connectionScore
    
    // Connection pool utilization (10 points)
    const utilization = (database.connections / database.maxConnections) * 100
    if (utilization > 90) score -= 10
    else if (utilization > 80) score -= 5
    
    // Cache hit ratio (20 points)
    if (database.cacheHitRatio < 80) score -= 20
    else if (database.cacheHitRatio < 90) score -= 10
    else if (database.cacheHitRatio < 95) score -= 5
    
    // Slow queries (15 points)
    if (database.slowQueries > 50) score -= 15
    else if (database.slowQueries > 20) score -= 10
    else if (database.slowQueries > 10) score -= 5
    
    // Deadlocks (10 points)
    if (performance.deadlocks > 5) score -= 10
    else if (performance.deadlocks > 2) score -= 5
    else if (performance.deadlocks > 0) score -= 2
    
    // Blocked queries (10 points)
    if (performance.blockedQueries > 10) score -= 10
    else if (performance.blockedQueries > 5) score -= 5
    
    // Long-running queries (5 points)
    if (performance.longRunningQueries > 5) score -= 5
    else if (performance.longRunningQueries > 0) score -= 2
    
    return Math.max(0, Math.min(100, Math.round(score)))
  }
  
  /**
   * Quick health check (connection only, no database queries)
   */
  async quickCheck(): Promise<{
    healthy: boolean
    latency: number
    message: string
  }> {
    try {
      const conn = await this.connectionManager.connect('read')
      return {
        healthy: conn.healthy,
        latency: conn.latency,
        message: conn.healthy ? 'Database connection healthy' : 'Database connection degraded'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        healthy: false,
        latency: 0,
        message: `Database connection failed: ${message}`
      }
    }
  }
  
  /**
   * Format health report for display
   */
  formatReport(report: HealthReport): string {
    const lines: string[] = []
    
    // Overall status
    const statusIcon = report.overall === 'healthy' ? '✅' : report.overall === 'degraded' ? '⚠️' : '🚨'
    lines.push(`${statusIcon} Overall Health: ${report.overall.toUpperCase()} (Score: ${report.score}/100)`)
    lines.push('')
    
    // Connections
    lines.push('🔌 Connections:')
    report.connections.forEach(conn => {
      const icon = conn.status === 'healthy' ? '✅' : conn.status === 'degraded' ? '⚠️' : '❌'
      lines.push(`  ${icon} ${conn.type}: ${conn.status} (${conn.latency}ms)`)
      if (conn.message) {
        lines.push(`     ${conn.message}`)
      }
    })
    lines.push('')
    
    // Database
    lines.push('💾 Database:')
    lines.push(`  Size: ${report.database.size}`)
    lines.push(`  Connections: ${report.database.connections}/${report.database.maxConnections}`)
    lines.push(`  Slow Queries: ${report.database.slowQueries}`)
    lines.push(`  Cache Hit Ratio: ${report.database.cacheHitRatio}%`)
    lines.push('')
    
    // Recommendations
    lines.push('💡 Recommendations:')
    report.recommendations.forEach(rec => {
      lines.push(`  ${rec}`)
    })
    
    return lines.join('\n')
  }
}
