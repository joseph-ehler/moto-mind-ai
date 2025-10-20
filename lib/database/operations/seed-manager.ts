/**
 * Seed Manager
 * 
 * Database seeding and test data generation:
 * - Load and execute seed files
 * - Seed specific tables with data
 * - Truncate tables safely
 * - Reset sequences
 * - Generate test data
 */

import { QueryExecutor } from '../core/query-executor'
import { promises as fs } from 'fs'
import path from 'path'

export interface SeedResult {
  success: boolean
  tablesSeeded: string[]
  rowsInserted: number
  errors: Array<{ table: string; error: string }>
  duration: number
}

export interface TruncateOptions {
  cascade?: boolean
  restart?: boolean
  only?: boolean
}

export interface SeedData {
  table: string
  data: Record<string, any>[]
  onConflict?: 'ignore' | 'replace' | 'error'
}

export class SeedManager {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Load and execute a seed file (SQL)
   */
  async loadSeedFile(filePath: string): Promise<SeedResult> {
    const startTime = Date.now()
    const result: SeedResult = {
      success: true,
      tablesSeeded: [],
      rowsInserted: 0,
      errors: [],
      duration: 0
    }
    
    try {
      // Read seed file
      const content = await fs.readFile(filePath, 'utf-8')
      
      // Check if it's SQL or JSON/TS
      if (filePath.endsWith('.sql')) {
        await this.executeSQLSeed(content, result)
      } else if (filePath.endsWith('.json')) {
        const data = JSON.parse(content) as SeedData[]
        await this.executeJSONSeed(data, result)
      } else if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
        // Dynamic import for TypeScript/JavaScript seed files
        const module = await import(filePath)
        const data = module.default || module.seed
        await this.executeJSONSeed(data, result)
      } else {
        throw new Error(`Unsupported seed file type: ${filePath}`)
      }
      
      result.duration = Date.now() - startTime
      return result
    } catch (error) {
      result.success = false
      result.errors.push({
        table: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      result.duration = Date.now() - startTime
      return result
    }
  }
  
  /**
   * Execute SQL seed content
   */
  private async executeSQLSeed(sql: string, result: SeedResult): Promise<void> {
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      try {
        const queryResult = await this.queryExecutor.execute(statement, {
          transaction: true
        })
        
        // Track table name from INSERT statement
        const tableMatch = statement.match(/INSERT\s+INTO\s+(\w+)/i)
        if (tableMatch) {
          const tableName = tableMatch[1]
          if (!result.tablesSeeded.includes(tableName)) {
            result.tablesSeeded.push(tableName)
          }
          result.rowsInserted += queryResult.rowCount || 0
        }
      } catch (error) {
        result.errors.push({
          table: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }
  
  /**
   * Execute JSON/TypeScript seed data
   */
  private async executeJSONSeed(seeds: SeedData[], result: SeedResult): Promise<void> {
    for (const seed of seeds) {
      try {
        const inserted = await this.seedTable(seed.table, seed.data, {
          onConflict: seed.onConflict || 'error'
        })
        
        if (!result.tablesSeeded.includes(seed.table)) {
          result.tablesSeeded.push(seed.table)
        }
        result.rowsInserted += inserted
      } catch (error) {
        result.errors.push({
          table: seed.table,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }
  
  /**
   * Seed a specific table with data
   */
  async seedTable(
    tableName: string,
    data: Record<string, any>[],
    options: {
      onConflict?: 'ignore' | 'replace' | 'error'
      batchSize?: number
    } = {}
  ): Promise<number> {
    if (data.length === 0) {
      return 0
    }
    
    const batchSize = options.batchSize || 100
    let totalInserted = 0
    
    // Insert in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      // Get column names from first item
      const columns = Object.keys(batch[0])
      
      // Build VALUES clause
      const values = batch.map((row, idx) => {
        const rowValues = columns.map((col, colIdx) => {
          const paramIdx = i * columns.length + idx * columns.length + colIdx + 1
          return `$${paramIdx}`
        })
        return `(${rowValues.join(', ')})`
      })
      
      // Flatten all values
      const params = batch.flatMap(row => columns.map(col => row[col]))
      
      // Build INSERT statement
      let sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${values.join(', ')}`
      
      // Handle conflicts
      if (options.onConflict === 'ignore') {
        sql += ' ON CONFLICT DO NOTHING'
      } else if (options.onConflict === 'replace') {
        // Assume first column is the primary key
        const pkColumn = columns[0]
        sql += ` ON CONFLICT (${pkColumn}) DO UPDATE SET `
        sql += columns.slice(1).map(col => `${col} = EXCLUDED.${col}`).join(', ')
      }
      
      const result = await this.queryExecutor.execute(sql, {
        params,
        transaction: true
      })
      
      totalInserted += result.rowCount || 0
    }
    
    return totalInserted
  }
  
  /**
   * Truncate a table
   */
  async truncateTable(
    tableName: string,
    options: TruncateOptions = {}
  ): Promise<void> {
    let sql = `TRUNCATE TABLE ${options.only ? 'ONLY ' : ''}${tableName}`
    
    if (options.restart) {
      sql += ' RESTART IDENTITY'
    }
    
    if (options.cascade) {
      sql += ' CASCADE'
    }
    
    await this.queryExecutor.execute(sql, { transaction: true })
  }
  
  /**
   * Truncate multiple tables
   */
  async truncateTables(
    tableNames: string[],
    options: TruncateOptions = {}
  ): Promise<void> {
    let sql = `TRUNCATE TABLE ${tableNames.join(', ')}`
    
    if (options.restart) {
      sql += ' RESTART IDENTITY'
    }
    
    if (options.cascade) {
      sql += ' CASCADE'
    }
    
    await this.queryExecutor.execute(sql, { transaction: true })
  }
  
  /**
   * Reset a sequence to a specific value
   */
  async resetSequence(
    sequenceName: string,
    restartValue: number = 1
  ): Promise<void> {
    await this.queryExecutor.execute(
      `ALTER SEQUENCE ${sequenceName} RESTART WITH ${restartValue}`,
      { transaction: true }
    )
  }
  
  /**
   * Reset all sequences in a schema
   */
  async resetAllSequences(schemaName: string = 'public'): Promise<number> {
    // Get all sequences
    const result = await this.queryExecutor.execute<{ sequence_name: string }>(
      `SELECT sequence_name 
       FROM information_schema.sequences 
       WHERE sequence_schema = $1`,
      { params: [schemaName], readOnly: true }
    )
    
    // Reset each sequence
    for (const row of result.rows) {
      await this.resetSequence(`${schemaName}.${row.sequence_name}`, 1)
    }
    
    return result.rows.length
  }
  
  /**
   * Reset database (truncate all tables and reset sequences)
   */
  async resetDatabase(
    schemaName: string = 'public',
    options: {
      confirm?: boolean
      exclude?: string[]
    } = {}
  ): Promise<{
    tablesTruncated: number
    sequencesReset: number
  }> {
    if (!options.confirm) {
      throw new Error(
        'resetDatabase requires explicit confirmation. Pass { confirm: true }'
      )
    }
    
    // Get all tables
    const tablesResult = await this.queryExecutor.execute<{ tablename: string }>(
      `SELECT tablename 
       FROM pg_tables 
       WHERE schemaname = $1`,
      { params: [schemaName], readOnly: true }
    )
    
    // Filter out excluded tables
    let tables = tablesResult.rows.map(r => r.tablename)
    
    if (options.exclude) {
      tables = tables.filter(t => !options.exclude!.includes(t))
    }
    
    // Truncate all tables
    if (tables.length > 0) {
      await this.truncateTables(tables, {
        cascade: true,
        restart: true
      })
    }
    
    // Reset sequences
    const sequencesReset = await this.resetAllSequences(schemaName)
    
    return {
      tablesTruncated: tables.length,
      sequencesReset
    }
  }
  
  /**
   * Generate test data for a table
   */
  async generateTestData(
    tableName: string,
    count: number,
    generator: (index: number) => Record<string, any>
  ): Promise<number> {
    const data: Record<string, any>[] = []
    
    for (let i = 0; i < count; i++) {
      data.push(generator(i))
    }
    
    return this.seedTable(tableName, data, {
      onConflict: 'ignore'
    })
  }
  
  /**
   * Get table row count
   */
  async getTableCount(tableName: string): Promise<number> {
    const result = await this.queryExecutor.execute<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${tableName}`,
      { readOnly: true }
    )
    
    return result.rows[0]?.count || 0
  }
  
  /**
   * Check if table is empty
   */
  async isTableEmpty(tableName: string): Promise<boolean> {
    const count = await this.getTableCount(tableName)
    return count === 0
  }
  
  /**
   * List all seed files in a directory
   */
  async listSeedFiles(directory: string): Promise<string[]> {
    try {
      const files = await fs.readdir(directory)
      return files
        .filter(f => f.endsWith('.sql') || f.endsWith('.json') || f.endsWith('.ts'))
        .map(f => path.join(directory, f))
        .sort()
    } catch (error) {
      return []
    }
  }
  
  /**
   * Execute multiple seed files in order
   */
  async executeSeedFiles(
    files: string[],
    options: {
      stopOnError?: boolean
    } = {}
  ): Promise<{
    results: SeedResult[]
    summary: {
      total: number
      successful: number
      failed: number
      totalRows: number
      totalDuration: number
    }
  }> {
    const results: SeedResult[] = []
    let successful = 0
    let failed = 0
    let totalRows = 0
    const startTime = Date.now()
    
    for (const file of files) {
      const result = await this.loadSeedFile(file)
      results.push(result)
      
      if (result.success) {
        successful++
        totalRows += result.rowsInserted
      } else {
        failed++
        
        if (options.stopOnError) {
          break
        }
      }
    }
    
    return {
      results,
      summary: {
        total: files.length,
        successful,
        failed,
        totalRows,
        totalDuration: Date.now() - startTime
      }
    }
  }
}
