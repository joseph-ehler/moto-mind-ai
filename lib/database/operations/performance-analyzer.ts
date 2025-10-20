/**
 * Performance Analyzer
 * 
 * Advanced performance monitoring and analysis:
 * - Query profiling
 * - Slow query tracking
 * - Performance statistics
 * - Bottleneck detection
 * - Resource usage monitoring
 */

import { QueryExecutor } from '../core/query-executor'

export interface QueryProfile {
  query: string
  fingerprint: string
  calls: number
  totalTime: number
  meanTime: number
  minTime: number
  maxTime: number
  stddevTime: number
  rows: number
  sharedBlksHit: number
  sharedBlksRead: number
  cacheHitRatio: number
}

export interface SlowQuery {
  query: string
  duration: number
  timestamp: Date
  user: string | null
  database: string
  explain: any
}

export interface PerformanceMetrics {
  database: {
    size: string
    connections: number
    maxConnections: number
    activeQueries: number
    idleConnections: number
    transactionsPerSecond: number
    cacheHitRatio: number
  }
  queries: {
    total: number
    slow: number
    avgDuration: number
    maxDuration: number
  }
  resources: {
    cpuUsage: number | null
    memoryUsage: number | null
    diskUsage: number | null
  }
  locks: {
    total: number
    waiting: number
    blocking: Array<{
      blockingPid: number
      blockedPid: number
      blockingQuery: string
      blockedQuery: string
      duration: number
    }>
  }
}

export interface TableStatistics {
  tableName: string
  schemaName: string
  rowCount: number
  totalSize: string
  indexSize: string
  toastSize: string
  seqScans: number
  seqTupRead: number
  idxScans: number
  idxTupFetch: number
  insertsPerSecond: number
  updatesPerSecond: number
  deletesPerSecond: number
  deadTuples: number
  liveTuples: number
  lastVacuum: Date | null
  lastAnalyze: Date | null
}

export class PerformanceAnalyzer {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Get query profiles from pg_stat_statements
   */
  async getQueryProfiles(
    limit: number = 50,
    minCalls: number = 10
  ): Promise<QueryProfile[]> {
    try {
      const result = await this.queryExecutor.execute<{
        query: string
        calls: number
        total_exec_time: number
        mean_exec_time: number
        min_exec_time: number
        max_exec_time: number
        stddev_exec_time: number
        rows: number
        shared_blks_hit: number
        shared_blks_read: number
      }>(
        `SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          min_exec_time,
          max_exec_time,
          stddev_exec_time,
          rows,
          shared_blks_hit,
          shared_blks_read
        FROM pg_stat_statements
        WHERE calls >= $1
        ORDER BY total_exec_time DESC
        LIMIT $2`,
        { params: [minCalls, limit], readOnly: true }
      )
      
      return result.rows.map(row => {
        const totalBlks = row.shared_blks_hit + row.shared_blks_read
        const cacheHitRatio = totalBlks > 0
          ? (row.shared_blks_hit / totalBlks) * 100
          : 0
        
        return {
          query: row.query,
          fingerprint: this.generateFingerprint(row.query),
          calls: row.calls,
          totalTime: row.total_exec_time,
          meanTime: row.mean_exec_time,
          minTime: row.min_exec_time,
          maxTime: row.max_exec_time,
          stddevTime: row.stddev_exec_time,
          rows: row.rows,
          sharedBlksHit: row.shared_blks_hit,
          sharedBlksRead: row.shared_blks_read,
          cacheHitRatio
        }
      })
    } catch (error) {
      // pg_stat_statements might not be enabled
      console.warn('pg_stat_statements not available')
      return []
    }
  }
  
  /**
   * Get currently running slow queries
   */
  async getSlowQueries(
    minDuration: number = 1000
  ): Promise<SlowQuery[]> {
    const result = await this.queryExecutor.execute<{
      query: string
      duration: number
      usename: string | null
      datname: string
      query_start: Date
    }>(
      `SELECT 
        query,
        EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000 as duration,
        usename,
        datname,
        query_start
      FROM pg_stat_activity
      WHERE state = 'active'
        AND query NOT LIKE '%pg_stat_activity%'
        AND EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000 > $1
      ORDER BY query_start`,
      { params: [minDuration], readOnly: true }
    )
    
    const slowQueries: SlowQuery[] = []
    
    for (const row of result.rows) {
      // Get EXPLAIN for the query
      let explain: any = null
      try {
        const explainResult = await this.queryExecutor.execute(
          `EXPLAIN (FORMAT JSON) ${row.query}`,
          { readOnly: true, timeout: 5000 }
        )
        explain = explainResult.rows[0]
      } catch (error) {
        // Ignore EXPLAIN errors
      }
      
      slowQueries.push({
        query: row.query,
        duration: row.duration,
        timestamp: row.query_start,
        user: row.usename,
        database: row.datname,
        explain
      })
    }
    
    return slowQueries
  }
  
