/**
 * Backup & Restore
 * 
 * Database backup and restore operations:
 * - Full database backups
 * - Table-level backups
 * - Schema-only backups
 * - Data anonymization
 * - Incremental backups
 */

import { QueryExecutor } from '../core/query-executor'
import { promises as fs } from 'fs'
import path from 'path'

export interface BackupOptions {
  tables?: string[]
  schemaOnly?: boolean
  dataOnly?: boolean
  anonymize?: {
    tables: Array<{
      name: string
      columns: string[]
    }>
  }
  compress?: boolean
  exclude?: string[]
}

export interface BackupMetadata {
  id: string
  timestamp: Date
  database: string
  tables: string[]
  rowCount: number
  sizeBytes: number
  compressed: boolean
  schemaOnly: boolean
  checksum: string
}

export interface RestoreOptions {
  overwrite?: boolean
  dryRun?: boolean
  skipErrors?: boolean
  tableMap?: Record<string, string> // Rename tables during restore
}

export interface RestoreResult {
  success: boolean
  tablesRestored: string[]
  rowsRestored: number
  errors: Array<{
    table: string
    error: string
  }>
  duration: number
}

export class BackupRestore {
  constructor(private queryExecutor: QueryExecutor) {}
  
  /**
   * Create a full database backup
   */
  async backup(
    outputPath: string,
    options: BackupOptions = {}
  ): Promise<BackupMetadata> {
    const startTime = Date.now()
    const backupId = this.generateBackupId()
    
    // Get tables to backup
    const tables = await this.getTablesToBackup(options)
    
    // Generate SQL dump
    const dump = await this.generateDump(tables, options)
    
    // Write to file
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, dump, 'utf-8')
    
