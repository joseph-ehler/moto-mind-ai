/**
 * Migration Runner
 * 
 * Safe migration execution with:
 * - Transaction support
 * - Rollback on failure
 * - Migration tracking
 * - Dry-run mode
 * - Dependency ordering
 */

import { QueryExecutor } from '../core/query-executor'
import { promises as fs } from 'fs'
import path from 'path'
import { splitStatements } from './migration-validator'
import { DatabaseError, toDatabaseError } from '../core/error-handler'

export interface Migration {
  id: string
  name: string
  content: string
  checksum: string
  appliedAt?: Date
  executionTime?: number
}

export interface MigrationResult {
  success: boolean
  migration: Migration
  error?: string
  executionTime: number
  changes: {
    tablesCreated: string[]
    tablesModified: string[]
    indexesCreated: string[]
  }
}

export interface MigrationPlan {
  pending: Migration[]
  applied: Migration[]
  total: number
  estimatedTime: number
}

export class MigrationRunner {
  private readonly migrationsTable = 'schema_migrations'
  
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Initialize migrations tracking table
   */
  async initialize(): Promise<void> {
    await this.queryExecutor.execute(
      `CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        execution_time_ms INTEGER NOT NULL,
        success BOOLEAN NOT NULL DEFAULT true,
        error TEXT,
        rollback_sql TEXT
      )`,
      { transaction: true }
    )
    
    await this.queryExecutor.execute(
      `CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
       ON ${this.migrationsTable} (applied_at DESC)`,
      { transaction: true }
    )
  }
  
  /**
   * Load migrations from directory
   */
  async loadMigrations(directory: string): Promise<Migration[]> {
    const files = await fs.readdir(directory)
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort() // Ensure chronological order
    
    const migrations: Migration[] = []
    
    for (const file of migrationFiles) {
      const fullPath = path.join(directory, file)
      const content = await fs.readFile(fullPath, 'utf-8')
      const checksum = this.generateChecksum(content)
      
      // Extract migration ID from filename (e.g., 20240101_01_create_users.sql)
      const match = file.match(/^(\d+_\d+)_(.+)\.sql$/)
      const id = match ? match[1] : file.replace('.sql', '')
      const name = match ? match[2] : file
      
      migrations.push({
        id,
        name,
        content,
        checksum
      })
    }
    
    return migrations
  }
  
