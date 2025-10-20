/**
 * Admin Operations
 * 
 * Database administration and maintenance:
 * - VACUUM (cleanup dead tuples)
 * - ANALYZE (update statistics)
 * - REINDEX (rebuild indexes)
 * - Connection management
 * - Query monitoring and termination
 */

import { QueryExecutor } from '../core/query-executor'

export interface ConnectionInfo {
  pid: number
  username: string
  database: string
  applicationName: string
  clientAddress: string
  backendStart: Date
  state: string
  query: string
  waitEventType: string | null
  waitEvent: string | null
}

export interface VacuumOptions {
  full?: boolean
  freeze?: boolean
  analyze?: boolean
  verbose?: boolean
}

export interface VacuumResult {
  success: boolean
  duration: number
  message?: string
}

export class AdminOperations {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * VACUUM a table or entire database
   */
  async vacuum(
    tableName?: string,
    options: VacuumOptions = {}
  ): Promise<VacuumResult> {
    const startTime = Date.now()
    
    let sql = 'VACUUM'
    
    if (options.full) {
      sql += ' FULL'
    }
    
    if (options.freeze) {
      sql += ' FREEZE'
    }
    
    if (options.analyze) {
      sql += ' ANALYZE'
    }
    
    if (options.verbose) {
      sql += ' VERBOSE'
    }
    
    if (tableName) {
      sql += ` ${tableName}`
    }
    
    try {
      await this.queryExecutor.execute(sql)
      
      return {
        success: true,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * ANALYZE a table or entire database
   */
  async analyze(tableName?: string, verbose: boolean = false): Promise<VacuumResult> {
    const startTime = Date.now()
    
    let sql = 'ANALYZE'
    
    if (verbose) {
      sql += ' VERBOSE'
    }
    
    if (tableName) {
      sql += ` ${tableName}`
    }
    
    try {
      await this.queryExecutor.execute(sql)
      
      return {
        success: true,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * REINDEX a table, index, or entire database
   */
  async reindex(
    target: string,
    type: 'TABLE' | 'INDEX' | 'SCHEMA' | 'DATABASE' = 'TABLE'
  ): Promise<VacuumResult> {
    const startTime = Date.now()
    
    const sql = `REINDEX ${type} ${target}`
    
    try {
      await this.queryExecutor.execute(sql)
      
      return {
        success: true,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * List all active connections
   */
  async listConnections(): Promise<ConnectionInfo[]> {
    const result = await this.queryExecutor.execute<{
      pid: number
      usename: string
      datname: string
      application_name: string
      client_addr: string
      backend_start: Date
      state: string
      query: string
      wait_event_type: string | null
      wait_event: string | null
    }>(
      `SELECT 
        pid,
        usename,
        datname,
        application_name,
        client_addr::text,
        backend_start,
        state,
        query,
        wait_event_type,
        wait_event
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
      ORDER BY backend_start DESC`,
      { readOnly: true }
    )
    
    return result.rows.map(row => ({
      pid: row.pid,
      username: row.usename,
      database: row.datname,
      applicationName: row.application_name,
      clientAddress: row.client_addr,
      backendStart: row.backend_start,
      state: row.state,
      query: row.query,
      waitEventType: row.wait_event_type,
      waitEvent: row.wait_event
    }))
  }
  
  /**
   * Get connection count by state
   */
  async getConnectionStats(): Promise<{
    total: number
    active: number
    idle: number
    idleInTransaction: number
    waiting: number
  }> {
    const result = await this.queryExecutor.execute<{
      state: string
      count: number
    }>(
      `SELECT state, COUNT(*) as count
       FROM pg_stat_activity
       WHERE pid != pg_backend_pid()
       GROUP BY state`,
      { readOnly: true }
    )
    
    const stats = {
      total: 0,
      active: 0,
      idle: 0,
      idleInTransaction: 0,
      waiting: 0
    }
    
    for (const row of result.rows) {
      stats.total += row.count
      
      if (row.state === 'active') {
        stats.active += row.count
      } else if (row.state === 'idle') {
        stats.idle += row.count
      } else if (row.state === 'idle in transaction') {
        stats.idleInTransaction += row.count
      }
    }
    
    return stats
  }
  
  /**
   * Terminate a connection by PID
   */
  async terminateConnection(pid: number): Promise<boolean> {
    const result = await this.queryExecutor.execute<{ pg_terminate_backend: boolean }>(
      `SELECT pg_terminate_backend($1) as pg_terminate_backend`,
      { params: [pid] }
    )
    
    return result.rows[0]?.pg_terminate_backend || false
  }
  
  /**
   * Cancel a running query by PID
   */
  async cancelQuery(pid: number): Promise<boolean> {
    const result = await this.queryExecutor.execute<{ pg_cancel_backend: boolean }>(
      `SELECT pg_cancel_backend($1) as pg_cancel_backend`,
      { params: [pid] }
    )
    
    return result.rows[0]?.pg_cancel_backend || false
  }
  
  /**
   * Get long-running queries
   */
  async getLongRunningQueries(minDurationSeconds: number = 60): Promise<ConnectionInfo[]> {
    const result = await this.queryExecutor.execute<{
      pid: number
      usename: string
      datname: string
      application_name: string
      client_addr: string
      backend_start: Date
      state: string
      query: string
      wait_event_type: string | null
      wait_event: string | null
    }>(
      `SELECT 
        pid,
        usename,
        datname,
        application_name,
        client_addr::text,
        backend_start,
        state,
        query,
        wait_event_type,
        wait_event
      FROM pg_stat_activity
      WHERE state = 'active'
        AND pid != pg_backend_pid()
        AND query_start < NOW() - INTERVAL '${minDurationSeconds} seconds'
      ORDER BY query_start`,
      { readOnly: true }
    )
    
    return result.rows.map(row => ({
      pid: row.pid,
      username: row.usename,
      database: row.datname,
      applicationName: row.application_name,
      clientAddress: row.client_addr,
      backendStart: row.backend_start,
      state: row.state,
      query: row.query,
      waitEventType: row.wait_event_type,
      waitEvent: row.wait_event
    }))
  }
  
  /**
   * Get database size
   */
  async getDatabaseSize(databaseName?: string): Promise<number> {
    const dbName = databaseName || (await this.getCurrentDatabase())
    
    const result = await this.queryExecutor.execute<{ size: number }>(
      `SELECT pg_database_size($1) as size`,
      { params: [dbName], readOnly: true }
    )
    
    return result.rows[0]?.size || 0
  }
  
  /**
   * Get table sizes
   */
  async getTableSizes(schemaName: string = 'public'): Promise<Array<{
    tableName: string
    size: number
    indexSize: number
    totalSize: number
  }>> {
    const result = await this.queryExecutor.execute<{
      tablename: string
      table_size: number
      indexes_size: number
      total_size: number
    }>(
      `SELECT 
        tablename,
        pg_table_size(schemaname||'.'||tablename) AS table_size,
        pg_indexes_size(schemaname||'.'||tablename) AS indexes_size,
        pg_total_relation_size(schemaname||'.'||tablename) AS total_size
      FROM pg_tables
      WHERE schemaname = $1
      ORDER BY total_size DESC`,
      { params: [schemaName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      tableName: row.tablename,
      size: row.table_size,
      indexSize: row.indexes_size,
      totalSize: row.total_size
    }))
  }
  
  /**
   * Get index usage statistics
   */
  async getIndexUsage(schemaName: string = 'public'): Promise<Array<{
    tableName: string
    indexName: string
    indexSize: number
    scans: number
    tuplesRead: number
    tuplesFetched: number
  }>> {
    const result = await this.queryExecutor.execute<{
      tablename: string
      indexname: string
      idx_size: number
      idx_scan: number
      idx_tup_read: number
      idx_tup_fetch: number
    }>(
      `SELECT 
        schemaname||'.'||tablename as tablename,
        indexname,
        pg_relation_size(indexrelid) as idx_size,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = $1
      ORDER BY idx_scan`,
      { params: [schemaName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      tableName: row.tablename,
      indexName: row.indexname,
      indexSize: row.idx_size,
      scans: row.idx_scan,
      tuplesRead: row.idx_tup_read,
      tuplesFetched: row.idx_tup_fetch
    }))
  }
  
  /**
   * Get current database name
   */
  private async getCurrentDatabase(): Promise<string> {
    const result = await this.queryExecutor.execute<{ current_database: string }>(
      'SELECT current_database()',
      { readOnly: true }
    )
    
    return result.rows[0]?.current_database || 'postgres'
  }
  
  /**
   * Get bloat estimate for tables
   */
  async getTableBloat(schemaName: string = 'public'): Promise<Array<{
    tableName: string
    bloatPercent: number
    wastedBytes: number
  }>> {
    const result = await this.queryExecutor.execute<{
      tablename: string
      bloat_pct: number
      wasted_bytes: number
    }>(
      `SELECT 
        schemaname||'.'||tablename as tablename,
        ROUND((CASE WHEN relpages > 0 THEN
          100 * (relpages - (reltuples / 100))::numeric / relpages
        ELSE 0 END)::numeric, 1) as bloat_pct,
        CASE WHEN relpages > 0 THEN
          (relpages - (reltuples / 100))::bigint * 8192
        ELSE 0 END as wasted_bytes
      FROM pg_stat_user_tables
      WHERE schemaname = $1
        AND relpages > 100
      ORDER BY wasted_bytes DESC`,
      { params: [schemaName], readOnly: true }
    )
    
    return result.rows.map(row => ({
      tableName: row.tablename,
      bloatPercent: row.bloat_pct,
      wastedBytes: row.wasted_bytes
    }))
  }
}