  /**
   * Get comprehensive performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics> {
    // Database metrics
    const dbSizeResult = await this.queryExecutor.execute<{ size: string }>(
      `SELECT pg_size_pretty(pg_database_size(current_database())) as size`,
      { readOnly: true }
    )
    
    const connectionsResult = await this.queryExecutor.execute<{
      total: number
      active: number
      idle: number
      max_connections: number
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity`,
      { readOnly: true }
    )
    
    const cacheHitResult = await this.queryExecutor.execute<{ ratio: number }>(
      `SELECT 
        ROUND(
          100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0),
          2
        ) as ratio
      FROM pg_stat_database`,
      { readOnly: true }
    )
    
    const tpsResult = await this.queryExecutor.execute<{ tps: number }>(
      `SELECT 
        (xact_commit + xact_rollback) / 
        GREATEST(EXTRACT(EPOCH FROM (NOW() - stats_reset)), 1) as tps
      FROM pg_stat_database 
      WHERE datname = current_database()`,
      { readOnly: true }
    )
    
    // Query metrics
    const queryStatsResult = await this.queryExecutor.execute<{
      total: number
      slow: number
      avg_duration: number
      max_duration: number
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE mean_exec_time > 1000) as slow,
        AVG(mean_exec_time) as avg_duration,
        MAX(max_exec_time) as max_duration
      FROM pg_stat_statements`,
      { readOnly: true }
    )
    
    // Lock metrics
    const locksResult = await this.queryExecutor.execute<{
      total: number
      waiting: number
    }>(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE NOT granted) as waiting
      FROM pg_locks`,
      { readOnly: true }
    )
    
    const blockingResult = await this.queryExecutor.execute<{
      blocking_pid: number
      blocked_pid: number
      blocking_query: string
      blocked_query: string
      duration: number
    }>(
      `SELECT 
        blocking.pid as blocking_pid,
        blocked.pid as blocked_pid,
        blocking_activity.query as blocking_query,
        blocked_activity.query as blocked_query,
        EXTRACT(EPOCH FROM (NOW() - blocked_activity.query_start)) * 1000 as duration
      FROM pg_catalog.pg_locks blocked
      JOIN pg_catalog.pg_stat_activity blocked_activity 
        ON blocked_activity.pid = blocked.pid
      JOIN pg_catalog.pg_locks blocking 
        ON blocking.locktype = blocked.locktype
        AND blocking.database IS NOT DISTINCT FROM blocked.database
        AND blocking.relation IS NOT DISTINCT FROM blocked.relation
        AND blocking.page IS NOT DISTINCT FROM blocked.page
        AND blocking.tuple IS NOT DISTINCT FROM blocked.tuple
        AND blocking.virtualxid IS NOT DISTINCT FROM blocked.virtualxid
        AND blocking.transactionid IS NOT DISTINCT FROM blocked.transactionid
        AND blocking.classid IS NOT DISTINCT FROM blocked.classid
        AND blocking.objid IS NOT DISTINCT FROM blocked.objid
        AND blocking.objsubid IS NOT DISTINCT FROM blocked.objsubid
        AND blocking.pid != blocked.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity 
        ON blocking_activity.pid = blocking.pid
      WHERE NOT blocked.granted`,
      { readOnly: true }
    )
    
    const conn = connectionsResult.rows[0] || {}
    const queryStats = queryStatsResult.rows[0] || {}
    const locks = locksResult.rows[0] || {}
    
    return {
      database: {
        size: dbSizeResult.rows[0]?.size || '0 bytes',
        connections: conn.total || 0,
        maxConnections: conn.max_connections || 0,
        activeQueries: conn.active || 0,
        idleConnections: conn.idle || 0,
        transactionsPerSecond: tpsResult.rows[0]?.tps || 0,
        cacheHitRatio: cacheHitResult.rows[0]?.ratio || 0
      },
      queries: {
        total: queryStats.total || 0,
        slow: queryStats.slow || 0,
        avgDuration: queryStats.avg_duration || 0,
        maxDuration: queryStats.max_duration || 0
      },
      resources: {
        cpuUsage: null, // Requires OS-level access
        memoryUsage: null,
        diskUsage: null
      },
      locks: {
        total: locks.total || 0,
        waiting: locks.waiting || 0,
        blocking: blockingResult.rows.map(row => ({
          blockingPid: row.blocking_pid,
          blockedPid: row.blocked_pid,
          blockingQuery: row.blocking_query,
          blockedQuery: row.blocked_query,
          duration: row.duration
        }))
      }
    }
  }
  
  /**
   * Get table statistics
   */
  async getTableStatistics(
    schemaName: string = 'public'
  ): Promise<TableStatistics[]> {
    const result = await this.queryExecutor.execute<{
      tablename: string
      schemaname: string
      n_tup_ins: number
      n_tup_upd: number
      n_tup_del: number
      n_live_tup: number
      n_dead_tup: number
      seq_scan: number
      seq_tup_read: number
      idx_scan: number
      idx_tup_fetch: number
      last_vacuum: Date | null
      last_analyze: Date | null
      total_size: string
      table_size: string
      indexes_size: string
      toast_size: string
    }>(
      `SELECT 
        s.schemaname,
        s.relname as tablename,
        s.n_tup_ins,
        s.n_tup_upd,
        s.n_tup_del,
        s.n_live_tup,
        s.n_dead_tup,
        s.seq_scan,
        s.seq_tup_read,
        COALESCE(s.idx_scan, 0) as idx_scan,
        COALESCE(s.idx_tup_fetch, 0) as idx_tup_fetch,
        s.last_vacuum,
        s.last_analyze,
        pg_size_pretty(pg_total_relation_size(s.relid)) as total_size,
        pg_size_pretty(pg_relation_size(s.relid)) as table_size,
        pg_size_pretty(pg_indexes_size(s.relid)) as indexes_size,
        pg_size_pretty(COALESCE(pg_total_relation_size(reltoastrelid), 0)) as toast_size
      FROM pg_stat_user_tables s
      LEFT JOIN pg_class c ON s.relid = c.oid
      WHERE s.schemaname = $1
      ORDER BY pg_total_relation_size(s.relid) DESC`,
      { params: [schemaName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      tableName: row.tablename,
      schemaName: row.schemaname,
      rowCount: row.n_live_tup,
      totalSize: row.total_size,
      indexSize: row.indexes_size,
      toastSize: row.toast_size,
      seqScans: row.seq_scan,
      seqTupRead: row.seq_tup_read,
      idxScans: row.idx_scan,
      idxTupFetch: row.idx_tup_fetch,
      insertsPerSecond: row.n_tup_ins,
      updatesPerSecond: row.n_tup_upd,
      deletesPerSecond: row.n_tup_del,
      deadTuples: row.n_dead_tup,
      liveTuples: row.n_live_tup,
      lastVacuum: row.last_vacuum,
      lastAnalyze: row.last_analyze
    }))
  }
  
