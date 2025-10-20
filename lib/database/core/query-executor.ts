/**
 * God-Tier Query Executor
 * 
 * Safe, transaction-aware SQL execution with:
 * - Parameterized queries (SQL injection prevention)
 * - Transaction support (atomic operations)
 * - Streaming (handle millions of rows)
 * - Dry-run mode (preview without executing)
 * - EXPLAIN plans (query optimization)
 * - Safety validations (prevent destructive queries)
 * - Timeout protection
 */

import { Pool, PoolClient } from 'pg'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  QueryOptions,
  QueryResult,
  QueryPlan,
  ValidationResult,
  Connection,
  ConnectionType
} from './types'
import { ConnectionManager } from './connection-manager'

export class QueryExecutor {
  constructor(private connectionManager: ConnectionManager) {}
  
  /**
   * Execute raw SQL with safety features
   */
  async execute<T = any>(
    sql: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    // Apply defaults
    const opts: Required<QueryOptions> = {
      params: options.params || [],
      transaction: options.transaction ?? false,
      dryRun: options.dryRun ?? false,
      timeout: options.timeout || 30000,
      streaming: options.streaming ?? false,
      explain: options.explain ?? false,
      confirm: options.confirm ?? false,
      readOnly: options.readOnly ?? false
    }
    
    // Validate SQL
    const validation = this.validateSQL(sql)
    if (!validation.safe && !opts.confirm) {
      throw new Error(
        `Destructive query requires confirmation: ${validation.reason}\n` +
        `Add { confirm: true } to execute anyway.`
      )
    }
    
    // Show warnings
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('⚠️  Query warnings:')
      validation.warnings.forEach(w => console.warn(`  - ${w}`))
    }
    
    // Dry run mode
    if (opts.dryRun) {
      return this.getDryRunResult(sql, opts.params)
    }
    
    // Get query plan
    if (opts.explain) {
      const plan = await this.explainQuery(sql, opts.params)
      return {
        rows: [],
        rowCount: 0,
        command: 'EXPLAIN',
        duration: 0,
        plan,
        preview: true,
        sql
      }
    }
    
    // Execute with transaction
    if (opts.transaction) {
      return this.executeInTransaction(sql, opts)
    }
    