  /**
   * Get applied migrations
   */
  async getAppliedMigrations(): Promise<Migration[]> {
    try {
      const result = await this.queryExecutor.execute<{
        id: string
        name: string
        checksum: string
        applied_at: Date
        execution_time_ms: number
      }>(
        `SELECT id, name, checksum, applied_at, execution_time_ms
         FROM ${this.migrationsTable}
         WHERE success = true
         ORDER BY applied_at`,
        { readOnly: true }
      )
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        content: '',
        checksum: row.checksum,
        appliedAt: row.applied_at,
        executionTime: row.execution_time_ms
      }))
    } catch (error) {
      // Table might not exist yet
      return []
    }
  }
  
  /**
   * Create migration plan
   */
  async plan(directory: string): Promise<MigrationPlan> {
    const [allMigrations, applied] = await Promise.all([
      this.loadMigrations(directory),
      this.getAppliedMigrations()
    ])
    
    const appliedIds = new Set(applied.map(m => m.id))
    const pending = allMigrations.filter(m => !appliedIds.has(m.id))
    
    // Estimate execution time (5s per migration on average)
    const estimatedTime = pending.length * 5000
    
    return {
      pending,
      applied,
      total: allMigrations.length,
      estimatedTime
    }
  }
  
  /**
   * Run a single migration
   */
  async runMigration(
    migration: Migration,
    options: {
      dryRun?: boolean
      transaction?: boolean
    } = {}
  ): Promise<MigrationResult> {
    const startTime = Date.now()
    
    try {
      // Dry run - just validate SQL
      if (options.dryRun) {
        await this.queryExecutor.execute(migration.content, {
          dryRun: true
        })
        
        return {
          success: true,
          migration,
          executionTime: Date.now() - startTime,
          changes: {
            tablesCreated: [],
            tablesModified: [],
            indexesCreated: []
          }
        }
      }
      
      // Real execution with smart transaction handling
      // Split into transactional and non-transactional statements
      const { transactional, nonTransactional } = splitStatements(migration.content)
      
      // Execute transactional statements atomically
      if (transactional.length > 0) {
        const txSql = transactional.join(';\n')
        await this.queryExecutor.execute(txSql, {
          transaction: true
        })
      }
      
      // Execute non-transactional statements sequentially
      for (const stmt of nonTransactional) {
        await this.queryExecutor.execute(stmt, {
          transaction: false
        })
      }
      
      const executionTime = Date.now() - startTime
      
      // Track migration
      await this.queryExecutor.execute(
        `INSERT INTO ${this.migrationsTable} 
         (id, name, checksum, execution_time_ms, success)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (id) DO UPDATE
         SET applied_at = NOW(),
             execution_time_ms = $4,
             success = true,
             error = NULL`,
        {
          params: [
            migration.id,
            migration.name,
            migration.checksum,
            executionTime
          ],
          transaction: true
        }
      )
      
      // Analyze changes (simple detection)
      const changes = this.detectChanges(migration.content)
      
      return {
        success: true,
        migration,
        executionTime,
        changes
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const dbError = toDatabaseError(error)
      const errorMessage = dbError.message
      
      // Track failed migration
      try {
        await this.queryExecutor.execute(
          `INSERT INTO ${this.migrationsTable} 
           (id, name, checksum, execution_time_ms, success, error)
           VALUES ($1, $2, $3, $4, false, $5)
           ON CONFLICT (id) DO UPDATE
           SET applied_at = NOW(),
               execution_time_ms = $4,
               success = false,
               error = $5`,
          {
            params: [
              migration.id,
              migration.name,
              migration.checksum,
              executionTime,
              errorMessage
            ],
            transaction: true
          }
        )
      } catch (trackError) {
        // Ignore tracking errors
      }
      
      return {
        success: false,
        migration,
        error: errorMessage,
        executionTime,
        changes: {
          tablesCreated: [],
          tablesModified: [],
          indexesCreated: []
        }
      }
    }
  }
  
  /**
   * Run all pending migrations
   */
  async runPending(
    directory: string,
    options: {
      dryRun?: boolean
      stopOnError?: boolean
    } = {}
  ): Promise<{
    results: MigrationResult[]
    summary: {
      total: number
      successful: number
      failed: number
      skipped: number
      totalTime: number
    }
  }> {
    await this.initialize()
    
    const plan = await this.plan(directory)
    const results: MigrationResult[] = []
    
    let successful = 0
    let failed = 0
    let skipped = 0
    const startTime = Date.now()
    
    for (const migration of plan.pending) {
      const result = await this.runMigration(migration, {
        dryRun: options.dryRun,
        transaction: true
      })
      
      results.push(result)
      
      if (result.success) {
        successful++
      } else {
        failed++
        
        if (options.stopOnError) {
          // Skip remaining migrations
          skipped = plan.pending.length - results.length
          break
        }
      }
    }
    
    const totalTime = Date.now() - startTime
    
    return {
      results,
      summary: {
        total: plan.pending.length,
        successful,
        failed,
        skipped,
        totalTime
      }
    }
  }
  
  /**
   * Rollback a migration (if rollback SQL provided)
   */
  async rollback(migrationId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const result = await this.queryExecutor.execute<{
        rollback_sql: string | null
      }>(
        `SELECT rollback_sql FROM ${this.migrationsTable} WHERE id = $1`,
        { params: [migrationId], readOnly: true }
      )
      
      const rollbackSql = result.rows[0]?.rollback_sql
      
      if (!rollbackSql) {
        return {
          success: false,
          error: 'No rollback SQL available for this migration'
        }
      }
      
      await this.queryExecutor.execute(rollbackSql, { transaction: true })
      
      // Mark as rolled back
      await this.queryExecutor.execute(
        `DELETE FROM ${this.migrationsTable} WHERE id = $1`,
        { params: [migrationId], transaction: true }
      )
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Validate migration checksums
   */
  async validateChecksums(directory: string): Promise<{
    valid: boolean
    mismatches: Array<{
      id: string
      name: string
      expectedChecksum: string
      actualChecksum: string
    }>
  }> {
    const [allMigrations, applied] = await Promise.all([
      this.loadMigrations(directory),
      this.getAppliedMigrations()
    ])
    
    const appliedMap = new Map(applied.map(m => [m.id, m]))
    const mismatches: Array<{
      id: string
      name: string
      expectedChecksum: string
      actualChecksum: string
    }> = []
    
    for (const migration of allMigrations) {
      const appliedMigration = appliedMap.get(migration.id)
      
      if (appliedMigration && appliedMigration.checksum !== migration.checksum) {
        mismatches.push({
          id: migration.id,
          name: migration.name,
          expectedChecksum: appliedMigration.checksum,
          actualChecksum: migration.checksum
        })
      }
    }
    
    return {
      valid: mismatches.length === 0,
      mismatches
    }
  }
  
  /**
   * Generate checksum for migration content
   */
  private generateChecksum(content: string): string {
    // Simple hash function (for demonstration)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }
  
  /**
   * Detect changes in migration SQL
   */
  private detectChanges(sql: string): {
    tablesCreated: string[]
    tablesModified: string[]
    indexesCreated: string[]
  } {
    const changes = {
      tablesCreated: [] as string[],
      tablesModified: [] as string[],
      indexesCreated: [] as string[]
    }
    
    // Simple regex-based detection
    const createTableMatches = sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi)
    for (const match of createTableMatches) {
      changes.tablesCreated.push(match[1])
    }
    
    const alterTableMatches = sql.matchAll(/ALTER TABLE\s+(\w+)/gi)
    for (const match of alterTableMatches) {
      changes.tablesModified.push(match[1])
    }
    
    const createIndexMatches = sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/gi)
    for (const match of createIndexMatches) {
      changes.indexesCreated.push(match[1])
    }
    
    return changes
  }
}