  /**
   * Identify performance bottlenecks
   */
  async identifyBottlenecks(): Promise<{
    slowQueries: Array<{ query: string; issue: string; recommendation: string }>
    missingIndexes: Array<{ table: string; columns: string[]; reason: string }>
    bloatedTables: Array<{ table: string; deadTuples: number; recommendation: string }>
    inefficientQueries: Array<{ query: string; issue: string; recommendation: string }>
  }> {
    const profiles = await this.getQueryProfiles(100, 5)
    const tableStats = await this.getTableStatistics()
    
    // Identify slow queries
    const slowQueries = profiles
      .filter(p => p.meanTime > 1000)
      .slice(0, 10)
      .map(p => ({
        query: p.fingerprint,
        issue: `Average execution time: ${p.meanTime.toFixed(2)}ms`,
        recommendation: 'Consider adding indexes or optimizing query structure'
      }))
    
    // Identify missing indexes (tables with high sequential scans)
    const missingIndexes = tableStats
      .filter(t => t.seqScans > 1000 && t.seqScans > t.idxScans * 10)
      .slice(0, 10)
      .map(t => ({
        table: t.tableName,
        columns: [] as string[], // Would need query analysis to determine
        reason: `High sequential scans: ${t.seqScans} (vs ${t.idxScans} index scans)`
      }))
    
    // Identify bloated tables
    const bloatedTables = tableStats
      .filter(t => t.deadTuples > t.liveTuples * 0.2) // >20% dead tuples
      .slice(0, 10)
      .map(t => ({
        table: t.tableName,
        deadTuples: t.deadTuples,
        recommendation: 'Run VACUUM ANALYZE to reclaim space and update statistics'
      }))
    
    // Identify inefficient queries (low cache hit ratio)
    const inefficientQueries = profiles
      .filter(p => p.cacheHitRatio < 90)
      .slice(0, 10)
      .map(p => ({
        query: p.fingerprint,
        issue: `Low cache hit ratio: ${p.cacheHitRatio.toFixed(2)}%`,
        recommendation: 'Query is reading from disk frequently. Consider increasing shared_buffers or optimizing query'
      }))
    
    return {
      slowQueries,
      missingIndexes,
      bloatedTables,
      inefficientQueries
    }
  }
  
  /**
   * Reset statistics
   */
  async resetStatistics(): Promise<void> {
    try {
      await this.queryExecutor.execute(
        `SELECT pg_stat_statements_reset()`,
        { transaction: true }
      )
    } catch (error) {
      // Ignore if extension not available
    }
    
    await this.queryExecutor.execute(
      `SELECT pg_stat_reset()`,
      { transaction: true }
    )
  }
  
  /**
   * Generate query fingerprint (normalize query)
   */
  private generateFingerprint(sql: string): string {
    return sql
      .replace(/'\w+'/g, '?')
      .replace(/\d+/g, '?')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100)
  }
}