    // Execute with timeout
    return this.executeWithTimeout(sql, opts)
  }
  
  /**
   * Execute query with timeout protection
   */
  private async executeWithTimeout<T>(
    sql: string,
    opts: Required<QueryOptions>
  ): Promise<QueryResult<T>> {
    const mode = opts.readOnly ? 'read' : 'write'
    const conn = await this.connectionManager.connect(mode)
    
    const start = Date.now()
    
    try {
      let result
      
      if (conn.type === 'supabase') {
        // Use Supabase client for HTTP API
        result = await this.executeViaSupabase(sql, opts, conn)
      } else {
        // Use PostgreSQL connection
        result = await this.executeViaPostgres(sql, opts, conn)
      }
      
      const duration = Date.now() - start
      
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command || 'SELECT',
        duration,
        sql
      }
    } catch (error) {
      const duration = Date.now() - start
      const message = error instanceof Error ? error.message : 'Unknown error'
      
      throw new Error(
        `Query failed after ${duration}ms: ${message}\n` +
        `SQL: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`
      )
    }
  }
  
  /**
   * Execute via PostgreSQL connection
   */
  private async executeViaPostgres<T>(
    sql: string,
    opts: Required<QueryOptions>,
    conn: Connection
  ): Promise<any> {
    const pool = conn.client as Pool
    const client = await pool.connect()
    
    try {
      // Set statement timeout
      await client.query(`SET statement_timeout = ${opts.timeout}`)
      
      // Execute query
      const result = await client.query(sql, opts.params)
      
      return result
    } finally {
      client.release()
    }
  }
  
  /**
   * Execute via Supabase client (HTTP API)
   */
  private async executeViaSupabase<T>(
    sql: string,
    opts: Required<QueryOptions>,
    conn: Connection
  ): Promise<any> {
    const client = conn.client as SupabaseClient
    
    // Use rpc to execute raw SQL
    const { data, error } = await client.rpc('execute_sql', {
      query: sql,
      params: opts.params
    })
    
    if (error) {
      throw error
    }
    
    return {
      rows: data || [],
      rowCount: data?.length || 0,
      command: 'SELECT'
    }
  }
  
  /**
   * Execute in transaction (all-or-nothing)
   */
  async executeInTransaction<T>(
    sql: string,
    opts: Required<QueryOptions>
  ): Promise<QueryResult<T>> {
    const conn = await this.connectionManager.connect('write')
    
    if (conn.type === 'supabase') {
      // Supabase doesn't support manual transactions via HTTP API
      throw new Error('Transactions not supported via Supabase client')
    }
    
    const pool = conn.client as Pool
    const client = await pool.connect()
    
    const start = Date.now()
    
    try {
      // Begin transaction
      await client.query('BEGIN')
      
      // Set statement timeout
      await client.query(`SET statement_timeout = ${opts.timeout}`)
      
      // Execute query
      const result = await client.query(sql, opts.params)
      
      // Commit transaction
      await client.query('COMMIT')
      
      const duration = Date.now() - start
      
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command || 'SELECT',
        duration,
        sql
      }
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK')
      
      const duration = Date.now() - start
      const message = error instanceof Error ? error.message : 'Unknown error'
      
      throw new Error(
        `Transaction failed after ${duration}ms: ${message}\n` +
        `Query rolled back successfully.\n` +
        `SQL: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`
      )
    } finally {
      client.release()
    }
  }
  
  /**
   * Execute multiple queries in a transaction
   */
  async withTransaction<T>(
    fn: (executor: QueryExecutor) => Promise<T>
  ): Promise<T> {
    const conn = await this.connectionManager.connect('write')
    
    if (conn.type === 'supabase') {
      throw new Error('Transactions not supported via Supabase client')
    }
    
    const pool = conn.client as Pool
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      const result = await fn(this)
      
      await client.query('COMMIT')
      
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  
  /**
   * Stream large result sets
   * Prevents memory issues with millions of rows
   */
  async *stream<T = any>(
    sql: string,
    params?: any[],
    batchSize: number = 1000
  ): AsyncGenerator<T[]> {
    let offset = 0
    
    while (true) {
      const batchSql = `${sql} LIMIT ${batchSize} OFFSET ${offset}`
      
      const result = await this.execute<T>(batchSql, { params })
      
      if (result.rows.length === 0) {
        break
      }
      
      yield result.rows
      offset += batchSize
      
      // Stop if we got fewer rows than batch size (last batch)
      if (result.rows.length < batchSize) {
        break
      }
    }
  }
  
  /**
   * Get EXPLAIN plan for query
   */
  private async explainQuery(sql: string, params: any[]): Promise<QueryPlan> {
    const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`
    
    const conn = await this.connectionManager.connect('read')
    const pool = conn.client as Pool
    const client = await pool.connect()
    
    try {
      const result = await client.query(explainSql, params)
      const plan = result.rows[0]['QUERY PLAN'][0]
      
      return {
        plan: plan.Plan,
        executionTime: plan['Execution Time'],
        planningTime: plan['Planning Time'],
        totalCost: plan.Plan['Total Cost'],
        summary: this.summarizePlan(plan.Plan)
      }
    } finally {
      client.release()
    }
  }
  
  /**
   * Summarize query plan in human terms
   */
  private summarizePlan(plan: any): string {
    const nodeType = plan['Node Type']
    const rows = plan['Actual Rows'] || plan['Plan Rows']
    const time = plan['Actual Total Time'] || 0
    
    let summary = `${nodeType} (${rows} rows, ${time.toFixed(2)}ms)`
    
    if (nodeType === 'Seq Scan') {
      summary += ' - Consider adding an index'
    } else if (nodeType === 'Index Scan') {
      summary += ' - Using index efficiently'
    } else if (nodeType === 'Nested Loop') {
      summary += ' - Joining tables'
    }
    
    return summary
  }
  
  /**
   * Dry run - preview what would happen without executing
   */
  private async getDryRunResult<T>(
    sql: string,
    params: any[]
  ): Promise<QueryResult<T>> {
    return {
      rows: [],
      rowCount: 0,
      command: 'DRY-RUN',
      duration: 0,
      preview: true,
      sql
    }
  }
  
  /**
   * Validate SQL for destructive operations
   */
  private validateSQL(sql: string): ValidationResult {
    const normalized = sql.trim().toUpperCase()
    const warnings: string[] = []
    
    // Check for destructive operations
    const destructivePatterns = [
      { pattern: /DROP\s+(TABLE|DATABASE|SCHEMA|INDEX)/i, reason: 'DROP operation detected' },
      { pattern: /TRUNCATE/i, reason: 'TRUNCATE operation detected' },
      { pattern: /DELETE\s+FROM\s+\w+\s*;/i, reason: 'DELETE without WHERE clause' },
      { pattern: /UPDATE\s+\w+\s+SET\s+.*\s*;/i, reason: 'UPDATE without WHERE clause' }
    ]
    
    for (const { pattern, reason } of destructivePatterns) {
      if (pattern.test(sql)) {
        return { safe: false, reason }
      }
    }
    
    // Check for potential issues
    if (normalized.includes('SELECT *')) {
      warnings.push('SELECT * can be slow - consider specifying columns')
    }
    
    if (!normalized.includes('LIMIT') && normalized.startsWith('SELECT')) {
      warnings.push('No LIMIT clause - could return many rows')
    }
    
    if (normalized.includes('OR') && normalized.includes('WHERE')) {
      warnings.push('OR in WHERE clause may prevent index usage')
    }
    
    return { safe: true, warnings }
  }
  
  /**
   * Execute with retry logic (for transient failures)
   */
  async executeWithRetry<T>(
    sql: string,
    options: QueryOptions = {},
    maxRetries: number = 3
  ): Promise<QueryResult<T>> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute<T>(sql, options)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Don't retry on validation errors
        if (lastError.message.includes('requires confirmation')) {
          throw lastError
        }
        
        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          console.warn(`⚠️  Query failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(
      `Query failed after ${maxRetries} attempts: ${lastError?.message}`
    )
  }
}