    // Get metadata
    const stats = await fs.stat(outputPath)
    const rowCount = await this.countRows(tables)
    
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp: new Date(),
      database: 'motomind', // TODO: Get from connection
      tables: tables.map(t => t.name),
      rowCount,
      sizeBytes: stats.size,
      compressed: options.compress || false,
      schemaOnly: options.schemaOnly || false,
      checksum: this.generateChecksum(dump)
    }
    
    // Save metadata
    await this.saveBackupMetadata(outputPath, metadata)
    
    return metadata
  }
  
  /**
   * Restore from backup
   */
  async restore(
    backupPath: string,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    const startTime = Date.now()
    
    try {
      // Read backup file
      const dump = await fs.readFile(backupPath, 'utf-8')
      
      // Parse SQL statements
      const statements = this.parseSqlDump(dump)
      
      const tablesRestored: string[] = []
      const errors: Array<{ table: string; error: string }> = []
      let rowsRestored = 0
      
      // Execute statements
      for (const stmt of statements) {
        if (options.dryRun) {
          // Just validate
          try {
            await this.queryExecutor.execute(stmt.sql, { dryRun: true })
          } catch (error) {
            errors.push({
              table: stmt.table || 'unknown',
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
          continue
        }
        
        try {
          // Apply table mapping if provided
          let sql = stmt.sql
          if (options.tableMap && stmt.table) {
            const newTableName = options.tableMap[stmt.table]
            if (newTableName) {
              sql = sql.replace(
                new RegExp(`\\b${stmt.table}\\b`, 'g'),
                newTableName
              )
            }
          }
          
          await this.queryExecutor.execute(sql, { transaction: true })
          
          if (stmt.table && !tablesRestored.includes(stmt.table)) {
            tablesRestored.push(stmt.table)
          }
          
          if (stmt.type === 'INSERT') {
            rowsRestored += stmt.rowCount || 1
          }
        } catch (error) {
          errors.push({
            table: stmt.table || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          if (!options.skipErrors) {
            throw error
          }
        }
      }
      
      return {
        success: errors.length === 0,
        tablesRestored,
        rowsRestored,
        errors,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        tablesRestored: [],
        rowsRestored: 0,
        errors: [{
          table: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        }],
        duration: Date.now() - startTime
      }
    }
  }
  
  /**
   * Backup a single table
   */
  async backupTable(
    tableName: string,
    outputPath: string,
    options: {
      schemaOnly?: boolean
      anonymize?: string[]
    } = {}
  ): Promise<void> {
    const dump = await this.generateTableDump(tableName, options)
    await fs.writeFile(outputPath, dump, 'utf-8')
  }
  
  /**
   * Create incremental backup (only changed data since last backup)
   */
  async incrementalBackup(
    outputPath: string,
    since: Date,
    options: BackupOptions = {}
  ): Promise<BackupMetadata> {
    // Get tables with timestamp columns
    const tables = await this.getTablesToBackup(options)
    const incrementalTables: Array<{ name: string; timestampColumn: string }> = []
    
    for (const table of tables) {
      const timestampCol = await this.findTimestampColumn(table.name)
      if (timestampCol) {
        incrementalTables.push({
          name: table.name,
          timestampColumn: timestampCol
        })
      }
    }
    
    // Generate incremental dump
    const dump = await this.generateIncrementalDump(incrementalTables, since, options)
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, dump, 'utf-8')
    
    const stats = await fs.stat(outputPath)
    
    const metadata: BackupMetadata = {
      id: this.generateBackupId(),
      timestamp: new Date(),
      database: 'motomind',
      tables: incrementalTables.map(t => t.name),
      rowCount: 0, // TODO: Count
      sizeBytes: stats.size,
      compressed: false,
      schemaOnly: false,
      checksum: this.generateChecksum(dump)
    }
    
    await this.saveBackupMetadata(outputPath, metadata)
    
    return metadata
  }
  
  /**
   * Get tables to backup
   */
  private async getTablesToBackup(
    options: BackupOptions
  ): Promise<Array<{ name: string; schema: string }>> {
    const result = await this.queryExecutor.execute<{
      table_name: string
      table_schema: string
    }>(
      `SELECT table_name, table_schema
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      { readOnly: true }
    )
    
    let tables = result.rows.map(row => ({
      name: row.table_name,
      schema: row.table_schema
    }))
    
    // Filter by options
    if (options.tables) {
      tables = tables.filter(t => options.tables!.includes(t.name))
    }
    
    if (options.exclude) {
      tables = tables.filter(t => !options.exclude!.includes(t.name))
    }
    
    return tables
  }
  
  /**
   * Generate SQL dump
   */
  private async generateDump(
    tables: Array<{ name: string; schema: string }>,
    options: BackupOptions
  ): Promise<string> {
    const lines: string[] = []
    
    lines.push('-- Database Backup')
    lines.push(`-- Generated: ${new Date().toISOString()}`)
    lines.push(`-- Tables: ${tables.map(t => t.name).join(', ')}`)
    lines.push('')
    
    for (const table of tables) {
      // Schema
      if (!options.dataOnly) {
        const schema = await this.getTableSchema(table.name)
        lines.push(`-- Table: ${table.name}`)
        lines.push(schema)
        lines.push('')
      }
      
      // Data
      if (!options.schemaOnly) {
        const data = await this.getTableData(table.name, options.anonymize)
        lines.push(data)
        lines.push('')
      }
    }
    
    return lines.join('\n')
  }
  
  /**
   * Generate table dump
   */
  private async generateTableDump(
    tableName: string,
    options: {
      schemaOnly?: boolean
      anonymize?: string[]
    }
  ): Promise<string> {
    const lines: string[] = []
    
    lines.push(`-- Table: ${tableName}`)
    lines.push(`-- Generated: ${new Date().toISOString()}`)
    lines.push('')
    
    // Schema
    if (!options.schemaOnly) {
      const schema = await this.getTableSchema(tableName)
      lines.push(schema)
      lines.push('')
    }
    
    // Data
    const anonymizeConfig = options.anonymize
      ? { tables: [{ name: tableName, columns: options.anonymize }] }
      : undefined
    
    const data = await this.getTableData(tableName, anonymizeConfig)
    lines.push(data)
    
    return lines.join('\n')
  }
  
  /**
   * Generate incremental dump
   */
  private async generateIncrementalDump(
    tables: Array<{ name: string; timestampColumn: string }>,
    since: Date,
    options: BackupOptions
  ): Promise<string> {
    const lines: string[] = []
    
    lines.push('-- Incremental Backup')
    lines.push(`-- Generated: ${new Date().toISOString()}`)
    lines.push(`-- Since: ${since.toISOString()}`)
    lines.push('')
    
    for (const table of tables) {
      const result = await this.queryExecutor.execute(
        `SELECT * FROM ${table.name}
         WHERE ${table.timestampColumn} > $1`,
        { params: [since], readOnly: true }
      )
      
      if (result.rows.length > 0) {
        lines.push(`-- Table: ${table.name} (${result.rows.length} rows)`)
        
        const columns = Object.keys(result.rows[0])
        const values = result.rows.map(row =>
          `(${columns.map(col => this.formatValue(row[col])).join(', ')})`
        )
        
        lines.push(
          `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES\n${values.join(',\n')};`
        )
        lines.push('')
      }
    }
    
    return lines.join('\n')
  }
  
  /**
   * Get table schema as SQL
   */
  private async getTableSchema(tableName: string): Promise<string> {
    // This is a simplified version - real implementation would use pg_dump
    const columns = await this.queryExecutor.execute(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      { params: [tableName], readOnly: true }
    )
    
    const lines: string[] = []
    lines.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`)
    
    const colDefs = columns.rows.map((col: any) => {
      let def = `  ${col.column_name} ${col.data_type}`
      if (col.is_nullable === 'NO') def += ' NOT NULL'
      if (col.column_default) def += ` DEFAULT ${col.column_default}`
      return def
    })
    
    lines.push(colDefs.join(',\n'))
    lines.push(');')
    
    return lines.join('\n')
  }
  
  /**
   * Get table data as SQL
   */
  private async getTableData(
    tableName: string,
    anonymize?: BackupOptions['anonymize']
  ): Promise<string> {
    const result = await this.queryExecutor.execute(
      `SELECT * FROM ${tableName}`,
      { readOnly: true }
    )
    
    if (result.rows.length === 0) {
      return `-- No data in ${tableName}`
    }
    
    const columns = Object.keys(result.rows[0])
    const anonymizeColumns = anonymize?.tables
      ?.find(t => t.name === tableName)?.columns || []
    
    const values = result.rows.map(row => {
      const vals = columns.map(col => {
        if (anonymizeColumns.includes(col)) {
          return "'[ANONYMIZED]'"
        }
        return this.formatValue(row[col])
      })
      return `(${vals.join(', ')})`
    })
    
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values.join(',\n')};`
  }
  
  /**
   * Find timestamp column in table
   */
  private async findTimestampColumn(tableName: string): Promise<string | null> {
    const result = await this.queryExecutor.execute<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = $1
         AND data_type IN ('timestamp', 'timestamptz', 'timestamp with time zone')
         AND column_name IN ('updated_at', 'modified_at', 'created_at')
       LIMIT 1`,
      { params: [tableName], readOnly: true }
    )
    
    return result.rows[0]?.column_name || null
  }
  
  /**
   * Count total rows in tables
   */
  private async countRows(
    tables: Array<{ name: string; schema: string }>
  ): Promise<number> {
    let total = 0
    
    for (const table of tables) {
      try {
        const result = await this.queryExecutor.execute<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${table.name}`,
          { readOnly: true, timeout: 5000 }
        )
        total += result.rows[0]?.count || 0
      } catch (error) {
        // Skip on error
      }
    }
    
    return total
  }
  
  /**
   * Parse SQL dump into statements
   */
  private parseSqlDump(dump: string): Array<{
    sql: string
    type: 'CREATE' | 'INSERT' | 'ALTER' | 'OTHER'
    table: string | null
    rowCount?: number
  }> {
    const statements: Array<{
      sql: string
      type: 'CREATE' | 'INSERT' | 'ALTER' | 'OTHER'
      table: string | null
      rowCount?: number
    }> = []
    
    // Split by semicolons (simple parser)
    const lines = dump.split(';')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('--')) continue
      
      let type: 'CREATE' | 'INSERT' | 'ALTER' | 'OTHER' = 'OTHER'
      let table: string | null = null
      
      if (trimmed.match(/^CREATE TABLE/i)) {
        type = 'CREATE'
        const match = trimmed.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)
        table = match ? match[1] : null
      } else if (trimmed.match(/^INSERT INTO/i)) {
        type = 'INSERT'
        const match = trimmed.match(/INSERT INTO\s+(\w+)/i)
        table = match ? match[1] : null
      } else if (trimmed.match(/^ALTER TABLE/i)) {
        type = 'ALTER'
        const match = trimmed.match(/ALTER TABLE\s+(\w+)/i)
        table = match ? match[1] : null
      }
      
      statements.push({
        sql: trimmed + ';',
        type,
        table,
        rowCount: type === 'INSERT' ? 1 : undefined
      })
    }
    
    return statements
  }
  
  /**
   * Format value for SQL
   */
  private formatValue(value: any): string {
    if (value === null) return 'NULL'
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (value instanceof Date) return `'${value.toISOString()}'`
    return String(value)
  }
  
  /**
   * Generate backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Generate checksum
   */
  private generateChecksum(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
  
  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(
    backupPath: string,
    metadata: BackupMetadata
  ): Promise<void> {
    const metadataPath = backupPath + '.meta.json'
    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )
  }
}
